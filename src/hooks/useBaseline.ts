// hooks/useBaseline.ts
// Loads the user's personal biometric baseline from Supabase.
// Refreshes every 6 hours by aggregating the past day's biometric_readings.
// Falls back to REAL_BASELINE if no DB row exists yet.
//
// Garmin equivalent: this is what happens when Garmin recomputes your "Body Battery"
// baseline and stress score nightly — we do it every 6 hours from our readings buffer.

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCurrentUserWithRows } from "@/lib/supabase/user-data";
import { REAL_BASELINE, updateBaseline } from "@/lib/biometrics/simulate";
import { getDailySummary, pruneOldReadings } from "@/lib/biometrics/garmin";
import type { Baseline } from "@/lib/biometrics/simulate";
import type { BaselineRow } from "@/types/database";

const REFRESH_INTERVAL_MS = 6 * 60 * 60_000; // 6 hours

function rowToBaseline(row: BaselineRow): Baseline {
  return {
    avgRestingHr: row.avg_resting_hr,
    avgDaytimeHr: row.avg_daytime_hr,
    avgStress: row.avg_stress,
    avgOvernightHrv: row.avg_overnight_hrv,
    established: row.established,
    sampleDays: row.sample_days,
  };
}

export function useBaseline() {
  const [baseline, setBaseline] = useState<Baseline>(REAL_BASELINE);
  const [loading, setLoading] = useState(true);
  const [rowId, setRowId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stable ref to the latest refresh function — avoids restarting the interval
  // every time baseline state changes (which would happen if [refreshBaseline]
  // was passed directly to setInterval's useEffect).
  const refreshBaselineRef = useRef<() => Promise<void>>(async () => {});

  // ── Load from Supabase on mount ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadBaseline() {
      const user = await getCurrentUserWithRows();

      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("baseline")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!cancelled) {
        if (data) {
          setBaseline(rowToBaseline(data as BaselineRow));
          setRowId((data as BaselineRow).id);
        }
        setUserId(user.id);
        setLoading(false);
      }
    }

    void loadBaseline();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Refresh: aggregate today's readings, update DB ──────────────
  // useCallback captures current baseline + rowId via closure.
  // We also keep refreshBaselineRef.current in sync so the stable
  // interval below always calls the latest version without restarting.
  const refreshBaseline = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const summary = await getDailySummary(today);

    if (!summary || summary.sample_count < 10) return; // not enough data yet

    const updated = updateBaseline(
      baseline,
      summary.avg_hr,
      summary.avg_stress,
      summary.avg_hrv ?? undefined,
    );

    setBaseline(updated);

    // Persist updated baseline back to Supabase
    if (rowId) {
      await supabase
        .from("baseline")
        .update({
          avg_resting_hr: updated.avgRestingHr,
          avg_daytime_hr: updated.avgDaytimeHr,
          avg_stress: updated.avgStress,
          avg_overnight_hrv: updated.avgOvernightHrv,
          established: updated.established,
          sample_days: updated.sampleDays,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rowId)
        .eq("user_id", userId);
    }

    // Keep the readings table small while we're here
    await pruneOldReadings();
  }, [baseline, rowId, userId]);

  // Keep the ref current so the interval always calls the latest version
  refreshBaselineRef.current = refreshBaseline;

  // ── Auto-refresh every 6 hours ──────────────────────────────────
  // Empty dep array: interval is created once and never restarted.
  // It calls refreshBaselineRef.current() which always points to the
  // latest refreshBaseline (with up-to-date baseline and rowId).
  useEffect(() => {
    intervalRef.current = setInterval(
      () => refreshBaselineRef.current(),
      REFRESH_INTERVAL_MS,
    );
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); // intentionally empty — interval must not restart on baseline changes

  return { baseline, loading, refreshBaseline };
}
