'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Episode, EpisodeCreate } from '@/types/database'

export function useEpisodeLog() {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('episodes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setEpisodes((data as Episode[]) ?? [])
        setLoading(false)
      })
  }, [])

  async function logEpisode(ep: EpisodeCreate): Promise<Episode | null> {
    const { data } = await supabase
      .from('episodes')
      .insert(ep)
      .select()
      .single()
    if (data) setEpisodes(prev => [data as Episode, ...prev])
    return (data as Episode) ?? null
  }

  async function markResolved(id: string) {
    await supabase.from('episodes').update({ resolved: true }).eq('id', id)
    setEpisodes(prev =>
      prev.map(e => (e.id === id ? { ...e, resolved: true } : e))
    )
  }

  return { episodes, loading, logEpisode, markResolved }
}
