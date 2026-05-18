import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const SOURCE_NAME = 'bengaluru.rent';
const SOURCE_API = 'https://mpnjtkqklmwczowhodfh.supabase.co/functions/v1/get-pins';
const WRITE_DELAY_MS = 50;

// ------------------------------------------------------------------
// Types matching the source API pin schema
// ------------------------------------------------------------------
interface BengaluruPin {
  id: string;
  lat: number;
  lng: number;
  rent_amount: number;
  bhk: string;           // "1"–"5+" as string
  sqft: number | null;
  furnished: boolean;
  gated: boolean;
  society: string | null;
  maintenance_included: boolean;  // INVERTED: true means maintenance IS included = not extra
  deposit_months: string | null;  // e.g. "2", "3"
  pet_friendly: 'yes' | 'no' | 'not_sure' | null;
  listing_type: 'room' | 'whole' | null;
  available_from: 'asap' | 'next_month' | 'flexible';
  looking_for_flatmate: boolean;
  occupant_type: 'family' | 'bachelor' | null;
  report_count: number;
  created_at: string;
}

// ------------------------------------------------------------------
// Field mapping helpers
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// Main import logic
// ------------------------------------------------------------------
async function runImport() {
  // Validate required env vars before doing anything
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Service role client — bypasses RLS entirely
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  // Step 1: Fetch all pins (single request, no pagination)
  console.log(`[import] Fetching pins from ${SOURCE_API}...`);
  const fetchResponse = await fetch(SOURCE_API);
  if (!fetchResponse.ok) {
    throw new Error(`Source API responded with ${fetchResponse.status}`);
  }
  const payload = await fetchResponse.json() as { pins: BengaluruPin[] };
  const pins = payload.pins;
  console.log(`[import] Fetched ${pins.length} pins`);

  // Step 2: Process each pin
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

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
        p_bhk:                  mapBhk(pin.bhk),
        p_size_sqft:            pin.sqft ?? null,
        p_furnished:            pin.furnished,
        p_maintenance_extra:    !pin.maintenance_included,  // INVERT
        p_deposit_months:       mapDepositMonths(pin.deposit_months),
        p_pets_allowed:         mapPetsAllowed(pin.pet_friendly),
        p_listing_type:         pin.listing_type ?? null,
        p_available_from:       pin.available_from,
        p_looking_for_flatmate: pin.looking_for_flatmate,
        p_occupant_type:        pin.occupant_type ?? null,
        p_ip_hash:              sha256(pin.id),
      });

      if (error) {
        // Unique violation on import_sources = already imported (race condition safety)
        if (error.code === '23505') {
          skipped++;
        } else {
          throw error;
        }
      } else if (data === null) {
        // RPC returned NULL — means idempotency path was taken inside the function
        skipped++;
      } else {
        imported++;
      }
    } catch (err: unknown) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ id: pin.id, error: message });
      console.error(`[import] Failed pin ${pin.id}: ${message}`);
    }

    // Respectful rate: 50ms between DB writes
    await sleep(WRITE_DELAY_MS);
  }

  // Step 3: Trigger snapshot refresh so new pins appear on the map
  const { error: snapshotError } = await supabase.rpc('refresh_map_snapshot');
  if (snapshotError) {
    console.error('[import] Snapshot refresh failed:', snapshotError.message);
  } else {
    console.log('[import] Snapshot refreshed successfully');
  }

  // Step 4: Summary report
  console.log('='.repeat(60));
  console.log(`[import] Complete — ${imported} imported, ${skipped} skipped, ${failed} failed`);
  if (errors.length > 0) {
    console.log('[import] Error details:');
    errors.forEach(e => console.log(`  pin ${e.id}: ${e.error}`));
  }
  console.log('='.repeat(60));

  // Exit non-zero if there were hard failures (GitHub Actions will mark the step as failed)
  if (failed > 0) {
    process.exit(1);
  }
}

runImport().catch(err => {
  console.error('[import] Unhandled fatal error:', err);
  process.exit(1);
});
