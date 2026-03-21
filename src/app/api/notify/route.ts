import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendCaregiverAlert, sendUserCheckIn, EpisodeEmailData } from '@/lib/email/caregiver'
import type { SettingsRow } from '@/types/database'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.json() as {
    episodeId: string
    triggeredAt: string
    triggerReason: string | null
    triggerHrValue: number | null
    triggerStressValue: number | null
  }

  const { data: settingsData, error: settingsError } = await supabaseAdmin
    .from('settings')
    .select('*')
    .single()

  if (settingsError || !settingsData) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }

  const settings = settingsData as SettingsRow

  const episode: EpisodeEmailData = {
    episodeId: body.episodeId,
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
      await supabaseAdmin
        .from('episodes')
        .update({ caregiver_alerted: true, caregiver_alerted_at: new Date().toISOString() })
        .eq('id', body.episodeId)
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ results, errors }, { status: 207 })
  }

  return NextResponse.json({ results })
}
