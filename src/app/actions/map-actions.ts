'use server';

import { checkRateLimit, checkRateLimitStrict, getServerIpHash } from '@/lib/redis';
import { createClient } from '@/utils/supabase/server';
import type { ServerResult, ListingData } from '@/lib/types';
import * as listingRepo from '@/lib/repositories/listing-repository';
import * as mapRepo from '@/lib/repositories/map-repository';

/**
 * Reverse geocode coordinates to address via Google Geocoding API.
 * Uses server-only API key (restricted by IP) for security.
 * IMPORTANT: Configure GOOGLE_MAPS_API_KEY_SERVER in Google Cloud Console with IP restriction.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  // Use private server-side API key (restricted by IP in Google Cloud)
  const apiKey = process.env.GOOGLE_MAPS_API_KEY_SERVER;
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY_SERVER not configured');
    return null;
  }

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

  // Enhanced rent validation: proper format + range check
  if (typeof f.rent !== 'string') return 'Rent must be a string.';
  const rentTrimmed = f.rent.trim();
  const rentMatch = rentTrimmed.match(/^(\d+)(,\d{3})*(\.\d{2})?$/);
  if (!rentMatch) return 'Invalid rent format (e.g., 15000 or 15,000.50).';
  const rentAmount = parseFloat(rentTrimmed.replace(/,/g, ''));
  if (rentAmount < 1000 || rentAmount > 100000000) return 'Rent must be between ₹1K and ₹10Cr.';

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
  const snapshot = await mapRepo.fetchMapSnapshot(supabase);

  if (!snapshot) {
    console.error('Snapshot fetch failed');
    return [];
  }

  return snapshot;
}

/**
 * Search localities by name (local geocoding)
 */
export async function searchLocalities(query: string) {
  if (!query || query.length < 2) return [];
  if (query.length > 100) return [];

  const supabase = await createClient();
  return await mapRepo.searchLocalitiesRpc(supabase, query);
}

/**
 * Find buildings within a certain radius of coordinates
 */
export async function findNearbyBuildings(lat: number, lng: number, radiusMeters = 50) {
  const supabase = await createClient();
  return await mapRepo.fetchNearbyBuildingsRpc(supabase, lat, lng, radiusMeters);
}

/**
 * Deploy a new listing with rate limiting (max 5 deploys per 15 min window)
 */
