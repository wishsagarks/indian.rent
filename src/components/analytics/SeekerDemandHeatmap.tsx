'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface HeatmapData {
  area: string;
  demand: number; // 0-100 intensity
  seekers: number;
  listings: number;
  ratio: number;
}

interface SeekerDemandHeatmapProps {
  data: HeatmapData[];
  title?: string;
}

export default function SeekerDemandHeatmap({
  data,
  title = 'Seeker Demand Heatmap'
}: SeekerDemandHeatmapProps) {
  const maxDemand = useMemo(() => Math.max(...data.map(d => d.demand), 50), [data]);

  const getHeatmapColor = (demand: number) => {
    const intensity = demand / maxDemand;
    // Cool to hot: blue → cyan → green → yellow → red
    if (intensity < 0.25) return 'bg-blue-500/30 border-blue-500/40';
    if (intensity < 0.5) return 'bg-cyan-500/40 border-cyan-500/50';
    if (intensity < 0.75) return 'bg-yellow-500/50 border-yellow-500/60';
    return 'bg-red-500/60 border-red-500/70';
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.08, 1],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatDelay: 2.4,
      }
    }
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
        <h3 className="text-sm font-black uppercase tracking-widest text-primary font-technical">{title}</h3>
        <p className="text-xs text-on-surface-variant mt-1">Real-time seeker demand intensity by area</p>
      </div>

      {/* Legend */}
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

      {/* Heatmap Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {data.map((item, idx) => (
          <motion.div
            key={item.area}
            variants={pulseVariants}
            animate="pulse"
            className={`relative p-2 md:p-3 rounded-lg border transition-all cursor-pointer hover:shadow-lg ${getHeatmapColor(item.demand)}`}
            title={`${item.area}: ${item.demand}% demand (${item.seekers} seekers, ${item.listings} listings)`}
          >
            <div className="text-[9px] md:text-[10px] font-bold text-on-surface text-center truncate">
              {item.area}
            </div>
            <div className="text-[8px] md:text-[9px] text-on-surface-variant text-center mt-1">
              {item.demand}%
            </div>
            <div className="text-[7px] md:text-[8px] text-on-surface-variant/60 text-center mt-0.5">
              {item.seekers}/{item.listings}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xs font-technical font-bold uppercase tracking-widest text-on-surface-variant">Max Demand</p>
          <p className="text-lg font-black text-primary mt-1">{Math.max(...data.map(d => d.demand))}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-technical font-bold uppercase tracking-widest text-on-surface-variant">Avg Demand</p>
          <p className="text-lg font-black text-on-surface mt-1">
            {Math.round(data.reduce((sum, d) => sum + d.demand, 0) / data.length)}%
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
