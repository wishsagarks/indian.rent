export type PropertyCategory = 'gated' | 'semi-gated' | 'standalone';

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
  no_broker_link?: string;
  flatmates_link?: string;
  created_at: string;
}
