'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import SeekerDemandHeatmap from './SeekerDemandHeatmap';

interface HeatmapData {
  area: string;
  demand: number;
  seekers: number;
  listings: number;
  ratio: number;
  avgRent?: number;
}

interface HeatmapContainerProps {
  data: HeatmapData[];
  city?: string;
}

type HeatmapType = 'demand' | 'listing' | 'gap' | 'price';

export default function HeatmapContainer({ data, city = 'Market' }: HeatmapContainerProps) {
  const [activeHeatmap, setActiveHeatmap] = useState<HeatmapType>('demand');

  // Transform data for different heatmap types
  const transformedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Get max values for normalization
    const maxListings = Math.max(...data.map(d => d.listings), 1);
    const maxRent = Math.max(...data.map(d => d.avgRent || 1), 1);

    return data.map(item => {
      // Listing density: normalize listings to 0-100
      const listingDensity = (item.listings / maxListings) * 100;

      // Supply-demand gap: positive = shortage, negative = oversupply
      const gapScore = item.ratio > 1.5 ? 80 : item.ratio > 0.8 ? 50 : 20;

      // Price intensity: normalize rent to 0-100
      const priceIntensity = ((item.avgRent || 0) / maxRent) * 100;

      return {
        ...item,
        listingDensity: Math.round(listingDensity),
        gapScore: Math.round(gapScore),
        priceIntensity: Math.round(priceIntensity)
      };
    });
  }, [data]);

  // Render appropriate heatmap based on selection
  const renderHeatmap = () => {
    switch (activeHeatmap) {
      case 'demand':
        return (
          <SeekerDemandHeatmap
            data={transformedData.map(d => ({
              area: d.area,
              demand: d.demand,
              seekers: d.seekers,
              listings: d.listings,
              ratio: d.ratio
            }))}
            title={`Seeker Demand Heatmap — ${city}`}
          />
        );
      case 'listing':
        return (
          <ListingDensityHeatmap
            data={transformedData.map(d => ({
              area: d.area,
              density: d.listingDensity,
              listings: d.listings,
              seekers: d.seekers,
              ratio: d.ratio
            }))}
            city={city}
          />
        );
      case 'gap':
        return (
          <SupplyDemandGapHeatmap
            data={transformedData.map(d => ({
              area: d.area,
              gap: d.gapScore,
              ratio: d.ratio,
              shortage: d.ratio > 1.5,
              surplus: d.ratio < 0.8
            }))}
            city={city}
          />
        );
      case 'price':
        return (
          <PriceHeatmap
            data={transformedData.map(d => ({
              area: d.area,
              price: d.priceIntensity,
              avgRent: d.avgRent || 0,
              listings: d.listings
            }))}
            city={city}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Heatmap Type Selector */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        <button
          onClick={() => setActiveHeatmap('demand')}
          className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
            activeHeatmap === 'demand'
              ? 'bg-primary/20 border-primary text-primary'
              : 'border-white/10 bg-surface hover:border-primary/50 text-on-surface-variant'
          }`}
        >
          📍 Seeker Demand
        </button>
        <button
          onClick={() => setActiveHeatmap('listing')}
          className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
            activeHeatmap === 'listing'
              ? 'bg-secondary/20 border-secondary text-secondary'
              : 'border-white/10 bg-surface hover:border-secondary/50 text-on-surface-variant'
          }`}
        >
          🏠 Listing Density
        </button>
        <button
          onClick={() => setActiveHeatmap('gap')}
          className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
            activeHeatmap === 'gap'
              ? 'bg-orange-500/20 border-orange-500 text-orange-400'
              : 'border-white/10 bg-surface hover:border-orange-500/50 text-on-surface-variant'
          }`}
        >
          ⚖️ Supply-Demand Gap
        </button>
        <button
          onClick={() => setActiveHeatmap('price')}
          className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
            activeHeatmap === 'price'
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
              : 'border-white/10 bg-surface hover:border-emerald-500/50 text-on-surface-variant'
          }`}
        >
          💰 Price Map
        </button>
      </div>

      {/* Heatmap Display */}
      <motion.div
        key={activeHeatmap}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {renderHeatmap()}
      </motion.div>
    </div>
  );
}

