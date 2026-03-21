// lib/supabase/server.ts
// Server-side Supabase client — uses the service role key (bypasses RLS).
// Import `supabaseServer` from here in route handlers and server components only.
// Never expose this client or key to the browser.
import { createClient } from '@supabase/supabase-js'

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
