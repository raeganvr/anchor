// hooks/useBiometrics.ts
// Polls the simulation engine (or real Garmin API in production)
// and maintains a rolling window of readings for trigger detection.

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  HRReading, StressReading, Baseline, TriggerResult,
  REAL_BASELINE,
  getNextLiveReading, detectTrigger, scheduleDemoEpisode,
} from '@/lib/biometrics/simulate'

const POLL_INTERVAL_MS = 2000      // 2s in demo (real Garmin: 120s)
const WINDOW_SIZE = 20             // keep last 20 readings in memory (~40s demo / 40min real)

export interface BiometricState {
  hrReadings: HRReading[]
  stressReadings: StressReading[]
  currentHr: number | null
  currentStress: number | null
  triggerResult: TriggerResult
  baseline: Baseline
  isMonitoring: boolean
  simulationMode: string
}

export function useBiometrics(baseline: Baseline = REAL_BASELINE) {
  const [state, setState] = useState<BiometricState>({
    hrReadings: [],
    stressReadings: [],
    currentHr: null,
    currentStress: null,
    triggerResult: { triggered: false },
    baseline,
    isMonitoring: false,
    simulationMode: 'baseline',
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const hrBufferRef = useRef<HRReading[]>([])
  const stressBufferRef = useRef<StressReading[]>([])

  const startMonitoring = useCallback(() => {
    // Schedule a demo episode 90 seconds after monitoring starts
    scheduleDemoEpisode(90_000)

    setState(s => ({ ...s, isMonitoring: true }))

    intervalRef.current = setInterval(() => {
      const { hr, stress, mode } = getNextLiveReading(baseline)

      // Maintain rolling window
      hrBufferRef.current = [...hrBufferRef.current, hr].slice(-WINDOW_SIZE)
      stressBufferRef.current = [...stressBufferRef.current, stress].slice(-WINDOW_SIZE)

      const triggerResult = detectTrigger(
        hrBufferRef.current,
        stressBufferRef.current,
        baseline
      )

      setState(s => ({
        ...s,
        hrReadings: hrBufferRef.current,
        stressReadings: stressBufferRef.current,
        currentHr: hr.bpm,
        currentStress: stress.stressLevel,
        triggerResult,
        simulationMode: mode,
      }))
    }, POLL_INTERVAL_MS)
  }, [baseline])

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setState(s => ({ ...s, isMonitoring: false }))
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return { ...state, startMonitoring, stopMonitoring }
}
