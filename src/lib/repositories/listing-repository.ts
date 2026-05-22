/**
 * Listing Repository
 * Pure data access layer for all flat and building queries
 * All functions take a Supabase client as first parameter and return typed data
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  ListingData,
  AreaStats,
  FlatRatings,
  FlatRow,
  BuildingRow,
  FloorRow,
} from '@/lib/types';

/**
 * Parse PostGIS location string to { lat, lng }
 */
function parseLocation(location: string | null): { lat: number | null; lng: number | null } {
  if (!location) return { lat: null, lng: null };
  try {
    const [lng, lat] = JSON.parse(location).coordinates;
    return { lat, lng };
  } catch {
    return { lat: null, lng: null };
  }
}

/**
 * Tier 1: Fetch flat with full building context via joins
 * Returns building data or null if not found
 */
export async function fetchFlatWithBuilding(
  supabase: SupabaseClient,
  flatId: string
): Promise<Omit<ListingData, 'dataQuality' | 'isCached' | 'isPartial' | 'areaStats'> | null> {
  const { data, error } = await supabase
    .from('flats')
    .select(`
      id, flat_number, status, rent_amount, bhk, furnishing, size_sqft,
      maintenance_extra, maintenance_amount, tenant_preference, pets_allowed,
      deposit_months, is_transparency_pin, is_removed, availability_date,
      flatmate_needed, no_broker_link, flatmates_link, contributor_name,
      intel_flags, created_at, updated_at, floor_id,
      floors (
        floor_number, building_id,
        buildings ( id, name, category, address, city, location )
      )
    `)
    .eq('id', flatId)
    .maybeSingle();

  if (error || !data) return null;

  const floorsArray = Array.isArray(data.floors) ? data.floors : [data.floors];
  const floor = floorsArray?.[0];
  const buildingsArray = Array.isArray(floor?.buildings) ? floor?.buildings : [floor?.buildings];
  const building = buildingsArray?.[0];
  const { lat, lng } = parseLocation(building?.location);

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
    floorNumber: floor?.floor_number ?? null,
    buildingId: building?.id ?? null,
    buildingName: building?.name ?? null,
    buildingCategory: building?.category ?? null,
    buildingAddress: building?.address ?? null,
    buildingCity: building?.city ?? null,
    buildingLat: lat ?? null,
    buildingLng: lng ?? null,
  };
}

/**
 * Tier 2: Fetch flat from map_snapshot cache
 * Scans the snapshot blob for the flat
 */
export async function fetchFlatFromSnapshot(
  supabase: SupabaseClient,
  flatId: string
): Promise<Omit<ListingData, 'dataQuality' | 'isCached' | 'isPartial' | 'areaStats'> | null> {
  const { data: snapshotData } = await supabase
    .from('map_snapshot')
    .select('data')
    .eq('id', 1)
    .maybeSingle();

  if (!snapshotData?.data || !Array.isArray(snapshotData.data)) return null;

  let cachedFlat: any = null;
  let cachedBuilding: any = null;
  let cachedFloor: any = null;

  // Scan the snapshot for the flat
  for (const building of snapshotData.data) {
    for (const floor of building.floors || []) {
      const flat = (floor.flats || []).find((f: any) => f.id === flatId);
      if (flat) {
        cachedFlat = flat;
        cachedBuilding = building;
        cachedFloor = floor;
        break;
      }
    }
    if (cachedFlat) break;
  }

  if (!cachedFlat) return null;

  const { lat, lng } = parseLocation(cachedBuilding.location);

  return {
    id: cachedFlat.id,
    flatNumber: cachedFlat.flat_number || null,
    status: cachedFlat.status || 'vacant',
    rentAmount: cachedFlat.rent_amount,
    bhk: cachedFlat.bhk,
    furnishing: cachedFlat.furnishing,
    sizeSqft: cachedFlat.size_sqft,
    maintenanceExtra: cachedFlat.maintenance_extra,
    maintenanceAmount: cachedFlat.maintenance_amount,
    tenantPreference: cachedFlat.tenant_preference,
    petsAllowed: cachedFlat.pets_allowed,
    depositMonths: cachedFlat.deposit_months,
    isTransparencyPin: cachedFlat.is_transparency_pin,
    isRemoved: cachedFlat.is_removed,
    availabilityDate: cachedFlat.availability_date,
    flatmateNeeded: cachedFlat.flatmate_needed,
    noBrokerLink: cachedFlat.no_broker_link,
    flatmatesLink: cachedFlat.flatmates_link,
    contributorName: cachedFlat.contributor_name,
    intelFlags: cachedFlat.intel_flags,
    createdAt: cachedFlat.created_at,
    updatedAt: cachedFlat.updated_at,
    floorNumber: cachedFloor.floor_number ?? null,
    buildingId: cachedBuilding.id,
    buildingName: cachedBuilding.name,
    buildingCategory: cachedBuilding.category,
    buildingAddress: cachedBuilding.address,
    buildingCity: cachedBuilding.city,
    buildingLat: lat ?? null,
    buildingLng: lng ?? null,
  };
}

