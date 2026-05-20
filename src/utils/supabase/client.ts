import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined;

export function createClient() {
  if (client) return client;

  // Ensure HTTPS URL for secure WebSocket (wss://)
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && supabaseUrl.startsWith('http://')) {
    supabaseUrl = supabaseUrl.replace('http://', 'https://');
  }

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
      },
    }
  )

  return client;
}
