import { createClient } from '@/utils/supabase/server';
import type { PlatformStatsData } from '@/components/PlatformStats';

export async function fetchPlatformStats(): Promise<PlatformStatsData> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_platform_stats');

    if (error) {
      console.error('RPC error:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      console.warn('No data returned from get_platform_stats');
      throw new Error('no data');
    }
    const row = data[0];

    // Fetch API usage for current month
    const month = new Date().toISOString().slice(0, 7);
    const { data: usageRows } = await supabase
      .from('api_usage')
      .select('service, count')
      .eq('month', month);
    const apiUsage = Object.fromEntries(usageRows?.map(r => [r.service, r.count]) || []);

    return {
      totalBuildings: Number(row.total_buildings) || 0,
      totalListings: Number(row.total_listings) || 0,
      totalRentMapped: Number(row.total_rent_mapped) || 0,
      totalSeekerPins: Number(row.total_seeker_pins) || 0,
      monthlyVelocity: (row.monthly_velocity as any[]) || [],
      areaDistribution: (row.area_distribution as any[]) || [],
      dbSizeBytes: Number(row.db_size_bytes) || 0,
      totalActions: Number(row.total_actions) || 0,
      apiUsage,
    };
  } catch (e: any) {
    console.error('fetchPlatformStats error:', {
      message: e?.message,
      code: e?.code,
      fullError: JSON.stringify(e)
    });
    return {
      totalBuildings: 0,
      totalListings: 0,
      totalRentMapped: 0,
      totalSeekerPins: 0,
      monthlyVelocity: [],
      areaDistribution: [],
      dbSizeBytes: 0,
      totalActions: 0,
      apiUsage: {},
    };
  }
}
