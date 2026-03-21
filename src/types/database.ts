export interface Episode {
  id: string
  created_at: string
  user_label: string | null
  hr_data: { timestamp: string; value: number }[]
  hrv_data: { timestamp: string; value: number }[]
  triggered_by: 'biometric' | 'manual'
  duration_minutes: number | null
  resolved: boolean
}

export interface EpisodeCreate {
  user_label?: string
  hr_data: Episode['hr_data']
  hrv_data: Episode['hrv_data']
  triggered_by: Episode['triggered_by']
  duration_minutes?: number
}

export interface Settings {
  id: string
  notification_email: string | null
  notification_consent: boolean
  alert_threshold_min: number
  sensitivity: 'low' | 'medium' | 'high'
}

export interface Baseline {
  id: string
  avg_hr: number
  avg_hrv: number
  sample_count: number
  updated_at: string
  established: boolean
}
