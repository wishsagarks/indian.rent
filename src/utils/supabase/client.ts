import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'x-client-info': 'indian.rent',
        },
      },
      // Force secure WebSocket (wss) in production
      // Prevents "WebSocket not available: The operation is insecure" errors
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  )

  return client;
}
