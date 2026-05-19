'use server';

import { createClient } from '@/utils/supabase/server';

export async function getSimpleAnalytics(city: string) {
  const supabase = await createClient();

  try {
    // Get listings by BHK (use flats_with_city view which includes city from buildings)
    const { data: listingsByBhk } = await supabase
      .from('flats_with_city')
      .select('bhk, rent_amount, created_at')
      .eq('city', city);

    // Get basic stats
    const { data: buildingStats } = await supabase
      .from('buildings')
      .select('city')
      .eq('city', city);

    // Get seeker pins
    const { data: seekerPins } = await supabase
      .from('seeker_pins')
      .select('id, created_at');

    // Transform to chart data
    const supplyTrend = transformSupplyTrend(listingsByBhk || []);
    const priceData = transformPriceData(listingsByBhk || []);
    const segmentData = transformSegmentData(listingsByBhk || []);
    const basicStats = {
      totalListings: listingsByBhk?.length || 0,
      totalBuildings: buildingStats?.length || 0,
      totalSeekers: seekerPins?.length || 0,
      medianRent: calculateMedianRent(listingsByBhk || []),
      avgRent: calculateAvgRent(listingsByBhk || [])
    };

    return {
      success: true,
      data: {
        supplyTrend,
        priceData,
        segmentData,
        basicStats
      }
    };
  } catch (error: any) {
    console.error('Analytics error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

function transformSupplyTrend(flats: any[]) {
  const last30Days: { [key: string]: number } = {};
  const today = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    last30Days[dateStr] = 0;
  }

  flats.forEach((flat) => {
    if (flat.created_at) {
      const date = new Date(flat.created_at);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dateStr in last30Days) {
        last30Days[dateStr]++;
      }
    }
  });

  return Object.entries(last30Days).map(([name, Listings]) => ({
    name,
    Listings,
    Seekers: Math.floor(Listings * 0.3)
  }));
}

function transformPriceData(flats: any[]) {
  const byBhk: { [key: number]: number[] } = {};

  flats.forEach((flat) => {
    if (flat.bhk && flat.rent_amount > 0) {
      if (!byBhk[flat.bhk]) byBhk[flat.bhk] = [];
      byBhk[flat.bhk].push(flat.rent_amount);
    }
  });

  return Object.entries(byBhk)
    .map(([bhk, rents]) => {
      const sorted = rents.sort((a, b) => a - b);
      return {
        category: `${bhk}BHK`,
        P25: sorted[Math.floor(sorted.length * 0.25)],
        Median: sorted[Math.floor(sorted.length * 0.5)],
        P75: sorted[Math.floor(sorted.length * 0.75)],
        Average: rents.reduce((a, b) => a + b, 0) / rents.length
      };
    })
    .sort((a, b) => parseInt(a.category) - parseInt(b.category));
}

function transformSegmentData(flats: any[]) {
  const segments: { [key: string]: number } = {};

  flats.forEach((flat) => {
    const key = `${flat.bhk || 'Studio'}BHK`;
    segments[key] = (segments[key] || 0) + 1;
  });

  return Object.entries(segments)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function calculateMedianRent(flats: any[]) {
  const rents = flats
    .filter((f) => f.rent_amount > 0)
    .map((f) => f.rent_amount)
    .sort((a, b) => a - b);
  return rents[Math.floor(rents.length / 2)] || 0;
}

function calculateAvgRent(flats: any[]) {
  const validRents = flats.filter((f) => f.rent_amount > 0);
  if (!validRents.length) return 0;
  return validRents.reduce((sum, f) => sum + f.rent_amount, 0) / validRents.length;
}
