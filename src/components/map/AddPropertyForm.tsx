'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, Building2, Home, Hotel, ChevronRight, ChevronLeft, Check, Layers, Hash, Link as LinkIcon, Landmark, RefreshCcw, Sofa, Ruler, Calendar, Users, X, Info, Building, IndianRupee, Compass, MapPin, Search as SearchIcon } from 'lucide-react';
import { findNearbyBuildings } from '@/app/actions/map-actions';
import AnimatedFormInput from '@/components/form/AnimatedFormInput';
import { PlaceAutocomplete } from './PlaceAutocomplete';

interface AddPropertyFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  lat: number;
  lng: number;
  onSearchPlace?: (place: any) => void;
  onLocateGPS?: () => void;
  initialData?: {
    buildingName?: string;
    address?: string;
    existingBuildingId?: string | null;
    category?: string;
  } | null;
  isSubmitting?: boolean;
}

const FormInfoIcon = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="p-0.5 text-on-surface-variant/60 hover:text-primary transition-colors flex items-center justify-center"
        type="button"
      >
        <Info size={13} />
      </button>
      {show && (
        <div className="absolute bottom-full left-0 mb-2 w-52 bg-surface border border-outline/30 rounded-lg p-2.5 text-[10px] leading-normal text-on-surface z-50 shadow-2xl">
          {text}
        </div>
      )}
    </div>
  );
};

