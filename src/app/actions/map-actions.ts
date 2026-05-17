'use server';

import { getCachedData } from '@/lib/redis';
import { supabase } from '@/lib/supabase';

/**
 * Tactical data fetch for map markers with Redis caching
 */
export async function getMapIntel() {
  const cacheKey = 'hyderabad_intel_live_v3';

  return getCachedData(cacheKey, async () => {
    // Fetch buildings and their hierarchical nested data, including timestamps for decay logic
    const { data, error } = await supabase
      .from('buildings')
      .select(`
        id,
        name,
        category,
        location,
        updated_at,
        floors (
          id,
          floor_number,
          flats (
            id,
            flat_number,
            status,
            rent_amount,
            contributor_name,
            updated_at
          )
        )
      `)
      .neq('flats.status', 'occupied')
      .limit(200);

    if (error) {
      console.error('Tactical Intel Failure:', error.message);
      return [];
    }

    return data || [];
  }, 60);
}

/**
 * Find buildings within a certain radius of coordinates
 */
export async function findNearbyBuildings(lat: number, lng: number, radiusMeters = 50) {
  // Use PostGIS ST_DWithin to find nearby buildings
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
 * Deploy a new tactical node (Anonymous) with real coordinates
 */
export async function deployNode(formData: any) {
  try {
    let buildingId = formData.existingBuildingId;

    // 1. Resolve Building (Use existing or create new)
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

    // 2. Create Floor
    const { data: floor, error: fError } = await supabase
      .from('floors')
      .insert({
        building_id: buildingId,
        floor_number: parseInt(formData.floor) || 0
      })
      .select()
      .single();

    if (fError) throw fError;

    // 3. Create Flat with anonymous contributor metadata
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

    // 4. Log Contribution (Anonymous)
    await supabase.from('contributions').insert({
      flat_id: flat.id,
      contribution_type: 'new_listing',
      reward_amount: 2500
    });

    return { success: true, flatId: flat.id };
  } catch (err: any) {
    console.error('Anonymous Deployment Failure:', err.message);
    return { error: err.message };
  }
}

/**
 * Tactical "Lock" action (Anonymous)
 */
export async function lockPlace(flatId: string) {
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
 * Community Moderation - Flag a listing as stale or fake
 */
export async function flagIntel(flatId: string) {
  try {
    const { error: incError } = await supabase.rpc('increment_intel_flags', { target_id: flatId });
    if (incError) throw incError;

    return { success: true };
  } catch (err: any) {
    console.error('Flagging Failure:', err.message);
    return { error: err.message };
  }
}
