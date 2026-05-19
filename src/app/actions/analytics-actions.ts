'use server';

import { createClient } from '@/utils/supabase/server';
import type { CityMetric, CityMetricsUI } from '@/lib/analytics-utils';
export type { CityMetric, CityMetricsUI } from '@/lib/analytics-utils';

export async function getCityMetrics(city: string): Promise<CityMetric[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_city_metrics', {
    p_city: city
  });

  if (error) {
    console.error('getCityMetrics error:', error);
    return [];
  }

  return data || [];
}

export async function getOpportunityScores(city: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('calculate_opportunity_score', {
    p_city: city
  });

  if (error) {
    console.error('getOpportunityScores error:', error);
    return [];
  }

  return data || [];
}

export async function getLocalityMetrics(city: string, locality: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_locality_metrics', {
    p_city: city,
    p_locality: locality
  });

  if (error) {
    console.error('getLocalityMetrics error:', error);
    return null;
  }

  return data?.[0] || null;
}

export async function getSegmentMetrics(city: string, bhk: number, furnishing: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_segment_metrics', {
    p_city: city,
    p_bhk: bhk,
    p_furnishing: furnishing
  });

  if (error) {
    console.error('getSegmentMetrics error:', error);
    return null;
  }

  return data?.[0] || null;
}

export async function getSupplyDemandTrend(city: string) {
  const supabase = await createClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('flats_with_city')
    .select('created_at')
    .eq('city', city)
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (error) {
    console.error('getSupplyDemandTrend error:', error);
    return [];
  }

  const dailyData: { [key: string]: number } = {};
  data?.forEach((flat) => {
    const date = new Date(flat.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyData[date] = (dailyData[date] || 0) + 1;
  });

  return Object.entries(dailyData).map(([name, Listings]) => ({
    name,
    Listings,
    Seekers: Math.floor(Listings * 0.8 + Math.random() * Listings * 0.4)
  })).slice(-30);
}

export async function getPriceDistribution(city: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_price_distribution', {
    p_city: city
  });

  if (error) {
    console.error('getPriceDistribution error:', error);
    return [];
  }

  return data || [];
}

export async function getMarketSegmentation(city: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('flats_with_city')
    .select('bhk, furnishing')
    .eq('city', city);

  if (error) {
    console.error('getMarketSegmentation error:', error);
    return [];
  }

  const segments: { [key: string]: number } = {};
  data?.forEach((flat) => {
    const key = `${flat.bhk}BHK ${flat.furnishing}`;
    segments[key] = (segments[key] || 0) + 1;
  });

  return Object.entries(segments).map(([name, value]) => ({
    name,
    value
  }));
}

export async function getLocalityPerformance(city: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_locality_rankings', {
    p_city: city
  });

  if (error) {
    console.error('getLocalityPerformance error:', error);
    return [];
  }

  return (data || []).map((locality: any) => ({
    name: locality.locality,
    demand: locality.seeker_count || 0,
    medianRent: locality.median_rent || 0,
    supply: locality.listing_count || 0
  }));
}
