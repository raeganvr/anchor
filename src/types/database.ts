// types/database.ts
// TypeScript interfaces matching the three Supabase tables exactly.
// BaselineRow — single row with the user's personal biometric averages.
// EpisodeRow  — one row per triggered episode; hr_data/stress_data are HRReading[]/StressReading[] stored as JSONB.
// SettingsRow — single row for caregiver config, sensitivity, and demo mode.
// Import these wherever you cast Supabase responses (the client is untyped by default).
export interface BaselineRow {
  id: string
  updated_at: string
  avg_resting_hr: number
  avg_daytime_hr: number
  avg_stress: number
  avg_overnight_hrv: number
  hrv_5min_high: number | null
  hrv_status: string | null
  established: boolean
  sample_days: number
  recent_days: any[]
}

export interface EpisodeRow {
  id: string
  created_at: string
  user_label: string | null
  triggered_by: 'biometric' | 'manual' | 'caregiver'
  duration_minutes: number | null
  resolved: boolean
  resolved_at: string | null
  hr_data: any[]
  stress_data: any[]
  hrv_data: any[]
  trigger_hr_value: number | null
  trigger_stress_value: number | null
  trigger_reason: string | null
  window_start_ms: number | null
  window_end_ms: number | null
  chat_transcript: any[]
  caregiver_alerted: boolean
  caregiver_alerted_at: string | null
}

export interface SettingsRow {
  id: string
  updated_at: string
  caregiver_email: string | null
  caregiver_consent: boolean
  caregiver_name: string | null
  alert_threshold_min: number
  sensitivity: 'low' | 'medium' | 'high'
  demo_mode: boolean
  demo_episode_delay_ms: number
}
