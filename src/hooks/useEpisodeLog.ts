// hooks/useEpisodeLog.ts
// Supabase-backed hook for reading and writing the episodes table.
// Use logEpisode() when a trigger fires (biometric, manual, or caregiver) to persist the
// biometric window and any metadata. Use resolveEpisode(id) to mark one closed.
// chat_transcript (Message[]) is written here by the chat team after a session ends.
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { EpisodeRow } from '@/types/database'
import type { HRReading, StressReading, HRVReading } from '@/lib/biometrics/simulate'
import type { Message } from '@/types/chat'

export function useEpisodeLog() {
  const [episodes, setEpisodes] = useState<EpisodeRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('episodes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setEpisodes(data as EpisodeRow[])
        setLoading(false)
      })
  }, [])

  const logEpisode = useCallback(async (episode: {
    triggered_by: 'biometric' | 'manual' | 'caregiver'
    trigger_reason?: string
    trigger_hr_value?: number
    trigger_stress_value?: number
    hr_data?: HRReading[]
    stress_data?: StressReading[]
    hrv_data?: HRVReading[]
    duration_minutes?: number
    user_label?: string
    window_start_ms?: number
    window_end_ms?: number
    chat_transcript?: Message[]
    notes?: string
    created_at?: string
  }) => {
    const { data, error } = await supabase
      .from('episodes')
      .insert(episode)
      .select()
      .single()

    if (data) setEpisodes(prev => [data as EpisodeRow, ...prev])
    return { data: data as EpisodeRow | null, error }
  }, [])

  const resolveEpisode = useCallback(async (id: string) => {
    const { data } = await supabase
      .from('episodes')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (data) setEpisodes(prev => prev.map(e => e.id === id ? data as EpisodeRow : e))
  }, [])

  const updateNotes = useCallback(async (id: string, notes: string) => {
    const { data, error } = await supabase
      .from('episodes')
      .update({ notes })
      .eq('id', id)
      .select()
      .single()

    if (data) setEpisodes(prev => prev.map(e => e.id === id ? data as EpisodeRow : e))
    return { data: data as EpisodeRow | null, error }
  }, [])

  const deleteEpisode = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('episodes')
      .delete()
      .eq('id', id)

    if (!error) setEpisodes(prev => prev.filter(e => e.id !== id))
    return { error }
  }, [])

  return { episodes, loading, logEpisode, resolveEpisode, updateNotes, deleteEpisode }
}
