// src/lib/biometrics/garmin.ts
// Simulates the Garmin Connect REST API surface.
// All methods return data in our internal types (HRReading, StressReading, etc.)
// Currently: reads from biometric_readings Supabase table (populated by useBiometrics polling)
// Future: replace DB queries with real Garmin Connect OAuth API calls

import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/user-data";
import type { BiometricReadingRow, DailySummary } from "@/types/database";
import type { HRReading, StressReading } from "@/lib/biometrics/simulate";

// ── pullHeartRateSince ─────────────────────────────────────────────────────
// Garmin equivalent: GET /wellness-api/rest/heartRate/{userId}
// Returns all HR readings from the past `windowMinutes` minutes.
// Used when an episode fires to capture what actually happened.
export async function pullHeartRateSince(
  windowMinutes: number,
): Promise<HRReading[]> {
  const user = await getCurrentUser();

  if (!user) return [];

  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  const { data, error } = await supabase
    .from("biometric_readings")
    .select("recorded_at, hr_bpm")
    .eq("user_id", user.id)
    .gte("recorded_at", since)
    .not("hr_bpm", "is", null)
    .order("recorded_at", { ascending: true });

  if (error || !data) return [];

  return (data as Pick<BiometricReadingRow, "recorded_at" | "hr_bpm">[])
    .filter((r) => r.hr_bpm !== null)
    .map((r) => ({
      timestamp: new Date(r.recorded_at).getTime(),
      bpm: r.hr_bpm as number,
    }));
}

// ── pullStressSince ────────────────────────────────────────────────────────
// Garmin equivalent: GET /wellness-api/rest/stressDetails/{userId}
// Returns all stress readings from the past `windowMinutes` minutes.
export async function pullStressSince(
  windowMinutes: number,
): Promise<StressReading[]> {
  const user = await getCurrentUser();

  if (!user) return [];

  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  const { data, error } = await supabase
    .from("biometric_readings")
    .select("recorded_at, stress_level")
    .eq("user_id", user.id)
    .gte("recorded_at", since)
    .not("stress_level", "is", null)
    .order("recorded_at", { ascending: true });

  if (error || !data) return [];

  return (data as Pick<BiometricReadingRow, "recorded_at" | "stress_level">[])
    .filter((r) => r.stress_level !== null)
    .map((r) => ({
      timestamp: new Date(r.recorded_at).getTime(),
      stressLevel: r.stress_level as number,
    }));
}

// ── getDailySummary ────────────────────────────────────────────────────────
// Garmin equivalent: GET /wellness-api/rest/dailies/{userId}
// Aggregates today's readings into a summary used for baseline update.
// Called by useBaseline every 6 hours.
export async function getDailySummary(
  date: string,
): Promise<DailySummary | null> {
  const user = await getCurrentUser();

  if (!user) return null;

  // date format: 'YYYY-MM-DD'
  const dayStart = new Date(date + "T00:00:00Z").toISOString();
  const dayEnd = new Date(date + "T23:59:59Z").toISOString();

  const { data, error } = await supabase
    .from("biometric_readings")
    .select("hr_bpm, stress_level, hrv_rmssd")
    .eq("user_id", user.id)
    .gte("recorded_at", dayStart)
    .lte("recorded_at", dayEnd);

  if (error || !data || data.length === 0) return null;

  const hrReadings = data.filter((r) => r.hr_bpm !== null);
  const stressReadings = data.filter((r) => r.stress_level !== null);
  const hrvReadings = data.filter((r) => r.hrv_rmssd !== null);

  return {
    date,
    avg_hr:
      hrReadings.length > 0
        ? Math.round(
            hrReadings.reduce((s, r) => s + (r.hr_bpm ?? 0), 0) /
              hrReadings.length,
          )
        : 0,
    avg_stress:
      stressReadings.length > 0
        ? Math.round(
            stressReadings.reduce((s, r) => s + (r.stress_level ?? 0), 0) /
              stressReadings.length,
          )
        : 0,
    avg_hrv:
      hrvReadings.length > 0
        ? Math.round(
            hrvReadings.reduce((s, r) => s + (r.hrv_rmssd ?? 0), 0) /
              hrvReadings.length,
          )
        : null,
    sample_count: data.length,
  };
}

// ── pullBiometricsInWindow ─────────────────────────────────────────────────
// Garmin equivalent: GET /wellness-api/rest/heartRate + stressDetails with date range
// Used when a user manually logs a past episode — fetches whatever was recorded
// in that specific time window rather than counting back from now.
export async function pullBiometricsInWindow(
  startIso: string,
  endIso: string,
): Promise<{ hr: HRReading[]; stress: StressReading[] }> {
  const user = await getCurrentUser();

  if (!user) {
    return { hr: [], stress: [] };
  }

  const [hrResult, stressResult] = await Promise.all([
    supabase
      .from("biometric_readings")
      .select("recorded_at, hr_bpm")
      .eq("user_id", user.id)
      .gte("recorded_at", startIso)
      .lte("recorded_at", endIso)
      .not("hr_bpm", "is", null)
      .order("recorded_at", { ascending: true }),
    supabase
      .from("biometric_readings")
      .select("recorded_at, stress_level")
      .eq("user_id", user.id)
      .gte("recorded_at", startIso)
      .lte("recorded_at", endIso)
      .not("stress_level", "is", null)
      .order("recorded_at", { ascending: true }),
  ])

  const hr = (hrResult.data ?? [])
    .filter((r) => r.hr_bpm !== null)
    .map((r) => ({
      timestamp: new Date(r.recorded_at).getTime(),
      bpm: r.hr_bpm as number,
    }))

  const stress = (stressResult.data ?? [])
    .filter((r) => r.stress_level !== null)
    .map((r) => ({
      timestamp: new Date(r.recorded_at).getTime(),
      stressLevel: r.stress_level as number,
    }))

  return { hr, stress }
}

// ── pruneOldReadings ───────────────────────────────────────────────────────
// Deletes readings older than 48 hours.
// Call this once per day (or from baseline refresh) to keep the table small.
// Garmin equivalent: their API handles retention; we handle it ourselves.
export async function pruneOldReadings(): Promise<void> {
  const user = await getCurrentUser();

  if (!user) return;

  const cutoff = new Date(Date.now() - 48 * 60 * 60_000).toISOString();
  await supabase
    .from("biometric_readings")
    .delete()
    .eq("user_id", user.id)
    .lt("recorded_at", cutoff);
}
