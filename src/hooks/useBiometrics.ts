// hooks/useBiometrics.ts
// Polls the simulation engine at real Garmin cadence (2s demo / 120s prod).
// Each reading is written to biometric_readings in Supabase (fire-and-forget).
// This makes our DB the equivalent of Garmin Connect's data store:
//   - Episode windows are pulled FROM this table (not synthesized on-the-fly)
//   - Baseline refresh aggregates FROM this table

import { useState, useEffect, useRef, useCallback } from "react";
import {
  HRReading,
  StressReading,
  Baseline,
  TriggerResult,
  REAL_BASELINE,
  TRIGGER_CONFIG,
  getNextLiveReading,
  detectTrigger,
  resetLiveState,
} from "@/lib/biometrics/simulate";
import { supabase } from "@/lib/supabase/client";
import type { SettingsRow } from "@/types/database";

const POLL_INTERVAL_MS = 2000; // 2s demo; each poll = one Garmin reading at simulated speed
const WINDOW_SIZE = 20; // last 20 readings in memory for trigger detection (~40s demo / 40min real)

// Map settings.sensitivity to TRIGGER_CONFIG multipliers
const SENSITIVITY_CONFIG: Record<
  SettingsRow["sensitivity"],
  typeof TRIGGER_CONFIG
> = {
  low: {
    ...TRIGGER_CONFIG,
    hrMultiplierThreshold: 1.7,
    hrAbsoluteThreshold: 110,
    stressThreshold: 75,
    sustainedReadings: 4,
    combinedHrThreshold: 90,
    combinedStressThreshold: 60,
  },
  medium: { ...TRIGGER_CONFIG }, // defaults from simulate.ts
  high: {
    ...TRIGGER_CONFIG,
    hrMultiplierThreshold: 1.35,
    hrAbsoluteThreshold: 80,
    stressThreshold: 55,
    sustainedReadings: 2,
    combinedHrThreshold: 70,
    combinedStressThreshold: 40,
  },
};

export interface BiometricState {
  hrReadings: HRReading[];
  stressReadings: StressReading[];
  currentHr: number | null;
  currentStress: number | null;
  triggerResult: TriggerResult;
  baseline: Baseline;
  isMonitoring: boolean;
  simulationMode: string;
}

interface UseBiometricsOptions {
  baseline?: Baseline;
  sensitivity?: SettingsRow["sensitivity"];
  onTrigger?: (result: TriggerResult) => void; // called once when trigger first fires
}

export function useBiometrics({
  baseline = REAL_BASELINE,
  sensitivity = "medium",
  onTrigger,
}: UseBiometricsOptions = {}) {
  const [state, setState] = useState<BiometricState>({
    hrReadings: [],
    stressReadings: [],
    currentHr: null,
    currentStress: null,
    triggerResult: { triggered: false },
    baseline,
    isMonitoring: false,
    simulationMode: "baseline",
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hrBufferRef = useRef<HRReading[]>([]);
  const stressBufferRef = useRef<StressReading[]>([]);
  const triggeredRef = useRef(false); // prevent firing onTrigger repeatedly
  const triggerConfig = SENSITIVITY_CONFIG[sensitivity];

  const startMonitoring = useCallback(() => {
    resetLiveState()
    setState((s) => ({ ...s, isMonitoring: true }));
    triggeredRef.current = false;

    intervalRef.current = setInterval(() => {
      const { hr, stress, mode } = getNextLiveReading(baseline);

      // ── Write to DB (fire-and-forget, non-blocking) ──────────────
      // This is the equivalent of Garmin pushing a reading to Garmin Connect.
      // We don't await — a dropped insert is acceptable; monitoring continues.
      supabase
        .from("biometric_readings")
        .insert({
          recorded_at: new Date(hr.timestamp).toISOString(),
          source: "simulated",
          hr_bpm: hr.bpm,
          stress_level: stress.stressLevel,
          hrv_rmssd: null, // HRV is sleep-only; written separately if ever implemented
        })
        .then(); // intentionally not awaited

      // ── Update in-memory buffer for trigger detection ─────────────
      hrBufferRef.current = [...hrBufferRef.current, hr].slice(-WINDOW_SIZE);
      stressBufferRef.current = [...stressBufferRef.current, stress].slice(
        -WINDOW_SIZE,
      );

      const triggerResult = detectTrigger(
        hrBufferRef.current,
        stressBufferRef.current,
        baseline,
        triggerConfig, // sensitivity-aware config, defaults to TRIGGER_CONFIG for 'medium'
      );

      // ── Fire onTrigger callback exactly once per monitoring session ─
      if (triggerResult.triggered && !triggeredRef.current) {
        triggeredRef.current = true;
        onTrigger?.(triggerResult);
      }

      setState((s) => ({
        ...s,
        hrReadings: hrBufferRef.current,
        stressReadings: stressBufferRef.current,
        currentHr: hr.bpm,
        currentStress: stress.stressLevel,
        triggerResult,
        simulationMode: mode,
      }));
    }, POLL_INTERVAL_MS);
  }, [baseline, onTrigger, triggerConfig]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState((s) => ({ ...s, isMonitoring: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { ...state, startMonitoring, stopMonitoring };
}
