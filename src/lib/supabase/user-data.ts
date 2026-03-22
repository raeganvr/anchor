import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    return null
  }

  return user
}

export async function ensureUserRows(user: Pick<User, 'id' | 'email'>): Promise<void> {
  const [settingsResult, baselineResult] = await Promise.all([
    supabase
      .from('settings')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('baseline')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle(),
  ])

  const writes: Promise<unknown>[] = []

  if (!settingsResult.data) {
    writes.push(
      Promise.resolve(
        supabase.from('settings').insert({
          user_id: user.id,
          user_email: user.email ?? null,
          caregiver_email: null,
          caregiver_consent: false,
          caregiver_name: null,
          alert_threshold_min: 10,
          sensitivity: 'medium',
          demo_mode: true,
          demo_episode_delay_ms: 30000,
          notifications_enabled: false,
        })
      )
    )
  }

  if (!baselineResult.data) {
    writes.push(
      Promise.resolve(
        supabase.from('baseline').insert({
          user_id: user.id,
          avg_resting_hr: 46,
          avg_daytime_hr: 68,
          avg_stress: 27,
          avg_overnight_hrv: 75,
          hrv_5min_high: null,
          hrv_status: null,
          established: true,
          sample_days: 7,
          recent_days: [],
        })
      )
    )
  }

  if (writes.length > 0) {
    await Promise.all(writes)
  }
}

export async function getCurrentUserWithRows(): Promise<User | null> {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  await ensureUserRows(user)
  return user
}
