import { NextResponse } from 'next/server'
import { createAuthServer } from '@/lib/supabase/auth-server'
import { supabaseServer } from '@/lib/supabase/server'
import { sendCaregiverAlert, sendUserCheckIn, EpisodeEmailData } from '@/lib/email/caregiver'
import type { SettingsRow } from '@/types/database'

export async function POST(request: Request) {
  const supabase = await createAuthServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    episodeId?: string
    triggeredAt: string
    triggerReason: string | null
    triggerHrValue: number | null
    triggerStressValue: number | null
  }

  const { data: settingsData, error: settingsError } = await supabaseServer
    .from('settings')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (settingsError || !settingsData) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }

  const settings = settingsData as SettingsRow

  if (!settings.notifications_enabled) {
    return NextResponse.json({ results: {}, errors: [] })
  }

  const episode: EpisodeEmailData = {
    episodeId: body.episodeId ?? '',
    triggeredAt: body.triggeredAt,
    triggerReason: body.triggerReason,
    triggerHrValue: body.triggerHrValue,
    triggerStressValue: body.triggerStressValue,
  }

  const results: { caregiver?: string; user?: string } = {}
  const errors: string[] = []

  // Send user check-in email
  if (settings.user_email) {
    const { error } = await sendUserCheckIn(settings.user_email, episode)
    if (error) {
      errors.push(`user email: ${error.message}`)
    } else {
      results.user = settings.user_email
    }
  }

  // Send caregiver alert if consent is on and email is set
  if (settings.caregiver_consent && settings.caregiver_email) {
    const { error } = await sendCaregiverAlert(
      settings.caregiver_email,
      settings.caregiver_name,
      episode
    )
    if (error) {
      errors.push(`caregiver email: ${error.message}`)
    } else {
      results.caregiver = settings.caregiver_email

      // Mark episode as caregiver_alerted
      if (body.episodeId) {
        await supabaseServer
        .from('episodes')
        .update({ caregiver_alerted: true, caregiver_alerted_at: new Date().toISOString() })
        .eq('id', body.episodeId)
        .eq('user_id', user.id)
      }
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ results, errors }, { status: 207 })
  }

  return NextResponse.json({ results })
}
