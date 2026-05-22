'use server';

import { createClient } from '@/utils/supabase/server';
import type { CityMetric, CityMetricsUI } from '@/lib/analytics-utils';
import * as analyticsRepo from '@/lib/repositories/analytics-repository';
export type { CityMetric, CityMetricsUI } from '@/lib/analytics-utils';

export async function getCityMetrics(city: string): Promise<CityMetric[]> {
  const supabase = await createClient();
  return await analyticsRepo.fetchCityMetricsRpc(supabase, city);
}

export async function getOpportunityScores(city: string) {
  const supabase = await createClient();
  return await analyticsRepo.fetchOpportunityScoresRpc(supabase, city);
}

export async function getLocalityMetrics(city: string, locality: string) {
  const supabase = await createClient();
  const results = await analyticsRepo.fetchLocalityMetricsRpc(supabase, city, locality);
  return results?.[0] || null;
}

export async function getSegmentMetrics(city: string, bhk: number, furnishing: string) {
  const supabase = await createClient();
  const results = await analyticsRepo.fetchSegmentMetricsRpc(supabase, city, String(bhk), furnishing);
  return results?.[0] || null;
}

export async function getSupplyDemandTrend(city: string) {
  const supabase = await createClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const flats = await analyticsRepo.fetchSupplyDemandFlats(supabase, city, thirtyDaysAgo.toISOString());

  const dailyData: { [key: string]: number } = {};
  flats?.forEach((flat) => {
    const date = new Date(flat.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyData[date] = (dailyData[date] || 0) + 1;
  });

  return Object.entries(dailyData).map(([name, Listings]) => ({
    name,
    Listings,
    Seekers: Math.floor(Listings * 1.0)
  })).slice(-30);
}

export async function getPriceDistribution(city: string) {
  const supabase = await createClient();
  return await analyticsRepo.fetchPriceDistributionRpc(supabase, city);
}

export async function getMarketSegmentation(city: string) {
  const supabase = await createClient();
  const flats = await analyticsRepo.fetchMarketSegmentationFlats(supabase, city);

  const segments: { [key: string]: number } = {};
  flats?.forEach((flat) => {
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
  const rankings = await analyticsRepo.fetchLocalityRankingsRpc(supabase, city);

  return (rankings || []).map((locality: any) => ({
    name: locality.locality,
    demand: locality.seeker_count || 0,
    medianRent: locality.median_rent || 0,
    supply: locality.listing_count || 0
  }));
}