export async function deployNode(formData: any) {
  console.log('=== DEPLOY_NODE_CALLED ===');
  console.log('INCOMING_FORMDATA:', JSON.stringify(formData, null, 2));

  // Input validation
  const validationError = validateDeployForm(formData);
  if (validationError) {
    console.log('VALIDATION_ERROR:', validationError);
    return { error: validationError };
  }
  console.log('VALIDATION_PASSED');

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
      const payload = {
        flatNumber: formData.flatNumber,
        status: 'vacant',
        rentAmount: parseFloat(formData.rent.replace(/[^0-9.]/g, '')),
        bhk: formData.bhk ? parseInt(formData.bhk) : 1,
        furnishing: formData.furnishing || null,
        sizeSqft: formData.sizeSqft ? parseInt(formData.sizeSqft) : null,
        maintenanceExtra: formData.maintenanceExtra || false,
        maintenanceAmount: formData.maintenanceAmount ? parseInt(formData.maintenanceAmount) : null,
        tenantPreference: formData.tenantPreference || 'any',
        petsAllowed: formData.petsAllowed || false,
        depositMonths: formData.depositMonths ? parseInt(formData.depositMonths) : 2,
        isTransparencyPin: formData.isTransparencyPin || false,
        availabilityDate: formData.availabilityDate || null,
        flatmateNeeded: formData.flatmateNeeded || false,
        noBrokerLink: formData.noBrokerLink || null,
        flatmatesLink: formData.flatmatesLink || null,
        city,
        buildingLat: formData.lat,
        buildingLng: formData.lng,
        buildingName: formData.buildingName || `${formData.category.toUpperCase()} NODE ${Math.floor(Math.random() * 1000)}`,
        buildingCategory: formData.category,
        buildingAddress: formData.address || 'Tactical Deployment Zone',
        floorNumber: parseInt(formData.floor) || 0,
        ipHash: serverIpHash,
      };

      console.log('DEPLOY_PAYLOAD:', JSON.stringify(payload, null, 2));

      const result = await listingRepo.deployNodeAtomic(supabase, payload);

      console.log('DEPLOY_RESPONSE_DATA:', result ? JSON.stringify({ flat_id: result.flatId }, null, 2) : 'null');
      console.log('DEPLOY_RESPONSE_ERROR:', result ? 'null' : 'deployment failed');

      if (!result) throw new Error('Deployment RPC failed');
      return { success: true, flatId: result.flatId };
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

function parseLocation(location: any): { lat?: number; lng?: number } {
  if (!location) return {};

  // Handle GeoJSON format: { type: "Point", coordinates: [lng, lat] }
  if (location.type === 'Point' && Array.isArray(location.coordinates)) {
    return { lng: location.coordinates[0], lat: location.coordinates[1] };
  }

  // Handle WKT string format: "POINT(lng lat)"
  if (typeof location === 'string') {
    const match = location.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
    if (match) {
      return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
    }
  }

  return {};
}

async function _fetchAreaStats(supabase: any, lat: number, lng: number) {
  const d = 0.009;
  try {
    const { data, error } = await supabase.rpc('get_area_stats', {
      min_lat: lat - d, min_lng: lng - d, max_lat: lat + d, max_lng: lng + d,
    });
    if (error || !data) return null;
    return data as {
      total_flats: number; avg_rent: number;
      avg_rent_1bhk: number; avg_rent_2bhk: number; avg_rent_3bhk: number;
      gated_count: number; non_gated_count: number;
    };
  } catch {
    return null;
  }
}

/**
 * Fetch full details for a single flat by ID, joining building and floor info.
 * Three-tier fallback: primary query → map_snapshot cache → bare flat record.
 * Returns dataQuality: 'full' | 'cached' | 'partial', plus areaStats when coords available.
 */
export async function getFlatDetails(flatId: string): Promise<ServerResult<ListingData>> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(flatId)) {
    return { data: null, error: 'Invalid listing ID format.' };
  }

  const supabase = await createClient();

  // Tier 1 — primary query with joins
  const tier1 = await listingRepo.fetchFlatWithBuilding(supabase, flatId);
  if (tier1) {
    const areaStats =
      tier1.buildingLat && tier1.buildingLng
        ? await listingRepo.fetchAreaStats(supabase, tier1.buildingLat, tier1.buildingLng)
        : null;
    const result: ListingData = {
      ...tier1,
      dataQuality: 'full',
      isCached: false,
      isPartial: false,
      areaStats,
    };
    return { data: result, error: null };
  }

  // Tier 2 — map_snapshot cache
  const tier2 = await listingRepo.fetchFlatFromSnapshot(supabase, flatId);
  if (tier2) {
    const areaStats =
      tier2.buildingLat && tier2.buildingLng
        ? await listingRepo.fetchAreaStats(supabase, tier2.buildingLat, tier2.buildingLng)
        : null;
    const result: ListingData = {
      ...tier2,
      dataQuality: 'cached',
      isCached: true,
      isPartial: false,
      areaStats,
    };
    return { data: result, error: null };
  }

  // Tier 3 — bare flat record (no building info)
  const tier3 = await listingRepo.fetchBareFlat(supabase, flatId);
  if (!tier3) {
    return { data: null, error: 'Listing not found.' };
  }

  const result: ListingData = {
    ...tier3,
    floorNumber: null,
    buildingId: null,
    buildingName: null,
    buildingCategory: null,
    buildingAddress: null,
    buildingCity: null,
    buildingLat: null,
    buildingLng: null,
    dataQuality: 'partial',
    isCached: false,
    isPartial: true,
    areaStats: null,
  };
  return { data: result, error: null };
}

/**
 * Get contributor payment details (UPI) - gated action, call only after lock confirmation
 */
export async function getContributorPaymentDetails(flatId: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(flatId)) {
    return { upiId: null };
  }

  const supabase = await createClient();
  const serverIpHash = await getServerIpHash();
  const upiId = await listingRepo.fetchContributorUpi(supabase, flatId, serverIpHash);
  return { upiId: upiId || null };
}

/**
 * Lock a flat with rate limiting (max 3 locks per 15 min)
 */
