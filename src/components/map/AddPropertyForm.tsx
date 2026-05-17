'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, Building2, ChevronRight, ChevronLeft, Check, X, Layers, Hash, Link as LinkIcon, Search, Landmark, RefreshCcw } from 'lucide-react';
import { findNearbyBuildings } from '@/app/actions/map-actions';

interface AddPropertyFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  lat: number;
  lng: number;
}

export default function AddPropertyForm({ onClose, onSubmit, lat, lng }: AddPropertyFormProps) {
  const [step, setStep] = useState(1);
  const [nearbyBuildings, setNearbyBuildings] = useState<any[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  const [formData, setFormData] = useState({
    category: '',
    floor: '',
    flatNumber: '',
    status: 'vacant',
    rent: '',
    noBrokerLink: '',
    contributorName: '',
    contributorUpi: '',
    existingBuildingId: null as string | null,
    buildingName: '',
  });

  // Step 1: Find nearby buildings when coordinates change or step 1 is active
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

  const nextStep = () => setStep(s => Math.min(s + 3, 3)); // Jump logic if building selected
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const updateData = (fields: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const steps = [
    { title: 'Coordinate Resolution', subtitle: 'Identify Building Node' },
    { title: 'Level Mapping', subtitle: 'Vertical identification' },
    { title: 'Intelligence Metadata', subtitle: 'Resource value & reward ID' },
  ];

  return (
    <div className="flex flex-col h-full bg-surface text-on-surface font-sans antialiased">
      {/* Tactical Header */}
      <div className="p-8 border-b border-white/5 flex justify-between items-center bg-surface-container-low">
        <div>
          <div className="font-technical text-[9px] uppercase tracking-[0.4em] text-primary font-black mb-1">
            Manual Node Deployment // 0{step}
          </div>
          <h2 className="text-3xl font-black text-on-surface uppercase tracking-tighter leading-none font-display text-left">
            {steps[step - 1].title}
          </h2>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                 <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black ml-2">Nearby Grid Nodes Detected</label>
                 {loadingNearby ? (
                   <div className="h-20 flex items-center justify-center skeuo-concave rounded-lg border border-white/5 animate-pulse">
                      <RefreshCcw className="animate-spin text-primary opacity-20" size={24} />
                   </div>
                 ) : nearbyBuildings.length > 0 ? (
                    <div className="space-y-2">
                       {nearbyBuildings.map(b => (
                         <button 
                            key={b.id}
                            onClick={() => {
                              updateData({ existingBuildingId: b.id, category: b.category, buildingName: b.name });
                              setStep(2);
                            }}
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
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      updateData({ category: cat.id, existingBuildingId: null });
                      setStep(2);
                    }}
                    className={`flex items-center gap-6 p-6 rounded-lg transition-all text-left border ${
                      formData.category === cat.id && !formData.existingBuildingId
                        ? 'border-primary bg-primary/5 shadow-lg' 
                        : 'border-white/5 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`p-4 rounded-lg ${formData.category === cat.id ? 'bg-primary text-background shadow-lg' : 'bg-surface-container text-on-surface-variant'}`}>
                      <cat.icon size={24} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-black uppercase tracking-widest text-xs ${formData.category === cat.id ? 'text-primary' : 'text-on-surface'}`}>
                        {cat.label}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              {/* If building selected, show its name */}
              {formData.buildingName && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3">
                   <Landmark size={16} className="text-primary" />
                   <span className="font-technical text-[10px] font-black uppercase text-primary tracking-widest">Locked to: {formData.buildingName}</span>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <Layers size={16} className="text-primary" />
                   <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-on-surface font-black">Vertical Level (Floor)</label>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {['G', '1', '2', '3', '4', '5', '6', '7+'].map((f) => (
                    <button
                      key={f}
                      onClick={() => updateData({ floor: f })}
                      className={`py-5 rounded-lg font-black transition-all border text-sm ${
                        formData.floor === f 
                          ? 'bg-primary text-background border-primary shadow-lg shadow-primary/20 scale-105' 
                          : 'bg-white/5 border-white/5 text-on-surface hover:bg-primary/5'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6 text-left">
                <div className="flex items-center gap-3">
                   <Hash size={16} className="text-primary" />
                   <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-on-surface font-black">Flat Identifier</label>
                </div>
                <div className="grid grid-cols-4 gap-3">
                   {['101', '102', '201', '202', '301', '302', '401', 'Custom'].map((num) => (
                     <button 
                       key={num}
                       onClick={() => updateData({ flatNumber: num === 'Custom' ? '' : num })}
                       className={`py-4 rounded-lg font-black transition-all border text-xs ${
                        formData.flatNumber === num 
                          ? 'bg-primary text-background border-primary shadow-lg scale-105' 
                          : 'bg-white/5 border-white/5 text-on-surface hover:bg-primary/5'
                      }`}
                     >
                       {num}
                     </button>
                   ))}
                </div>
                {formData.flatNumber === '' && (
                  <input
                    type="text"
                    placeholder="Enter manual identifier..."
                    autoFocus
                    className="w-full bg-surface-container-low border border-white/5 rounded-lg p-5 text-on-surface placeholder:text-on-surface-variant/30 font-bold focus:bg-white/5 focus:border-primary transition-all outline-none"
                    onChange={e => updateData({ flatNumber: e.target.value })}
                  />
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <div className="space-y-6 text-left">
                <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black ml-2 text-left">Intelligence Target (Link)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="No Broker or Flatmates Link"
                    value={formData.noBrokerLink}
                    onChange={e => updateData({ noBrokerLink: e.target.value })}
                    className="w-full bg-surface-container-low border border-white/5 rounded-lg p-6 pl-16 text-on-surface placeholder:text-on-surface-variant/30 font-bold focus:bg-white/5 focus:border-primary transition-all outline-none"
                  />
                  <LinkIcon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface opacity-30" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                 <div className="space-y-4">
                    <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black ml-2 text-left">Contributor Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul S."
                      value={formData.contributorName}
                      onChange={e => updateData({ contributorName: e.target.value })}
                      className="w-full bg-surface-container-low border border-white/5 rounded-lg p-4 text-on-surface placeholder:text-on-surface-variant/30 font-bold focus:border-primary outline-none"
                    />
                 </div>
                 <div className="space-y-4 text-left">
                    <label className="font-technical text-[9px] uppercase tracking-widest text-on-surface-variant font-black ml-2 text-left">UPI ID (For Rewards)</label>
                    <input
                      type="text"
                      placeholder="yourupi@bank"
                      value={formData.contributorUpi}
                      onChange={e => updateData({ contributorUpi: e.target.value })}
                      className="w-full bg-surface-container-low border border-white/5 rounded-lg p-4 text-on-surface placeholder:text-on-surface-variant/30 font-bold focus:border-primary outline-none"
                    />
                 </div>
              </div>

              <div className="space-y-6 pt-4 text-left">
                <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black ml-2 text-left">Monthly Resource Value (Rent)</label>
                <input
                  type="text"
                  placeholder="₹ Rent amount"
                  value={formData.rent}
                  onChange={e => updateData({ rent: e.target.value })}
                  className="w-full bg-surface-container-low border border-white/5 rounded-lg p-8 text-primary placeholder:text-primary/20 text-4xl font-black focus:bg-white/5 focus:border-primary transition-all outline-none tracking-tighter"
                />
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 flex items-center gap-8 shadow-inner">
                <div className="bg-primary text-background p-3.5 rounded-lg shadow-lg glow-primary">
                  <Check size={24} strokeWidth={3} />
                </div>
                <div>
                  <div className="font-technical text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1 leading-none text-left">Status: Ready</div>
                  <div className="text-on-surface font-black text-xl tracking-tight uppercase leading-none text-left text-[14px]">Verified Contribution Eligible</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="p-8 border-t border-white/5 flex gap-4 bg-surface-container-low/50 mt-auto">
        {step > 1 && (
          <button 
            onClick={prevStep}
            className="flex-1 py-5 bg-white/5 border border-white/10 rounded-lg text-on-surface font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95 flex items-center justify-center gap-3 font-technical"
          >
            <ChevronLeft size={16} strokeWidth={3} /> Back
          </button>
        )}
        <button 
          onClick={step === 3 ? () => onSubmit(formData) : nextStep}
          disabled={(step === 1 && !formData.category && !formData.existingBuildingId) || (step === 2 && (!formData.floor || !formData.flatNumber))}
          className="flex-[2] py-5 bg-primary text-background rounded-lg font-black uppercase tracking-[0.3em] text-[10px] shadow-lg shadow-primary/20 hover:bg-blue-400 transition-all flex items-center justify-center gap-3 disabled:opacity-20 border border-white/10"
        >
          {step === 3 ? 'Deploy Node to Map' : 'Next Protocol Step'} <ChevronRight size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
