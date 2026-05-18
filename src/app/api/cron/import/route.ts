import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

export const maxDuration = 300; // 5 minutes required for 4579 pins × 50ms = ~229s

const SOURCE_NAME = 'bengaluru.rent';
const SOURCE_API = 'https://mpnjtkqklmwczowhodfh.supabase.co/functions/v1/get-pins';
const WRITE_DELAY_MS = 50;

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  // 1. Authenticate the cron caller
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[cron] CRON_SECRET env var not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Build service-role Supabase client (never use anon key for imports)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  // 3. Fetch source data
  let pins: any[];
  try {
    const res = await fetch(SOURCE_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    pins = payload.pins;
  } catch (err: any) {
    return NextResponse.json({ error: `Source fetch failed: ${err.message}` }, { status: 502 });
  }

  // 4. Process pins
  let imported = 0, skipped = 0, failed = 0;

  for (const pin of pins) {
    try {
      const { data, error } = await supabase.rpc('import_bengaluru_pin', {
        p_source:               SOURCE_NAME,
        p_source_id:            pin.id,
        p_lat:                  pin.lat,
        p_lng:                  pin.lng,
        p_society:              pin.society ?? null,
        p_gated:                pin.gated,
        p_rent_amount:          pin.rent_amount,
        p_bhk:                  Math.min(parseInt(pin.bhk, 10) || 1, 5),
        p_size_sqft:            pin.sqft ?? null,
        p_furnished:            pin.furnished,
        p_maintenance_extra:    !pin.maintenance_included,
        p_deposit_months:       parseInt(pin.deposit_months, 10) || 2,
        p_pets_allowed:         pin.pet_friendly === 'yes',
        p_listing_type:         pin.listing_type ?? null,
        p_available_from:       pin.available_from,
        p_looking_for_flatmate: pin.looking_for_flatmate,
        p_occupant_type:        pin.occupant_type ?? null,
        p_ip_hash:              sha256(pin.id),
      });

      if (error?.code === '23505' || data === null) {
        skipped++;
      } else if (error) {
        throw error;
      } else {
        imported++;
      }
    } catch (err: any) {
      failed++;
      console.error(`[cron] Pin ${pin.id} failed:`, err.message);
    }

    await sleep(WRITE_DELAY_MS);
  }

  // 5. Refresh snapshot
  await supabase.rpc('refresh_map_snapshot');

  return NextResponse.json({
    success: true,
    imported,
    skipped,
    failed,
    total: pins.length,
  });
}
