'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Satellite, Loader2, CheckCircle2 } from 'lucide-react';
import MobileScrollProgress from './animations/MobileScrollProgress';
import { useScrollVelocity } from '@/lib/scroll-velocity-context';

const GlobeAnalytics = dynamic(() => import('./ui/cobe-globe-analytics').then(m => ({ default: m.GlobeAnalytics })), {
  ssr: false,
  loading: () => <div className="w-80 h-80 bg-white/5 rounded-full animate-pulse mx-auto" />,
});
import MagneticButton, { PeelingSticker } from './ui-advanced/TactileControls';
import TracingBeam from './ui-advanced/TracingBeam';
import { BentoGrid } from './ui-advanced/BentoGrid';
import { CitiesMarquee } from './ui-advanced/CitiesMarquee';
import HeroText from './ui-advanced/HeroText';
import { useTheme } from '@/hooks/useTheme';
import { TourHelpButton } from './TourHelpButton';

gsap.registerPlugin(ScrollTrigger);

function StickerButton({
  children,
  isLoading = false,
  isSuccess = false,
  disabled = false,
  onClick
}: {
  children: React.ReactNode
  isLoading?: boolean
  isSuccess?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useTheme();

  // Light mode: black background, dark mode: light cream
  const idleBg = theme === 'light' ? '#000000' : '#e5e2e1';
  const idleText = theme === 'light' ? '#ffffff' : '#0a0a0a';
  const hoverBg = theme === 'light' ? '#1a1a1a' : '#b3c5ff';
  const hoverText = theme === 'light' ? '#ffffff' : '#002b75';

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      onHoverStart={() => !isLoading && setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileTap={{ scale: 0.95 }}
      className="relative cursor-pointer group disabled:cursor-not-allowed"
    >
      {/* Shadow */}
      <div className={`absolute inset-0 bg-primary/20 blur-xl rounded-xl translate-y-2 scale-95 transition-opacity duration-500 ${isLoading || isSuccess ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />

      {/* Main Button Body */}
      <motion.div
        animate={{
          rotateX: isHovered ? 5 : 0,
          rotateY: isHovered ? -5 : 0,
          y: isHovered ? -4 : 0,
          backgroundColor: isSuccess
            ? "#5db8a6"
            : isLoading
              ? "#cc785c"
              : isHovered
                ? hoverBg
                : idleBg,
          color: isSuccess || isLoading ? "#ffffff" : isHovered ? hoverText : idleText
        }}
        className="relative z-10 border border-white/10 rounded-DEFAULT px-12 py-6 overflow-hidden shadow-sm metallic-edge transition-colors duration-300"
      >
        <div className="relative z-20 flex items-center justify-center gap-3">
          {isLoading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={20} strokeWidth={2.5} />
            </motion.div>
          )}
          {isSuccess && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 12, mass: 1 }}
            >
              <CheckCircle2 size={20} strokeWidth={2.5} />
            </motion.div>
          )}
          {children}
        </div>

        {/* The Peeling Sticker Corner */}
        <motion.div
          initial={false}
          animate={{
            width: (isHovered && !isLoading) ? 40 : 0,
            height: (isHovered && !isLoading) ? 40 : 0,
            opacity: (isHovered && !isLoading) ? 1 : 0
          }}
          className="absolute top-0 right-0 bg-white/40 backdrop-blur-md rounded-bl-DEFAULT border-b border-l border-white/20 pointer-events-none shadow-inner z-30"
        />
      </motion.div>
    </motion.button>
  );
}

import { Plus } from 'lucide-react';
import type { PlatformStatsData } from './PlatformStats';
import { formatRentMapped } from './PlatformStats';
import UnifiedMenu from './UnifiedMenu';
import ThemeToggle from './ThemeToggle';
import { useDriverJS } from '@/hooks/useDriverJS';

export default function LandingPage({ platformStats }: { platformStats?: PlatformStatsData }) {
  const mainRef = useRef(null);
  const router = useRouter();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const { shouldReduceComplexity } = useScrollVelocity();
  const { startTour, isEnabled } = useDriverJS();  // Initialize but don't auto-start

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploySuccess(true);
    await new Promise(r => setTimeout(r, 100));
    router.push('/explore');
  };

  useGSAP(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    // Skip complex scroll animations if user is fast-scrolling on mobile
    if (shouldReduceComplexity) return;

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

    // Hero section entrance animations
    gsap.from('.hero-headline', {
      opacity: 0,
      y: 60,
      rotate: -3,
      duration: 0.7,
      ease: 'back.out',
      delay: 0.1
    });

    gsap.from('.hero-subheading', {
      opacity: 0,
      y: 50,
      duration: 0.7,
      ease: 'back.out',
      delay: 0.3
    });

    // Parallax text depth on hero (mobile: 0.15x, tablet: 0.35x, desktop: 0.8x)
    gsap.to('.hero-subheading', {
      y: window.innerWidth >= 1024 ? 200 : window.innerWidth >= 768 ? 60 : 25,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom center',
        scrub: 1.2,
      }
    });

    gsap.from('.hero-cta-group', {
      opacity: 0,
      y: 50,
      scale: 0.9,
      duration: 0.7,
      ease: 'back.out',
      delay: 0.5
    });

    // Anti-Broker heading word-by-word reveal on scroll
    gsap.from(['.word-reveal-1', '.word-reveal-2', '.word-reveal-3'], {
      opacity: 0,
      y: 80,
      rotate: -5,
      duration: 0.6,
      stagger: 0.2,
      ease: 'back.out',
      scrollTrigger: {
        trigger: '.anti-broker-section',
        start: 'top 75%',
        once: true,
      }
    });

    // Tactical Stats reveal on scroll
    gsap.from('.stat-item', {
      opacity: 0,
      y: 60,
      scale: 0.85,
      stagger: 0.22,
      duration: 0.6,
      ease: 'back.out',
      scrollTrigger: {
        trigger: '.tactical-stats',
        start: 'top 70%',
        once: true,
      }
    });

    // Final CTA letter-cascade reveal on scroll
    gsap.from(['.cta-word-1', '.cta-word-2', '.cta-word-3', '.cta-word-4'], {
      opacity: 0,
      y: 100,
      rotate: -12,
      duration: 0.7,
      stagger: 0.25,
      ease: 'back.out',
      scrollTrigger: {
        trigger: '.final-cta',
        start: 'top 65%',
        once: true,
      }
    });

    // Powerful background parallax
    gsap.to('.bg-parallax-container', {
      y: -300,
      ease: 'none',
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2,
      }
    });
  }, { scope: mainRef });

  return (
    <div ref={mainRef} className="bg-background text-on-background overflow-x-hidden antialiased font-sans relative pt-16">
      <MobileScrollProgress />

      {/* Dynamic Background - Dark Tactical with Parallax */}
      <div className="bg-parallax-container bg-parallax fixed inset-0 z-0 opacity-30 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/15 via-background to-background" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(255,255,255,0.03)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(255,255,255,0.03)_1px,_transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* TopNavBar - DESIGN.md Centered Layout */}
      <nav className="fixed top-0 w-full z-50 flex justify-center h-16 bg-background backdrop-blur-xl border-b border-primary/20 shadow-2xl px-mobile md:px-desktop">
        <div className="max-w-container w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <UnifiedMenu />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center shadow-lg glow-primary">
                    <Satellite className="text-on-primary" size={16} strokeWidth={2.5} />
                </div>
                <span className="font-display text-lg md:text-xl text-primary font-black tracking-tighter uppercase">indian.rent</span>
              </div>
              <div className="font-technical text-[7px] uppercase tracking-[0.5em] text-primary/50 font-black ml-9 hidden md:block">WishLabs</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 font-technical">
            <Link href="/explore" className="text-primary font-bold border-b-2 border-primary pb-0.5 transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.1em] text-[12px]">Interface</Link>
            <Link href="/analytics" className="text-on-surface-variant font-medium hover:text-primary transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.1em] text-[12px]">Analytics</Link>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.1em] text-[12px]" href="/terms">Terms & Conditions</a>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden md:flex font-technical text-[12px] font-black uppercase tracking-widest text-secondary flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
               BETA
            </div>
            {isEnabled && <TourHelpButton tourName="landing" />}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <TracingBeam checkpoints={[0, 0.2, 0.5, 0.8, 1]}>
        {/* Hero Section */}
        <section data-tour="hero-section" className="hero-section relative min-h-screen flex items-center justify-center pt-8 md:pt-12 pb-12 md:pb-20 px-mobile md:px-desktop overflow-hidden w-full">
          <div className="max-w-container w-full grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center mx-auto">
            <div className="flex flex-col gap-10">
              <div className="space-y-4">
                 <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-technical text-[10px] font-black uppercase tracking-[0.4em] text-primary"
                 >
                    Tactical Protocol // Active
                 </motion.div>
                 <div className="hero-headline">
                   <HeroText />
                 </div>
              </div>
              <p className="hero-subheading text-body-md text-on-surface-variant max-w-lg leading-relaxed font-medium opacity-80 uppercase tracking-widest text-[10px] font-technical">
                Direct community rental protocol. Deploy nodes. Bypass middlemen. Reward intelligence.
              </p>
              <div className="hero-cta-group flex gap-4 items-center mt-6">
                <div className="group relative">
                  <MagneticButton>
                    <StickerButton
                      data-tour="explore-button"
                      onClick={handleDeploy}
                      isLoading={isDeploying}
                      isSuccess={deploySuccess}
                      disabled={isDeploying || deploySuccess}
                    >
                      <span className="font-black uppercase tracking-[0.3em] text-[12px]">
                        {isDeploying ? 'Connecting...' : deploySuccess ? 'Connected' : 'Deploy Interface'}
                      </span>
                      {!isDeploying && !deploySuccess && (
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform font-black text-sm">radar</span>
                      )}
                    </StickerButton>
                  </MagneticButton>
                  {!isDeploying && !deploySuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2, duration: 0.6 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-surface-container-high text-inverse-on-surface text-[11px] rounded-md whitespace-nowrap pointer-events-none z-50 font-medium"
                    >
                      Explore map & listings
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-container-high rotate-45"></div>
                    </motion.div>
                  )}
                </div>
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

        {/* Cities Marquee - Live Coverage */}
        <CitiesMarquee />

        {/* Anti-Broker Loop Section */}
        <section className="anti-broker-section py-16 md:py-32 lg:py-40 px-mobile md:px-desktop relative z-10 w-full">
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
              <h2 className="anti-broker-heading text-headline-lg md:text-display-hero font-black text-on-background tracking-tighter uppercase leading-[0.9] text-left font-display">
                <span className="word-reveal-1 inline-block">The</span>
                {' '}
                <span className="word-reveal-2 inline-block">Anti-Broker</span>
                {' '}
                <span className="word-reveal-3 inline-block">Loop</span>
              </h2>
            </div>
            <BentoGrid />
          </div>
        </section>

        {/* Tactical Stats */}
        <section className="tactical-stats py-20 md:py-40 px-mobile md:px-desktop border-y border-white/5 bg-surface-container-lowest/50 w-full">
           <div className="max-w-container mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12">
              {[
                { label: 'Active Satellite Nodes', value: platformStats?.totalBuildings ? platformStats.totalBuildings.toLocaleString() : '—', sub: 'Hyderabad' },
                { label: 'P2P Value Exchange', value: platformStats?.totalRentMapped ? formatRentMapped(platformStats.totalRentMapped) : '—', sub: 'Good Faith' },
                { label: 'Network Latency', value: '<200ms', sub: 'Edge Sync' },
                { label: 'Direct Listings', value: '100%', sub: 'Verified' }
              ].map((stat, i) => (
                <div key={i} className="stat-item space-y-2 md:space-y-4 group">
                   <div className="font-technical text-[8px] md:text-[9px] uppercase tracking-[0.4em] md:tracking-[0.5em] text-primary font-black opacity-60 group-hover:opacity-100 transition-opacity">
                     {stat.label}
                   </div>
                   <div className="text-2xl md:text-4xl lg:text-7xl font-black tracking-tighter group-hover:text-primary transition-colors duration-500 text-on-background leading-none">
                     {stat.value}
                   </div>
                   <div className="text-[9px] md:text-[10px] uppercase tracking-widest font-black opacity-20 group-hover:opacity-60 transition-opacity font-technical">
                     {stat.sub}
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta py-20 md:py-40 lg:py-80 px-mobile md:px-desktop flex flex-col items-center justify-center text-center relative overflow-hidden w-full">
           <div className="absolute inset-0 bg-primary/5 blur-[200px] animate-pulse" />
           <div className="max-w-container mx-auto relative z-10">
              <h2 className="final-cta-title text-2xl md:text-4xl lg:text-6xl xl:text-[10rem] font-black uppercase tracking-[calc(-0.06em)] mb-6 md:mb-12 lg:mb-16 leading-tight md:leading-none text-on-background font-display">
                <span className="cta-word-1 inline-block">Take</span>
                {' '}
                <span className="cta-word-2 inline-block">the</span>
                <br className="hidden md:block"/>
                {' '}
                <span className="cta-word-3 inline-block">market</span>
                {' '}
                <span className="cta-word-4 inline-block">back</span>
              </h2>
              <StickerButton
                onClick={handleDeploy}
                isLoading={isDeploying}
                isSuccess={deploySuccess}
                disabled={isDeploying || deploySuccess}
              >
                <span className="px-8 font-black uppercase tracking-[0.4em] text-sm">
                  {isDeploying ? 'Connecting...' : deploySuccess ? 'Connected' : 'Deploy Now →'}
                </span>
              </StickerButton>
           </div>
        </section>
      </TracingBeam>
      
      {/* Footer */}
      <footer className="py-24 px-mobile md:px-desktop border-t border-white/5 relative z-10 bg-background">
         <div className="max-w-container mx-auto flex flex-col md:flex-row justify-between items-center gap-12 w-full text-center md:text-left">
           <div className="flex flex-col items-center md:items-start gap-1">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <Satellite className="text-on-primary" size={20} strokeWidth={2.5} />
               </div>
               <span className="font-display text-lg text-on-surface font-black tracking-tighter uppercase">indian.rent</span>
             </div>
             <div className="font-technical text-[10px] uppercase tracking-[0.3em] text-primary opacity-60 ml-1 font-black">Product of WishLabs.in</div>
           </div>
           <div className="flex gap-12 font-technical text-[12px] uppercase tracking-widest opacity-60 font-medium">
             <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
             <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
             <Link href="/terms" className="hover:text-primary transition-colors">T&C</Link>
             <a href="mailto:support@wishlabs.in" className="hover:text-primary transition-colors">HQ Support</a>
           </div>
           <div className="font-technical text-[10px] uppercase tracking-[0.4em] opacity-40 font-black">&copy; 2026 Direct Rental Protocol • A WishLabs Production</div>
         </div>
      </footer>
    </div>
  );
}
