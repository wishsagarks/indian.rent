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

    // Fetch seeker pin statistics
    let seekerPinStats = undefined;
    try {
      const { data: seekerPins, error: seekerError } = await supabase
        .from('seeker_pins')
        .select('id, budget, bhk_preference, latitude, longitude');

      if (!seekerError && seekerPins && seekerPins.length > 0) {
        // Calculate statistics
        const budgets = seekerPins.filter(p => p.budget).map(p => Number(p.budget) || 0);
        const avgBudget = budgets.length > 0 ? budgets.reduce((a, b) => a + b, 0) / budgets.length : 0;

        // Count BHK preferences
        const bhkCounts: Record<string, number> = {};
        seekerPins.forEach(p => {
          const bhk = p.bhk_preference || 'any';
          bhkCounts[bhk] = (bhkCounts[bhk] || 0) + 1;
        });
        const topBhk = Object.entries(bhkCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '1-2 BHK';

        // Reverse geocode to get areas (approximate based on coordinates)
        const areaMap: Record<string, number> = {};
        seekerPins.forEach(p => {
          if (p.latitude && p.longitude) {
            // Simple grid-based area grouping (rough approximation)
            const latGrid = Math.floor((p.latitude || 0) * 10) / 10;
            const lngGrid = Math.floor((p.longitude || 0) * 10) / 10;
            const key = `${latGrid},${lngGrid}`;
            areaMap[key] = (areaMap[key] || 0) + 1;
          }
        });

        const areaDistribution = Object.entries(areaMap)
          .map(([coords, count]) => ({
            area: coords.split(',')[0].substring(0, 5), // Show approx latitude
            count
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        seekerPinStats = {
          totalPins: seekerPins.length,
          avgBudget: Math.round(avgBudget),
          topBhk,
          areaCoverage: Object.keys(areaMap).length,
          areaDistribution
        };
      }
    } catch (e) {
      console.warn('Could not fetch seeker pin stats:', e);
    }

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
      seekerPinStats,
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
      seekerPinStats: undefined,
    };
  }
}
