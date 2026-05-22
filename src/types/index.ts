/**
 * Re-export all new domain types from src/lib/types for unified import path
 */
import type {
  ServerResult,
  DataQuality,
  PropertyStatus,
  PropertyCategory,
  Furnishing,
  TenantPreference,
  AreaStats,
  ListingData,
  MapPin,
  FlatSummary,
  FlatRatings,
  CityMetric,
  CityMetricsUI,
} from '@/lib/types';

export type {
  ServerResult,
  DataQuality,
  PropertyStatus,
  PropertyCategory,
  Furnishing,
  TenantPreference,
  AreaStats,
  ListingData,
  MapPin,
  FlatSummary,
  FlatRatings,
  CityMetric,
  CityMetricsUI,
};

/**
 * Legacy database row types - kept for backward compatibility
 * Consumers should migrate to the new camelCase types in src/lib/types
 */
export type LegacyPropertyCategory = 'gated' | 'semi-gated' | 'standalone' | 'pg' | 'hostel';

export interface SeekerPin {
  id: string;
  latitude: number;
  longitude: number;
  bhk_preference: string;
  budget: string;
  move_in_timeline: string;
  food_preference?: string;
  smoking_preference?: string;
  gender_preference?: string;
  email?: string;
  expires_at?: string;
  created_at: string;
  ip_hash: string;
}

export interface Comment {
  id?: string;
  flat_id: string;
  content: string;
  ip_hash?: string;
  created_at: string;
}

export interface Rating {
  id?: string;
  flat_id: string;
  locality_score: number;
  built_quality_score: number;
  ip_hash?: string;
  created_at?: string;
}

export interface NotificationSubscription {
  id?: string;
  email: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  locality?: string;
  created_at?: string;
}

export interface Contribution {
  id?: string;
  flat_id: string;
  user_id?: string;
  contribution_type: string;
  reward_amount: number;
  is_verified?: boolean;
  created_at?: string;
}

export interface ImportRun {
  id?: string;
  source: string;
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  duration_ms: number;
  created_at?: string;
}

export interface FlatsWithCity extends Flat {
  city: string;
  building_name: string;
}

export interface FlatmateListing {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  location: string;
  rent_amount: number;
  deposit_months?: number;
  furnishing_type?: 'furnished' | 'semi-furnished' | 'unfurnished';
  created_at?: string;
}

export interface MapPoint {
  id: string;
  name: string;
  category: PropertyCategory;
  lat: number;
  lng: number;
  rent?: number;
  bhk?: number;
  furnishing?: 'furnished' | 'semi-furnished' | 'unfurnished';
  reward?: number;
  verified?: boolean;
  coordinates: [number, number];
}

export interface Building {
  id: string;
  name: string;
  category: PropertyCategory;
  location: {
    lat: number;
    lng: number;
  };
  address?: string;
  city: string;
  created_at: string;
}

export interface Floor {
  id: string;
  building_id: string;
  floor_number: number;
}

export interface Flat {
  id: string;
  floor_id: string;
  flat_number: string;
  status: 'vacant' | 'partial' | 'occupied';
  rent_amount?: number;
  bhk?: number;
  furnishing?: 'furnished' | 'semi-furnished' | 'unfurnished';
  size_sqft?: number;
  maintenance_extra?: boolean;
  maintenance_amount?: number | null;
  tenant_preference?: 'any' | 'bachelors' | 'family';
  pets_allowed?: boolean;
  deposit_months?: number;
  is_transparency_pin?: boolean;
  is_removed?: boolean;
  availability_date?: string;
  flatmate_needed?: boolean;
  no_broker_link?: string;
  flatmates_link?: string;
  contributor_name?: string;
  contributor_upi_id?: string;
  intel_flags?: number;
  ip_hash?: string;
  created_at: string;
  updated_at?: string;
}
