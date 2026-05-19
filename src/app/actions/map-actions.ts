'use server';

import { checkRateLimit, checkRateLimitStrict, getServerIpHash } from '@/lib/redis';
import { createClient } from '@/utils/supabase/server';

/**
 * Reverse geocode coordinates to address via Google Geocoding API.
 * Calls API from server-side using server-only API key.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const data = (await res.json()) as { results?: Array<{ formatted_address: string }> };
    return data.results?.[0]?.formatted_address ?? null;
  } catch (err) {
    console.error('Reverse geocode failed:', err);
    return null;
  }
}

function isSafeUrl(url?: string | null): boolean {
  if (!url) return true;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function validateDeployForm(f: any): string | null {
  if (!f || typeof f !== 'object') return 'Invalid form data.';
  if (typeof f.lat !== 'number' || typeof f.lng !== 'number') return 'Invalid coordinates.';
  if (!['gated', 'semi-gated', 'standalone', 'pg', 'hostel'].includes(f.category)) return 'Invalid category.';
  if (typeof f.rent !== 'string' || !/^\d[\d,.]*$/.test(f.rent.trim())) return 'Invalid rent amount.';
  if (!isSafeUrl(f.noBrokerLink)) return 'Invalid NoBroker URL (must be https).';
  if (!isSafeUrl(f.flatmatesLink)) return 'Invalid Flatmates URL (must be https).';
  return null;
}

function sanitizeError(err: any, fallback = 'Operation failed. Please try again.'): string {
  if (err?.code === '23505') return 'This entry already exists.';
  if (err?.code === '23503') return 'Referenced record not found.';
  if (err?.code === '57014') return 'Request timed out. Please try again.';
  return fallback;
}

/**
 * Fetch map markers from the pre-computed snapshot table.
 * The component handles city-based filtering based on the city field.
 */
export async function getMapIntel() {
  const supabase = await createClient();
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

  const supabase = await createClient();
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
  const supabase = await createClient();
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
  // Input validation
  const validationError = validateDeployForm(formData);
  if (validationError) {
    return { error: validationError };
  }

  // Get server-derived IP hash
  const serverIpHash = await getServerIpHash();

  // Rate limiting - fail closed
  const rateKey = `deploy:${serverIpHash}`;
  const { allowed } = await checkRateLimitStrict(rateKey, 5, 900);
  if (!allowed) {
    return { error: 'Rate limit exceeded. Please wait before adding more listings.' };
  }

  // Geofence: must be within major Indian cities (4 supported cities)
  const cities = [
    { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
    { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
    { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
    { name: 'Cuttack', lat: 20.4625, lng: 85.8830 }
  ];

  let nearestCity: string | null = null;
  let minDistance = Infinity;

  for (const c of cities) {
    const latDiff = (formData.lat - c.lat) * 111;
    const lngDiff = (formData.lng - c.lng) * 105;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = c.name;
    }
  }

  if (!nearestCity || minDistance > 150) {
    return { error: 'Pin is outside supported cities. Only Hyderabad, Bengaluru, Bhubaneswar, and Cuttack are supported.' };
  }

  const supabase = await createClient();
  const city = nearestCity;
  let retries = 0;
  const maxRetries = 1;

  const attemptDeploy = async (): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('deploy_node_atomic', {
        p_building_id: formData.existingBuildingId || null,
        p_building_name: formData.buildingName || `${formData.category.toUpperCase()} NODE ${Math.floor(Math.random() * 1000)}`,
        p_category: formData.category,
        p_location: `POINT(${formData.lng} ${formData.lat})`,
        p_address: formData.address || 'Tactical Deployment Zone',
        p_city: city,
        p_ip_hash: serverIpHash,
        p_floor_number: parseInt(formData.floor) || 0,
        p_flat_number: formData.flatNumber,
        p_rent_amount: parseFloat(formData.rent.replace(/[^0-9.]/g, '')),
        p_no_broker_link: formData.noBrokerLink || null,
        p_flatmates_link: formData.flatmatesLink || null,
        p_contributor_name: formData.contributorName || 'Anonymous Node',
        p_contributor_upi_id: formData.contributorUpi || '',
        p_bhk: formData.bhk ? parseInt(formData.bhk) : null,
        p_furnishing: formData.furnishing || null,
        p_size_sqft: formData.sizeSqft ? parseInt(formData.sizeSqft) : null,
        p_maintenance_extra: formData.maintenanceExtra || false,
        p_maintenance_amount: formData.maintenanceAmount ? parseInt(formData.maintenanceAmount) : null,
        p_tenant_preference: formData.tenantPreference || 'any',
        p_pets_allowed: formData.petsAllowed || false,
        p_deposit_months: formData.depositMonths ? parseInt(formData.depositMonths) : 2,
        p_is_transparency_pin: formData.isTransparencyPin || false,
        p_availability_date: formData.availabilityDate || null,
        p_flatmate_needed: formData.flatmateNeeded || false,
      });

      if (error) throw error;
      return { success: true, flatId: data.flat_id };
    } catch (err: any) {
      if (retries < maxRetries && (err.code === '57014' || err.code === 'PGRST301')) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 2000));
        return attemptDeploy();
      }
      throw err;
    }
  };

  try {
    return await attemptDeploy();
  } catch (err: any) {
    console.error('Deployment Failure:', err.message);
    return { error: sanitizeError(err) };
  }
}

