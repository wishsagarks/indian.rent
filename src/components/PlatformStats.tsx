'use client';

export interface PlatformStatsData {
  totalBuildings: number;
  totalListings: number;
  totalRentMapped: number;
  totalSeekerPins: number;
  monthlyVelocity?: Array<{ month: string; count: number }>;
  areaDistribution?: Array<{ area: string; count: number; pct: number }>;
  dbSizeBytes?: number;
  totalActions?: number;
  apiUsage?: Record<string, number>;
  seekerPinStats?: {
    totalPins: number;
    avgBudget?: number;
    topBhk?: string;
    areaCoverage?: number;
    areaDistribution?: Array<{ area: string; count: number }>;
  };
}

export function formatRentMapped(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)}Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
}
