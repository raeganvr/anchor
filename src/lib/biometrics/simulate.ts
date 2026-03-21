// ============================================================
// lib/biometrics/simulate.ts
// Simulation engine calibrated to real Garmin data:
//   - Resting HR: 43–49 bpm (mean 46)
//   - HR sampling: every 120 seconds → [timestamp_ms, bpm]
//   - HRV: 5-min intervals, sleep-only, 51–106ms (avg 75ms)
//   - Stress: 18–37 daily avg, low baseline
//   - Daytime trigger = HR + stress (HRV is sleep-only on Garmin)
// ============================================================

export interface HRReading {
  timestamp: number      // Unix ms — matches Garmin's heartRateValues format
  bpm: number
}

export interface HRVReading {
  hrvValue: number       // rMSSD ms — matches Garmin's hrvReadings format
  readingTimeGMT: string // ISO string — matches Garmin's hrvReadings format
}

export interface StressReading {
  timestamp: number
  stressLevel: number    // 0–100, Garmin scale
}

export interface BiometricWindow {
  hr: HRReading[]
  stress: StressReading[]
  // HRV only present if window includes overnight data
  hrv?: HRVReading[]
  windowStartMs: number
  windowEndMs: number
}

export interface Baseline {
  avgRestingHr: number        // your data: ~46
  avgDaytimeHr: number        // your data: ~65–75 during activity
  avgStress: number           // your data: ~27 weekly avg
  avgOvernightHrv: number     // your data: ~75ms
  established: boolean
  sampleDays: number
}

// Raegan's real baseline — seed values from actual Garmin data
export const REAL_BASELINE: Baseline = {
  avgRestingHr: 46,
  avgDaytimeHr: 68,
  avgStress: 27,
  avgOvernightHrv: 75,
  established: true,
  sampleDays: 7,
}

// ── TRIGGER THRESHOLDS (adapted for your low-baseline profile) ──
// Your resting HR is so low that a +20 spike is still only ~66bpm
// which is normal daytime activity for most people.
// We use a RATIO trigger instead of a fixed delta.
export const TRIGGER_CONFIG = {
  // HR must exceed restingHr * this multiplier
  hrMultiplierThreshold: 1.55,     // 46 * 1.55 = ~71bpm sustained → elevated
  hrAbsoluteThreshold: 95,         // OR absolute threshold for clear spikes
  stressThreshold: 65,             // Garmin stress 65+ = high stress
  sustainedReadings: 3,            // Must hold for 3 consecutive readings (6 min at 120s intervals)
  // Combined trigger: HR elevated AND stress elevated
  combinedHrThreshold: 80,         // Lower HR bar if stress is also high
  combinedStressThreshold: 50,
}