export default function AddPropertyForm({ onClose, onSubmit, lat, lng, initialData, isSubmitting = false, onLocateGPS }: AddPropertyFormProps) {
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
    tenantPreference: 'any' as 'any' | 'bachelors' | 'family',
    petsAllowed: false,
    maintenanceExtra: false,
    maintenanceAmount: '',
    depositMonths: '2',
    isTransparencyPin: false,
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
    <div className="flex flex-col h-full min-h-0 bg-surface text-on-surface font-sans antialiased overflow-hidden">
      <div className="border-b border-white/5 bg-surface-container-low flex-shrink-0">
        <div className="p-4 sm:p-6 md:p-8 flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="font-technical text-[8px] sm:text-[9px] uppercase tracking-[0.4em] text-primary font-black mb-1">
              Node Deployment // Step {step} of 4
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-on-surface uppercase tracking-tighter leading-tight font-display text-left">
              {steps[step - 1].title}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5 transition-all flex-shrink-0 touch-target-min">
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
        {/* Progress Bar */}
        <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 space-y-2">
          <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
            />
          </div>
          <div className="flex justify-between text-[9px] font-technical uppercase tracking-widest text-on-surface-variant font-black opacity-60">
            <span>{Math.round((step / 4) * 100)}% Complete</span>
            <span>{4 - step} steps remaining</span>
          </div>
        </div>
      </div>

      <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div className="p-4 bg-emerald-400/10 border border-emerald-400/30 rounded-lg">
                <p className="font-technical text-[9px] uppercase tracking-widest text-emerald-400 font-black mb-2">Quick Tip</p>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  <strong>Already listed?</strong> Select your building below. <strong>New building?</strong> Scroll down to enter details.
                </p>
              </div>

              {/* Search & Locate Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-on-surface mb-2 uppercase tracking-wide">Find Your Building</label>
                  <PlaceAutocomplete
                    onPlaceSelect={(place) => {
                      if (place.geometry?.location) {
                        updateData({
                          buildingName: place.name || formData.buildingName,
                          address: place.formatted_address || formData.address,
                          category: formData.category || 'gated',
                        });
                      }
                    }}
                    className="w-full"
                  />
                  <p className="text-[9px] text-on-surface-variant/60 mt-1 font-technical">Search for better accuracy</p>
                </div>
                <button
                  onClick={() => {
                    if ('geolocation' in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          onLocateGPS?.();
                        },
                        (error) => {
                          console.error('Geolocation error:', error);
                        },
                        {
                          enableHighAccuracy: true,
                          timeout: 10000,
                          maximumAge: 0
                        }
                      );
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs sm:text-sm font-black uppercase tracking-wider transition-all border border-white/10 h-10 sm:h-11"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Locate Me</span>
                </button>
              </div>

              {formData.buildingName && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shadow-lg"><Check size={16} className="text-on-primary" strokeWidth={3} /></div>
                    <div>
                      <div className="text-[10px] font-black text-primary uppercase tracking-widest">Node Identified</div>
                      <div className="text-xs font-bold text-on-surface uppercase truncate max-w-[200px]">{formData.buildingName}</div>
                    </div>
                  </div>
                  <button onClick={() => { updateData({ buildingName: '', address: '', existingBuildingId: null }); }} className="text-[8px] uppercase tracking-widest text-on-surface-variant hover:text-primary font-black">Reset</button>
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
                  <AnimatedFormInput
                    type="text"
                    label="Building Name"
                    placeholder="e.g. Banjara Heights, Jubilee Towers"
                    value={formData.buildingName}
                    onChange={(e) => updateData({ buildingName: e.target.value })}
                    helperText="Name of your building or residence"
                    icon={<Building size={18} />}
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

              {/* Transparency Pin Toggle */}
              <button
                onClick={() => updateData({ isTransparencyPin: !formData.isTransparencyPin })}
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                  formData.isTransparencyPin ? 'border-amber-400/40 bg-amber-400/5' : 'border-white/5'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="font-black text-xs uppercase tracking-wider">Transparency Pin</span>
                  <span className="text-[9px] text-on-surface-variant/60 font-technical mt-0.5">
                    I live here — not renting, just adding for transparency
                  </span>
                </div>
                <div className={`w-10 h-5 rounded-full transition-all relative ${formData.isTransparencyPin ? 'bg-amber-400' : 'bg-white/20'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${formData.isTransparencyPin ? 'left-5.5' : 'left-0.5'}`} />
                </div>
              </button>
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
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
                  {['G', '1', '2', '3', '4', '5', '6', '7+'].map((f) => (
                    <button key={f} onClick={() => updateData({ floor: f })} className={`py-3 sm:py-4 rounded-lg font-black transition-all border text-xs sm:text-sm min-h-[40px] sm:min-h-[44px] ${formData.floor === f ? 'bg-primary text-background border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-white/5 border-white/5 text-on-surface hover:bg-primary/5'}`}>{f}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 text-left">
                <AnimatedFormInput
                  type="text"
                  label="Flat / Unit Identifier"
                  placeholder="e.g. 101, A-3, Ground Floor, Shop 2..."
                  value={formData.flatNumber}
                  onChange={e => updateData({ flatNumber: e.target.value })}
                  helperText="How to identify this unit"
                  icon={<Hash size={18} />}
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              {/* BHK */}
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 ml-2">
                  <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black">BHK</label>
                  <FormInfoIcon text="Bedroom-Hall-Kitchen. 1BHK = 1 bedroom + hall + kitchen. 5+ = 5 or more bedrooms." />
                </div>
                <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                  {['1', '2', '3', '4', '5+'].map(b => (
                    <button key={b} onClick={() => updateData({ bhk: b })} className={`py-3 sm:py-3.5 rounded-lg font-black text-xs sm:text-sm border transition-all min-h-[40px] sm:min-h-[44px] ${formData.bhk === b ? 'bg-primary text-background border-primary shadow-lg' : 'bg-white/5 border-white/5 hover:bg-primary/5'}`}>{b}</button>
                  ))}
                </div>
              </div>

              {/* Furnishing */}
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 ml-2">
                  <Sofa size={14} className="text-primary" />
                  <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black">Furnishing</label>
                  <FormInfoIcon text="Furnished = all furniture. Semi = some furniture/fixtures. Unfurnished = bare space only." />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {[{ id: 'furnished', label: 'Furnished' }, { id: 'semi-furnished', label: 'Semi' }, { id: 'unfurnished', label: 'Unfurnished' }].map(f => (
                    <button key={f.id} onClick={() => updateData({ furnishing: f.id })} className={`py-3 sm:py-3.5 rounded-lg font-black text-[9px] sm:text-[10px] uppercase tracking-wider border transition-all min-h-[40px] sm:min-h-[44px] ${formData.furnishing === f.id ? 'bg-primary text-background border-primary shadow-lg' : 'bg-white/5 border-white/5 hover:bg-primary/5'}`}>{f.label}</button>
                  ))}
                </div>
              </div>

              {/* Size - OPTIONAL */}
              <div className="space-y-4 text-left">
                <AnimatedFormInput
                  type="number"
                  label="Size (sq.ft)"
                  placeholder="e.g. 1200"
                  value={formData.sizeSqft}
                  onChange={e => updateData({ sizeSqft: e.target.value })}
                  helperText="Floor area in square feet (optional)"
                  icon={<Ruler size={18} />}
                />
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
                  <AnimatedFormInput
                    type="date"
                    value={formData.availabilityDate}
                    onChange={e => updateData({ availabilityDate: e.target.value })}
                    helperText="When the property becomes available"
                    icon={<Calendar size={18} />}
                  />
                )}
              </div>

              {/* Tenant Preference */}
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 ml-2">
                  <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black">Tenant Preference</label>
                  <FormInfoIcon text="Who you prefer to rent to: Any (open), Bachelors (singles/professionals), or Family." />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: 'any', label: '🏠 Any' }, { id: 'bachelors', label: '🎓 Bachelors' }, { id: 'family', label: '👨‍👩‍👧 Family' }].map(p => (
                    <button key={p.id} onClick={() => updateData({ tenantPreference: p.id as any })} className={`py-3.5 rounded-lg font-black text-[10px] uppercase tracking-wider border transition-all ${formData.tenantPreference === p.id ? 'bg-primary text-background border-primary shadow-lg' : 'bg-white/5 border-white/5 hover:bg-primary/5'}`}>{p.label}</button>
                  ))}
                </div>
              </div>

              {/* Pets Allowed */}
              <button onClick={() => updateData({ petsAllowed: !formData.petsAllowed })} className={`w-full flex items-center justify-between p-5 rounded-lg border transition-all ${formData.petsAllowed ? 'border-emerald-400 bg-emerald-400/5' : 'border-white/5 bg-white/5 hover:border-emerald-400/40'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">🐕</span>
                  <span className="font-black text-xs uppercase tracking-wider">Pets Allowed</span>
                </div>
                <div className={`w-10 h-5 rounded-full transition-all relative ${formData.petsAllowed ? 'bg-emerald-400' : 'bg-white/20'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${formData.petsAllowed ? 'left-5.5' : 'left-0.5'}`} />
                </div>
              </button>

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
                <div className="flex items-center gap-2 ml-2">
                  <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black">Monthly Rent</label>
                  <FormInfoIcon text="Monthly rental amount in INR. This is the primary rent, excluding maintenance & utilities." />
                </div>
                <AnimatedFormInput
                  type="text"
                  placeholder="₹ Rent amount"
                  value={formData.rent}
                  onChange={e => updateData({ rent: e.target.value })}
                  helperText="Primary rent amount in INR"
                  icon={<IndianRupee size={18} />}
                  className="text-2xl placeholder:text-primary/20"
                />
              </div>

              {/* Security Deposit (months) */}
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 ml-2">
                  <label className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary font-black">Security Deposit (months)</label>
                  <FormInfoIcon text="How many months of rent as deposit. 2 months is standard. Refunded when tenant leaves." />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '2', '3', '6'].map(m => (
                    <button key={m} onClick={() => updateData({ depositMonths: m })} className={`py-3 rounded-lg font-black text-sm border transition-all ${formData.depositMonths === m ? 'bg-primary text-background border-primary shadow-lg' : 'bg-white/5 border-white/5 hover:bg-primary/5'}`}>{m}</button>
                  ))}
                </div>
              </div>

              {/* Maintenance Extra */}
              <button onClick={() => updateData({ maintenanceExtra: !formData.maintenanceExtra })} className={`w-full flex items-center justify-between p-5 rounded-lg border transition-all ${formData.maintenanceExtra ? 'border-amber-400 bg-amber-400/5' : 'border-white/5 bg-white/5 hover:border-amber-400/40'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">💰</span>
                  <span className="font-black text-xs uppercase tracking-wider">Maintenance Extra?</span>
                </div>
                <div className={`w-10 h-5 rounded-full transition-all relative ${formData.maintenanceExtra ? 'bg-amber-400' : 'bg-white/20'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${formData.maintenanceExtra ? 'left-5.5' : 'left-0.5'}`} />
                </div>
              </button>

              {formData.maintenanceExtra && (
                <div className="space-y-3 text-left">
                  <AnimatedFormInput
                    type="number"
                    label="Est. Amount (₹/mo)"
                    placeholder="e.g. 1500"
                    value={formData.maintenanceAmount}
                    onChange={e => updateData({ maintenanceAmount: e.target.value })}
                    helperText="Estimated monthly maintenance charges"
                    icon={<IndianRupee size={18} />}
                  />
                </div>
              )}

              <div className="space-y-4 text-left">
                <AnimatedFormInput
                  type="text"
                  label="NoBroker Link"
                  placeholder="nobroker.in/..."
                  value={formData.noBrokerLink}
                  onChange={e => updateData({ noBrokerLink: e.target.value })}
                  helperText="Link to your NoBroker listing (optional)"
                  icon={<LinkIcon size={18} />}
                />
              </div>

              <div className="space-y-4 text-left">
                <AnimatedFormInput
                  type="text"
                  label="Flatmates Link"
                  placeholder="flatmates.in/..."
                  value={formData.flatmatesLink}
                  onChange={e => updateData({ flatmatesLink: e.target.value })}
                  helperText="Link to your Flatmates listing (optional)"
                  icon={<LinkIcon size={18} />}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="space-y-3">
                  <AnimatedFormInput
                    type="text"
                    label="Contributor"
                    placeholder="e.g. Rahul S."
                    value={formData.contributorName}
                    onChange={e => updateData({ contributorName: e.target.value })}
                    helperText="Your name"
                  />
                </div>
                <div className="space-y-3 text-left">
                  <AnimatedFormInput
                    type="text"
                    label="UPI (Rewards)"
                    placeholder="yourupi@bank"
                    value={formData.contributorUpi}
                    onChange={e => updateData({ contributorUpi: e.target.value })}
                    helperText="For reward payouts"
                  />
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

      <div className="p-4 sm:p-6 border-t border-white/5 flex flex-col gap-4 bg-surface-container-low/50 flex-shrink-0">
        {isSubmitting && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="font-technical text-[8px] sm:text-[9px] uppercase tracking-widest text-on-surface-variant font-black">Deploying...</span>
              <span className="font-technical text-[8px] sm:text-[9px] uppercase tracking-widest text-primary font-black">Creating building</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: ['0%', '33%', '66%', '100%'] }}
                transition={{ duration: 3, times: [0, 0.3, 0.6, 1] }}
                className="h-full bg-gradient-to-r from-primary via-blue-400 to-primary"
              />
            </div>
          </div>
        )}
        <div className="flex gap-3 sm:gap-4">
          {step > 1 && !isSubmitting && (
            <button onClick={prevStep} className="flex-1 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-lg text-on-surface font-black uppercase tracking-[0.3em] text-[9px] sm:text-[10px] transition-all active:scale-95 flex items-center justify-center gap-2 font-technical hover:bg-white/10 min-h-[44px] sm:min-h-[48px]">
              <ChevronLeft size={14} strokeWidth={3} className="sm:w-4 sm:h-4" /> Back
            </button>
          )}
          <button
            onClick={step === 4 ? () => onSubmit(formData) : nextStep}
            disabled={(step === 1 && !formData.category && !formData.existingBuildingId && !formData.buildingName) || (step === 2 && (!formData.floor || !formData.flatNumber)) || isSubmitting}
            className="flex-[2] py-3 sm:py-4 bg-primary text-background rounded-lg font-black uppercase tracking-[0.3em] text-[9px] sm:text-[10px] shadow-lg shadow-primary/20 hover:bg-blue-400 transition-all flex items-center justify-center gap-2 disabled:opacity-20 border border-white/10 min-h-[44px] sm:min-h-[48px]"
          >
            {isSubmitting ? 'Deploying...' : (step === 4 ? 'Deploy Node' : 'Next')} {!isSubmitting && <ChevronRight size={14} strokeWidth={3} className="sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
