/**
 * Analytics Repository
 * Data access layer for all analytics and metrics queries
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { CityMetric } from '@/lib/analytics-utils';

/**
 * Fetch city metrics via RPC
 */
export async function fetchCityMetricsRpc(
  supabase: SupabaseClient,
  city: string
): Promise<CityMetric[]> {
  const { data, error } = await supabase.rpc('get_city_metrics', {
    city_name: city,
  });

  if (error || !data) return [];
  return data;
}

/**
 * Fetch opportunity scores for a city
 */
export async function fetchOpportunityScoresRpc(
  supabase: SupabaseClient,
  city: string
): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_opportunity_scores', {
    city_name: city,
  });

  if (error || !data) return [];
  return data;
}

/**
 * Fetch locality-level metrics
 */
export async function fetchLocalityMetricsRpc(
  supabase: SupabaseClient,
  city: string,
  locality?: string
): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_locality_metrics', {
    city_name: city,
    locality_name: locality || null,
  });

  if (error || !data) return [];
  return data;
}

/**
 * Fetch segment metrics (by BHK, furnishing)
 */
export async function fetchSegmentMetricsRpc(
  supabase: SupabaseClient,
  city: string,
  bhk?: string,
  furnishing?: string
): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_segment_metrics', {
    city_name: city,
    bhk_type: bhk || null,
    furnishing_type: furnishing || null,
  });

  if (error || !data) return [];
  return data;
}

/**
 * Fetch supply/demand trend (flats with city info)
 */
export async function fetchSupplyDemandFlats(
  supabase: SupabaseClient,
  city: string,
  sinceDate?: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('flats_with_city')
    .select('*')
    .eq('city', city)
    .gte('created_at', sinceDate || '2025-01-01');

  if (error || !data) return [];
  return data;
}

/**
 * Fetch price distribution
 */
export async function fetchPriceDistributionRpc(
  supabase: SupabaseClient,
  city: string
): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_price_distribution', {
    city_name: city,
  });

  if (error || !data) return [];
  return data;
}

/**
 * Fetch market segmentation (flats_with_city grouped)
 */
export async function fetchMarketSegmentationFlats(
  supabase: SupabaseClient,
  city: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('flats_with_city')
    .select('*')
    .eq('city', city);

  if (error || !data) return [];
  return data;
}

/**
 * Fetch locality performance rankings
 */
export async function fetchLocalityRankingsRpc(
  supabase: SupabaseClient,
  city: string
): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_locality_rankings', {
    city_name: city,
  });

  if (error || !data) return [];
  return data;
}

/**
 * Fetch simple analytics data (flats, seekers, basic stats)
 */
export async function fetchSimpleAnalyticsData(
  supabase: SupabaseClient,
  city: string
): Promise<{
  flats: any[];
  seekers: any[];
  buildings: any[];
}> {
  const [flatsResult, seekersResult, buildingsResult] = await Promise.all([
    supabase.from('flats_with_city').select('*').eq('city', city),
    supabase.from('seeker_pins').select('*').eq('city', city),
    supabase.from('buildings').select('*').eq('city', city),
  ]);

  return {
    flats: flatsResult.data || [],
    seekers: seekersResult.data || [],
    buildings: buildingsResult.data || [],
  };
}