/**
 * Tier 3: Fetch bare flat record (no building info)
 * Fallback when database and snapshot lookups fail
 */
export async function fetchBareFlat(
  supabase: SupabaseClient,
  flatId: string
): Promise<Omit<ListingData, 'dataQuality' | 'isCached' | 'isPartial' | 'areaStats' | 'floorNumber' | 'buildingId' | 'buildingName' | 'buildingCategory' | 'buildingAddress' | 'buildingCity' | 'buildingLat' | 'buildingLng'> | null> {
  const { data, error } = await supabase
    .from('flats')
    .select('*')
    .eq('id', flatId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    flatNumber: data.flat_number,
    status: data.status || 'vacant',
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
  };
}

/**
 * Fetch area statistics within a bounding box
 * Used to enrich listing detail pages with market context
 */
export async function fetchAreaStats(
  supabase: SupabaseClient,
  lat: number,
  lng: number
): Promise<AreaStats | null> {
  const bounds = 0.01; // ~1km
  const { data, error } = await supabase.rpc('get_area_stats', {
    min_lat: lat - bounds,
    min_lng: lng - bounds,
    max_lat: lat + bounds,
    max_lng: lng + bounds,
  });

  if (error || !data || data.length === 0) return null;
  return data[0];
}

/**
 * Deploy a new flat (atomic RPC call)
 * Creates flat + floor + building in a single transaction
 */
export async function deployNodeAtomic(
  supabase: SupabaseClient,
  payload: {
    flatNumber: string;
    status: string;
    rentAmount: number;
    bhk: number;
    furnishing: string;
    sizeSqft: number | null;
    maintenanceExtra: boolean;
    maintenanceAmount: number | null;
    tenantPreference: string;
    petsAllowed: boolean;
    depositMonths: number;
    isTransparencyPin: boolean;
    availabilityDate: string | null;
    flatmateNeeded: boolean;
    noBrokerLink: string | null;
    flatmatesLink: string | null;
    city: string;
    buildingLat: number;
    buildingLng: number;
    buildingName: string | null;
    buildingCategory: string;
    buildingAddress: string;
    floorNumber: number;
    ipHash: string;
  }
): Promise<{ flatId: string } | null> {
  const { data, error } = await supabase.rpc('deploy_node_atomic', payload);

  if (error || !data) return null;
  return { flatId: data.flat_id };
}

/**
 * Fetch all flats contributed by an IP hash (user)
 */
export async function fetchFlatsByIpHash(
  supabase: SupabaseClient,
  ipHash: string
): Promise<FlatRow[]> {
  const { data, error } = await supabase
    .from('flats')
    .select('*')
    .eq('ip_hash', ipHash);

  if (error || !data) return [];
  return data;
}

/**
 * Update flat record by IP hash verification
 */
export async function updateFlatByIpHash(
  supabase: SupabaseClient,
  flatId: string,
  ipHash: string,
  patch: Partial<FlatRow>
): Promise<boolean> {
  const { error } = await supabase
    .from('flats')
    .update(patch)
    .eq('id', flatId)
    .eq('ip_hash', ipHash);

  return !error;
}

/**
 * Delete flat by IP hash verification
 */
