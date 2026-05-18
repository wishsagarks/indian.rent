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
