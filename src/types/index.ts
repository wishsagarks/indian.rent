export type PropertyCategory = 'gated' | 'semi-gated' | 'standalone' | 'pg' | 'hostel';

export interface SeekerPin {
  id: string;
  lat: number;
  lng: number;
  bhk_preference: string;
  budget: string;
  move_in_timeline: string;
  food_preference?: string;
  smoking_preference?: string;
  gender_preference?: string;
  created_at: string;
  ip_hash: string;
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
