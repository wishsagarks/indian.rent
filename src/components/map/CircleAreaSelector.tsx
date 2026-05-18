'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, BarChart3, Plus, Minus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface CircleAreaSelectorProps {
  center: { lat: number; lng: number };
  onClose: () => void;
}

export default function CircleAreaSelector({ center, onClose }: CircleAreaSelectorProps) {
  const [radius, setRadius] = useState(1); // kilometers
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (radius > 0) {
      fetchStats();
    }
  }, [radius]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Convert radius from km to degrees (roughly 1 degree ≈ 111 km at equator)
      const radiusDegrees = radius / 111;

      const { data, error } = await supabase.rpc('get_area_stats', {
        min_lat: center.lat - radiusDegrees,
        min_lng: center.lng - radiusDegrees,
        max_lat: center.lat + radiusDegrees,
        max_lng: center.lng + radiusDegrees,
      });

      if (!error && data && data.length > 0) {
        setStats(data[0]);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error('Failed to fetch area stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const avgRent = stats?.avg_rent ? Math.round(stats.avg_rent) : 0;
  const totalFlats = stats?.total_flats || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed left-2 right-2 top-20 lg:left-4 lg:right-auto lg:top-1/2 w-auto lg:w-80 lg:-translate-y-1/2 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-50"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" />
          <span className="font-technical text-xs text-primary font-black uppercase">Area Stats</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/5"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Radius Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-technical text-on-surface-variant uppercase">
              Radius: {radius} km
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setRadius(Math.max(0.5, radius - 0.5))}
              className="flex-1 py-2 px-3 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition"
            >
              <Minus size={14} className="mx-auto" />
            </button>
            <div className="flex-1 flex items-center justify-center">
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={radius}
                onChange={(e) => setRadius(parseFloat(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>
            <button
              onClick={() => setRadius(Math.min(5, radius + 0.5))}
              className="flex-1 py-2 px-3 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition"
            >
              <Plus size={14} className="mx-auto" />
            </button>
          </div>
        </div>

        {/* Stats Display */}
        {loading ? (
          <div className="py-6 text-center text-xs text-on-surface-variant animate-pulse">
            Calculating stats...
          </div>
        ) : totalFlats === 0 ? (
          <div className="py-6 text-center text-xs text-on-surface-variant">
            No listings in this radius
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
              <div className="text-xl font-black text-primary">{totalFlats}</div>
              <div className="text-[10px] text-on-surface-variant uppercase font-technical mt-1">
                Listings
              </div>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
              <div className="text-xl font-black text-primary">₹{(avgRent / 1000).toFixed(0)}k</div>
              <div className="text-[10px] text-on-surface-variant uppercase font-technical mt-1">
                Avg Rent
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-[10px] text-on-surface-variant bg-white/5 rounded p-2 text-center border border-white/5">
          Adjust radius to see market insights for different areas
        </div>
      </div>
    </motion.div>
  );
}
