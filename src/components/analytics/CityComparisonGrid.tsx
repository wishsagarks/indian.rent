'use client';

import React from 'react';
import { CityMetricsUI } from '@/lib/analytics-utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-16 bg-surface rounded-lg border border-white/10" />
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
      category: 'Demand',
      metric: 'seeker_pins',
      label: 'Seeker Pins',
      getValue: (m?: CityMetricsUI) => m?.demand.count || 0,
      format: (v: number) => v.toLocaleString()
    },
    {
      category: 'Demand',
      metric: 'ratio',
      label: 'Seeker-Listing Ratio',
      getValue: (m?: CityMetricsUI) => m?.demand.ratio || 0,
      format: (v: number) => `1:${Math.round(1 / v)}`
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
      label: 'Volatility',
      getValue: (m?: CityMetricsUI) => m?.price.volatility || 0,
      format: (v: number) => `${v.toFixed(1)}%`
    }
  ];

  const calculateDelta = (blr: number, hyd: number) => {
    if (!blr || !hyd) return 0;
    return ((blr - hyd) / hyd) * 100;
  };

  return (
    <div className="space-y-8">
      {['Supply', 'Demand', 'Price'].map((category) => (
        <div key={category}>
          <h3 className="text-xs uppercase tracking-widest font-technical font-bold text-primary mb-4">
            {category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rows
              .filter((r) => r.category === category)
              .map((row) => {
                const blrValue = row.getValue(bengaluru);
                const hydValue = row.getValue(hyderabad);
                const delta = calculateDelta(
                  typeof blrValue === 'number' ? blrValue : 0,
                  typeof hydValue === 'number' ? hydValue : 0
                );
                const isBetter = delta > 0;

                return (
                  <div
                    key={row.metric}
                    className="grid grid-cols-3 gap-4 p-4 rounded-lg border border-white/10 bg-surface/50"
                  >
                    {/* Label */}
                    <div className="col-span-3">
                      <p className="text-xs uppercase tracking-widest font-technical font-bold text-on-surface-variant">
                        {row.label}
                      </p>
                    </div>

                    {/* Bengaluru */}
                    <div>
                      <p className="text-xs text-on-surface-variant mb-1">🏙️ Bengaluru</p>
                      <p className="text-lg font-bold text-white">
                        {row.format(blrValue as number)}
                      </p>
                    </div>

                    {/* Hyderabad */}
                    <div>
                      <p className="text-xs text-on-surface-variant mb-1">🏙️ Hyderabad</p>
                      <p className="text-lg font-bold text-white">
                        {row.format(hydValue as number)}
                      </p>
                    </div>

                    {/* Delta */}
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant mb-1">Δ</p>
                      <div className={`flex items-center gap-1 justify-end ${
                        delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {delta > 0 ? <TrendingUp size={14} /> : delta < 0 ? <TrendingDown size={14} /> : '→'}
                        <span className="text-sm font-bold">{Math.abs(delta).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
