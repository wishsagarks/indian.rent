'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, SlidersHorizontal } from 'lucide-react';

export interface MapFilters {
  bhk: string;
  rentMin: string;
  rentMax: string;
  furnishing: string;
  category: string;
  flatmateNeeded: boolean;
  postedWithin: string;
}

interface FilterPanelProps {
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
  onClose: () => void;
}

export const DEFAULT_FILTERS: MapFilters = {
  bhk: 'any',
  rentMin: '',
  rentMax: '',
  furnishing: 'any',
  category: 'any',
  flatmateNeeded: false,
  postedWithin: 'all',
};

export default function FilterPanel({ filters, onChange, onClose }: FilterPanelProps) {
  const update = (key: keyof MapFilters, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const resetFilters = () => onChange(DEFAULT_FILTERS);

  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute left-4 top-24 w-[320px] bg-surface/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-40 overflow-hidden"
    >
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SlidersHorizontal size={16} className="text-primary" />
          <span className="font-technical text-[10px] text-primary font-black uppercase tracking-[0.2em]">Filters</span>
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors">Reset</button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-on-surface-variant transition-colors"><X size={16} /></button>
        </div>
      </div>

      <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {/* BHK */}
        <div className="space-y-3">
          <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">BHK</label>
          <div className="grid grid-cols-5 gap-2">
            {['any', '1', '2', '3', '4+'].map(b => (
              <button key={b} onClick={() => update('bhk', b)} className={`py-2.5 rounded-md font-black text-[10px] uppercase border transition-all ${filters.bhk === b ? 'bg-primary text-background border-primary' : 'bg-white/5 border-white/5 hover:bg-primary/5'}`}>{b === 'any' ? 'All' : b}</button>
            ))}
          </div>
        </div>

        {/* Rent Range */}
        <div className="space-y-3">
          <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">Rent Range</label>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Min ₹" value={filters.rentMin} onChange={e => update('rentMin', e.target.value)} className="bg-white/5 border border-white/5 rounded-md p-2.5 text-on-surface text-xs font-bold focus:border-primary outline-none placeholder:text-on-surface-variant/30" />
            <input type="number" placeholder="Max ₹" value={filters.rentMax} onChange={e => update('rentMax', e.target.value)} className="bg-white/5 border border-white/5 rounded-md p-2.5 text-on-surface text-xs font-bold focus:border-primary outline-none placeholder:text-on-surface-variant/30" />
          </div>
        </div>

        {/* Furnishing */}
        <div className="space-y-3">
          <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">Furnishing</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ id: 'any', label: 'All' }, { id: 'furnished', label: 'Furnished' }, { id: 'semi-furnished', label: 'Semi' }, { id: 'unfurnished', label: 'Unfurnished' }].map(f => (
              <button key={f.id} onClick={() => update('furnishing', f.id)} className={`py-2.5 rounded-md font-black text-[9px] uppercase tracking-wider border transition-all ${filters.furnishing === f.id ? 'bg-primary text-background border-primary' : 'bg-white/5 border-white/5 hover:bg-primary/5'}`}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Society Type */}
        <div className="space-y-3">
          <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">Society Type</label>
          <div className="flex flex-wrap gap-2">
            {[{ id: 'any', label: 'All' }, { id: 'gated', label: 'Gated' }, { id: 'standalone', label: 'Non-Gated' }, { id: 'pg', label: 'PG' }, { id: 'hostel', label: 'Hostel' }].map(c => (
              <button key={c.id} onClick={() => update('category', c.id)} className={`flex-1 min-w-[60px] py-2.5 rounded-md font-black text-[9px] uppercase tracking-wider border transition-all ${filters.category === c.id ? 'bg-primary text-background border-primary' : 'bg-white/5 border-white/5 hover:bg-primary/5'}`}>{c.label}</button>
            ))}
          </div>
        </div>

        {/* Flatmate Toggle */}
        <button onClick={() => update('flatmateNeeded', !filters.flatmateNeeded)} className={`w-full flex items-center justify-between p-3.5 rounded-lg border transition-all ${filters.flatmateNeeded ? 'border-emerald-400 bg-emerald-400/5' : 'border-white/5 bg-white/5'}`}>
          <span className="font-black text-[10px] uppercase tracking-wider">Flatmate Wanted Only</span>
          <div className={`w-9 h-4.5 rounded-full transition-all relative ${filters.flatmateNeeded ? 'bg-emerald-400' : 'bg-white/20'}`}>
            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all ${filters.flatmateNeeded ? 'left-[18px]' : 'left-[2px]'}`} />
          </div>
        </button>

        {/* Posted Within */}
        <div className="space-y-3">
          <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">Posted Within</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: 'all', label: 'All' }, { id: '7', label: '7 Days' }, { id: '30', label: '30 Days' }, { id: '90', label: '90 Days' }, { id: '180', label: '6 Mo' }].map(t => (
              <button key={t.id} onClick={() => update('postedWithin', t.id)} className={`py-2.5 rounded-md font-black text-[9px] uppercase tracking-wider border transition-all ${filters.postedWithin === t.id ? 'bg-primary text-background border-primary' : 'bg-white/5 border-white/5 hover:bg-primary/5'}`}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