/**
 * Fetch full details for a single flat by ID, joining building and floor info
 * NOTE: Does not return ipHash or contributorUpiId (use getContributorPaymentDetails for UPI)
 */
export async function getFlatDetails(flatId: string) {
  const supabase = await createClient();
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
      maintenance_extra,
      maintenance_amount,
      tenant_preference,
      pets_allowed,
      deposit_months,
      is_transparency_pin,
      is_removed,
      availability_date,
      flatmate_needed,
      no_broker_link,
      flatmates_link,
      contributor_name,
      intel_flags,
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
    maintenanceExtra: data.maintenance_extra,
    maintenanceAmount: data.maintenance_amount,
    tenantPreference: data.tenant_preference,
    petsAllowed: data.pets_allowed,
    depositMonths: data.deposit_months,
    isTransparencyPin: data.is_transparency_pin,
    isRemoved: data.is_removed,
    availabilityDate: data.availability_date,
    flatmateNeeded: data.flatmate_needed,
    noBrokerLink: data.no_broker_link,
    flatmatesLink: data.flatmates_link,
    contributorName: data.contributor_name,
    intelFlags: data.intel_flags,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    floorNumber: floor?.floor_number,
    buildingId: building?.id,
    buildingName: building?.name,
    buildingCategory: building?.category,
    buildingAddress: building?.address,
    buildingCity: building?.city,
  };
}

/**
 * Get contributor payment details (UPI) - gated action, call only after lock confirmation
 */
export async function getContributorPaymentDetails(flatId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('flats')
    .select('contributor_upi_id')
    .eq('id', flatId)
    .maybeSingle();

  if (error) {
    console.error('Payment details fetch failed:', error.message);
    return { upiId: null };
  }

  return { upiId: data?.contributor_upi_id ?? null };
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

  const supabase = await createClient();
  try {
    const { error: updateError } = await supabase
      .from('flats')
      .update({ status: 'occupied' })
      .eq('id', flatId);

    if (updateError) throw updateError;
    return { success: true };
  } catch (err: any) {
    console.error('Lock Protocol Failure:', err.message);
    return { error: sanitizeError(err) };
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

  const supabase = await createClient();
  try {
    const { error: incError } = await supabase.rpc('increment_intel_flags', { target_id: flatId });
    if (incError) throw incError;

    // Check if the flat is now removed (3+ flags triggered removal)
    const { data: flat } = await supabase
      .from('flats')
      .select('is_removed, intel_flags')
      .eq('id', flatId)
      .maybeSingle();

    return { success: true, removed: flat?.is_removed === true };
  } catch (err: any) {
    console.error('Flagging Failure:', err.message);
    return { error: sanitizeError(err) };
  }
}

/**
 * Track API usage for quota monitoring (Google Maps, Mapbox, Supabase reads)
 */
export async function trackApiUsage(service: 'google_maps' | 'mapbox' | 'supabase_reads') {
  const supabase = await createClient();
  const month = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  try {
    await supabase.rpc('increment_api_usage', { p_service: service, p_month: month });
  } catch (err: any) {
    // Silent fail — don't interrupt UX for analytics tracking
    console.warn('API usage tracking failed:', err.message);
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
}) {
  const serverIpHash = await getServerIpHash();

  const rateKey = `seeker:${serverIpHash}`;
  const { allowed } = await checkRateLimitStrict(rateKey, 3, 900);
  if (!allowed) {
    return { error: 'Rate limit exceeded. Please wait before adding more seeker pins.' };
  }

  const supabase = await createClient();
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
      ip_hash: serverIpHash,
    });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Seeker Pin Failure:', err.message);
    return { error: sanitizeError(err) };
  }
}

/**
 * Get active seeker pins
 */
