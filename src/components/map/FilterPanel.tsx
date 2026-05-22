'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, SlidersHorizontal, Info } from 'lucide-react';

export interface MapFilters {
  bhk: string;
  rentMin: string;
  rentMax: string;
  furnishing: string;
  category: string;
  flatmateNeeded: boolean;
  tenantPreference: 'any' | 'bachelors' | 'family';
  petsAllowed: boolean;
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
  tenantPreference: 'any',
  petsAllowed: false,
  postedWithin: 'all',
};

const InfoTooltip = ({ text }: { text: string }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div className="relative inline-block">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="p-0.5 text-on-surface-variant/60 hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
      >
        <Info size={14} />
      </motion.div>
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-surface border border-outline/30 rounded-lg p-2.5 text-[10px] leading-normal text-on-surface z-50 shadow-2xl"
        >
          {text}
        </motion.div>
      )}
    </div>
  );
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
      className="fixed lg:absolute left-2 lg:left-4 right-2 lg:right-auto top-20 lg:top-24 w-auto lg:w-[320px] max-h-[70vh] lg:max-h-none bg-black/85 backdrop-blur-xl border border-primary/30 rounded-lg shadow-2xl z-40 overflow-y-auto"
    >
      <div className="p-3 sm:p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <SlidersHorizontal size={16} className="text-primary" />
          <span className="font-technical text-[9px] sm:text-[10px] text-primary font-black uppercase tracking-[0.2em]">Filters</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-white/70 hover:text-primary transition-colors">Reset</button>
          )}
          <button onClick={onClose} className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"><X size={16} /></button>
        </div>
      </div>

      <div className="p-3 sm:p-5 space-y-6 custom-scrollbar [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb:hover]:bg-white/30">
        {/* BHK */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="font-technical text-[9px] uppercase tracking-widest text-white/80 font-black">BHK</label>
            <InfoTooltip text="Number of bedrooms. 1BHK = 1 Bedroom+Kitchen, 2BHK = 2 Bedrooms+Kitchen, etc." />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {['any', '1', '2', '3', '4+'].map(b => (
              <button key={b} onClick={() => update('bhk', b)} className={`py-2.5 rounded-md font-black text-[10px] uppercase border transition-all ${filters.bhk === b ? 'bg-gradient-to-r from-primary to-blue-500 text-background border-primary shadow-[0_0_12px_rgba(0,102,255,0.6)]' : 'bg-gradient-to-r from-primary/20 to-blue-600/10 border-primary/30 hover:bg-gradient-to-r hover:from-primary/35 hover:to-blue-600/20 hover:border-primary/50'}`}>{b === 'any' ? 'All' : b}</button>
            ))}
          </div>
        </div>

        {/* Rent Range */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="font-technical text-[9px] uppercase tracking-widest text-white/80 font-black">Rent Range</label>
            <InfoTooltip text="Monthly rent in rupees. Leave empty for no limit. Shows listings within your budget range." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Min ₹" value={filters.rentMin} onChange={e => update('rentMin', e.target.value)} className="bg-gradient-to-r from-primary/25 to-blue-600/15 border border-primary/40 rounded-md p-2.5 text-white text-xs font-bold focus:border-primary/80 focus:shadow-[0_0_8px_rgba(0,102,255,0.3)] outline-none placeholder:text-white/40" />
            <input type="number" placeholder="Max ₹" value={filters.rentMax} onChange={e => update('rentMax', e.target.value)} className="bg-gradient-to-r from-primary/25 to-blue-600/15 border border-primary/40 rounded-md p-2.5 text-white text-xs font-bold focus:border-primary/80 focus:shadow-[0_0_8px_rgba(0,102,255,0.3)] outline-none placeholder:text-white/40" />
          </div>
        </div>

        {/* Furnishing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="font-technical text-[9px] uppercase tracking-widest text-white/80 font-black">Furnishing</label>
            <InfoTooltip text="Furnished = all furniture. Semi = some furniture. Unfurnished = bare space." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[{ id: 'any', label: 'All' }, { id: 'furnished', label: 'Furnished' }, { id: 'semi-furnished', label: 'Semi' }, { id: 'unfurnished', label: 'Unfurnished' }].map(f => (
              <button key={f.id} onClick={() => update('furnishing', f.id)} className={`py-2.5 rounded-md font-black text-[9px] uppercase tracking-wider border transition-all ${filters.furnishing === f.id ? 'bg-gradient-to-r from-primary to-blue-500 text-background border-primary shadow-[0_0_12px_rgba(0,102,255,0.6)]' : 'bg-gradient-to-r from-primary/20 to-blue-600/10 border-primary/30 hover:bg-gradient-to-r hover:from-primary/35 hover:to-blue-600/20 hover:border-primary/50'}`}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Society Type */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="font-technical text-[9px] uppercase tracking-widest text-white/80 font-black">Society Type</label>
            <InfoTooltip text="Gated = secure community. Non-Gated = open access. PG/Hostel = shared living." />
          </div>
          <div className="flex flex-wrap gap-2">
            {[{ id: 'any', label: 'All' }, { id: 'gated', label: 'Gated' }, { id: 'standalone', label: 'Non-Gated' }, { id: 'pg', label: 'PG' }, { id: 'hostel', label: 'Hostel' }].map(c => (
              <button key={c.id} onClick={() => update('category', c.id)} className={`flex-1 min-w-[60px] py-2.5 rounded-md font-black text-[9px] uppercase tracking-wider border transition-all ${filters.category === c.id ? 'bg-gradient-to-r from-primary to-blue-500 text-background border-primary shadow-[0_0_12px_rgba(0,102,255,0.6)]' : 'bg-gradient-to-r from-primary/20 to-blue-600/10 border-primary/30 hover:bg-gradient-to-r hover:from-primary/35 hover:to-blue-600/20 hover:border-primary/50'}`}>{c.label}</button>
            ))}
          </div>
        </div>

        {/* Tenant Preference */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="font-technical text-[9px] uppercase tracking-widest text-white/80 font-black">Tenant Type</label>
            <InfoTooltip text="Filter by tenant type. Bachelors = professionals. Family = groups with dependents." />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: 'any', label: '🏠 Any' }, { id: 'bachelors', label: '🎓 Bachelors' }, { id: 'family', label: '👨‍👩‍👧 Family' }].map(t => (
              <button key={t.id} onClick={() => update('tenantPreference', t.id as any)} className={`py-2.5 rounded-md font-black text-[9px] uppercase tracking-wider border transition-all ${filters.tenantPreference === t.id ? 'bg-gradient-to-r from-primary to-blue-500 text-background border-primary shadow-[0_0_12px_rgba(0,102,255,0.6)]' : 'bg-gradient-to-r from-primary/20 to-blue-600/10 border-primary/30 hover:bg-gradient-to-r hover:from-primary/35 hover:to-blue-600/20 hover:border-primary/50'}`}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Flatmate Toggle */}
        <button onClick={() => update('flatmateNeeded', !filters.flatmateNeeded)} className={`w-full flex items-center justify-between p-3.5 rounded-lg border transition-all ${filters.flatmateNeeded ? 'border-secondary/60 bg-gradient-to-r from-secondary/40 to-emerald-500/30 shadow-[0_0_12px_rgba(47,248,1,0.3)]' : 'border-primary/30 bg-gradient-to-r from-primary/20 to-blue-600/10'}`}>
          <div className="flex items-center gap-2">
            <span className="font-black text-[10px] uppercase tracking-wider">Flatmate Wanted Only</span>
            <InfoTooltip text="Show only properties where owner is looking for a roommate." />
          </div>
          <div className={`w-9 h-4.5 rounded-full transition-all relative ${filters.flatmateNeeded ? 'bg-gradient-to-r from-secondary to-emerald-400 shadow-[0_0_8px_rgba(47,248,1,0.6)]' : 'bg-gradient-to-r from-primary/60 to-blue-500/40'}`}>
            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all ${filters.flatmateNeeded ? 'left-[18px]' : 'left-[2px]'}`} />
          </div>
        </button>

        {/* Pets Allowed Toggle */}
        <button onClick={() => update('petsAllowed', !filters.petsAllowed)} className={`w-full flex items-center justify-between p-3.5 rounded-lg border transition-all ${filters.petsAllowed ? 'border-secondary/60 bg-gradient-to-r from-secondary/40 to-emerald-500/30 shadow-[0_0_12px_rgba(47,248,1,0.3)]' : 'border-primary/30 bg-gradient-to-r from-primary/20 to-blue-600/10'}`}>
          <div className="flex items-center gap-2">
            <span className="font-black text-[10px] uppercase tracking-wider">🐕 Pets Allowed</span>
            <InfoTooltip text="Show only pet-friendly properties where dogs/cats are welcome." />
          </div>
          <div className={`w-9 h-4.5 rounded-full transition-all relative ${filters.petsAllowed ? 'bg-gradient-to-r from-secondary to-emerald-400 shadow-[0_0_8px_rgba(47,248,1,0.6)]' : 'bg-gradient-to-r from-primary/60 to-blue-500/40'}`}>
            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all ${filters.petsAllowed ? 'left-[18px]' : 'left-[2px]'}`} />
          </div>
        </button>

        {/* Posted Within */}
        <div className="space-y-3">
          <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">Posted Within</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: 'all', label: 'All' }, { id: '7', label: '7 Days' }, { id: '30', label: '30 Days' }, { id: '90', label: '90 Days' }, { id: '180', label: '6 Mo' }].map(t => (
              <button key={t.id} onClick={() => update('postedWithin', t.id)} className={`py-2.5 rounded-md font-black text-[9px] uppercase tracking-wider border transition-all ${filters.postedWithin === t.id ? 'bg-gradient-to-r from-primary to-blue-500 text-background border-primary shadow-[0_0_12px_rgba(0,102,255,0.6)]' : 'bg-gradient-to-r from-primary/20 to-blue-600/10 border-primary/30 hover:bg-gradient-to-r hover:from-primary/35 hover:to-blue-600/20 hover:border-primary/50'}`}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
