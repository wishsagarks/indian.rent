'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChartBar as BarChart3 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface AreaStatsModalProps {
  bounds: { minLat: number; minLng: number; maxLat: number; maxLng: number };
  onClose: () => void;
}

interface AreaStats {
  total_flats: number;
  avg_rent: number;
  avg_rent_1bhk: number | null;
  avg_rent_2bhk: number | null;
  avg_rent_3bhk: number | null;
  gated_count: number;
  non_gated_count: number;
  total_flats_gated: number;
  total_flats_non_gated: number;
  avg_rent_1bhk_gated: number | null;
  avg_rent_2bhk_gated: number | null;
  avg_rent_3bhk_gated: number | null;
  avg_rent_1bhk_non_gated: number | null;
  avg_rent_2bhk_non_gated: number | null;
  avg_rent_3bhk_non_gated: number | null;
}

export default function AreaStatsModal({ bounds, onClose }: AreaStatsModalProps) {
  const [stats, setStats] = useState<AreaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'gated' | 'non-gated'>('all');

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_area_stats', {
        min_lat: bounds.minLat,
        min_lng: bounds.minLng,
        max_lat: bounds.maxLat,
        max_lng: bounds.maxLng,
      });
      if (!error && data && data.length > 0) {
        setStats(data[0]);
      }
      setLoading(false);
    }
    fetchStats();
  }, [bounds]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed lg:absolute left-2 lg:left-1/2 right-2 lg:right-auto top-20 lg:top-1/2 bottom-auto lg:bottom-auto w-auto lg:w-[380px] lg:-translate-x-1/2 lg:-translate-y-1/2 max-h-[75vh] lg:max-h-none bg-background backdrop-blur-xl border border-primary/20 rounded-xl shadow-2xl z-[80] lg:z-50 overflow-hidden"
    >
      <div className="p-3 sm:p-5 border-b border-primary/10 sticky top-0 bg-background/80 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <BarChart3 size={16} className="text-primary" />
          <span className="font-technical text-[9px] sm:text-[10px] text-primary font-black uppercase tracking-[0.2em]">Area Stats</span>
        </div>
        <button onClick={onClose} className="p-1 sm:p-1.5 rounded-lg hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-all"><X size={16} /></button>
      </div>

      <div className="p-3 sm:p-5 overflow-y-auto max-h-[calc(75vh-50px)]">
        {loading ? (
          <div className="py-8 sm:py-12 text-center">
            <div className="font-technical text-[8px] sm:text-[10px] text-on-surface-variant uppercase tracking-widest animate-pulse">Analysing pins in selection...</div>
          </div>
        ) : !stats || stats.total_flats === 0 ? (
          <div className="py-8 sm:py-12 text-center">
            <div className="font-technical text-[8px] sm:text-[10px] text-on-surface-variant uppercase tracking-widest">No listings in this area</div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-5">
            {/* Filter toggle */}
            <div className="grid grid-cols-3 gap-2">
              {([['all', 'All'], ['gated', 'Gated'], ['non-gated', 'Non-Gated']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setFilter(id)} className={`py-1.5 sm:py-2 rounded-md font-black text-[8px] sm:text-[9px] uppercase tracking-wider border transition-all ${filter === id ? 'bg-primary text-background border-primary' : 'bg-white/5 border-white/5'}`}>{label}</button>
              ))}
            </div>

            {/* Total Count */}
            <div className="bg-white/5 border border-white/5 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-black text-on-surface tracking-tighter">
                {filter === 'gated' ? stats.total_flats_gated : filter === 'non-gated' ? stats.total_flats_non_gated : stats.total_flats}
              </div>
              <div className="font-technical text-[8px] sm:text-[9px] text-on-surface-variant uppercase tracking-widest mt-1">
                Total Flats {filter === 'gated' ? '(Gated)' : filter === 'non-gated' ? '(Non-Gated)' : ''}
              </div>
            </div>

            {/* Avg Rent by BHK */}
            <div className="space-y-2">
              <div className="font-technical text-[8px] sm:text-[9px] text-on-surface-variant uppercase tracking-widest">Average Rent by BHK</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: '1 BHK',
                    value: filter === 'gated' ? stats.avg_rent_1bhk_gated : filter === 'non-gated' ? stats.avg_rent_1bhk_non_gated : stats.avg_rent_1bhk,
                  },
                  {
                    label: '2 BHK',
                    value: filter === 'gated' ? stats.avg_rent_2bhk_gated : filter === 'non-gated' ? stats.avg_rent_2bhk_non_gated : stats.avg_rent_2bhk,
                  },
                  {
                    label: '3 BHK',
                    value: filter === 'gated' ? stats.avg_rent_3bhk_gated : filter === 'non-gated' ? stats.avg_rent_3bhk_non_gated : stats.avg_rent_3bhk,
                  },
                ].map(item => (
                  <div key={item.label} className="bg-white/5 border border-white/5 rounded-lg p-2 sm:p-3 text-center">
                    <div className="text-base sm:text-lg font-black text-primary tracking-tighter">{item.value ? `₹${(item.value / 1000).toFixed(0)}k` : '—'}</div>
                    <div className="font-technical text-[7px] sm:text-[8px] text-on-surface-variant uppercase tracking-wider mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gated vs Non-Gated */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 border border-white/5 rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-black text-blue-400">{stats.gated_count}</div>
                <div className="font-technical text-[7px] sm:text-[8px] text-on-surface-variant uppercase tracking-wider mt-1">Gated</div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-black text-orange-400">{stats.non_gated_count}</div>
                <div className="font-technical text-[7px] sm:text-[8px] text-on-surface-variant uppercase tracking-wider mt-1">Non-Gated</div>
              </div>
            </div>

            {/* Overall Average */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4 text-center">
              <div className="font-technical text-[8px] sm:text-[9px] text-primary uppercase tracking-widest mb-1">Area Average Rent</div>
              <div className="text-xl sm:text-2xl font-black text-primary tracking-tighter">₹{stats.avg_rent?.toLocaleString() || '—'}</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
