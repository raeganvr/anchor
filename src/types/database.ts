// types/database.ts
import type {
  HRReading,
  StressReading,
  HRVReading,
} from "@/lib/biometrics/simulate";
import type { Message } from "@/types/chat";

export interface BiometricReadingRow {
  id: string;
  recorded_at: string; // ISO timestamptz
  source: "simulated" | "garmin" | "strava";
  hr_bpm: number | null;
  stress_level: number | null;
  hrv_rmssd: number | null;
  created_at: string;
}

export interface BaselineRow {
  id: string;
  updated_at: string;
  avg_resting_hr: number;
  avg_daytime_hr: number;
  avg_stress: number;
  avg_overnight_hrv: number;
  hrv_5min_high: number | null;
  hrv_status: string | null;
  established: boolean;
  sample_days: number;
  recent_days: DailySummary[]; // was: any[]
}

export interface DailySummary {
  date: string; // 'YYYY-MM-DD'
  avg_hr: number;
  avg_stress: number;
  avg_hrv: number | null;
  sample_count: number;
}

export interface EpisodeRow {
  id: string;
  created_at: string;
  user_label: string | null;
  triggered_by: "biometric" | "manual" | "caregiver";
  duration_minutes: number | null;
  resolved: boolean;
  resolved_at: string | null;
  hr_data: HRReading[]; // was: any[]
  stress_data: StressReading[]; // was: any[]
  hrv_data: HRVReading[]; // was: any[]
  trigger_hr_value: number | null;
  trigger_stress_value: number | null;
  trigger_reason: string | null;
  window_start_ms: number | null;
  window_end_ms: number | null;
  chat_transcript: Message[]; // was: any[]
  caregiver_alerted: boolean;
  caregiver_alerted_at: string | null;
}

export interface SettingsRow {
  id: string;
  updated_at: string;
  user_email: string | null;
  caregiver_email: string | null;
  caregiver_consent: boolean;
  caregiver_name: string | null;
  alert_threshold_min: number;
  sensitivity: "low" | "medium" | "high";
  demo_mode: boolean;
  demo_episode_delay_ms: number;
}
