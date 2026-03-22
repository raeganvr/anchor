// app/api/debug/route.ts
// Dev-only GET endpoint — dumps all three Supabase tables and one simulated biometric reading.
// Hit GET /api/debug in the browser to verify Supabase connectivity and simulation output.
// Remove or gate behind an env check before deploying to production.
import { createAuthServer } from '@/lib/supabase/auth-server'
import { supabaseServer } from '@/lib/supabase/server'
import { getNextLiveReading, detectTrigger, REAL_BASELINE } from '@/lib/biometrics/simulate'

export async function GET() {
  const supabase = await createAuthServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [baseline, episodes, settings] = await Promise.all([
    supabaseServer.from('baseline').select('*').eq('user_id', user.id).limit(1).maybeSingle(),
    supabaseServer.from('episodes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabaseServer.from('settings').select('*').eq('user_id', user.id).limit(1).maybeSingle(),
  ])

  // Snapshot one simulated reading + trigger check
  const reading = getNextLiveReading(REAL_BASELINE)
  const trigger = detectTrigger([reading.hr], [reading.stress], REAL_BASELINE)

  return Response.json({
    supabase: {
      baseline: baseline.data ?? baseline.error,
      episodes: episodes.data ?? episodes.error,
      settings: settings.data ?? settings.error,
    },
    simulation: {
      mode: reading.mode,
      hr: reading.hr,
      stress: reading.stress,
      trigger,
    },
  })
}
