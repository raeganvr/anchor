// lib/biometrics/baseline.ts
// React hook that loads the single baseline row from Supabase on mount.
// Returns { baseline: BaselineRow | null, loading }. The baseline row holds
// the user's personal HR/stress/HRV averages used to calibrate trigger detection.
// In production this row is updated nightly from the Garmin API pull.
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { BaselineRow } from '@/types/database'

export function useBaseline() {
  const [baseline, setBaseline] = useState<BaselineRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('baseline')
      .select('*')
      .single()
      .then(({ data }) => {
        if (data) setBaseline(data as BaselineRow)
        setLoading(false)
      })
  }, [])

  return { baseline, loading }
}
