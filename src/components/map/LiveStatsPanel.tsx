'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChartBar as BarChart3, Globe, MapPin } from 'lucide-react';

interface LiveStatsPanelProps {
  points: any[];
  onClose: () => void;
}

export default function LiveStatsPanel({ points, onClose }: LiveStatsPanelProps) {
  const [tab, setTab] = useState<'overall' | 'nearby'>('overall');

  const stats = useMemo(() => {
    const flats = points.map(p => p.properties);
    const rents = flats.map(f => {
      const num = parseInt(String(f.rent || '0').replace(/[^0-9]/g, ''));
      return num;
    }).filter(r => r > 0);

    const bhkRents: Record<string, number[]> = {};
    flats.forEach(f => {
      const bhk = f.bhk || 'unknown';
      const rent = parseInt(String(f.rent || '0').replace(/[^0-9]/g, ''));
      if (rent > 0) {
        if (!bhkRents[bhk]) bhkRents[bhk] = [];
        bhkRents[bhk].push(rent);
      }
    });

    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    const max = (arr: number[]) => arr.length > 0 ? Math.max(...arr) : 0;

    return {
      totalPins: flats.length,
      avgRent: avg(rents),
      maxRent: max(rents),
      bhkBreakdown: Object.entries(bhkRents).map(([bhk, rentArr]) => ({
        bhk,
        avg: avg(rentArr),
        max: max(rentArr),
        count: rentArr.length,
      })).sort((a, b) => parseInt(a.bhk) - parseInt(b.bhk)),
      gated: flats.filter(f => f.category === 'gated').length,
      nonGated: flats.filter(f => f.category !== 'gated').length,
    };
  }, [points]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed lg:absolute right-2 lg:right-4 left-2 lg:left-auto top-20 lg:top-24 w-auto lg:w-[340px] max-h-[70vh] lg:max-h-none bg-surface/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-40 overflow-y-auto"
    >
      <div className="p-3 sm:p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <BarChart3 size={16} className="text-primary" />
          <span className="font-technical text-[9px] sm:text-[10px] text-primary font-black uppercase tracking-[0.2em]">Live Stats</span>
        </div>
        <button onClick={onClose} className="p-1 sm:p-1.5 rounded-lg hover:bg-white/5 text-on-surface-variant"><X size={16} /></button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-white/5">
        <button onClick={() => setTab('overall')} className={`py-3 font-technical text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-2 transition-all ${tab === 'overall' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant'}`}>
          <Globe size={12} /> Overall
        </button>
        <button onClick={() => setTab('nearby')} className={`py-3 font-technical text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-2 transition-all ${tab === 'nearby' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant'}`}>
          <MapPin size={12} /> Visible Area
        </button>
      </div>

      <div className="p-3 sm:p-5 space-y-5 max-h-[55vh] overflow-y-auto custom-scrollbar">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-black text-on-surface tracking-tighter">{stats.totalPins}</div>
            <div className="font-technical text-[8px] text-on-surface-variant uppercase tracking-wider mt-1">Rent Pins</div>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-black text-primary tracking-tighter">{stats.avgRent > 0 ? `₹${(stats.avgRent / 1000).toFixed(0)}k` : '—'}</div>
            <div className="font-technical text-[8px] text-on-surface-variant uppercase tracking-wider mt-1">Avg Rent</div>
          </div>
        </div>

        {/* BHK Breakdown */}
        <div className="space-y-3">
          <div className="font-technical text-[9px] text-on-surface-variant uppercase tracking-widest font-black">Average Rent by BHK</div>
          {stats.bhkBreakdown.length > 0 ? (
            <div className="space-y-2">
              {stats.bhkBreakdown.map(item => (
                <div key={item.bhk} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-xs text-on-surface">{item.bhk === 'unknown' ? '?' : item.bhk} BHK</span>
                    <span className="text-[9px] text-on-surface-variant">({item.count} pins)</span>
                  </div>
                  <span className="font-black text-sm text-primary">₹{item.avg.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-on-surface-variant/50 text-center py-4">No BHK data available yet</div>
          )}
        </div>

        {/* Gated vs Non-Gated */}
        <div className="space-y-3">
          <div className="font-technical text-[9px] text-on-surface-variant uppercase tracking-widest font-black">Society Type</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
              <div className="text-xl font-black text-blue-400">{stats.gated}</div>
              <div className="font-technical text-[8px] text-blue-400/70 uppercase tracking-wider mt-1">Gated</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
              <div className="text-xl font-black text-orange-400">{stats.nonGated}</div>
              <div className="font-technical text-[8px] text-orange-400/70 uppercase tracking-wider mt-1">Non-Gated</div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        {stats.maxRent > 0 && (
          <div className="space-y-3">
            <div className="font-technical text-[9px] text-on-surface-variant uppercase tracking-widest font-black">Highest Rent</div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-black text-primary tracking-tighter">₹{stats.maxRent.toLocaleString()}</div>
              <div className="font-technical text-[8px] text-primary/60 uppercase tracking-wider mt-1">Top Listing</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
