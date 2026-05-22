/**
 * Core domain types and interfaces
 * Serves as the single source of truth for all data shapes across the application
 */

/**
 * Discriminated union for all server action returns
 * Enforces explicit error handling vs data access
 */
export type ServerResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

/**
 * Enum-like type for data freshness/completeness
 */
export type DataQuality = 'full' | 'cached' | 'partial';

export type PropertyStatus = 'vacant' | 'partial' | 'occupied';
export type PropertyCategory = 'gated' | 'semi-gated' | 'standalone' | 'pg' | 'hostel';
export type Furnishing = 'furnished' | 'semi-furnished' | 'unfurnished';
export type TenantPreference = 'any' | 'bachelors' | 'family';

/**
 * Area-level aggregated statistics
 * From the `get_area_stats` RPC call
 */
export interface AreaStats {
  total_flats: number;
  avg_rent: number;
  avg_rent_1bhk: number | null;
  avg_rent_2bhk: number | null;
  avg_rent_3bhk: number | null;
  gated_count: number;
  non_gated_count: number;
}

/**
 * Complete listing data with all context
 * Combines flat + building + area stats + data quality tracking
 * Used by getFlatDetails and detail page components
 */
export interface ListingData {
  // Flat fields
  id: string;
  flatNumber: string | null;
  status: PropertyStatus;
  rentAmount: number | null;
  bhk: number | null;
  furnishing: Furnishing | null;
  sizeSqft: number | null;
  maintenanceExtra: boolean | null;
  maintenanceAmount: number | null;
  tenantPreference: TenantPreference | null;
  petsAllowed: boolean | null;
  depositMonths: number | null;
  isTransparencyPin: boolean | null;
  isRemoved: boolean | null;
  availabilityDate: string | null;
  flatmateNeeded: boolean | null;
  noBrokerLink: string | null;
  flatmatesLink: string | null;
  contributorName: string | null;
  intelFlags: number | null;
  createdAt: string;
  updatedAt: string | null;

  // Building fields (null when dataQuality is 'partial')
  floorNumber: number | null;
  buildingId: string | null;
  buildingName: string | null;
  buildingCategory: PropertyCategory | null;
  buildingAddress: string | null;
  buildingCity: string | null;
  buildingLat: number | null;
  buildingLng: number | null;

  // Metadata
  dataQuality: DataQuality;
  isCached: boolean;
  isPartial: boolean;
  areaStats: AreaStats | null;
}

/**
 * Pin representation for map rendering
 * Aggregates all flats at a single building location
 */
export interface MapPin {
  id: string;
  buildingId: string;
  lat: number;
  lng: number;
  city: string;
  category: PropertyCategory;
  flats: FlatSummary[];
}

/**
 * Summary of a flat for the pin popover
 */
export interface FlatSummary {
  id: string;
  status: PropertyStatus;
  bhk: number | null;
  rentAmount: number | null;
  flatmateNeeded: boolean;
  intelFlags: number;
}

/**
 * Aggregated ratings for a locality
 */
export interface FlatRatings {
  avg_locality: number;
  avg_built_quality: number;
  total_ratings: number;
}

/**
 * Raw row types from database (kept internal to repositories)
 * Not exported; only used within repository functions
 */
export interface FlatRow {
  id: string;
  flatNumber: string | null;
  status: PropertyStatus;
  rentAmount: number | null;
  bhk: number | null;
  furnishing: Furnishing | null;
  sizeSqft: number | null;
  maintenanceExtra: boolean | null;
  maintenanceAmount: number | null;
  tenantPreference: TenantPreference | null;
  petsAllowed: boolean | null;
  depositMonths: number | null;
  isTransparencyPin: boolean | null;
  isRemoved: boolean | null;
  availabilityDate: string | null;
  flatmateNeeded: boolean | null;
  noBrokerLink: string | null;
  flatmatesLink: string | null;
  contributorName: string | null;
  intelFlags: number | null;
  createdAt: string;
  updatedAt: string | null;
  floorId: string | null;
}

export interface BuildingRow {
  id: string;
  name: string | null;
  category: PropertyCategory | null;
  address: string | null;
  city: string | null;
  location: string | null; // PostGIS geometry as string
}

export interface FloorRow {
  id: string;
  buildingId: string;
  floorNumber: number;
}

/**
 * Re-export analytics types to unify import paths
 * Consumers can import all domain types from a single location
 */
export type { CityMetric, CityMetricsUI } from '@/lib/analytics-utils';
