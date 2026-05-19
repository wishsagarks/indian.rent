'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, ChevronRight } from 'lucide-react';

interface SeekerPinFormProps {
  lat: number;
  lng: number;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function SeekerPinForm({ lat, lng, onClose, onSubmit }: SeekerPinFormProps) {
  const [formData, setFormData] = useState({
    bhkPreference: 'any',
    budget: '',
    moveInTimeline: 'flexible',
    foodPreference: 'any',
    smokingPreference: 'any',
    genderPreference: 'any',
    email: '',
  });

  const update = (fields: Partial<typeof formData>) => setFormData(prev => ({ ...prev, ...fields }));

  const handleSubmit = () => {
    onSubmit({ ...formData, latitude: lat, longitude: lng });
  };

  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="relative w-full md:w-[420px] h-full bg-surface border-r border-white/10 shadow-3xl pointer-events-auto overflow-hidden flex flex-col"
    >
      <div className="p-6 border-b border-white/5 bg-surface-container-low flex justify-between items-center">
        <div>
          <div className="font-technical text-[9px] uppercase tracking-[0.4em] text-emerald-400 font-black mb-1">Flat Hunt Mode</div>
          <div className="font-display font-black text-xl text-on-surface tracking-tighter uppercase leading-none">Drop Seeker Pin</div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-on-surface-variant"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* BHK */}
        <div className="space-y-3 text-left">
          <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">BHK Preference</label>
          <div className="grid grid-cols-4 gap-2">
            {['any', '1', '2', '3'].map(b => (
              <button key={b} onClick={() => update({ bhkPreference: b })} className={`py-3 rounded-lg font-black text-xs border transition-all ${formData.bhkPreference === b ? 'bg-emerald-400 text-background border-emerald-400' : 'bg-white/5 border-white/5 hover:bg-emerald-400/5'}`}>{b === 'any' ? 'Any' : `${b} BHK`}</button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-3 text-left">
          <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">Budget (per month) <span className="text-[8px] opacity-60">Optional</span></label>
          <input type="number" placeholder="₹ Max budget (optional)" value={formData.budget} onChange={e => update({ budget: e.target.value })} className="w-full bg-surface-container-low border border-white/5 rounded-lg p-4 text-on-surface text-lg font-black placeholder:text-on-surface-variant/30 focus:border-emerald-400 outline-none" />
        </div>

        {/* Move-in Timeline */}
        <div className="space-y-3 text-left">
          <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">Move-in Timeline</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: 'asap', label: 'ASAP' }, { id: 'next_month', label: 'Next Month' }, { id: 'flexible', label: 'Flexible' }].map(t => (
              <button key={t.id} onClick={() => update({ moveInTimeline: t.id })} className={`py-3 rounded-lg font-black text-[10px] uppercase tracking-wider border transition-all ${formData.moveInTimeline === t.id ? 'bg-emerald-400 text-background border-emerald-400' : 'bg-white/5 border-white/5 hover:bg-emerald-400/5'}`}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Food Preference */}
        <div className="space-y-3 text-left">
          <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">Food Preference</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: 'veg', label: 'Veg' }, { id: 'non-veg', label: 'Non-Veg' }, { id: 'any', label: 'Any' }].map(f => (
              <button key={f.id} onClick={() => update({ foodPreference: f.id })} className={`py-3 rounded-lg font-black text-[10px] uppercase tracking-wider border transition-all ${formData.foodPreference === f.id ? 'bg-emerald-400 text-background border-emerald-400' : 'bg-white/5 border-white/5 hover:bg-emerald-400/5'}`}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Smoking */}
        <div className="space-y-3 text-left">
          <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">Smoking</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: 'smoker', label: 'Smoker' }, { id: 'non-smoker', label: 'Non-Smoker' }, { id: 'any', label: 'Any' }].map(s => (
              <button key={s.id} onClick={() => update({ smokingPreference: s.id })} className={`py-3 rounded-lg font-black text-[10px] uppercase tracking-wider border transition-all ${formData.smokingPreference === s.id ? 'bg-emerald-400 text-background border-emerald-400' : 'bg-white/5 border-white/5 hover:bg-emerald-400/5'}`}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-3 text-left">
          <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">Gender Preference</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: 'male', label: 'Male' }, { id: 'female', label: 'Female' }, { id: 'any', label: 'Any' }].map(g => (
              <button key={g.id} onClick={() => update({ genderPreference: g.id })} className={`py-3 rounded-lg font-black text-[10px] uppercase tracking-wider border transition-all ${formData.genderPreference === g.id ? 'bg-emerald-400 text-background border-emerald-400' : 'bg-white/5 border-white/5 hover:bg-emerald-400/5'}`}>{g.label}</button>
            ))}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-3 text-left">
          <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black">Email (Private)</label>
          <input type="email" placeholder="your@email.com" value={formData.email} onChange={e => update({ email: e.target.value })} className="w-full bg-surface-container-low border border-white/5 rounded-lg p-4 text-on-surface font-bold placeholder:text-on-surface-variant/30 focus:border-emerald-400 outline-none" />
          <p className="text-[9px] text-on-surface-variant/50 ml-2">Only used to match you with flatmates. Never shown publicly.</p>
        </div>
      </div>

      <div className="p-6 border-t border-white/5 bg-surface-container-low/50 space-y-3">
        <button onClick={handleSubmit} className="w-full py-4 bg-emerald-400 text-background rounded-lg font-black uppercase tracking-[0.3em] text-[10px] shadow-lg hover:bg-emerald-300 active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/10">
          <Search size={16} strokeWidth={3} /> Drop Seeker Pin <ChevronRight size={14} />
        </button>
        <p className="text-[8px] text-on-surface-variant/60 text-center">Drop a pin on the map, then fill this form. Landlords will see demand patterns.</p>
      </div>
    </motion.div>
  );
}
