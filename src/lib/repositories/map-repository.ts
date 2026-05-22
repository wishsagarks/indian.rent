/**
 * Map Repository
 * Data access layer for map-related queries (pins, seekers, geosearch)
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetch the complete map snapshot (all buildings + flats cached)
 */
export async function fetchMapSnapshot(supabase: SupabaseClient): Promise<unknown[] | null> {
  const { data, error } = await supabase
    .from('map_snapshot')
    .select('data')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) return null;
  return data.data;
}

/**
 * Search localities by query (RPC)
 */
export async function searchLocalitiesRpc(
  supabase: SupabaseClient,
  query: string
): Promise<any[]> {
  const { data, error } = await supabase.rpc('search_localities', {
    query_text: query,
  });

  if (error || !data) return [];
  return data;
}

/**
 * Find nearby buildings within radius
 */
export async function fetchNearbyBuildingsRpc(
  supabase: SupabaseClient,
  lat: number,
  lng: number,
  radius: number
): Promise<any[]> {
  const { data, error } = await supabase.rpc('find_nearby_buildings', {
    lat,
    lng,
    radius_km: radius,
  });

  if (error || !data) return [];
  return data;
}

/**
 * Insert a new seeker pin
 */
export async function insertSeekerPin(
  supabase: SupabaseClient,
  payload: {
    latitude: number;
    longitude: number;
    bhk_preference: string;
    budget: string;
    move_in_timeline: string;
    food_preference?: string;
    smoking_preference?: string;
    gender_preference?: string;
    email?: string;
    ip_hash: string;
  }
): Promise<{ id: string } | null> {
  const { data, error } = await supabase.from('seeker_pins').insert(payload).select('id');

  if (error || !data || data.length === 0) return null;
  return { id: data[0].id };
}

/**
 * Fetch all active seeker pins
 */
export async function fetchActiveSeekerPins(supabase: SupabaseClient): Promise<any[]> {
  const { data, error } = await supabase
    .from('seeker_pins')
    .select('*')
    .gt('expires_at', new Date().toISOString());

  if (error || !data) return [];
  return data;
}

/**
 * Fetch seeker pins for a specific IP hash (user)
 */
export async function fetchSeekerPinsByIpHash(
  supabase: SupabaseClient,
  ipHash: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('seeker_pins')
    .select('*')
    .eq('ip_hash', ipHash);

  if (error || !data) return [];
  return data;
}

/**
 * Delete a seeker pin by IP hash verification
 */
export async function deleteSeekerPinByIpHash(
  supabase: SupabaseClient,
  pinId: string,
  ipHash: string
): Promise<boolean> {
  const { error } = await supabase
    .from('seeker_pins')
    .delete()
    .eq('id', pinId)
    .eq('ip_hash', ipHash);

  return !error;
}