// ── NOISE HELPER ────────────────────────────────────────────────
function noise(amplitude: number): number {
  return (Math.random() - 0.5) * 2 * amplitude
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

// ── HR SIMULATION ───────────────────────────────────────────────
// Generates a realistic daytime HR window matching Garmin's
// [timestamp_ms, bpm] format at 120-second intervals

export type SimulationMode = 'baseline' | 'pre_episode' | 'episode' | 'recovery'

export function generateHRWindow(
  startMs: number,
  durationMinutes: number,
  mode: SimulationMode,
  baseline: Baseline = REAL_BASELINE
): HRReading[] {
  const readings: HRReading[] = []
  const intervalMs = 120_000  // 120 seconds — matches your Garmin data
  const count = Math.floor((durationMinutes * 60_000) / intervalMs)

  for (let i = 0; i < count; i++) {
    const timestamp = startMs + i * intervalMs
    const progress = i / count  // 0→1 through the window
    let bpm: number

    switch (mode) {
      case 'baseline':
        // Normal waking activity: 60–80bpm with natural drift
        // Matches your observed daytime readings (64–91 in today's data)
        bpm = baseline.avgDaytimeHr + noise(8) + Math.sin(progress * Math.PI) * 5
        break

      case 'pre_episode':
        // Gradual HR elevation 10–15 min before episode
        // Subtle — from ~68 up to ~85 over the window
        bpm = baseline.avgDaytimeHr
          + (progress * 18)          // gradual climb
          + noise(5)
        break

      case 'episode':
        // Acute elevation: rapid spike then sustained high
        // Peak: ~105–115bpm (your resting * ~2.3)
        const spike = progress < 0.2
          ? progress * 5 * 35        // fast ramp up
          : 35 - (progress - 0.2) * 10  // slow decay
        bpm = baseline.avgDaytimeHr + spike + noise(7)
        break

      case 'recovery':
        // Gradual return toward resting — takes 20–30 min
        const decay = Math.exp(-progress * 3)
        bpm = baseline.avgRestingHr
          + (baseline.avgDaytimeHr - baseline.avgRestingHr) * decay
          + noise(4)
        break
    }

    readings.push({
      timestamp,
      bpm: Math.round(clamp(bpm, 38, 160))
    })
  }

  return readings
}

// ── STRESS SIMULATION ───────────────────────────────────────────
// Garmin stress is computed every ~3 minutes during the day
// Your baseline: 18–37. Episode stress: 65–85.

export function generateStressWindow(
  startMs: number,
  durationMinutes: number,
  mode: SimulationMode,
  baseline: Baseline = REAL_BASELINE
): StressReading[] {
  const readings: StressReading[] = []
  const intervalMs = 180_000  // 3 minutes
  const count = Math.floor((durationMinutes * 60_000) / intervalMs)

  for (let i = 0; i < count; i++) {
    const timestamp = startMs + i * intervalMs
    const progress = i / count
    let stressLevel: number

    switch (mode) {
      case 'baseline':
        stressLevel = baseline.avgStress + noise(8)
        break
      case 'pre_episode':
        stressLevel = baseline.avgStress + (progress * 30) + noise(8)
        break
      case 'episode':
        stressLevel = 65 + noise(12)
        break
      case 'recovery':
        stressLevel = baseline.avgStress
          + (65 - baseline.avgStress) * Math.exp(-progress * 2.5)
          + noise(6)
        break
    }

    readings.push({
      timestamp,
      stressLevel: Math.round(clamp(stressLevel, 1, 99))
    })
  }

  return readings
}

// ── FULL EPISODE SIMULATION ──────────────────────────────────────
// Generates a complete 90-minute window showing:
//   30 min baseline → 15 min pre-episode → 20 min episode → 25 min recovery
// This is what gets stored when a user reports an episode

export function generateEpisodeWindow(
  episodeStartMs: number = Date.now() - 45 * 60_000
): BiometricWindow {
  const baselineStart = episodeStartMs - 30 * 60_000
  const preStart = episodeStartMs - 15 * 60_000
  const recoveryStart = episodeStartMs + 20 * 60_000
  const windowEnd = episodeStartMs + 45 * 60_000

  const hr: HRReading[] = [
    ...generateHRWindow(baselineStart, 30, 'baseline'),
    ...generateHRWindow(preStart, 15, 'pre_episode'),
    ...generateHRWindow(episodeStartMs, 20, 'episode'),
    ...generateHRWindow(recoveryStart, 25, 'recovery'),
  ]

  const stress: StressReading[] = [
    ...generateStressWindow(baselineStart, 30, 'baseline'),
    ...generateStressWindow(preStart, 15, 'pre_episode'),
    ...generateStressWindow(episodeStartMs, 20, 'episode'),
    ...generateStressWindow(recoveryStart, 25, 'recovery'),
  ]

  return {
    hr,
    stress,
    windowStartMs: baselineStart,
    windowEndMs: windowEnd,
  }
}

// ── LIVE FEED SIMULATION ─────────────────────────────────────────
// Used by useBiometrics() hook for the real-time dashboard.
// Returns one reading at a time, called every 120s (or faster in demo mode).

export interface LiveState {
  mode: SimulationMode
  episodeScheduledAt?: number  // ms timestamp when demo episode will start
}

let _liveState: LiveState = { mode: 'baseline' }
let _lastHr = 68
let _lastStress = 25

export function scheduleDemoEpisode(delayMs: number = 90_000): void {
  _liveState = {
    mode: 'baseline',
    episodeScheduledAt: Date.now() + delayMs
  }
}

export function getNextLiveReading(baseline: Baseline = REAL_BASELINE): {
  hr: HRReading
  stress: StressReading
  mode: SimulationMode
} {
  const now = Date.now()

  // Transition mode based on scheduled episode
  if (_liveState.episodeScheduledAt) {
    const msTilEpisode = _liveState.episodeScheduledAt - now
    if (msTilEpisode < -20 * 60_000) {
      _liveState = { mode: 'recovery' }
      if (Date.now() - (_liveState.episodeScheduledAt ?? 0) > 25 * 60_000) {
        _liveState = { mode: 'baseline' }
      }
    } else if (msTilEpisode < 0) {
      _liveState.mode = 'episode'
    } else if (msTilEpisode < 15 * 60_000) {
      _liveState.mode = 'pre_episode'
    }
  }

  // Generate single reading
  const [hrWindow] = generateHRWindow(now, 2, _liveState.mode, baseline)
  const [stressWindow] = generateStressWindow(now, 3, _liveState.mode, baseline)

  _lastHr = hrWindow?.bpm ?? _lastHr
  _lastStress = stressWindow?.stressLevel ?? _lastStress

  return {
    hr: hrWindow ?? { timestamp: now, bpm: _lastHr },
    stress: stressWindow ?? { timestamp: now, stressLevel: _lastStress },
    mode: _liveState.mode,
  }
}

// ── TRIGGER DETECTION ────────────────────────────────────────────
// Pure function — takes last N readings, returns whether to fire

export interface TriggerResult {
  triggered: boolean
  reason?: 'hr_spike' | 'combined_hr_stress' | 'stress_only'
  hrValue?: number
  stressValue?: number
}

export function detectTrigger(
  recentHr: HRReading[],
  recentStress: StressReading[],
  baseline: Baseline = REAL_BASELINE,
  config: typeof TRIGGER_CONFIG = TRIGGER_CONFIG, // optional override for sensitivity
): TriggerResult {
  const N = config.sustainedReadings;

  if (recentHr.length < N) {
    return { triggered: false };
  }

  const lastNHr = recentHr.slice(-N);
  const avgRecentHr = lastNHr.reduce((s, r) => s + r.bpm, 0) / N;

  const lastNStress = recentStress.slice(-N);
  const avgRecentStress =
    lastNStress.length > 0
      ? lastNStress.reduce((s, r) => s + r.stressLevel, 0) / lastNStress.length
      : 0;

  // Trigger 1: pure HR spike (absolute threshold)
  if (avgRecentHr >= config.hrAbsoluteThreshold) {
    return {
      triggered: true,
      reason: "hr_spike",
      hrValue: avgRecentHr,
      stressValue: avgRecentStress,
    };
  }

  // Trigger 2: HR ratio (adapted for low-baseline athletes like Raegan)
  if (avgRecentHr >= baseline.avgRestingHr * config.hrMultiplierThreshold) {
    return {
      triggered: true,
      reason: "hr_spike",
      hrValue: avgRecentHr,
      stressValue: avgRecentStress,
    };
  }

  // Trigger 3: combined moderate HR + elevated stress
  if (
    avgRecentHr >= config.combinedHrThreshold &&
    avgRecentStress >= config.combinedStressThreshold
  ) {
    return {
      triggered: true,
      reason: "combined_hr_stress",
      hrValue: avgRecentHr,
      stressValue: avgRecentStress,
    };
  }

  return {
    triggered: false,
    hrValue: avgRecentHr,
    stressValue: avgRecentStress,
  };
}

// ── BASELINE CALCULATOR ──────────────────────────────────────────
// Updates rolling baseline from new day's data
// In production, fed from real Garmin API pulls

export function updateBaseline(
  current: Baseline,
  newRestingHr: number,
  newAvgStress: number,
  newOvernightHrv?: number
): Baseline {
  const weight = 0.15  // How much new day shifts the baseline (EMA)
  return {
    avgRestingHr: Math.round(current.avgRestingHr * (1 - weight) + newRestingHr * weight),
    avgDaytimeHr: current.avgDaytimeHr,  // Updated separately from HR window
    avgStress: Math.round(current.avgStress * (1 - weight) + newAvgStress * weight),
    avgOvernightHrv: newOvernightHrv
      ? Math.round(current.avgOvernightHrv * (1 - weight) + newOvernightHrv * weight)
      : current.avgOvernightHrv,
    established: current.sampleDays >= 3,
    sampleDays: current.sampleDays + 1,
  }
}

// ── GARMIN FORMAT ADAPTERS ───────────────────────────────────────
// Convert real Garmin API responses to our internal types
// Used when switching from simulation to real data

export function adaptGarminHR(
  heartRateValues: [number, number][]  // Garmin's [timestamp_ms, bpm] format
): HRReading[] {
  return heartRateValues
    .filter(([, bpm]) => bpm !== null && bpm > 0)
    .map(([timestamp, bpm]) => ({ timestamp, bpm }))
}

export function adaptGarminHRV(
  hrvReadings: { hrvValue: number; readingTimeGMT: string }[]
): HRVReading[] {
  return hrvReadings.map(r => ({
    hrvValue: r.hrvValue,
    readingTimeGMT: r.readingTimeGMT,
  }))
}

export function adaptGarminStress(
  stressValues: [number, number][]  // Garmin returns [timestamp_ms, stress_level]
): StressReading[] {
  return stressValues
    .filter(([, level]) => level >= 0)
    .map(([timestamp, stressLevel]) => ({ timestamp, stressLevel }))
}