export async function getSeekerPins() {
  const supabase = await createClient();
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
}) {
  const serverIpHash = await getServerIpHash();
  const supabase = await createClient();
  try {
    const { error } = await supabase.from('ratings').insert({
      flat_id: data.flatId,
      locality_score: data.localityScore,
      built_quality_score: data.builtQualityScore,
      ip_hash: serverIpHash,
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
    return { error: sanitizeError(err) };
  }
}

/**
 * Get ratings for a flat
 */
export async function getFlatRatings(flatId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_flat_ratings', { target_flat_id: flatId });
  if (error) {
    return { avg_locality: 0, avg_built_quality: 0, total_ratings: 0 };
  }
  return data?.[0] || { avg_locality: 0, avg_built_quality: 0, total_ratings: 0 };
}

/**
 * Delete own pin (by server-derived IP hash)
 */
export async function deleteOwnPin(flatId: string) {
  const serverIpHash = await getServerIpHash();
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.rpc('delete_own_pin', {
      target_flat_id: flatId,
      owner_ip_hash: serverIpHash,
    });
    if (error) throw error;
    if (!data) return { error: 'This pin does not belong to you.' };
    return { success: true };
  } catch (err: any) {
    console.error('Delete Pin Failure:', err.message);
    return { error: sanitizeError(err) };
  }
}

/**
 * Get comments for a flat
 */
export async function getComments(flatId: string) {
  const supabase = await createClient();
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
export async function addComment(flatId: string, content: string) {
  const serverIpHash = await getServerIpHash();

  const rateKey = `comment:${serverIpHash}`;
  const { allowed } = await checkRateLimitStrict(rateKey, 5, 300);
  if (!allowed) {
    return { error: 'Rate limit exceeded for commenting.' };
  }

  const supabase = await createClient();
  try {
    const { error } = await supabase.from('comments').insert({
      flat_id: flatId,
      content: content.trim().slice(0, 500),
      ip_hash: serverIpHash,
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Comment Failure:', err.message);
    return { error: sanitizeError(err) };
  }
}

/**
 * Get all listings belonging to the current user (by server-derived IP hash)
 */
export async function getMyListings() {
  const serverIpHash = await getServerIpHash();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('flats')
    .select(`
      id, flat_number, status, rent_amount, bhk, flatmate_needed, intel_flags, created_at,
      floors ( floor_number, buildings ( name, category, address ) )
    `)
    .eq('ip_hash', serverIpHash)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data || []).map((d: any) => ({
    id: d.id,
    flatNumber: d.flat_number,
    status: d.status,
    rentAmount: d.rent_amount,
    bhk: d.bhk,
    flatmateNeeded: d.flatmate_needed,
    intelFlags: d.intel_flags,
    createdAt: d.created_at,
    floorNumber: d.floors?.floor_number,
    buildingName: d.floors?.buildings?.name,
    buildingCategory: d.floors?.buildings?.category,
    buildingAddress: d.floors?.buildings?.address,
  }));
}

/**
 * Get all seeker pins belonging to the current user (by server-derived IP hash)
 */
export async function getMySeekerPins() {
  const serverIpHash = await getServerIpHash();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('seeker_pins')
    .select('id, bhk_preference, budget, move_in_timeline, expires_at, created_at')
    .eq('ip_hash', serverIpHash)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

/**
 * Update rent amount or flatmate status on a listing the user owns
 */
export async function updateMyListing(
  flatId: string,
  updates: { rentAmount?: number; flatmateNeeded?: boolean }
) {
  const serverIpHash = await getServerIpHash();
  const supabase = await createClient();
  const payload: Record<string, any> = {};
  if (updates.rentAmount !== undefined) payload.rent_amount = updates.rentAmount;
  if (updates.flatmateNeeded !== undefined) payload.flatmate_needed = updates.flatmateNeeded;
  const { error } = await supabase
    .from('flats')
    .update(payload)
    .eq('id', flatId)
    .eq('ip_hash', serverIpHash);

  if (error) return { error: sanitizeError(error) };
  return { success: true };
}

/**
 * Delete a seeker pin owned by the user
 */
export async function deleteMySeekerPin(pinId: string) {
  const serverIpHash = await getServerIpHash();
  const supabase = await createClient();
  const { error } = await supabase
    .from('seeker_pins')
    .delete()
    .eq('id', pinId)
    .eq('ip_hash', serverIpHash);

  if (error) return { error: sanitizeError(error) };
  return { success: true };
}

/**
 * Subscribe to area notifications
 */
export async function subscribeToArea(
  email: string,
  lat: number,
  lng: number,
  radiusKm: number,
  locality?: string
) {
  if (!email || !email.includes('@')) return { error: 'Valid email required.' };
  const supabase = await createClient();
  const { error } = await supabase.from('notification_subscriptions').insert({
    email,
    latitude: lat,
    longitude: lng,
    radius_km: radiusKm,
    locality: locality || null,
  });
  if (error) return { error: error.message };
  return { success: true };
}
