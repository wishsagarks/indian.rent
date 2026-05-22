'use client';

import React from 'react';
import { TrendingUp, Users, Home, Zap, Shield, Calendar } from 'lucide-react';

interface LocalityProfile {
  name: string;
  region?: string;
  supply: number;
  demand: number;
  ratio: number;
  avgRent: number;
  medianRent: number;
  minRent: number;
  maxRent: number;
  bhk1Avg?: number;
  bhk2Avg?: number;
  bhk3Avg?: number;
  mostCommonBhk?: string;
  gatedPercent?: number;
  listingAge?: number;
  transparencyScore?: number;
  volatility?: number;
  cityRank?: number;
}

interface LocalityProfileCardProps {
  locality: LocalityProfile;
  cityAverage?: Partial<LocalityProfile>;
  isAboveAverage?: (metric: string) => boolean;
}

export default function LocalityProfileCard({
  locality,
  cityAverage,
  isAboveAverage = () => false
}: LocalityProfileCardProps) {
  const getMarketTemperature = (ratio: number) => {
    if (!isFinite(ratio) || ratio === Infinity) return { emoji: '🔥', label: 'Extreme' };
    if (ratio > 1.5) return { emoji: '🔥', label: 'Hot' };
    if (ratio > 0.8) return { emoji: '🟡', label: 'Warm' };
    if (ratio <= 0) return { emoji: '📦', label: 'No Data' };
    return { emoji: '❄️', label: 'Cool' };
  };

  const temperature = getMarketTemperature(locality.ratio);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-primary/20 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">{locality.name}</h2>
            {locality.region && (
              <p className="text-sm text-on-surface-variant">{locality.region}</p>
            )}
          </div>
          <div className="text-right">
            {locality.cityRank && (
              <div className="text-xs text-on-surface-variant mb-2">City Rank</div>
            )}
            <div className="text-3xl font-bold text-primary">
              {temperature.emoji}
            </div>
            <p className="text-sm font-bold text-primary mt-1">{temperature.label}</p>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-on-surface-variant mb-1">Demand-Supply</p>
            <p className="text-lg font-bold text-on-surface">
              {!isFinite(locality.ratio) ? '∞:1' : locality.ratio.toFixed(1) + ':1'}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              {locality.demand} seekers vs {locality.supply} listings
            </p>
          </div>

          <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20">
            <p className="text-xs text-on-surface-variant mb-1">Avg Rent</p>
            <p className="text-lg font-bold text-on-surface">₹{(locality.avgRent / 1000).toFixed(0)}k</p>
            {cityAverage && (
              <p className={`text-xs mt-1 ${isAboveAverage('avgRent') ? 'text-orange-400' : 'text-emerald-400'}`}>
                {isAboveAverage('avgRent') ? '+' : '−'}
                {Math.abs(
                  ((locality.avgRent - (cityAverage.avgRent || 0)) /
                    (cityAverage.avgRent || 1)) *
                    100
                ).toFixed(0)}
                % vs avg
              </p>
            )}
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-on-surface-variant mb-1">Price Range</p>
            <p className="text-xs text-on-surface">₹{(locality.minRent / 1000).toFixed(0)}k - ₹{(locality.maxRent / 1000).toFixed(0)}k</p>
            <p className="text-xs text-on-surface-variant mt-2">Min - Max</p>
          </div>

          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <p className="text-xs text-on-surface-variant mb-1">Market Health</p>
            <p className="text-sm font-bold text-on-surface">
              {locality.ratio > 1.5 ? 'Seller Friendly' : locality.ratio > 0.8 ? 'Balanced' : 'Buyer Friendly'}
            </p>
          </div>
        </div>
      </div>

      {/* BHK Pricing */}
      {(locality.bhk1Avg || locality.bhk2Avg || locality.bhk3Avg) && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-primary uppercase">Pricing by Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: '1BHK', value: locality.bhk1Avg },
              { label: '2BHK', value: locality.bhk2Avg },
              { label: '3BHK', value: locality.bhk3Avg }
            ].map(
              (bhk) =>
                bhk.value && (
                  <div
                    key={bhk.label}
                    className="p-4 rounded-lg border border-white/10 bg-surface/50 hover:border-primary/30 transition-all"
                  >
                    <p className="text-xs text-on-surface-variant mb-2 uppercase font-technical">{bhk.label}</p>
                    <p className="text-2xl font-bold text-on-surface">₹{(bhk.value / 1000).toFixed(0)}k</p>
                  </div>
                )
            )}
          </div>
          {locality.mostCommonBhk && (
            <p className="text-xs text-on-surface-variant">
              Most Common: <span className="font-bold text-on-surface">{locality.mostCommonBhk}</span>
            </p>
          )}
        </div>
      )}

      {/* Detailed Metrics */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-secondary uppercase">Detailed Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-white/10 bg-surface/30">
              <div className="flex items-center gap-2 mb-2">
                <Home size={16} className="text-primary" />
                <span className="text-xs text-on-surface-variant uppercase font-technical">Active Listings</span>
              </div>
              <p className="text-2xl font-bold text-on-surface">{locality.supply}</p>
            </div>

            <div className="p-4 rounded-lg border border-white/10 bg-surface/30">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-secondary" />
                <span className="text-xs text-on-surface-variant uppercase font-technical">Active Seekers</span>
              </div>
              <p className="text-2xl font-bold text-on-surface">{locality.demand}</p>
            </div>

            <div className="p-4 rounded-lg border border-white/10 bg-surface/30">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-emerald-400" />
                <span className="text-xs text-on-surface-variant uppercase font-technical">Median Age</span>
              </div>
              <p className="text-2xl font-bold text-on-surface">
                {locality.listingAge ? `${locality.listingAge}d` : '—'}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">Days on market</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {locality.gatedPercent !== undefined && (
              <div className="p-4 rounded-lg border border-white/10 bg-surface/30">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-orange-400" />
                  <span className="text-xs text-on-surface-variant uppercase font-technical">Gated Societies</span>
                </div>
                <p className="text-2xl font-bold text-on-surface">{locality.gatedPercent}%</p>
              </div>
            )}

            {locality.volatility !== undefined && (
              <div className="p-4 rounded-lg border border-white/10 bg-surface/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className={locality.volatility > 15 ? 'text-orange-400' : 'text-emerald-400'} />
                  <span className="text-xs text-on-surface-variant uppercase font-technical">Price Volatility</span>
                </div>
                <p className="text-2xl font-bold text-on-surface">{locality.volatility.toFixed(1)}%</p>
              </div>
            )}

            {locality.transparencyScore !== undefined && (
              <div className="p-4 rounded-lg border border-white/10 bg-surface/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-yellow-400" />
                  <span className="text-xs text-on-surface-variant uppercase font-technical">Transparency</span>
                </div>
                <p className="text-2xl font-bold text-on-surface">{locality.transparencyScore.toFixed(0)}%</p>
                <p className="text-xs text-on-surface-variant mt-1">Data quality</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Median Rent Details */}
      <div className="border-t border-primary/20 pt-6">
        <h3 className="text-sm font-bold text-primary uppercase mb-4">Rent Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-on-surface-variant mb-1">P25 (25th %ile)</p>
            <p className="text-lg font-bold text-on-surface">₹{(locality.minRent / 1000).toFixed(0)}k</p>
          </div>
          <div className="border-l border-r border-white/10">
            <p className="text-xs text-on-surface-variant mb-1">Median (50th %ile)</p>
            <p className="text-lg font-bold text-primary">₹{(locality.medianRent / 1000).toFixed(0)}k</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-1">P75 (75th %ile)</p>
            <p className="text-lg font-bold text-on-surface">₹{(locality.maxRent / 1000).toFixed(0)}k</p>
          </div>
        </div>
      </div>
    </div>
  );
}
