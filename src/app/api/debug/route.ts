// app/api/debug/route.ts
// Dev-only GET endpoint — dumps all three Supabase tables and one simulated biometric reading.
// Hit GET /api/debug in the browser to verify Supabase connectivity and simulation output.
// Remove or gate behind an env check before deploying to production.
import { supabaseServer } from '@/lib/supabase/server'
import { getNextLiveReading, detectTrigger, REAL_BASELINE } from '@/lib/biometrics/simulate'

export async function GET() {
  const [baseline, episodes, settings] = await Promise.all([
    supabaseServer.from('baseline').select('*').single(),
    supabaseServer.from('episodes').select('*').order('created_at', { ascending: false }).limit(5),
    supabaseServer.from('settings').select('*').single(),
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
