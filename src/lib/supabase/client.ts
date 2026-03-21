// lib/supabase/client.ts
// Browser-side Supabase client — uses the public anon key.
// Import `supabase` from here in any React hook or client component.
// Do NOT use this on the server; use supabaseServer from ./server instead.
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
