import { createClient } from '@supabase/supabase-js'

// Pass cache:'no-store' on every Supabase fetch so Next.js Data Cache never
// serves a stale snapshot of the database to the server-side route handlers.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    global: {
      fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
        fetch(url, { ...options, cache: 'no-store' }),
    },
  }
)
