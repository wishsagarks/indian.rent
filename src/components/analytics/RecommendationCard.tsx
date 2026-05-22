'use client';

import React from 'react';
import { TrendingUp, Target, Users, Calendar } from 'lucide-react';
import type { Recommendation } from '@/lib/recommendation-engine';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onClick?: () => void;
}

export default function RecommendationCard({
  recommendation,
  onClick
}: RecommendationCardProps) {
  const getIconComponent = () => {
    switch (recommendation.type) {
      case 'similar':
        return <Target size={20} className="text-primary" />;
      case 'investment':
        return <TrendingUp size={20} className="text-orange-400" />;
      case 'seeker':
        return <Users size={20} className="text-emerald-400" />;
      case 'seasonal':
        return <Calendar size={20} className="text-cyan-400" />;
      default:
        return null;
    }
  };

  const getTypeLabel = () => {
    switch (recommendation.type) {
      case 'similar':
        return 'Similar Area';
      case 'investment':
        return 'Investment Opportunity';
      case 'seeker':
        return 'Seeker Friendly';
      case 'seasonal':
        return 'Seasonal Insight';
      default:
        return 'Recommendation';
    }
  };

  const getBgColor = () => {
    switch (recommendation.type) {
      case 'similar':
        return 'bg-primary/10 border-primary/30';
      case 'investment':
        return 'bg-orange-500/10 border-orange-500/30';
      case 'seeker':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'seasonal':
        return 'bg-cyan-500/10 border-cyan-500/30';
      default:
        return 'bg-surface/50 border-white/10';
    }
  };

  const getMetricsDisplay = () => {
    const items = [];

    if (recommendation.metrics.similarity !== undefined) {
      items.push({
        label: 'Similarity',
        value: `${recommendation.metrics.similarity}%`,
        color: 'text-primary'
      });
    }

    if (recommendation.metrics.opportunity !== undefined) {
      items.push({
        label: 'Opportunity',
        value: `${recommendation.metrics.opportunity}/100`,
        color: 'text-orange-400'
      });
    }

    if (recommendation.metrics.priceMatch !== undefined) {
      items.push({
        label: 'Price',
        value: `${recommendation.metrics.priceMatch > 0 ? '+' : ''}${recommendation.metrics.priceMatch}%`,
        color: recommendation.metrics.priceMatch < -10 ? 'text-emerald-400' : recommendation.metrics.priceMatch > 10 ? 'text-orange-400' : 'text-on-surface-variant'
      });
    }

    if (recommendation.metrics.growthPotential !== undefined) {
      items.push({
        label: 'Growth',
        value: `${recommendation.metrics.growthPotential}%`,
        color: 'text-cyan-400'
      });
    }

    return items;
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-glow-blue-sm hover:border-primary/50 ${getBgColor()}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5">{getIconComponent()}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase font-technical font-bold text-on-surface-variant mb-1">
              {getTypeLabel()}
            </p>
            <h3 className="text-sm font-bold text-on-surface truncate">
              {recommendation.icon} {recommendation.suggestedLocality}
            </h3>
          </div>
        </div>
      </div>

      <p className="text-xs text-on-surface-variant mb-3 line-clamp-2">
        {recommendation.reason}
      </p>

      {/* Metrics Grid */}
      {getMetricsDisplay().length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3 pb-3 border-t border-white/10 pt-3">
          {getMetricsDisplay().map((metric, idx) => (
            <div key={idx}>
              <p className="text-xs text-on-surface-variant mb-1">{metric.label}</p>
              <p className={`text-sm font-bold ${metric.color}`}>{metric.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-technical text-primary font-bold">
          {recommendation.action}
        </p>
        <span className="text-xs">→</span>
      </div>
    </button>
  );
}
