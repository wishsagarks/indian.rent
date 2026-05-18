'use client';

import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { GlobeAnalytics } from './ui/cobe-globe-analytics';
import MagneticButton, { PeelingSticker } from './ui-advanced/TactileControls';
import TracingBeam from './ui-advanced/TracingBeam';
import { BentoGrid } from './ui-advanced/BentoGrid';
import HeroText from './ui-advanced/HeroText';

gsap.registerPlugin(ScrollTrigger);

function StickerButton({ children }: { children: React.ReactNode }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative cursor-pointer group"
    >
      {/* Shadow */}
      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-xl translate-y-2 scale-95 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Main Button Body */}
      <motion.div
        animate={{ 
          rotateX: isHovered ? 5 : 0,
          rotateY: isHovered ? -5 : 0,
          y: isHovered ? -4 : 0,
          backgroundColor: isHovered ? "#b3c5ff" : "#e5e2e1",
          color: isHovered ? "#002b75" : "#0a0a0a"
        }}
        className="relative z-10 border border-white/10 rounded-DEFAULT px-12 py-6 overflow-hidden shadow-sm metallic-edge"
      >
        <div className="relative z-20">
          {children}
        </div>
        
        {/* The Peeling Sticker Corner */}
        <motion.div 
          initial={false}
          animate={{ 
            width: isHovered ? 40 : 0,
            height: isHovered ? 40 : 0,
            opacity: isHovered ? 1 : 0
          }}
          className="absolute top-0 right-0 bg-white/40 backdrop-blur-md rounded-bl-DEFAULT border-b border-l border-white/20 pointer-events-none shadow-inner z-30"
        />
      </motion.div>
    </motion.div>
  );
}

import { Plus } from 'lucide-react';
import type { PlatformStatsData } from './PlatformStats';
import { formatRentMapped } from './PlatformStats';
import UnifiedMenu from './UnifiedMenu';
import { useDriverJS } from '@/hooks/useDriverJS';

