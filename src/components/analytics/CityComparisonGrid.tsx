'use client';

import React from 'react';
import { CityMetricsUI } from '@/lib/analytics-utils';
import CityComparisonCard3D from './CityComparisonCard3D';

interface CityComparisonGridProps {
  bengaluru?: CityMetricsUI;
  hyderabad?: CityMetricsUI;
  loading?: boolean;
}

export default function CityComparisonGrid({
  bengaluru,
  hyderabad,
  loading = false
}: CityComparisonGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="h-48 bg-surface rounded-xl border border-white/10" />
        ))}
      </div>
    );
  }

  interface RowConfig {
    category: string;
    metric: string;
    label: string;
    getValue: (m?: CityMetricsUI) => number;
    format: (v: number) => string;
  }

  const rows: RowConfig[] = [
    {
      category: 'Supply',
      metric: 'total_listings',
      label: 'Total Listings',
      getValue: (m?: CityMetricsUI) => m?.supply.count || 0,
      format: (v: number) => v.toLocaleString()
    },
    {
      category: 'Supply',
      metric: 'supply_trend',
      label: 'Supply Trend',
      getValue: (m?: CityMetricsUI) => m?.supply.change || 0,
      format: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
    },
    {
      category: 'Demand',
      metric: 'seeker_pins',
      label: 'Seeker Demand',
      getValue: (m?: CityMetricsUI) => m?.demand.count || 0,
      format: (v: number) => v.toLocaleString()
    },
    {
      category: 'Demand',
      metric: 'ratio',
      label: 'Market Balance',
      getValue: (m?: CityMetricsUI) => m?.demand.ratio || 0,
      format: (v: number) => `1:${(1 / v).toFixed(1)}`
    },
    {
      category: 'Price',
      metric: 'median_rent',
      label: 'Median Rent',
      getValue: (m?: CityMetricsUI) => m?.price.median || 0,
      format: (v: number) => `₹${(v / 1000).toFixed(1)}k`
    },
    {
      category: 'Price',
      metric: 'volatility',
      label: 'Price Volatility',
      getValue: (m?: CityMetricsUI) => m?.price.volatility || 0,
      format: (v: number) => `${v.toFixed(1)}%`
    },
    {
      category: 'Price',
      metric: 'premium',
      label: 'Premium Index',
      getValue: (m?: CityMetricsUI) => m?.price.premiumIndex || 0,
      format: (v: number) => `${v.toFixed(2)}x`
    },
    {
      category: 'Quality',
      metric: 'transparency',
      label: 'Data Quality',
      getValue: (m?: CityMetricsUI) => m?.quality.transparencyScore || 0,
      format: (v: number) => `${v.toFixed(0)}%`
    }
  ];

  const calculateDelta = (blr: number, hyd: number) => {
    if (hyd === 0) return blr > 0 ? 100 : 0;
    return ((blr - hyd) / hyd) * 100;
  };

  if (!bengaluru || !hyderabad) {
    return (
      <div className="p-8 text-center rounded-xl border border-white/10 bg-surface/50">
        <p className="text-on-surface-variant">Loading city comparison data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {['Supply', 'Demand', 'Price', 'Quality'].map((category) => (
        <div key={category}>
          <h3 className="text-xs uppercase tracking-widest font-technical font-bold text-primary mb-6">
            {category} Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rows
              .filter((r) => r.category === category)
              .map((row) => {
                const blrValue = row.getValue(bengaluru);
                const hydValue = row.getValue(hyderabad);
                const delta = calculateDelta(blrValue, hydValue);

                return (
                  <CityComparisonCard3D
                    key={row.metric}
                    label={row.label}
                    bengaluru={row.format(blrValue)}
                    hyderabad={row.format(hydValue)}
                    delta={delta}
                    category={category}
                  />
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
