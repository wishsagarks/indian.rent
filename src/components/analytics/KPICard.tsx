'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: number | string;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  interpretation?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export default function KPICard({
  label,
  value,
  unit = '',
  trend,
  trendLabel,
  interpretation,
  icon,
  highlight = false
}: KPICardProps) {
  const isTrendPositive = trend !== undefined && trend > 0;
  const isTrendNegative = trend !== undefined && trend < 0;

  return (
    <div className={`rounded-lg border p-6 transition-all ${
      highlight
        ? 'bg-primary/10 border-primary/50'
        : 'bg-surface border-white/10 hover:border-white/20'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <label className="text-xs uppercase tracking-widest font-technical font-bold text-on-surface-variant">
          {label}
        </label>
        {icon && <div className="text-primary/60">{icon}</div>}
      </div>

      {/* Main Value */}
      <div className="mb-4">
        <div className="text-3xl md:text-4xl font-display font-black text-white tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="text-lg md:text-xl ml-2 text-on-surface-variant">{unit}</span>}
        </div>
      </div>

      {/* Trend Indicator */}
      {trend !== undefined && (
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-sm text-sm font-bold ${
            isTrendPositive
              ? 'bg-green-500/20 text-green-400'
              : isTrendNegative
              ? 'bg-red-500/20 text-red-400'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {isTrendPositive ? (
              <TrendingUp size={14} />
            ) : isTrendNegative ? (
              <TrendingDown size={14} />
            ) : (
              <Minus size={14} />
            )}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
          {trendLabel && (
            <span className="text-xs text-on-surface-variant">{trendLabel}</span>
          )}
        </div>
      )}

      {/* Interpretation */}
      {interpretation && (
        <div className="mt-3 text-xs text-on-surface-variant">
          {interpretation}
        </div>
      )}
    </div>
  );
}
