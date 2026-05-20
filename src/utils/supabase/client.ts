import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined;

export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const isSecure = supabaseUrl.startsWith('https://');

  client = createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'x-client-info': 'indian.rent',
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
        // Force WebSocket protocol based on page security
        headers: isSecure ? {} : undefined,
      },
    }
  )

  return client;
}
