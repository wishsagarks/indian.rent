'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Users, ChartBar as BarChart3, Brain as Train, Satellite, Shield, Share2, ChevronRight } from 'lucide-react';

const CONSENT_KEY = 'indian_rent_consent_v1';

interface ConsentSplashProps {
  onAccept: () => void;
}

export default function ConsentSplash({ onAccept }: ConsentSplashProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consented = localStorage.getItem(CONSENT_KEY);
    if (!consented) {
      setVisible(true);
    } else {
      onAccept();
    }
  }, [onAccept]);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setVisible(false);
    onAccept();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-background flex items-center justify-center overflow-y-auto"
      >
        <div className="max-w-2xl w-full mx-auto px-6 py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-8">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-technical text-[10px] text-primary font-black uppercase tracking-[0.3em]">Live Protocol</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-on-background uppercase tracking-tighter leading-none font-display mb-6">
              indian.rent
            </h1>
            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed max-w-lg mx-auto">
              Crowdsourced rental map for Hyderabad. Real rents submitted by actual renters.
              No signup, no app, no broker fees, no ads.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12"
          >
            {[
              { icon: MapPin, text: 'Pin your rent — no sign-up required', color: 'text-primary' },
              { icon: Star, text: 'Rate listings on Locality + Built Quality', color: 'text-amber-400' },
              { icon: Users, text: 'Looking for a flatmate? Pin it and get connected', color: 'text-emerald-400' },
              { icon: BarChart3, text: 'Area Stats — draw any area, get avg rent by BHK', color: 'text-cyan-400' },
              { icon: Train, text: 'Hyderabad Metro lines + filter by distance', color: 'text-rose-400' },
              { icon: Satellite, text: 'Live map of all available flats — updated in real time', color: 'text-orange-400' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-lg">
                <item.icon size={18} className={`${item.color} shrink-0`} />
                <span className="text-on-surface text-xs font-medium">{item.text}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 border border-white/10 rounded-lg p-6 mb-10"
          >
            <div className="flex items-center gap-3 mb-3">
              <Shield size={16} className="text-primary" />
              <span className="font-technical text-[10px] text-primary font-black uppercase tracking-[0.2em]">Community Trust</span>
            </div>
            <p className="text-on-surface-variant text-xs leading-relaxed">
              Every pin earns its place. Anti-manipulation guards keep this map honest.
              If something looks off — report it. You are the fact-checker for your neighbourhood.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="text-center space-y-6"
          >
            <button
              onClick={handleAccept}
              className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-12 py-5 bg-primary text-on-primary rounded-lg font-black uppercase tracking-[0.3em] text-[11px] shadow-[0_20px_40px_-10px_rgba(0,102,255,0.4)] hover:shadow-[0_30px_60px_-10px_rgba(0,102,255,0.5)] border border-white/20 transition-all active:scale-[0.98]"
            >
              Enter the Map <ChevronRight size={16} strokeWidth={3} />
            </button>
            <p className="text-on-surface-variant/40 text-[10px] font-medium">
              By moving forward, you agree to our Privacy Policy and Terms of Use
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-12 pt-8 border-t border-white/5 text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <Share2 size={14} className="text-on-surface-variant/50" />
              <span className="text-on-surface-variant/50 text-[10px] font-bold uppercase tracking-widest">Help spread the word</span>
            </div>
            <p className="text-on-surface-variant/30 text-xs max-w-sm mx-auto">
              &quot;Found this: indian.rent — a live rent map of Hyderabad with real rents from real people. No brokers, no signup. Check it out.&quot;
            </p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
