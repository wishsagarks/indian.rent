'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, Building2, Home, Hotel, ChevronRight, ChevronLeft, Check, Layers, Hash, Link as LinkIcon, Landmark, RefreshCcw, Sofa, Ruler, Calendar, Users } from 'lucide-react';
import { findNearbyBuildings } from '@/app/actions/map-actions';

interface AddPropertyFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  lat: number;
  lng: number;
  initialData?: {
    buildingName?: string;
    address?: string;
    existingBuildingId?: string | null;
    category?: string;
  } | null;
}

export default function AddPropertyForm({ onClose, onSubmit, lat, lng, initialData }: AddPropertyFormProps) {
  const [step, setStep] = useState(1);
  const [nearbyBuildings, setNearbyBuildings] = useState<any[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  const [formData, setFormData] = useState({
    category: initialData?.category || '',
    floor: '',
    flatNumber: '',
    status: 'vacant',
    rent: '',
    noBrokerLink: '',
    flatmatesLink: '',
    contributorName: '',
    contributorUpi: '',
    existingBuildingId: initialData?.existingBuildingId || null as string | null,
    buildingName: initialData?.buildingName || '',
    address: initialData?.address || '',
    bhk: '' as string,
    furnishing: '' as string,
    sizeSqft: '',
    maintenanceIncluded: '' as string,
    availabilityDate: '',
    flatmateNeeded: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        buildingName: initialData.buildingName || prev.buildingName,
        address: initialData.address || prev.address,
        existingBuildingId: initialData.existingBuildingId !== undefined ? initialData.existingBuildingId : prev.existingBuildingId,
        category: initialData.category || prev.category
      }));
      if (initialData.existingBuildingId) {
        setStep(2); // Jump to vertical identification if building is selected
      }
    }
  }, [initialData]);

  useEffect(() => {
    async function loadNearby() {
      if (step === 1) {
        setLoadingNearby(true);
        const buildings = await findNearbyBuildings(lat, lng);
        setNearbyBuildings(buildings);
        setLoadingNearby(false);
      }
    }
    loadNearby();
  }, [lat, lng, step]);

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const updateData = (fields: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const steps = [
    { title: 'Coordinate Resolution', subtitle: 'Identify Building Node' },
    { title: 'Level Mapping', subtitle: 'Vertical identification' },
    { title: 'Flat Details', subtitle: 'Size, BHK & furnishing' },
    { title: 'Final Intel', subtitle: 'Rent, links & reward ID' },
  ];

  return (
    <div className="flex flex-col h-full bg-surface text-on-surface font-sans antialiased">
      <div className="p-8 border-b border-white/5 flex justify-between items-center bg-surface-container-low">
        <div>
          <div className="font-technical text-[9px] uppercase tracking-[0.4em] text-primary font-black mb-1">
            Node Deployment // 0{step}
          </div>
          <h2 className="text-2xl font-black text-on-surface uppercase tracking-tighter leading-none font-display text-left">
            {steps[step - 1].title}
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              {formData.buildingName && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shadow-lg"><Check size={16} className="text-on-primary" strokeWidth={3} /></div>
                    <div>
                      <div className="text-[10px] font-black text-primary uppercase tracking-widest">Node Identified</div>
                      <div className="text-xs font-bold text-on-surface uppercase truncate max-w-[200px]">{formData.buildingName}</div>
                    </div>
                  </div>
                  <button onClick={() => { updateData({ buildingName: '', address: '', existingBuildingId: null }); }} className="text-[8px] uppercase tracking-widest text-on-surface-variant hover:text-white font-black">Reset</button>
                </motion.div>
              )}

              <div className="space-y-4">
                <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black ml-2">Nearby Grid Nodes</label>
                {loadingNearby ? (
                  <div className="h-20 flex items-center justify-center skeuo-concave rounded-lg border border-white/5 animate-pulse">
                    <RefreshCcw className="animate-spin text-primary opacity-20" size={24} />
                  </div>
                ) : nearbyBuildings.length > 0 ? (
                  <div className="space-y-2">
                    {nearbyBuildings.map(b => (
                      <button
                        key={b.id}
                        onClick={() => { updateData({ existingBuildingId: b.id, category: b.category, buildingName: b.name }); setStep(2); }}
                        className="w-full flex items-center justify-between p-5 glass-plate border-white/10 rounded-lg hover:border-primary transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <Landmark size={18} className="text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                          <span className="font-black uppercase tracking-widest text-[10px]">{b.name}</span>
                        </div>
                        <ChevronRight size={14} className="opacity-20" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 skeuo-concave rounded-lg text-center opacity-30">
                    <span className="font-technical text-[9px] uppercase tracking-widest italic">No existing nodes in this sector</span>
                  </div>
                )}
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <div className="relative flex justify-center text-[8px] uppercase tracking-[0.5em] font-black"><span className="bg-surface px-4 text-on-surface-variant opacity-40 italic text-left">Establish New Node</span></div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'gated', label: 'Gated Protocol', icon: Shield, desc: 'High security community' },
                  { id: 'semi-gated', label: 'Semi-Gated', icon: ShieldAlert, desc: 'Partial access control' },
                  { id: 'standalone', label: 'Standalone Node', icon: Building2, desc: 'Independent infrastructure' },
                  { id: 'pg', label: 'PG / Paying Guest', icon: Home, desc: 'Shared accommodation' },
                  { id: 'hostel', label: 'Hostel', icon: Hotel, desc: 'Dormitory or hostel' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { updateData({ category: cat.id, existingBuildingId: null }); }}
                    className={`flex items-center gap-6 p-5 rounded-lg transition-all text-left border ${
                      formData.category === cat.id && !formData.existingBuildingId ? 'border-primary bg-primary/5 shadow-lg' : 'border-white/5 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`p-3.5 rounded-lg ${formData.category === cat.id ? 'bg-primary text-background shadow-lg' : 'bg-surface-container text-on-surface-variant'}`}>
                      <cat.icon size={22} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-black uppercase tracking-widest text-xs ${formData.category === cat.id ? 'text-primary' : 'text-on-surface'}`}>{cat.label}</div>
                    </div>
                  </button>
                ))}
              </div>

              {formData.category && !formData.existingBuildingId && (
                <div className="space-y-4 mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black">Building Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Banjara Heights, Jubilee Towers"
                    value={formData.buildingName}
                    onChange={(e) => updateData({ buildingName: e.target.value })}
                    className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary outline-none focus:bg-surface-container-high transition-all text-sm font-medium"
                  />
                  <button
                    onClick={() => { if (formData.buildingName.trim()) setStep(2); }}
                    disabled={!formData.buildingName.trim()}
                    className="w-full py-3 bg-primary text-on-primary rounded-lg font-black uppercase tracking-[0.2em] text-[10px] disabled:opacity-40 transition-all"
                  >
                    Continue →
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
              {formData.buildingName && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3">
                  <Landmark size={16} className="text-primary" />
                  <span className="font-technical text-[10px] font-black uppercase text-primary tracking-widest">Locked to: {formData.buildingName}</span>
                </div>
              )}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <Layers size={16} className="text-primary" />
                  <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-on-surface font-black">Floor</label>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {['G', '1', '2', '3', '4', '5', '6', '7+'].map((f) => (
                    <button key={f} onClick={() => updateData({ floor: f })} className={`py-4 rounded-lg font-black transition-all border text-sm ${formData.floor === f ? 'bg-primary text-background border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-white/5 border-white/5 text-on-surface hover:bg-primary/5'}`}>{f}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <Hash size={16} className="text-primary" />
                  <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-on-surface font-black">Flat / Unit Identifier</label>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 101, A-3, Ground Floor, Shop 2..."
                  value={formData.flatNumber}
                  onChange={e => updateData({ flatNumber: e.target.value })}
                  className="w-full bg-surface-container-low border border-white/5 rounded-lg p-4 text-on-surface placeholder:text-on-surface-variant/30 font-bold focus:border-primary outline-none transition-colors"
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              {/* BHK */}
              <div className="space-y-4 text-left">
                <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black ml-2">BHK</label>
                <div className="grid grid-cols-5 gap-2">
                  {['1', '2', '3', '4', '5+'].map(b => (
                    <button key={b} onClick={() => updateData({ bhk: b })} className={`py-3.5 rounded-lg font-black text-sm border transition-all ${formData.bhk === b ? 'bg-primary text-background border-primary shadow-lg' : 'bg-white/5 border-white/5 hover:bg-primary/5'}`}>{b}</button>
                  ))}
                </div>
              </div>

              {/* Furnishing */}
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 ml-2">
                  <Sofa size={14} className="text-primary" />
                  <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black">Furnishing</label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: 'furnished', label: 'Furnished' }, { id: 'semi-furnished', label: 'Semi' }, { id: 'unfurnished', label: 'Unfurnished' }].map(f => (
                    <button key={f.id} onClick={() => updateData({ furnishing: f.id })} className={`py-3.5 rounded-lg font-black text-[10px] uppercase tracking-wider border transition-all ${formData.furnishing === f.id ? 'bg-primary text-background border-primary shadow-lg' : 'bg-white/5 border-white/5 hover:bg-primary/5'}`}>{f.label}</button>
                  ))}
                </div>
              </div>

              {/* Size - OPTIONAL */}
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 ml-2">
                  <Ruler size={14} className="text-primary opacity-60" />
                  <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-black">Size (sq.ft) <span className="text-primary/40 text-[9px]">Optional</span></label>
                </div>
                <input type="number" placeholder="e.g. 1200" value={formData.sizeSqft} onChange={e => updateData({ sizeSqft: e.target.value })} className="w-full bg-surface-container-low border border-white/5 rounded-lg p-4 text-on-surface placeholder:text-on-surface-variant/30 font-bold focus:border-primary outline-none transition-colors" />
              </div>

              {/* Availability Date - OPTIONAL with checkbox */}
              <div className="space-y-4 text-left">
                <button
                  onClick={() => {
                    if (formData.availabilityDate) {
                      updateData({ availabilityDate: '' });
                    }
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border transition-all bg-surface-container-low/50 hover:border-primary/40 border-white/5"
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border-2 ${formData.availabilityDate ? 'bg-primary border-primary' : 'border-white/20'}`}>
                    {formData.availabilityDate && <Check size={14} className="text-background font-black" />}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-on-surface-variant" />
                      <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-on-surface font-black">Specify Available From Date</label>
                    </div>
                  </div>
                </button>
                {formData.availabilityDate && (
                  <input
                    type="date"
                    value={formData.availabilityDate}
                    onChange={e => updateData({ availabilityDate: e.target.value })}
                    className="w-full bg-primary/5 border border-primary/20 rounded-lg p-4 text-on-surface font-bold focus:border-primary outline-none transition-colors"
                  />
                )}
              </div>

              {/* Maintenance - Fixed or Variable */}
              <div className="space-y-4 text-left">
                <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black ml-2">Maintenance (Optional)</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => updateData({ maintenanceIncluded: 'none' })}
                    className={`py-4 rounded-lg font-black text-[10px] uppercase tracking-wider border transition-all text-center ${formData.maintenanceIncluded === 'none' ? 'bg-primary text-background border-primary shadow-lg' : 'bg-white/5 border-white/5 hover:bg-primary/5'}`}
                  >
                    Not Included
                  </button>
                  <button
                    onClick={() => updateData({ maintenanceIncluded: 'fixed' })}
                    className={`py-4 rounded-lg font-black text-[10px] uppercase tracking-wider border transition-all text-center ${formData.maintenanceIncluded === 'fixed' ? 'bg-primary text-background border-primary shadow-lg' : 'bg-white/5 border-white/5 hover:bg-primary/5'}`}
                  >
                    Fixed Charge
                  </button>
                  <button
                    onClick={() => updateData({ maintenanceIncluded: 'variable' })}
                    className={`py-4 rounded-lg font-black text-[10px] uppercase tracking-wider border transition-all text-center ${formData.maintenanceIncluded === 'variable' ? 'bg-primary text-background border-primary shadow-lg' : 'bg-white/5 border-white/5 hover:bg-primary/5'}`}
                  >
                    Variable
                  </button>
                </div>
              </div>

              {/* Flatmate Needed */}
              <button onClick={() => updateData({ flatmateNeeded: !formData.flatmateNeeded })} className={`w-full flex items-center justify-between p-5 rounded-lg border transition-all ${formData.flatmateNeeded ? 'border-emerald-400 bg-emerald-400/5' : 'border-white/5 bg-white/5 hover:border-emerald-400/40'}`}>
                <div className="flex items-center gap-3">
                  <Users size={16} className={formData.flatmateNeeded ? 'text-emerald-400' : 'text-on-surface-variant'} />
                  <span className="font-black text-xs uppercase tracking-wider">Flatmate Needed</span>
                </div>
                <div className={`w-10 h-5 rounded-full transition-all relative ${formData.flatmateNeeded ? 'bg-emerald-400' : 'bg-white/20'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${formData.flatmateNeeded ? 'left-5.5' : 'left-0.5'}`} />
                </div>
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div className="space-y-4 text-left">
                <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black ml-2">Monthly Rent</label>
                <input type="text" placeholder="₹ Rent amount" value={formData.rent} onChange={e => updateData({ rent: e.target.value })} className="w-full bg-surface-container-low border border-white/5 rounded-lg p-6 text-primary placeholder:text-primary/20 text-3xl font-black focus:border-primary transition-all outline-none tracking-tighter" />
              </div>

              <div className="space-y-4 text-left">
                <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black ml-2">NoBroker Link</label>
                <div className="relative">
                  <input type="text" placeholder="nobroker.in/..." value={formData.noBrokerLink} onChange={e => updateData({ noBrokerLink: e.target.value })} className="w-full bg-surface-container-low border border-white/5 rounded-lg p-5 pl-14 text-on-surface placeholder:text-on-surface-variant/30 font-bold focus:border-primary outline-none" />
                  <LinkIcon size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface opacity-30" />
                </div>
              </div>

              <div className="space-y-4 text-left">
                <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black ml-2">Flatmates Link</label>
                <div className="relative">
                  <input type="text" placeholder="flatmates.in/..." value={formData.flatmatesLink} onChange={e => updateData({ flatmatesLink: e.target.value })} className="w-full bg-surface-container-low border border-white/5 rounded-lg p-5 pl-14 text-on-surface placeholder:text-on-surface-variant/30 font-bold focus:border-primary outline-none" />
                  <LinkIcon size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface opacity-30" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="space-y-3">
                  <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black ml-2">Contributor</label>
                  <input type="text" placeholder="e.g. Rahul S." value={formData.contributorName} onChange={e => updateData({ contributorName: e.target.value })} className="w-full bg-surface-container-low border border-white/5 rounded-lg p-4 text-on-surface placeholder:text-on-surface-variant/30 font-bold focus:border-primary outline-none" />
                </div>
                <div className="space-y-3 text-left">
                  <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black ml-2">UPI (Rewards)</label>
                  <input type="text" placeholder="yourupi@bank" value={formData.contributorUpi} onChange={e => updateData({ contributorUpi: e.target.value })} className="w-full bg-surface-container-low border border-white/5 rounded-lg p-4 text-on-surface placeholder:text-on-surface-variant/30 font-bold focus:border-primary outline-none" />
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 flex items-center gap-6 shadow-inner">
                <div className="bg-primary text-background p-3 rounded-lg shadow-lg glow-primary">
                  <Check size={20} strokeWidth={3} />
                </div>
                <div>
                  <div className="font-technical text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1 leading-none text-left">Status: Ready</div>
                  <div className="text-on-surface font-black text-sm tracking-tight uppercase leading-none text-left">Verified Contribution Eligible</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-white/5 flex gap-4 bg-surface-container-low/50 mt-auto">
        {step > 1 && (
          <button onClick={prevStep} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-lg text-on-surface font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95 flex items-center justify-center gap-3 font-technical">
            <ChevronLeft size={16} strokeWidth={3} /> Back
          </button>
        )}
        <button
          onClick={step === 4 ? () => onSubmit(formData) : nextStep}
          disabled={(step === 1 && !formData.category && !formData.existingBuildingId) || (step === 2 && (!formData.floor || !formData.flatNumber))}
          className="flex-[2] py-4 bg-primary text-background rounded-lg font-black uppercase tracking-[0.3em] text-[10px] shadow-lg shadow-primary/20 hover:bg-blue-400 transition-all flex items-center justify-center gap-3 disabled:opacity-20 border border-white/10"
        >
          {step === 4 ? 'Deploy Node' : 'Next'} <ChevronRight size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
