import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const SOURCE_NAME = 'bengaluru.rent';
const SOURCE_API = 'https://mpnjtkqklmwczowhodfh.supabase.co/functions/v1/get-pins';
const WRITE_DELAY_MS = 50;

interface BengaluruPin {
  id: string;
  lat: number;
  lng: number;
  rent_amount: number;
  bhk: string;
  sqft: number | null;
  furnished: boolean;
  gated: boolean;
  society: string | null;
  maintenance_included: boolean;
  deposit_months: string | null;
  pet_friendly: 'yes' | 'no' | 'not_sure' | null;
  listing_type: 'room' | 'whole' | null;
  available_from: 'asap' | 'next_month' | 'flexible';
  looking_for_flatmate: boolean;
  occupant_type: 'family' | 'bachelor' | null;
  report_count: number;
  created_at: string;
}

function mapBhk(bhkStr: string): number {
  const n = parseInt(bhkStr, 10);
  return isNaN(n) ? 1 : Math.min(n, 5);
}

function mapDepositMonths(raw: string | null): number {
  if (!raw) return 2;
  const n = parseInt(raw, 10);
  return isNaN(n) ? 2 : n;
}

function mapPetsAllowed(raw: 'yes' | 'no' | 'not_sure' | null): boolean {
  return raw === 'yes';
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const maxDuration = 300; // 5 minutes for 4579 pins × 50ms

export async function GET(request: Request) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Missing Supabase env vars' }),
      { status: 502 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  try {
    // Fetch pins
    const fetchResponse = await fetch(SOURCE_API);
    if (!fetchResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Source API: ${fetchResponse.status}` }),
        { status: 502 }
      );
    }

    const payload = (await fetchResponse.json()) as { pins: BengaluruPin[] };
    const pins = payload.pins;

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < pins.length; i++) {
      const pin = pins[i];
      if ((i + 1) % 500 === 0) {
        console.log(`[cron] Processing pin ${i + 1}/${pins.length}...`);
      }

      try {
        const { data, error } = await supabase.rpc('import_bengaluru_pin', {
          p_source: SOURCE_NAME,
          p_source_id: pin.id,
          p_lat: pin.lat,
          p_lng: pin.lng,
          p_society: pin.society ?? null,
          p_gated: pin.gated,
          p_rent_amount: pin.rent_amount,
          p_bhk: mapBhk(pin.bhk),
          p_size_sqft: pin.sqft ?? null,
          p_furnished: pin.furnished,
          p_maintenance_extra: !pin.maintenance_included,
          p_deposit_months: mapDepositMonths(pin.deposit_months),
          p_pets_allowed: mapPetsAllowed(pin.pet_friendly),
          p_listing_type: pin.listing_type ?? null,
          p_available_from: pin.available_from,
          p_looking_for_flatmate: pin.looking_for_flatmate,
          p_occupant_type: pin.occupant_type ?? null,
          p_ip_hash: sha256(pin.id)
        });

        if (error) {
          if (error.code === '23505') {
            skipped++;
          } else {
            failed++;
            console.error(`[cron] Pin ${pin.id} error:`, error.message);
          }
        } else if (data === null) {
          skipped++;
        } else {
          imported++;
        }
      } catch (err: unknown) {
        failed++;
        console.error(`[cron] Pin ${pin.id} exception:`, err);
      }

      await sleep(WRITE_DELAY_MS);
    }

    // Refresh snapshot
    await supabase.rpc('refresh_map_snapshot');

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        skipped,
        failed,
        total: pins.length
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('[cron] Fatal error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