/* ListingDensityHeatmap Component */
function ListingDensityHeatmap({
  data,
  city
}: {
  data: Array<{ area: string; density: number; listings: number; seekers: number; ratio: number }>;
  city: string;
}) {
  const getHeatmapColor = (density: number) => {
    // Cool to hot: blue → green → yellow → red
    if (density < 25) return 'bg-blue-500/30 border-blue-500/40';
    if (density < 50) return 'bg-cyan-500/40 border-cyan-500/50';
    if (density < 75) return 'bg-yellow-500/50 border-yellow-500/60';
    return 'bg-red-500/60 border-red-500/70';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-surface border border-white/10 rounded-lg p-6 space-y-4"
    >
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-secondary font-technical">
          Listing Density Heatmap
        </h3>
        <p className="text-xs text-on-surface-variant mt-1">Property concentration by area — {city}</p>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-blue-500/30 border border-blue-500/40" />
          <span className="text-on-surface-variant">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-yellow-500/50 border border-yellow-500/60" />
          <span className="text-on-surface-variant">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-red-500/60 border border-red-500/70" />
          <span className="text-on-surface-variant">High</span>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {data.map(item => (
          <div
            key={item.area}
            className={`p-2 md:p-3 rounded-lg border transition-all cursor-pointer hover:shadow-lg ${getHeatmapColor(item.density)}`}
            title={`${item.area}: ${item.listings} listings, ${item.ratio.toFixed(1)}:1 ratio`}
          >
            <div className="text-[9px] md:text-[10px] font-bold text-on-surface text-center truncate">
              {item.area}
            </div>
            <div className="text-[8px] md:text-[9px] text-on-surface-variant text-center mt-1">
              {item.listings}
            </div>
            <div className="text-[7px] md:text-[8px] text-on-surface-variant/60 text-center mt-0.5">
              listings
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xs font-technical font-bold uppercase tracking-widest text-on-surface-variant">
            Max Listings
          </p>
          <p className="text-lg font-black text-secondary mt-1">{Math.max(...data.map(d => d.listings))}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-technical font-bold uppercase tracking-widest text-on-surface-variant">
            Avg Listings
          </p>
          <p className="text-lg font-black text-on-surface mt-1">
            {Math.round(data.reduce((sum, d) => sum + d.listings, 0) / data.length)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs font-technical font-bold uppercase tracking-widest text-on-surface-variant">Areas</p>
          <p className="text-lg font-black text-on-surface mt-1">{data.length}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* SupplyDemandGapHeatmap Component */
function SupplyDemandGapHeatmap({
  data,
  city
}: {
  data: Array<{ area: string; gap: number; ratio: number; shortage: boolean; surplus: boolean }>;
  city: string;
}) {
  const getGapColor = (gap: number, shortage: boolean) => {
    if (shortage) return 'bg-red-500/50 border-red-500/60'; // Red = shortage
    if (gap > 50) return 'bg-yellow-500/40 border-yellow-500/50'; // Yellow = slight imbalance
    return 'bg-emerald-500/40 border-emerald-500/50'; // Green = balanced/surplus
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-surface border border-white/10 rounded-lg p-6 space-y-4"
    >
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-orange-400 font-technical">
          Supply-Demand Gap
        </h3>
        <p className="text-xs text-on-surface-variant mt-1">Identify shortages vs. oversupply — {city}</p>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-red-500/50 border border-red-500/60" />
          <span className="text-on-surface-variant">Shortage</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-yellow-500/40 border border-yellow-500/50" />
          <span className="text-on-surface-variant">Balanced</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-emerald-500/40 border border-emerald-500/50" />
          <span className="text-on-surface-variant">Surplus</span>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {data.map(item => (
          <div
            key={item.area}
            className={`p-2 md:p-3 rounded-lg border transition-all cursor-pointer hover:shadow-lg ${getGapColor(item.gap, item.shortage)}`}
            title={`${item.area}: ${item.ratio.toFixed(1)}:1 ratio ${item.shortage ? '(Shortage)' : '(Surplus)'}`}
          >
            <div className="text-[9px] md:text-[10px] font-bold text-on-surface text-center truncate">
              {item.area}
            </div>
            <div className="text-[8px] md:text-[9px] text-on-surface-variant text-center mt-1">
              {item.shortage ? '🔴' : item.ratio < 0.8 ? '🔵' : '🟡'}
            </div>
            <div className="text-[7px] md:text-[8px] text-on-surface-variant/60 text-center mt-0.5">
              {item.ratio.toFixed(1)}:1
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <p className="text-xs text-on-surface-variant">
          <strong>🔴 Shortage:</strong> High demand, low supply (high opportunity) &nbsp; | &nbsp;
          <strong>🔵 Surplus:</strong> Low demand, high supply (buyer friendly) &nbsp; | &nbsp;
          <strong>🟡 Balanced:</strong> Equilibrium market
        </p>
      </div>
    </motion.div>
  );
}

/* PriceHeatmap Component */
function PriceHeatmap({
  data,
  city
}: {
  data: Array<{ area: string; price: number; avgRent: number; listings: number }>;
  city: string;
}) {
  const getHeatmapColor = (price: number) => {
    // Cool (affordable) to hot (expensive)
    if (price < 25) return 'bg-blue-500/30 border-blue-500/40';
    if (price < 50) return 'bg-green-500/40 border-green-500/50';
    if (price < 75) return 'bg-yellow-500/50 border-yellow-500/60';
    return 'bg-red-500/60 border-red-500/70';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-surface border border-white/10 rounded-lg p-6 space-y-4"
    >
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 font-technical">
          Price Heatmap
        </h3>
        <p className="text-xs text-on-surface-variant mt-1">Average rent intensity — {city}</p>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-blue-500/30 border border-blue-500/40" />
          <span className="text-on-surface-variant">Affordable</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-yellow-500/50 border border-yellow-500/60" />
          <span className="text-on-surface-variant">Moderate</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-red-500/60 border border-red-500/70" />
          <span className="text-on-surface-variant">Premium</span>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {data.map(item => (
          <div
            key={item.area}
            className={`p-2 md:p-3 rounded-lg border transition-all cursor-pointer hover:shadow-lg ${getHeatmapColor(item.price)}`}
            title={`${item.area}: ₹${(item.avgRent / 1000).toFixed(0)}k avg rent`}
          >
            <div className="text-[9px] md:text-[10px] font-bold text-on-surface text-center truncate">
              {item.area}
            </div>
            <div className="text-[8px] md:text-[9px] text-on-surface-variant text-center mt-1">
              ₹{(item.avgRent / 1000).toFixed(0)}k
            </div>
            <div className="text-[7px] md:text-[8px] text-on-surface-variant/60 text-center mt-0.5">
              {item.listings} listings
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xs font-technical font-bold uppercase tracking-widest text-on-surface-variant">
            Max Price
          </p>
          <p className="text-lg font-black text-red-400 mt-1">
            ₹{Math.max(...data.map(d => d.avgRent / 1000)).toFixed(0)}k
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs font-technical font-bold uppercase tracking-widest text-on-surface-variant">
            Avg Price
          </p>
          <p className="text-lg font-black text-on-surface mt-1">
            ₹{Math.round(data.reduce((sum, d) => sum + d.avgRent, 0) / data.length / 1000)}k
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs font-technical font-bold uppercase tracking-widest text-on-surface-variant">
            Min Price
          </p>
          <p className="text-lg font-black text-blue-400 mt-1">
            ₹{Math.min(...data.map(d => d.avgRent / 1000)).toFixed(0)}k
          </p>
        </div>
      </div>
    </motion.div>
  );
}
