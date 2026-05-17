'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, MapPin, Banknote, Navigation2, Zap, Target } from 'lucide-react';

export function BentoGrid() {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-6 grid-rows-2 gap-6 h-auto md:h-[800px] w-full mx-auto">
      {/* Feature 1: Large Primary */}
      <motion.div 
        whileHover={{ y: -5, scale: 1.01 }}
        className="col-span-1 md:col-span-3 row-span-2 glass-plate rounded-lg p-10 flex flex-col gap-6 relative overflow-hidden group"
      >
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-colors duration-700" />
        <div className="w-20 h-20 rounded-lg skeuo-raised flex items-center justify-center glow-primary mb-4 metallic-edge border border-white/10">
          <Eye size={40} className="text-primary animate-pulse" />
        </div>
        <div className="space-y-4 text-left">
          <h3 className="text-headline-lg font-black uppercase tracking-tighter text-on-background leading-none">Detect Vacancy &rarr;</h3>
          <p className="text-body-md text-on-surface-variant font-medium leading-relaxed opacity-70">
            Our network of tactical residents identifies new listings before they even hit the market. No brokers. No middleman. Pure speed.
          </p>
        </div>
        <div className="mt-auto flex gap-3 font-technical text-technical-sm">
          <div className="px-4 py-1 rounded-full glass-plate uppercase tracking-widest text-secondary font-bold border border-secondary/20">Real-time Feed</div>
          <div className="px-4 py-1 rounded-full glass-plate uppercase tracking-widest text-primary font-bold border border-primary/20">Zero Brokerage</div>
        </div>
      </motion.div>

      {/* Feature 2: Wide Secondary */}
      <motion.div 
        whileHover={{ y: -5, scale: 1.01 }}
        className="col-span-1 md:col-span-3 row-span-1 glass-plate rounded-lg p-8 flex flex-col gap-6 relative overflow-hidden group"
      >
        <div className="absolute right-0 bottom-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity duration-700">
           <MapPin size={100} />
        </div>
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-lg skeuo-raised flex items-center justify-center shadow-lg shadow-secondary/20 border border-secondary/20">
             <Target size={32} className="text-secondary" />
           </div>
           <h3 className="text-2xl font-black uppercase tracking-tight">Deploy Node</h3>
        </div>
        <p className="text-body-md text-on-surface-variant font-bold leading-relaxed opacity-60 uppercase tracking-wide text-xs text-left max-w-md font-technical">
          Drop a precision pin with hierarchical data (Building &gt; Floor &gt; Flat). Deploy your intel directly to the Hyderabad map.
        </p>
      </motion.div>

      {/* Feature 3: Rewards Small */}
      <motion.div 
        whileHover={{ y: -5, scale: 1.01 }}
        className="col-span-1 md:col-span-1 row-span-1 glass-plate rounded-lg p-8 flex flex-col items-center justify-center gap-4 relative overflow-hidden group"
      >
        <Banknote size={40} className="text-primary group-hover:scale-110 transition-transform duration-500" />
        <div className="text-center font-technical">
           <div className="text-technical-sm font-black uppercase tracking-[0.3em] text-primary">Reward</div>
           <div className="text-2xl font-black text-on-background tracking-tighter leading-none mt-1">₹5K+</div>
        </div>
      </motion.div>

      {/* Feature 4: Performance Small */}
      <motion.div 
        whileHover={{ y: -5, scale: 1.01 }}
        className="col-span-1 md:col-span-2 row-span-1 glass-plate rounded-lg p-8 flex flex-col justify-center gap-6 relative overflow-hidden group"
      >
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-lg skeuo-raised flex items-center justify-center border border-white/10">
             <Zap size={24} className="text-secondary animate-pulse" />
           </div>
           <div className="font-technical text-technical-sm uppercase tracking-widest font-black text-on-surface-variant">Edge Sync</div>
        </div>
        <div className="space-y-1">
           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-full w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent" 
              />
           </div>
           <p className="font-technical text-[9px] uppercase tracking-widest opacity-40 font-bold">Redis Cluster Active</p>
        </div>
      </motion.div>
    </div>
  );
}
