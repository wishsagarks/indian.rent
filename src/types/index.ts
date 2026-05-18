export type PropertyCategory = 'gated' | 'semi-gated' | 'standalone' | 'pg' | 'hostel';

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
