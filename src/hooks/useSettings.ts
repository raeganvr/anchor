// hooks/useSettings.ts
// Supabase-backed hook for the settings table (single row).
// Returns { settings: SettingsRow | null, loading, updateSettings }.
// Use updateSettings(patch) to change caregiver info, sensitivity, or demo mode.
// The settings row drives demo_episode_delay_ms and alert_threshold_min at runtime.
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getCurrentUserWithRows } from '@/lib/supabase/user-data'
import type { SettingsRow } from '@/types/database'

export function useSettings() {
  const [settings, setSettings] = useState<SettingsRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      const user = await getCurrentUserWithRows()

      if (!user) {
        if (!cancelled) setLoading(false)
        return
      }

      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (!cancelled) {
        if (data) setSettings(data as SettingsRow)
        setLoading(false)
      }
    }

    void loadSettings()

    return () => {
      cancelled = true
    }
  }, [])

  const updateSettings = useCallback(async (patch: Partial<Omit<SettingsRow, 'id' | 'updated_at'>>) => {
    if (!settings) return { data: null, error: new Error('settings not loaded') }

    const { data, error } = await supabase
      .from('settings')
      .update(patch)
      .eq('id', settings.id)
      .eq('user_id', settings.user_id)
      .select()
      .single()

    if (data) setSettings(data as SettingsRow)
    return { data: data as SettingsRow | null, error }
  }, [settings])

  return { settings, loading, updateSettings }
}
