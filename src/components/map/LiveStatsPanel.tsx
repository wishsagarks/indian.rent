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
      className="fixed lg:absolute right-2 lg:right-4 left-2 lg:left-auto top-20 lg:top-24 w-auto lg:w-[360px] max-h-[75vh] lg:max-h-[80vh] bg-background backdrop-blur-xl border border-primary/20 rounded-xl shadow-2xl z-40 overflow-y-auto"
    >
      <div className="p-4 sm:p-5 border-b border-primary/10 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <BarChart3 size={18} className="text-primary" />
          <span className="font-technical text-[10px] sm:text-xs text-primary font-black uppercase tracking-[0.15em]">Live Stats</span>
        </div>
        <button onClick={onClose} className="p-2 sm:p-1.5 rounded-lg hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-all min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center" aria-label="Close live stats"><X size={18} /></button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-primary/10 bg-background/50">
        <button onClick={() => setTab('overall')} className={`py-3 px-2 font-technical text-[10px] uppercase tracking-widest font-black flex items-center justify-center gap-2 transition-all ${tab === 'overall' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
          <Globe size={14} /> Overall
        </button>
        <button onClick={() => setTab('nearby')} className={`py-3 px-2 font-technical text-[10px] uppercase tracking-widest font-black flex items-center justify-center gap-2 transition-all ${tab === 'nearby' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
          <MapPin size={14} /> Visible Area
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-5 max-h-[calc(75vh-180px)] lg:max-h-[calc(80vh-180px)] overflow-y-auto custom-scrollbar">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/50 border border-primary/20 rounded-lg p-4 text-center hover:bg-background/70 transition-colors">
            <div className="text-2xl font-black text-primary tracking-tighter">{stats.totalPins}</div>
            <div className="font-technical text-[9px] text-on-surface-variant uppercase tracking-wider mt-1">Active Pins</div>
          </div>
          <div className="bg-background/50 border border-primary/20 rounded-lg p-4 text-center hover:bg-background/70 transition-colors">
            <div className="text-2xl font-black text-primary tracking-tighter">{stats.avgRent > 0 ? `₹${(stats.avgRent / 1000).toFixed(0)}k` : '—'}</div>
            <div className="font-technical text-[9px] text-on-surface-variant uppercase tracking-wider mt-1">Avg Rent</div>
          </div>
        </div>

        {/* BHK Breakdown */}
        <div className="space-y-3">
          <div className="font-technical text-[10px] text-primary uppercase tracking-widest font-black">Rent by BHK</div>
          {stats.bhkBreakdown.length > 0 ? (
            <div className="space-y-2">
              {stats.bhkBreakdown.map(item => (
                <div key={item.bhk} className="flex items-center justify-between bg-background/50 border border-primary/20 rounded-lg p-3 hover:bg-background/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm text-on-surface">{item.bhk === 'unknown' ? '?' : item.bhk} BHK</span>
                    <span className="text-[9px] text-on-surface-variant">({item.count})</span>
                  </div>
                  <span className="font-black text-sm text-primary">₹{(item.avg / 1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-on-surface-variant/50 text-center py-4">No data</div>
          )}
        </div>

        {/* Gated vs Non-Gated */}
        <div className="space-y-3">
          <div className="font-technical text-[10px] text-primary uppercase tracking-widest font-black">Society Type</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-center hover:bg-primary/15 transition-colors">
              <div className="text-xl font-black text-primary">{stats.gated}</div>
              <div className="font-technical text-[9px] text-primary/70 uppercase tracking-wider mt-1">Gated</div>
            </div>
            <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-3 text-center hover:bg-secondary/15 transition-colors">
              <div className="text-xl font-black text-secondary">{stats.nonGated}</div>
              <div className="font-technical text-[9px] text-secondary/70 uppercase tracking-wider mt-1">Open</div>
            </div>
          </div>
        </div>

        {/* Highest Rent */}
        {stats.maxRent > 0 && (
          <div className="space-y-3">
            <div className="font-technical text-[10px] text-primary uppercase tracking-widest font-black">Highest Rent</div>
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center hover:bg-primary/15 transition-colors">
              <div className="text-2xl font-black text-primary tracking-tighter">₹{(stats.maxRent / 1000).toFixed(0)}k</div>
              <div className="font-technical text-[9px] text-primary/70 uppercase tracking-wider mt-1">Top Listing</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
