'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { MapPin, Zap } from 'lucide-react';

const cities = [
  { name: 'BLR', fullName: 'BENGALURU', active: true },
  { name: 'HYD', fullName: 'HYDERABAD', active: true },
  { name: 'BBSR', fullName: 'BHUBANESWAR', active: true },
  { name: 'CTC', fullName: 'CUTTACK', active: true },
  { name: 'BOM', fullName: 'MUMBAI', active: false, comingSoon: true },
  { name: 'DEL', fullName: 'DELHI', active: false, comingSoon: true },
  { name: 'CHE', fullName: 'CHENNAI', active: false, comingSoon: true },
  { name: 'PUN', fullName: 'PUNE', active: false, comingSoon: true },
];

export function CitiesMarquee() {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;

    if (!container || !inner) return;

    // Clone items for seamless loop
    const children = Array.from(inner.children) as HTMLElement[];
    children.forEach((child) => {
      const clone = child.cloneNode(true) as HTMLElement;
      inner.appendChild(clone);
    });

    // Calculate width for animation
    const totalWidth = inner.scrollWidth / 2;

    // GSAP animation for smooth infinite scroll
    gsap.set(inner, { x: 0 });
    gsap.to(inner, {
      x: -totalWidth,
      duration: 50,
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x) => parseFloat(x) % totalWidth),
      },
    });

    return () => {
      gsap.killTweensOf(inner);
    };
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative py-16 md:py-28 overflow-hidden bg-background"
    >
      {/* Gradient Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Header */}
      <div className="max-w-container mx-auto px-mobile md:px-desktop mb-12 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
            <div className="font-technical text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-primary/80">
              Network Expansion
            </div>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-black text-on-surface uppercase tracking-tighter leading-tight mb-3">
            Live Across
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              India
            </span>
          </h2>
          <p className="text-sm md:text-base text-on-surface-variant/70 font-medium max-w-2xl">
            Direct rental protocol live in major metros. Expanding the peer-to-peer network across regions.
          </p>
        </motion.div>
      </div>

      {/* Marquee Container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden w-full mb-12 md:mb-16"
      >
        {/* Gradient fade left */}
        <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-background via-background/50 to-transparent z-20 pointer-events-none" />
        {/* Gradient fade right */}
        <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-background via-background/50 to-transparent z-20 pointer-events-none" />

        {/* Scrolling container */}
        <div
          ref={innerRef}
          className="flex gap-5 md:gap-8 whitespace-nowrap py-8 md:py-10"
        >
          {cities.map((city, idx) => (
            <div key={`${city.name}-${idx}`} className="flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className={`group relative px-7 md:px-10 py-4 md:py-5 font-technical font-black uppercase tracking-widest transition-all duration-300 ${
                  city.active
                    ? 'border border-primary/60 bg-gradient-to-br from-primary/25 to-primary/10 text-primary shadow-xl shadow-primary/20 backdrop-blur-sm'
                    : 'border border-white/15 bg-surface/40 text-on-surface-variant/50 hover:bg-surface/60 hover:border-white/25'
                } rounded-xl`}
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2 w-full">
                    {city.active && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-primary rounded-full flex-shrink-0"
                      />
                    )}
                    <span className="text-sm md:text-base font-black tracking-tight">{city.name}</span>
                    {city.comingSoon && (
                      <span className="text-[7px] md:text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black tracking-wider ml-auto">
                        SOON
                      </span>
                    )}
                  </div>
                  <span className="text-[7px] md:text-[8px] text-on-surface-variant/50 font-technical uppercase tracking-widest">{city.fullName}</span>
                </div>

                {/* Hover shine effect for active */}
                {city.active && (
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                )}
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section - 3D Skeuomorphic Design */}
      <div className="max-w-container mx-auto px-mobile md:px-desktop">
        <div className="grid grid-cols-3 gap-4 md:gap-6 auto-rows-fr">
          {/* Active Markets - 3D Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group perspective"
          >
            <motion.div
              whileHover={{ y: -8, rotateX: 5 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative h-full p-6 md:p-8 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.2) 0%, rgba(255, 107, 53, 0.05) 100%)',
                boxShadow: `
                  inset 1px 1px 0 rgba(255, 107, 53, 0.4),
                  inset -1px -1px 0 rgba(0, 0, 0, 0.3),
                  0 20px 40px rgba(255, 107, 53, 0.2),
                  0 0 60px rgba(255, 107, 53, 0.1)
                `,
                border: '1px solid rgba(255, 107, 53, 0.35)',
              }}
            >
              {/* Beveled top highlight */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent rounded-t-2xl" />

              {/* Inner depth shadow */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 -2px 8px rgba(255, 107, 53, 0.1)'
              }} />

              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-300" style={{
                background: 'radial-gradient(ellipse at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
              }} />

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center relative"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.4) 0%, rgba(255, 107, 53, 0.2) 100%)',
                      boxShadow: 'inset 1px 1px 0 rgba(255, 255, 255, 0.2), inset -1px -1px 0 rgba(0, 0, 0, 0.3), 0 4px 8px rgba(255, 107, 53, 0.2)'
                    }}
                  >
                    <MapPin size={18} className="text-primary" />
                  </div>
                  <div className="font-technical text-[8px] md:text-[9px] font-black uppercase tracking-widest text-primary/80">
                    Active Markets
                  </div>
                </div>
                <div className="mb-auto">
                  <div className="text-4xl md:text-5xl font-black text-primary drop-shadow-lg">
                    {cities.filter((c) => c.active).length}
                  </div>
                </div>
                <p className="text-xs md:text-sm text-on-surface-variant/70 mt-3 font-medium">
                  Live network nodes
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Expansion Lane - 3D Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group perspective"
          >
            <motion.div
              whileHover={{ y: -8, rotateX: 5 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative h-full p-6 md:p-8 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 136, 255, 0.2) 0%, rgba(0, 136, 255, 0.05) 100%)',
                boxShadow: `
                  inset 1px 1px 0 rgba(0, 136, 255, 0.4),
                  inset -1px -1px 0 rgba(0, 0, 0, 0.3),
                  0 20px 40px rgba(0, 136, 255, 0.2),
                  0 0 60px rgba(0, 136, 255, 0.1)
                `,
                border: '1px solid rgba(0, 136, 255, 0.35)',
              }}
            >
              {/* Beveled top highlight */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary/40 via-secondary/20 to-transparent rounded-t-2xl" />

              {/* Inner depth shadow */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 -2px 8px rgba(0, 136, 255, 0.1)'
              }} />

              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-300" style={{
                background: 'radial-gradient(ellipse at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
              }} />

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center relative"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0, 136, 255, 0.4) 0%, rgba(0, 136, 255, 0.2) 100%)',
                      boxShadow: 'inset 1px 1px 0 rgba(255, 255, 255, 0.2), inset -1px -1px 0 rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 136, 255, 0.2)'
                    }}
                  >
                    <Zap size={18} className="text-secondary" />
                  </div>
                  <div className="font-technical text-[8px] md:text-[9px] font-black uppercase tracking-widest text-secondary/80">
                    Expansion Lane
                  </div>
                </div>
                <div className="mb-auto">
                  <div className="text-4xl md:text-5xl font-black text-secondary drop-shadow-lg">
                    {cities.filter((c) => !c.active).length}
                  </div>
                </div>
                <p className="text-xs md:text-sm text-on-surface-variant/70 mt-3 font-medium">
                  Coming soon
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Coverage - 3D Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="group perspective"
          >
            <motion.div
              whileHover={{ y: -8, rotateX: 5 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative h-full p-6 md:p-8 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%)',
                boxShadow: `
                  inset 1px 1px 0 rgba(255, 255, 255, 0.25),
                  inset -1px -1px 0 rgba(0, 0, 0, 0.3),
                  0 20px 40px rgba(255, 255, 255, 0.1),
                  0 0 60px rgba(255, 255, 255, 0.05)
                `,
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {/* Beveled top highlight */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-white/30 via-white/15 to-transparent rounded-t-2xl" />

              {/* Inner depth shadow */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 -2px 8px rgba(255, 255, 255, 0.1)'
              }} />

              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-300" style={{
                background: 'radial-gradient(ellipse at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 70%)',
              }} />

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="font-technical text-[8px] md:text-[9px] font-black uppercase tracking-widest text-on-surface-variant/70 mb-4">
                  Coverage
                </div>
                <div className="mb-auto">
                  <div className="text-4xl md:text-5xl font-black text-on-surface drop-shadow-lg">
                    {cities.length}
                  </div>
                </div>
                <p className="text-xs md:text-sm text-on-surface-variant/70 mt-3 font-medium">
                  Cities in network
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