export async function lockPlace(flatId: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(flatId)) {
    return { error: 'Invalid listing ID.' };
  }

  const rateKey = `lock:${flatId}`;
  const { allowed } = await checkRateLimit(rateKey, 3, 900);
  if (!allowed) {
    return { error: 'Rate limit exceeded for this listing.' };
  }

  const supabase = await createClient();
  const serverIpHash = await getServerIpHash();
  try {
    const result = await listingRepo.lockFlat(supabase, flatId, serverIpHash);
    if (!result?.success) throw new Error('Lock update failed');
    return { success: true };
  } catch (err: any) {
    console.error('Lock Protocol Failure:', err.message);
    return { error: sanitizeError(err) };
  }
}

/**
 * Flag a listing with rate limiting (max 3 flags per 15 min per flat)
 */
export async function flagIntel(flatId: string, userAgent?: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(flatId)) {
    return { error: 'Invalid listing ID.' };
  }

  const rateKey = `flag:${flatId}`;
  const { allowed } = await checkRateLimit(rateKey, 3, 900);
  if (!allowed) {
    return { error: 'Rate limit exceeded for flagging.' };
  }

  const supabase = await createClient();
  try {
    // Increment the intel flags counter
    const flagCount = await listingRepo.incrementIntelFlags(supabase, flatId);
    if (flagCount === null) throw new Error('Failed to increment flags');

    // Log the flag event
    await listingRepo.insertFlagEvent(supabase, flatId, userAgent || '');

    // If flags reach 3, move to moderation queue and mark as removed
    if (flagCount >= 3) {
      await listingRepo.upsertModerationQueue(supabase, flatId, flagCount);
      await listingRepo.markFlatRemoved(supabase, flatId);

      return {
        success: true,
        removed: true,
        flagCount,
        message: 'Listing has been flagged and moved to moderation queue.'
      };
    }

    return {
      success: true,
      removed: false,
      flagCount,
      message: `Listing flagged (${flagCount}/3 flags)`
    };
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
  const month = new Date().toISOString().slice(0, 7);
  try {
    await listingRepo.trackApiUsageRpc(supabase, service, month);
  } catch (err: any) {
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
    const payload = {
      latitude: data.latitude,
      longitude: data.longitude,
      bhk_preference: data.bhkPreference,
      budget: data.budget || '',
      move_in_timeline: data.moveInTimeline,
      food_preference: data.foodPreference,
      smoking_preference: data.smokingPreference,
      gender_preference: data.genderPreference,
      email: data.email,
      ip_hash: serverIpHash,
    };

    const result = await mapRepo.insertSeekerPin(supabase, payload);
    if (!result) throw new Error('Seeker pin insertion failed');
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
  return await mapRepo.fetchActiveSeekerPins(supabase);
}

/**
 * Submit a rating for a flat (IP-deduplicated)
 */
export async function submitRating(data: {
  flatId: string;
  localityScore: number;
  builtQualityScore: number;
}) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(data.flatId)) {
    return { error: 'Invalid listing ID.' };
  }

  if (!Number.isInteger(data.localityScore) || data.localityScore < 1 || data.localityScore > 5) {
    return { error: 'Locality score must be between 1 and 5.' };
  }
  if (!Number.isInteger(data.builtQualityScore) || data.builtQualityScore < 1 || data.builtQualityScore > 5) {
    return { error: 'Built quality score must be between 1 and 5.' };
  }

  const serverIpHash = await getServerIpHash();
  const supabase = await createClient();
  try {
    const payload = {
      flat_id: data.flatId,
      locality_score: data.localityScore,
      built_quality_score: data.builtQualityScore,
      ip_hash: serverIpHash,
    };
    const success = await listingRepo.insertRating(supabase, payload);
    if (!success) throw new Error('Rating insertion failed');
    return { success: true };
  } catch (err: any) {
    if (err.code === '23505' || err.message.includes('already')) {
      return { error: 'You have already rated this listing.' };
    }
    console.error('Rating Failure:', err.message);
    return { error: sanitizeError(err) };
  }
}

/**
 * Get ratings for a flat
 */
