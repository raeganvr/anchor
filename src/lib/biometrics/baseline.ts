// lib/biometrics/baseline.ts
// React hook that loads the single baseline row from Supabase on mount.
// Returns { baseline: BaselineRow | null, loading }. The baseline row holds
// the user's personal HR/stress/HRV averages used to calibrate trigger detection.
// In production this row is updated nightly from the Garmin API pull.
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getCurrentUserWithRows } from '@/lib/supabase/user-data'
import type { BaselineRow } from '@/types/database'

export function useBaseline() {
  const [baseline, setBaseline] = useState<BaselineRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadBaseline() {
      const user = await getCurrentUserWithRows()

      if (!user) {
        if (!cancelled) setLoading(false)
        return
      }

      const { data } = await supabase
        .from('baseline')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (!cancelled) {
        if (data) setBaseline(data as BaselineRow)
        setLoading(false)
      }
    }

    void loadBaseline()

    return () => {
      cancelled = true
    }
  }, [])

  return { baseline, loading }
}
