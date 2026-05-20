'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface OpportunityScoreItem {
  locality_name: string;
  opportunity_score: number;
  supply_trend: string;
  demand_trend: string;
  price_momentum: string;
  recommendation: string;
}

interface OpportunityTableProps {
  data: OpportunityScoreItem[];
  loading?: boolean;
  onLocalityClick?: (locality: string) => void;
}

export default function OpportunityTable({
  data = [],
  loading = false,
  onLocalityClick
}: OpportunityTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getScoreStars = (score: number) => {
    const stars = Math.round(score / 20);
    return '⭐'.repeat(Math.min(stars, 5));
  };

  const getRecommendationColor = (rec: string) => {
    if (rec.includes('High')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (rec.includes('Medium')) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-surface rounded-lg border border-white/10 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {data.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">
            No data available
          </div>
        ) : (
          data.map((item, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-white/10 bg-surface/50 transition-all hover:border-white/20 cursor-pointer"
              onClick={() => {
                setExpandedRow(expandedRow === item.locality_name ? null : item.locality_name);
                onLocalityClick?.(item.locality_name);
              }}
            >
              {/* Header Row */}
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
                  {/* Locality */}
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-sm font-bold text-on-surface">{item.locality_name}</p>
                  </div>

                  {/* Score */}
                  <div className="hidden md:block">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getScoreStars(item.opportunity_score)}</span>
                      <span className="text-xs text-on-surface-variant">
                        {item.opportunity_score.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Supply Trend */}
                  <div className="hidden md:block">
                    <p className="text-sm font-semibold">{item.supply_trend}</p>
                  </div>

                  {/* Demand Trend */}
                  <div className="hidden md:block">
                    <p className="text-sm font-semibold">{item.demand_trend}</p>
                  </div>

                  {/* Price Momentum */}
                  <div className="hidden md:block">
                    <p className="text-sm font-semibold">{item.price_momentum}</p>
                  </div>

                  {/* Recommendation Badge */}
                  <div className="col-span-2 md:col-span-1">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getRecommendationColor(
                        item.recommendation
                      )}`}
                    >
                      {item.recommendation}
                    </span>
                  </div>

                  {/* Expand Arrow */}
                  <div className="flex justify-end">
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${
                        expandedRow === item.locality_name ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Row */}
              {expandedRow === item.locality_name && (
                <div className="border-t border-primary/20 p-4 bg-surface space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-on-surface-variant mb-1">Supply Trend</p>
                      <p className="text-sm font-bold">{item.supply_trend}</p>
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant mb-1">Demand Trend</p>
                      <p className="text-sm font-bold">{item.demand_trend}</p>
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant mb-1">Price Momentum</p>
                      <p className="text-sm font-bold">{item.price_momentum}</p>
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant mb-1">Opportunity Score</p>
                      <p className="text-sm font-bold">{item.opportunity_score.toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button className="text-xs px-3 py-1 rounded border border-primary/50 text-primary hover:bg-primary/10 transition-all">
                      View Detailed Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
