'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, MapPin, Banknote, Link as LinkIcon, Share2, CheckCircle2, ChevronLeft, Check, X, QrCode, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { lockPlace, flagIntel } from '@/app/actions/map-actions';

interface ListingPageProps {
  id: string;
  type: 'flat' | 'flatmate';
}

// Simulated fetcher (Would be real Supabase fetch in production)
const getListingData = (id: string) => ({
  id,
  building: 'Cybercity Marina Skies',
  location: 'Hitech City, Hyderabad',
  category: 'gated',
  rent: '₹55,000',
  deposit: '3 Months',
  bhk: 3,
  floor: '18th Floor',
  reward: '₹3,000',
  description: 'Spacious corner flat with lake view. Looking for direct tenants only. No brokers please.',
  ownerContact: 'https://wa.me/910000000000',
  images: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop',
  ]
});

export default function ListingDetail({ id, type }: ListingPageProps) {
  const data = getListingData(id);
  const { isCopied, copy } = useCopyToClipboard();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  const handleShare = () => {
    copy(window.location.href);
  };

  const handleLockPlace = async () => {
    setIsLocking(true);
    const result = await lockPlace(id);
    if (result.error) {
      alert(result.error);
      setIsLocking(false);
    } else {
      setShowRewardModal(true);
      setIsLocking(false);
    }
  };

  const handleFlagIntel = async () => {
    const confirm = window.confirm("Are you sure this intelligence is fake or stale? Multiple flags will revert this listing.");
    if (confirm) {
      const result = await flagIntel(id);
      if (result.success) {
        alert("Intelligence Flagged. Thank you for maintaining the grid.");
      } else {
        alert("Flagging protocol failed.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-24 selection:bg-primary/30">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 flex justify-center h-20 bg-background/5 backdrop-blur-xl border-b border-white/10 shadow-2xl px-mobile md:px-desktop">
        <div className="max-w-container flex justify-between items-center w-full">
          <Link href="/explore" className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform group font-technical">
            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Back to Map
          </Link>
          <Link href="/" className="font-display text-2xl text-primary font-black tracking-tighter">indian.rent</Link>
          <button 
            onClick={handleShare}
            className="skeuo-raised glass-plate p-3 rounded-DEFAULT text-primary hover:scale-110 active:scale-90 transition-all relative border border-white/10"
          >
            {isCopied ? <Check size={20} /> : <Share2 size={20} />}
            <AnimatePresence>
              {isCopied && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-full right-0 mt-2 bg-primary text-on-primary text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full shadow-lg font-technical"
                >
                  Copied
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      <main className="pt-32 px-mobile md:px-desktop max-w-container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 text-left">
        {/* Left: Imagery & Details */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="aspect-video w-full rounded-xl overflow-hidden glass-plate p-2 border border-white/15 shadow-2xl"
          >
            <img src={data.images[0]} alt={data.building} className="w-full h-full object-cover rounded-lg" />
          </motion.div>

          <div className="glass-plate rounded-lg p-10 space-y-8 border border-white/15">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-3 font-display">{data.building}</h1>
                <div className="flex items-center gap-2 text-on-surface-variant font-bold uppercase tracking-widest text-[10px] opacity-60 font-technical">
                  <MapPin size={14} /> {data.location}
                </div>
              </div>
              <div className="bg-secondary/10 border border-secondary/20 text-secondary px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg glow-secondary font-technical">
                <CheckCircle2 size={14} /> Verified Listing
              </div>
            </div>

            <p className="text-body-md leading-relaxed text-on-surface-variant font-medium opacity-80">
              {data.description}
            </p>

            <div className="grid grid-cols-3 gap-6 border-t border-white/5 pt-10">
              <div className="skeuo-raised glass-plate p-6 rounded-lg text-center group transition-all hover:bg-primary/5 border border-white/10">
                <div className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black mb-2 opacity-50 group-hover:text-primary transition-colors font-technical">Type</div>
                <div className="font-black text-primary uppercase text-sm tracking-widest">{data.category}</div>
              </div>
              <div className="skeuo-raised glass-plate p-6 rounded-lg text-center group transition-all hover:bg-primary/5 border border-white/10">
                <div className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black mb-2 opacity-50 group-hover:text-primary transition-colors font-technical">Vertical</div>
                <div className="font-black text-primary uppercase text-sm tracking-widest">{data.floor}</div>
              </div>
              <div className="skeuo-raised glass-plate p-6 rounded-lg text-center group transition-all hover:bg-primary/5 border border-white/10">
                <div className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black mb-2 opacity-50 group-hover:text-primary transition-colors font-technical">BHK</div>
                <div className="font-black text-primary uppercase text-sm tracking-widest">{data.bhk} BHK</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Action & Reward Card */}
        <div className="lg:sticky lg:top-32 h-fit space-y-8 pb-12">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="skeuo-raised glass-plate rounded-lg p-12 border border-white/15 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]"
          >
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="skeuo-raised glass-plate p-6 rounded-lg border border-white/10">
                <div className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-black mb-2 opacity-50 font-technical text-left">Monthly Rent</div>
                <div className="text-4xl font-black text-primary tracking-tighter text-left">{data.rent}<span className="text-xs text-on-surface-variant font-normal tracking-normal ml-1 font-sans">/mo</span></div>
              </div>
              <div className="skeuo-raised glass-plate p-6 rounded-lg border border-white/10 text-right">
                <div className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-black mb-2 opacity-50 font-technical">Deposit</div>
                <div className="text-4xl font-black text-on-surface tracking-tighter">{data.deposit}</div>
              </div>
            </div>

            {/* The Reward Callout */}
            <div className="skeuo-raised bg-primary/5 border border-primary/20 rounded-lg p-10 mb-12 relative overflow-hidden group shadow-inner">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[80px] rounded-full -mr-24 -mt-24 animate-pulse" />
              <div className="relative z-10 flex items-center gap-8 text-left">
                <div className="bg-primary text-on-primary p-5 rounded-lg shadow-[0_10px_20px_rgba(0,102,255,0.4)]">
                  <Banknote size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="font-technical text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-2">Anti-Broker Incentive</div>
                  <div className="text-3xl font-black text-on-surface tracking-tight leading-none uppercase">
                    {data.reward} <span className="text-primary tracking-widest text-sm ml-2 font-technical">Good Faith</span>
                  </div>
                </div>
              </div>
              <p className="relative z-10 mt-8 text-xs text-on-surface-variant font-bold leading-relaxed opacity-60 uppercase tracking-wider font-technical text-left">
                Direct community value. You pay this reward only if you secure the place. Bypasses ₹50k+ broker fees.
              </p>
            </div>

            <div className="space-y-6">
              <Link href={data.ownerContact} target="_blank" className="block">
                <button className="w-full py-6 bg-primary text-on-primary rounded-DEFAULT font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_20px_40px_-10px_rgba(0,102,255,0.5)] skeuo-raised hover:shadow-[0_25px_50px_-10px_rgba(0,102,255,0.6)] transition-all flex items-center justify-center gap-3 border border-white/20">
                  <LinkIcon size={18} strokeWidth={3} /> Get {type === 'flat' ? 'No Broker' : 'Flatmate'} Contact
                </button>
              </Link>
              <button 
                onClick={handleLockPlace}
                disabled={isLocking}
                className="w-full py-6 skeuo-raised glass-plate hover:bg-white/5 rounded-DEFAULT font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-3 active:scale-[0.98] border border-white/10 disabled:opacity-30"
              >
                <CheckCircle2 size={18} strokeWidth={3} /> {isLocking ? 'Processing Protocol...' : 'I Have Locked This Place'}
              </button>
              
              <button 
                onClick={handleFlagIntel}
                className="w-full py-4 bg-error/5 text-error rounded-DEFAULT font-black uppercase tracking-[0.3em] text-[8px] transition-all flex items-center justify-center gap-2 border border-error/20 hover:bg-error/10 opacity-40 hover:opacity-100 font-technical"
              >
                <ShieldAlert size={14} /> Report Fake or Stale Intelligence
              </button>
            </div>
          </motion.div>

          <div className="p-8 border border-white/5 rounded-lg text-center opacity-30">
             <div className="font-technical text-[9px] uppercase tracking-[0.4em] font-black">Satellite Intel Connection: Active</div>
          </div>
        </div>
      </main>

      {/* Reward Facilitation Modal */}
      <AnimatePresence>
        {showRewardModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 text-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRewardModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg skeuo-raised glass-plate rounded-lg overflow-hidden shadow-2xl border border-white/15 bg-background p-1"
            >
              <div className="p-12 text-center space-y-8 bg-background/50 rounded-lg">
                <div className="inline-flex bg-primary/10 p-6 rounded-full text-primary mb-2 shadow-inner glow-primary border border-primary/20">
                  <Check size={48} strokeWidth={3} />
                </div>
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-4 font-display">Tactical Success</h2>
                  <p className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px] opacity-60 font-technical text-center">Listing secured without broker interference.</p>
                </div>

                <div className="skeuo-raised glass-plate p-8 rounded-lg border border-white/10 space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-white rounded-md shadow-inner">
                       <QrCode size={180} className="text-black" />
                    </div>
                    <div className="font-technical text-[10px] uppercase tracking-widest text-primary font-black">Scan to Pay Good Faith Reward</div>
                  </div>
                  <div className="text-3xl font-black text-on-surface tracking-tighter">{data.reward}</div>
                </div>

                <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed opacity-60 italic uppercase tracking-widest font-technical text-center">
                  Direct payment to the contributor. Fair markets powered by you.
                </p>

                <button 
                  onClick={() => setShowRewardModal(false)}
                  className="w-full py-6 glass-plate hover:bg-white/10 rounded-DEFAULT font-black uppercase tracking-[0.3em] text-[10px] transition-all border border-white/15 active:scale-95 font-technical"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