export async function deleteOwnPinRpc(
  supabase: SupabaseClient,
  flatId: string,
  ipHash: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('delete_own_pin', {
    flat_id: flatId,
    ip_hash: ipHash,
  });

  return !error && data?.success;
}

/**
 * Increment intel flags for a flat
 */
export async function incrementIntelFlags(
  supabase: SupabaseClient,
  flatId: string
): Promise<number | null> {
  const { data, error } = await supabase.rpc('increment_intel_flags', {
    flat_id: flatId,
  });

  if (error || !data) return null;
  return data.new_flags;
}

/**
 * Insert a flag event record
 */
export async function insertFlagEvent(
  supabase: SupabaseClient,
  flatId: string,
  userAgent: string
): Promise<boolean> {
  const { error } = await supabase.from('flag_events').insert({
    flat_id: flatId,
    user_agent: userAgent,
  });

  return !error;
}

/**
 * Upsert moderation queue entry
 */
export async function upsertModerationQueue(
  supabase: SupabaseClient,
  flatId: string,
  flagCount: number
): Promise<boolean> {
  const { error } = await supabase
    .from('moderation_queue')
    .upsert({
      flat_id: flatId,
      flag_count: flagCount,
      status: 'pending',
    });

  return !error;
}

/**
 * Mark flat as removed (after flagging)
 */
export async function markFlatRemoved(
  supabase: SupabaseClient,
  flatId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('flats')
    .update({ is_removed: true })
    .eq('id', flatId);

  return !error;
}

/**
 * Fetch flat ratings (locality + built quality scores)
 */
export async function fetchFlatRatings(
  supabase: SupabaseClient,
  flatId: string
): Promise<FlatRatings | null> {
  const { data, error } = await supabase.rpc('get_flat_ratings', {
    flat_id: flatId,
  });

  if (error || !data) return null;
  return {
    avg_locality: data.avg_locality || 0,
    avg_built_quality: data.avg_built_quality || 0,
    total_ratings: data.total_ratings || 0,
  };
}

/**
 * Insert a new rating
 */
export async function insertRating(
  supabase: SupabaseClient,
  payload: {
    flat_id: string;
    locality_score: number;
    built_quality_score: number;
    ip_hash: string;
  }
): Promise<boolean> {
  const { error } = await supabase.from('ratings').insert(payload);
  return !error;
}

/**
 * Fetch comments for a flat
 */
export async function fetchComments(
  supabase: SupabaseClient,
  flatId: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('flat_id', flatId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data;
}

/**
 * Insert a new comment
 */
export async function insertComment(
  supabase: SupabaseClient,
  flatId: string,
  content: string,
  ipHash: string
): Promise<boolean> {
  const { error } = await supabase.from('comments').insert({
    flat_id: flatId,
    content,
    ip_hash: ipHash,
  });

  return !error;
}

/**
 * Fetch contributor UPI for payment
 */
export async function fetchContributorUpi(
  supabase: SupabaseClient,
  flatId: string,
  _ipHash: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('flats')
    .select('contributor_upi_id')
    .eq('id', flatId)
    .maybeSingle();

  if (error || !data) return null;
  return data.contributor_upi_id || null;
}

/**
 * Lock a flat (mark as occupied)
 */
export async function lockFlat(
  supabase: SupabaseClient,
  flatId: string,
  ipHash: string
): Promise<{ success: boolean } | null> {
  const { data, error } = await supabase.rpc('lock_place', {
    flat_id: flatId,
    ip_hash: ipHash,
  });

  if (error) return null;
  return { success: true };
}

/**
 * Insert notification subscription
 */
export async function insertSubscription(
  supabase: SupabaseClient,
  payload: {
    email: string;
    latitude: number;
    longitude: number;
    radius_km: number;
    locality?: string;
  }
): Promise<boolean> {
  const { error } = await supabase.from('notification_subscriptions').insert(payload);
  return !error;
}

/**
 * Track API usage
 */
export async function trackApiUsageRpc(
  supabase: SupabaseClient,
  service: string,
  month: string
): Promise<void> {
  await supabase.rpc('track_api_usage', {
    service,
    month,
  });
}
