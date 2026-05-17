'use server';

import { checkRateLimit } from '@/lib/redis';
import { supabase } from '@/lib/supabase';

/**
 * Fetch map markers from the pre-computed snapshot table.
 */
export async function getMapIntel() {
  const { data, error } = await supabase
    .from('map_snapshot')
    .select('data')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('Snapshot fetch failed:', error.message);
    return [];
  }

  return data?.data || [];
}

/**
 * Search localities by name (local geocoding)
 */
export async function searchLocalities(query: string) {
  if (!query || query.length < 2) return [];

  const { data, error } = await supabase.rpc('search_localities', { query });

  if (error) {
    console.error('Locality search failed:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Find buildings within a certain radius of coordinates
 */
export async function findNearbyBuildings(lat: number, lng: number, radiusMeters = 50) {
  const { data, error } = await supabase
    .rpc('get_nearby_buildings', {
      t_lat: lat,
      t_lng: lng,
      t_radius: radiusMeters
    });

  if (error) {
    console.error('Nearby Search Failure:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Deploy a new listing with rate limiting (max 5 deploys per 15 min window)
 */
export async function deployNode(formData: any) {
  const rateKey = `deploy:${formData.contributorName || 'anon'}`;
  const { allowed } = await checkRateLimit(rateKey, 5, 900);
  if (!allowed) {
    return { error: 'Rate limit exceeded. Please wait before adding more listings.' };
  }

  try {
    let buildingId = formData.existingBuildingId;

    if (!buildingId) {
      const { data: building, error: bError } = await supabase
        .from('buildings')
        .insert({
          name: formData.buildingName || `${formData.category.toUpperCase()} NODE ${Math.floor(Math.random() * 1000)}`,
          category: formData.category,
          location: `POINT(${formData.lng} ${formData.lat})`,
          address: formData.address || 'Tactical Deployment Zone',
          city: 'Hyderabad'
        })
        .select()
        .single();

      if (bError) throw bError;
      buildingId = building.id;
    }

    const { data: floor, error: fError } = await supabase
      .from('floors')
      .insert({
        building_id: buildingId,
        floor_number: parseInt(formData.floor) || 0
      })
      .select()
      .single();

    if (fError) throw fError;

    const { data: flat, error: flError } = await supabase
      .from('flats')
      .insert({
        floor_id: floor.id,
        flat_number: formData.flatNumber,
        status: 'vacant',
        rent_amount: parseFloat(formData.rent.replace(/[^0-9.]/g, '')),
        no_broker_link: formData.noBrokerLink,
        contributor_name: formData.contributorName || 'Anonymous Node',
        contributor_upi_id: formData.contributorUpi || ''
      })
      .select()
      .single();

    if (flError) throw flError;

    await supabase.from('contributions').insert({
      flat_id: flat.id,
      contribution_type: 'new_listing',
      reward_amount: 2500
    });

    return { success: true, flatId: flat.id };
  } catch (err: any) {
    console.error('Deployment Failure:', err.message);
    return { error: err.message };
  }
}

/**
 * Lock a flat with rate limiting (max 3 locks per 15 min)
 */
export async function lockPlace(flatId: string) {
  const rateKey = `lock:${flatId}`;
  const { allowed } = await checkRateLimit(rateKey, 3, 900);
  if (!allowed) {
    return { error: 'Rate limit exceeded for this listing.' };
  }

  try {
    const { error: updateError } = await supabase
      .from('flats')
      .update({ status: 'occupied' })
      .eq('id', flatId);

    if (updateError) throw updateError;
    return { success: true };
  } catch (err: any) {
    console.error('Lock Protocol Failure:', err.message);
    return { error: err.message };
  }
}

/**
 * Flag a listing with rate limiting (max 3 flags per 15 min per flat)
 */
export async function flagIntel(flatId: string) {
  const rateKey = `flag:${flatId}`;
  const { allowed } = await checkRateLimit(rateKey, 3, 900);
  if (!allowed) {
    return { error: 'Rate limit exceeded for flagging.' };
  }

  try {
    const { error: incError } = await supabase.rpc('increment_intel_flags', { target_id: flatId });
    if (incError) throw incError;
    return { success: true };
  } catch (err: any) {
    console.error('Flagging Failure:', err.message);
    return { error: err.message };
  }
}