export default function LandingPage({ platformStats }: { platformStats?: PlatformStatsData }) {
  const mainRef = useRef(null);
  useDriverJS('landing');

  useGSAP(() => {
    // Parallax background effect
    gsap.to('.bg-parallax', {
      y: -200,
      ease: 'none',
      scrollTrigger: {
        trigger: mainRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
      }
    });
  }, { scope: mainRef });

  return (
    <div ref={mainRef} className="bg-background text-on-background overflow-x-hidden antialiased font-sans relative selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Background - Dark Tactical */}
      <div className="fixed inset-0 z-0 bg-parallax opacity-20 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(255,255,255,0.02)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(255,255,255,0.02)_1px,_transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* TopNavBar - DESIGN.md Centered Layout */}
      <nav className="fixed top-0 w-full z-50 flex justify-center h-20 bg-background/80 backdrop-blur-xl border-b border-white/5 shadow-2xl px-mobile md:px-desktop">
        <div className="max-w-container w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <UnifiedMenu />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shadow-lg glow-primary">
                    <span className="material-symbols-outlined text-white text-sm">satellite_alt</span>
                </div>
                <span className="font-display text-2xl md:text-3xl text-primary font-black tracking-tighter uppercase">indian.rent</span>
              </div>
              <div className="font-technical text-[8px] uppercase tracking-[0.6em] text-primary/50 font-black ml-12 hidden md:block">WishLabs Intelligence</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-12 font-technical">
            <Link href="/explore" className="text-primary font-bold border-b-2 border-primary pb-1 transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.2em] text-[10px]">Interface</Link>
            <Link href="/analytics" className="text-on-surface-variant font-medium hover:text-primary transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.2em] text-[10px]">Intelligence</Link>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.2em] text-[10px]" href="#">Community</a>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.2em] text-[10px]" href="#">Node Map</a>
          </div>
          <div className="flex items-center gap-6">
            <div className="font-technical text-[10px] font-black uppercase tracking-widest text-secondary flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
               Live Protocol
            </div>
          </div>
        </div>
      </nav>

      <TracingBeam>
        {/* Hero Section */}
        <section data-tour="hero-section" className="relative min-h-screen flex items-center justify-center pt-24 px-mobile md:px-desktop overflow-hidden w-full">
          <div className="max-w-container w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mx-auto">
            <div className="flex flex-col gap-10">
              <div className="space-y-4">
                 <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-technical text-[10px] font-black uppercase tracking-[0.4em] text-primary"
                 >
                    Tactical Protocol // Active
                 </motion.div>
                 <HeroText />
              </div>
              <p className="text-body-md text-on-surface-variant max-w-lg leading-relaxed font-medium opacity-80 uppercase tracking-widest text-[10px] font-technical">
                Direct community rental protocol. Deploy nodes. Bypass middlemen. Reward intelligence.
              </p>
              <div className="flex gap-4 items-center mt-6">
                <MagneticButton>
                  <Link href="/explore" data-tour="explore-button">
                    <StickerButton>
                       <div className="flex items-center gap-4">
                        <span className="font-black uppercase tracking-[0.3em] text-[11px]">Deploy Interface</span>
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform font-black text-sm">radar</span>
                      </div>
                    </StickerButton>
                  </Link>
                </MagneticButton>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center relative w-full group">
               <div className="absolute w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full group-hover:bg-primary/10 transition-colors duration-1000" />
               <div className="w-full max-w-[600px] aspect-square relative z-10">
                 <GlobeAnalytics className="w-full h-full" />
               </div>
            </div>
          </div>
        </section>

        {/* Anti-Broker Loop Section */}
        <section className="py-40 px-mobile md:px-desktop relative z-10 w-full">
          <div className="max-w-container w-full mx-auto">
            <div className="mb-24 flex flex-col items-start space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="px-6 py-2 rounded-full border border-primary/20 bg-primary/5 font-technical text-technical-sm uppercase tracking-[0.5em] text-primary font-black"
              >
                Strategic Protocol
              </motion.div>
              <h2 className="text-headline-lg md:text-display-hero font-black text-on-background tracking-tighter uppercase leading-[0.9] text-left font-display">
                The Anti-Broker Loop
              </h2>
            </div>
            <BentoGrid />
          </div>
        </section>

        {/* Tactical Stats */}
        <section className="py-40 px-mobile md:px-desktop border-y border-white/5 bg-surface-container-lowest/50 w-full">
           <div className="max-w-container mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
              {[
                { label: 'Active Satellite Nodes', value: platformStats?.totalBuildings ? platformStats.totalBuildings.toLocaleString() : '—', sub: 'Hyderabad' },
                { label: 'P2P Value Exchange', value: platformStats?.totalRentMapped ? formatRentMapped(platformStats.totalRentMapped) : '—', sub: 'Good Faith' },
                { label: 'Network Latency', value: '<200ms', sub: 'Edge Sync' },
                { label: 'Direct Listings', value: '100%', sub: 'Verified' }
              ].map((stat, i) => (
                <div key={i} className="space-y-4 group">
                   <div className="font-technical text-[9px] uppercase tracking-[0.5em] text-primary font-black opacity-60 group-hover:opacity-100 transition-opacity">
                     {stat.label}
                   </div>
                   <div className="text-4xl md:text-7xl font-black tracking-tighter group-hover:text-primary transition-colors duration-500 text-on-background">
                     {stat.value}
                   </div>
                   <div className="text-[10px] uppercase tracking-widest font-black opacity-20 group-hover:opacity-60 transition-opacity font-technical">
                     {stat.sub}
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Final CTA */}
        <section className="py-80 px-mobile md:px-desktop flex flex-col items-center justify-center text-center relative overflow-hidden w-full">
           <div className="absolute inset-0 bg-primary/5 blur-[200px] animate-pulse" />
           <div className="max-w-container mx-auto relative z-10">
              <h2 className="text-headline-lg md:text-[10rem] font-black uppercase tracking-[calc(-0.06em)] mb-16 leading-none text-on-background font-display">
                Take the <br/> market back
              </h2>
              <Link href="/explore">
                <StickerButton>
                   <span className="px-8 font-black uppercase tracking-[0.4em] text-sm">Deploy Now &rarr;</span>
                </StickerButton>
              </Link>
           </div>
        </section>
      </TracingBeam>
      
      {/* Footer */}
      <footer className="py-24 px-mobile md:px-desktop border-t border-white/5 relative z-10 bg-background">
         <div className="max-w-container mx-auto flex flex-col md:flex-row justify-between items-center gap-12 w-full text-center md:text-left">
           <div className="flex flex-col items-center md:items-start gap-1">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm">satellite_alt</span>
               </div>
               <span className="font-display text-xl text-on-surface font-black tracking-tighter uppercase">indian.rent</span>
             </div>
             <div className="font-technical text-[9px] uppercase tracking-[0.4em] text-primary opacity-60 ml-1 font-black">Product of WishLabs.in</div>
           </div>
           <div className="flex gap-12 font-technical text-technical-sm uppercase tracking-widest opacity-40">
             <a href="#" className="hover:text-primary transition-colors">Documentation</a>
             <a href="#" className="hover:text-primary transition-colors">Privacy</a>
             <Link href="/terms" className="hover:text-primary transition-colors">T&C</Link>
             <a href="#" className="hover:text-primary transition-colors">HQ Support</a>
           </div>
           <div className="font-technical text-[9px] uppercase tracking-[0.6em] opacity-20 font-black">&copy; 2026 Direct Rental Protocol • A WishLabs Production</div>
         </div>
      </footer>
    </div>
  );
}
