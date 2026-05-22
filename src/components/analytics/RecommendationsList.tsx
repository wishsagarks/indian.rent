'use client';

import React, { useState } from 'react';
import RecommendationCard from './RecommendationCard';
import type { Recommendation } from '@/lib/recommendation-engine';

interface RecommendationsListProps {
  recommendations: Recommendation[];
  selectedLocality?: string;
  isLoading?: boolean;
}

export default function RecommendationsList({
  recommendations,
  selectedLocality = 'This Area',
  isLoading = false
}: RecommendationsListProps) {
  const [expandedType, setExpandedType] = useState<string | null>(null);

  // Group recommendations by type
  const grouped = recommendations.reduce((acc, rec) => {
    if (!acc[rec.type]) {
      acc[rec.type] = [];
    }
    acc[rec.type].push(rec);
    return acc;
  }, {} as Record<string, Recommendation[]>);

  const getGroupLabel = (type: string) => {
    switch (type) {
      case 'similar':
        return 'Similar Neighborhoods';
      case 'investment':
        return 'Investment Opportunities';
      case 'seeker':
        return 'Seeker-Friendly Areas';
      case 'seasonal':
        return 'Seasonal Insights';
      default:
        return 'Recommendations';
    }
  };

  const getGroupDescription = (type: string) => {
    switch (type) {
      case 'similar':
        return 'Areas with comparable price, demand, and market dynamics';
      case 'investment':
        return 'High-potential areas for property investment based on demand-supply gaps';
      case 'seeker':
        return 'Ideal areas for property seekers based on price and availability';
      case 'seasonal':
        return 'Market trends based on current season — peak vs off-season dynamics';
      default:
        return 'Personalized recommendations for you';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-surface rounded-lg border border-white/10 animate-pulse" />
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg border border-white/10 bg-surface/50">
        <p className="text-on-surface-variant text-sm">
          No recommendations available. Select a locality to get personalized suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([type, recs]) => (
        <div key={type} className="space-y-3">
          {/* Group Header */}
          <button
            onClick={() => setExpandedType(expandedType === type ? null : type)}
            className="w-full flex items-center justify-between p-4 rounded-lg border border-white/10 bg-surface/50 hover:border-white/20 transition-all"
          >
            <div className="text-left flex-1">
              <h3 className="text-sm font-bold text-on-surface mb-1">
                {getGroupLabel(type)}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {getGroupDescription(type)}
              </p>
            </div>
            <div className="text-xs font-bold text-primary ml-4 flex-shrink-0">
              {recs.length} {recs.length === 1 ? 'item' : 'items'}
              <span className="ml-2">{expandedType === type ? '▼' : '▶'}</span>
            </div>
          </button>

          {/* Group Items */}
          {expandedType === type && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
              {recs.map((rec, idx) => (
                <RecommendationCard
                  key={`${type}-${idx}`}
                  recommendation={rec}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
