export interface CityMetric {
  metric_name: string;
  metric_value: number;
  metric_type: string;
  context: Record<string, any>;
}

export interface CityMetricsUI {
  supply: {
    count: number;
    trend: string;
    change: number;
  };
  demand: {
    count: number;
    ratio: number;
    interpretation: string;
  };
  price: {
    median: number;
    avg: number;
    p25: number;
    p75: number;
    volatility: number;
    premiumIndex: number;
  };
  quality: {
    transparencyScore: number;
  };
}

export function transformMetrics(rawMetrics: CityMetric[]): CityMetricsUI {
  const metrics = Object.fromEntries(
    rawMetrics.map(m => [m.metric_name, m.metric_value])
  );

  return {
    supply: {
      count: metrics.total_listings || 0,
      trend: metrics.total_listings > 5000 ? '↑ Growing' : '→ Stable',
      change: metrics.listing_growth_rate ?? 0
    },
    demand: {
      count: metrics.seeker_pins || 0,
      ratio: metrics.seeker_listing_ratio || 0,
      interpretation: interpretRatio(metrics.seeker_listing_ratio || 0)
    },
    price: {
      median: metrics.median_rent || 0,
      avg: metrics.avg_rent || 0,
      p25: metrics.rent_p25 || 0,
      p75: metrics.rent_p75 || 0,
      volatility: metrics.rent_volatility || 0,
      premiumIndex: metrics.premium_index || 0
    },
    quality: {
      transparencyScore: metrics.transparency_score || 0
    }
  };
}

export function interpretRatio(ratio: number): string {
  if (ratio > 2) return 'Supply Crunch ⚠️';
  if (ratio > 1) return 'Balanced 🟢';
  if (ratio > 0.5) return 'Oversupply 📉';
  return 'Heavy Oversupply 🔴';
}