export async function getFlatRatings(flatId: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(flatId)) {
    return { avg_locality: 0, avg_built_quality: 0, total_ratings: 0 };
  }

  const supabase = await createClient();
  const result = await listingRepo.fetchFlatRatings(supabase, flatId);
  return result || { avg_locality: 0, avg_built_quality: 0, total_ratings: 0 };
}

/**
 * Delete own pin (by server-derived IP hash)
 */
export async function deleteOwnPin(flatId: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(flatId)) {
    return { error: 'Invalid listing ID.' };
  }

  const serverIpHash = await getServerIpHash();
  const supabase = await createClient();
  try {
    const success = await listingRepo.deleteOwnPinRpc(supabase, flatId, serverIpHash);
    if (!success) return { error: 'This pin does not belong to you.' };
    return { success: true };
  } catch (err: any) {
    console.error('Delete Pin Failure:', err.message);
    return { error: sanitizeError(err) };
  }
}

/**
 * Escape HTML entities to prevent XSS when displaying user content
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Get comments for a flat
 */
export async function getComments(flatId: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(flatId)) {
    return [];
  }

  const supabase = await createClient();
  const comments = await listingRepo.fetchComments(supabase, flatId);
  return (comments || []).map(c => ({
    ...c,
    content: escapeHtml(c.content)
  }));
}

/**
 * Add a comment to a flat
 */
export async function addComment(flatId: string, content: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(flatId)) {
    return { error: 'Invalid listing ID.' };
  }

  const serverIpHash = await getServerIpHash();
  const rateKey = `comment:${serverIpHash}`;
  const { allowed } = await checkRateLimitStrict(rateKey, 5, 300);
  if (!allowed) {
    return { error: 'Rate limit exceeded for commenting.' };
  }

  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return { error: 'Comment cannot be empty.' };
  }
  if (trimmedContent.length > 500) {
    return { error: 'Comment must be 500 characters or less.' };
  }

  const supabase = await createClient();
  try {
    const success = await listingRepo.insertComment(supabase, flatId, trimmedContent, serverIpHash);
    if (!success) throw new Error('Comment insertion failed');
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
  return await listingRepo.fetchFlatsByIpHash(supabase, serverIpHash);
}

/**
 * Get all seeker pins belonging to the current user (by server-derived IP hash)
 */
export async function getMySeekerPins() {
  const serverIpHash = await getServerIpHash();
  const supabase = await createClient();
  return await mapRepo.fetchSeekerPinsByIpHash(supabase, serverIpHash);
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
  const success = await listingRepo.updateFlatByIpHash(supabase, flatId, serverIpHash, updates);

  if (!success) return { error: 'Update failed. Make sure you own this listing.' };
  return { success: true };
}

/**
 * Delete a seeker pin owned by the user
 */
export async function deleteMySeekerPin(pinId: string) {
  const serverIpHash = await getServerIpHash();
  const supabase = await createClient();
  const success = await mapRepo.deleteSeekerPinByIpHash(supabase, pinId, serverIpHash);

  if (!success) return { error: 'Delete failed. Make sure you own this pin.' };
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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { error: 'Valid email address required.' };
  }

  if (typeof lat !== 'number' || typeof lng !== 'number' || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { error: 'Invalid coordinates.' };
  }

  if (typeof radiusKm !== 'number' || radiusKm < 0.1 || radiusKm > 100) {
    return { error: 'Radius must be between 0.1 and 100 km.' };
  }

  const supabase = await createClient();
  const payload = {
    email,
    latitude: lat,
    longitude: lng,
    radius_km: radiusKm,
    locality: locality || undefined,
  };
  const success = await listingRepo.insertSubscription(supabase, payload);
  if (!success) return { error: 'Failed to subscribe to notifications. Please try again.' };
  return { success: true };
}

export async function countActiveSeekersInArea(lat: number, lng: number, radiusKm: number = 1) {
  const supabase = await createClient();
  const seekerPins = await mapRepo.fetchActiveSeekerPins(supabase);

  if (!seekerPins || seekerPins.length === 0) {
    return { count: 0 };
  }

  // Calculate distance in km using Haversine formula
  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const count = seekerPins.filter(pin => {
    if (!pin.latitude || !pin.longitude) return false;
    const distance = getDistance(lat, lng, pin.latitude, pin.longitude);
    return distance <= radiusKm;
  }).length;

  return { count };
}
