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
          city: 'Hyderabad',
          ip_hash: formData.ipHash || null,
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
        contributor_upi_id: formData.contributorUpi || '',
        bhk: formData.bhk ? parseInt(formData.bhk) : null,
        furnishing: formData.furnishing || null,
        size_sqft: formData.sizeSqft ? parseInt(formData.sizeSqft) : null,
        maintenance_included: formData.maintenanceIncluded || false,
        availability_date: formData.availabilityDate || null,
        flatmate_needed: formData.flatmateNeeded || false,
        ip_hash: formData.ipHash || null,
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
 * Fetch full details for a single flat by ID, joining building and floor info
 */
export async function getFlatDetails(flatId: string) {
  const { data, error } = await supabase
    .from('flats')
    .select(`
      id,
      flat_number,
      status,
      rent_amount,
      bhk,
      furnishing,
      size_sqft,
      maintenance_included,
      availability_date,
      flatmate_needed,
      no_broker_link,
      flatmates_link,
      contributor_name,
      contributor_upi_id,
      intel_flags,
      ip_hash,
      created_at,
      updated_at,
      floors (
        floor_number,
        buildings (
          id,
          name,
          category,
          address,
          city,
          ip_hash,
          location
        )
      )
    `)
    .eq('id', flatId)
    .maybeSingle();

  if (error || !data) {
    console.error('getFlatDetails failed:', error?.message);
    return null;
  }

  const floor = (data.floors as any);
  const building = floor?.buildings;

  return {
    id: data.id,
    flatNumber: data.flat_number,
    status: data.status,
    rentAmount: data.rent_amount,
    bhk: data.bhk,
    furnishing: data.furnishing,
    sizeSqft: data.size_sqft,
    maintenanceIncluded: data.maintenance_included,
    availabilityDate: data.availability_date,
    flatmateNeeded: data.flatmate_needed,
    noBrokerLink: data.no_broker_link || data.flatmates_link,
    contributorName: data.contributor_name,
    contributorUpiId: data.contributor_upi_id,
    intelFlags: data.intel_flags,
    ipHash: data.ip_hash,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    floorNumber: floor?.floor_number,
    buildingId: building?.id,
    buildingName: building?.name,
    buildingCategory: building?.category,
    buildingAddress: building?.address,
    buildingCity: building?.city,
    buildingIpHash: building?.ip_hash,
  };
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

/**
 * Drop a seeker pin (flat hunt mode)
 */
export async function dropSeekerPin(data: {
  latitude: number;
  longitude: number;
  bhkPreference: string;
  budget: string;
  moveInTimeline: string;
  foodPreference: string;
  smokingPreference: string;
  genderPreference: string;
  email: string;
  ipHash: string;
}) {
  const rateKey = `seeker:${data.ipHash}`;
  const { allowed } = await checkRateLimit(rateKey, 3, 900);
  if (!allowed) {
    return { error: 'Rate limit exceeded. Please wait before adding more seeker pins.' };
  }

  try {
    const { error } = await supabase.from('seeker_pins').insert({
      latitude: data.latitude,
      longitude: data.longitude,
      bhk_preference: data.bhkPreference,
      budget: data.budget ? parseFloat(data.budget) : null,
      move_in_timeline: data.moveInTimeline,
      food_preference: data.foodPreference,
      smoking_preference: data.smokingPreference,
      gender_preference: data.genderPreference,
      email: data.email,
      ip_hash: data.ipHash,
    });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Seeker Pin Failure:', err.message);
    return { error: err.message };
  }
}

/**
 * Get active seeker pins
 */
export async function getSeekerPins() {
  const { data, error } = await supabase
    .from('seeker_pins')
    .select('id, latitude, longitude, bhk_preference, budget, move_in_timeline, created_at')
    .gt('expires_at', new Date().toISOString())
    .limit(100);

  if (error) {
    console.error('Seeker pins fetch failed:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Submit a rating for a flat (IP-deduplicated)
 */
export async function submitRating(data: {
  flatId: string;
  localityScore: number;
  builtQualityScore: number;
  ipHash: string;
}) {
  try {
    const { error } = await supabase.from('ratings').insert({
      flat_id: data.flatId,
      locality_score: data.localityScore,
      built_quality_score: data.builtQualityScore,
      ip_hash: data.ipHash,
    });

    if (error) {
      if (error.code === '23505') {
        return { error: 'You have already rated this listing.' };
      }
      throw error;
    }
    return { success: true };
  } catch (err: any) {
    console.error('Rating Failure:', err.message);
    return { error: err.message };
  }
}

/**
 * Get ratings for a flat
 */
export async function getFlatRatings(flatId: string) {
  const { data, error } = await supabase.rpc('get_flat_ratings', { target_flat_id: flatId });
  if (error) {
    return { avg_locality: 0, avg_built_quality: 0, total_ratings: 0 };
  }
  return data?.[0] || { avg_locality: 0, avg_built_quality: 0, total_ratings: 0 };
}

/**
 * Delete own pin (by IP hash)
 */
export async function deleteOwnPin(flatId: string, ipHash: string) {
  try {
    const { data, error } = await supabase.rpc('delete_own_pin', {
      target_flat_id: flatId,
      owner_ip_hash: ipHash,
    });
    if (error) throw error;
    if (!data) return { error: 'This pin does not belong to you.' };
    return { success: true };
  } catch (err: any) {
    console.error('Delete Pin Failure:', err.message);
    return { error: err.message };
  }
}

/**
 * Get comments for a flat
 */
export async function getComments(flatId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('id, content, created_at')
    .eq('flat_id', flatId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return [];
  return data || [];
}

/**
 * Add a comment to a flat
 */
export async function addComment(flatId: string, content: string, ipHash: string) {
  const rateKey = `comment:${ipHash}`;
  const { allowed } = await checkRateLimit(rateKey, 5, 300);
  if (!allowed) {
    return { error: 'Rate limit exceeded for commenting.' };
  }

  try {
    const { error } = await supabase.from('comments').insert({
      flat_id: flatId,
      content: content.trim().slice(0, 500),
      ip_hash: ipHash,
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Comment Failure:', err.message);
    return { error: err.message };
  }
}
