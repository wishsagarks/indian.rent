import { createClient } from '@/utils/supabase/server';
import type { PlatformStatsData } from '@/components/PlatformStats';

export async function fetchPlatformStats(): Promise<PlatformStatsData> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_platform_stats');
    if (error || !data || data.length === 0) throw new Error('no data');
    const row = data[0];
    return {
      totalBuildings: Number(row.total_buildings) || 0,
      totalListings: Number(row.total_listings) || 0,
      totalRentMapped: Number(row.total_rent_mapped) || 0,
      totalSeekerPins: Number(row.total_seeker_pins) || 0,
    };
  } catch {
    return { totalBuildings: 0, totalListings: 0, totalRentMapped: 0, totalSeekerPins: 0 };
  }
}
