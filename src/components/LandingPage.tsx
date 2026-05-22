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
import { CommunityBenefitsSection } from './ui-advanced/CommunityBenefitsSection';
import { StickyScrollReveal } from './ui-advanced/StickyScrollReveal';
import { SpotlightCard } from './ui-advanced/SpotlightCard';
import { MobileTextReveal } from './animations/MobileTextReveal';

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

    const isMobile = window.innerWidth < 768;

    // Skip complex scroll animations if user is fast-scrolling on mobile
    if (shouldReduceComplexity) return;

    // Parallax background effect - reduced on mobile
    gsap.to('.bg-parallax', {
      y: isMobile ? -80 : -200,
      ease: 'none',
      scrollTrigger: {
        trigger: mainRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: isMobile ? 2 : true,
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
      y: 60,
      duration: 0.9,
      ease: 'back.out',
      delay: 0.4,
      clearProps: 'all'
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
        onEnter: () => {},
      }
    });

    // Tactical Stats reveal on scroll - optimized for mobile
    gsap.from('.stat-item', {
      opacity: 0,
      y: isMobile ? 40 : 60,
      scale: 0.85,
      stagger: isMobile ? 0.15 : 0.22,
      duration: isMobile ? 0.5 : 0.6,
      ease: 'back.out',
      scrollTrigger: {
        trigger: '.tactical-stats',
        start: 'top 70%',
        onEnter: () => {},
      }
    });

    // Final CTA letter-cascade reveal on scroll - MAKE DRAMATIC AND VISIBLE
    gsap.from(['.cta-word-1', '.cta-word-2', '.cta-word-3', '.cta-word-4'], {
      opacity: 0,
      y: 150,
      rotate: -15,
      scale: 0.7,
      duration: 1,
      stagger: 0.3,
      ease: 'back.out',
      scrollTrigger: {
        trigger: '.final-cta',
        start: 'top 70%',
        onEnter: () => {},
      }
    });

    // Powerful background parallax - optimized for mobile
    gsap.to('.bg-parallax-container', {
      y: isMobile ? -120 : -300,
      ease: 'none',
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: isMobile ? 2.5 : 2,
      }
    });
  }, { scope: mainRef });

  return (
    <div ref={mainRef} className="bg-background text-on-background overflow-x-hidden antialiased font-sans relative pt-16">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary focus:rounded focus:outline-none">
        Skip to content
      </a>
      <MobileScrollProgress />

      {/* Dynamic Background - Dark Tactical with Parallax */}
      <div className="bg-parallax-container bg-parallax fixed inset-0 z-0 opacity-30 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/15 via-background to-background" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(255,255,255,0.03)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(255,255,255,0.03)_1px,_transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* TopNavBar - DESIGN.md Centered Layout */}
      <nav className="fixed top-0 w-full z-50 flex justify-center h-16 bg-background backdrop-blur-xl border-b border-primary/20 shadow-2xl px-mobile md:px-desktop" aria-label="Main navigation">
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
        {/* Hero Section - Sophisticated Background Globe Design */}
        <section id="main-content" data-tour="hero-section" className="hero-section relative w-full min-h-screen flex items-center justify-center pt-8 md:pt-12 pb-8 md:pb-20 px-mobile md:px-desktop overflow-hidden">
          {/* Background Globe Layer - Behind Everything */}
          <div className="absolute inset-0 -z-20 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Globe positioned in background */}
              <div className="absolute w-[600px] h-[600px] md:w-[900px] md:h-[900px] lg:w-[1200px] lg:h-[1200px] opacity-20 md:opacity-30 pointer-events-none">
                <GlobeAnalytics className="w-full h-full" />
              </div>

              {/* Radial gradient fade mask - smooth blend */}
              <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
              <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
            </motion.div>
          </div>

          {/* Content Layer - Foreground */}
          <div className="max-w-container w-full mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
              {/* Text Content - Left Side */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="flex flex-col gap-10"
              >
                {/* Label */}
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.7 }}
                    className="font-technical text-[10px] font-black uppercase tracking-[0.4em] text-primary"
                  >
                    Tactical Protocol // Active
                  </motion.div>

                  {/* Hero Headline with Glass Effect Background */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="relative"
                  >
                    {/* Subtle glass background behind text */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg blur-2xl -z-10" />
                    <div className="hero-headline relative">
                      <HeroText />
                    </div>
                  </motion.div>
                </div>

                {/* Subheading with Dynamic Text Reveal */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="hero-subheading max-w-xs sm:max-w-lg"
                >
                  <MobileTextReveal
                    text="Community Intelligence • Direct Rentals • Fair Pricing • Zero Middlemen"
                    className="text-body-md text-on-surface-variant leading-snug sm:leading-relaxed font-medium opacity-70 hover:opacity-100 transition-opacity duration-500 uppercase tracking-widest text-[8px] sm:text-[10px] font-technical backdrop-blur-sm px-4 py-3 rounded-lg bg-surface/30"
                    delay={0.6}
                    staggerDuration={0.04}
                    containerDelay={0.08}
                    splitByWord={true}
                  />
                </motion.div>

                {/* CTA Button Group */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="hero-cta-group flex gap-4 items-center mt-8"
                >
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
                        className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-surface-container-high text-inverse-on-surface text-[11px] rounded-md whitespace-nowrap pointer-events-none z-50 font-medium"
                      >
                        Explore map & listings
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-container-high rotate-45"></div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Side - Information Density (Hidden on mobile, visible on lg) */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                className="hidden lg:flex flex-col gap-8 items-end"
              >
                {/* Network Stats Cards - Overlaid on Globe */}
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="backdrop-blur-lg bg-surface/40 border border-primary/20 rounded-lg p-6 shadow-2xl hover:shadow-primary/20 transition-shadow"
                >
                  <div className="font-technical text-[10px] text-primary/70 mb-2">NETWORK STATUS</div>
                  <div className="text-3xl font-black text-primary">4 Cities</div>
                  <div className="text-xs text-on-surface-variant/60 mt-2">Live Network Nodes</div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
                  className="backdrop-blur-lg bg-secondary/40 border border-secondary/20 rounded-lg p-6 shadow-2xl hover:shadow-secondary/20 transition-shadow"
                >
                  <div className="font-technical text-[10px] text-secondary/70 mb-2">EXPANSION LANE</div>
                  <div className="text-3xl font-black text-secondary">4 Cities</div>
                  <div className="text-xs text-on-surface-variant/60 mt-2">Coming Soon</div>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Floating Accent Elements */}
          <motion.div
            className="absolute bottom-10 right-10 w-20 h-20 bg-primary/10 rounded-full blur-3xl pointer-events-none"
            animate={{
              y: [0, 20, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </section>

        {/* Cities Marquee - Live Coverage */}
        <CitiesMarquee />

        {/* Community Network Section */}
        <section className="anti-broker-section py-16 md:py-32 lg:py-40 px-mobile md:px-desktop relative z-10 w-full">
          <div className="max-w-container w-full mx-auto">
            <div className="mb-24 flex flex-col items-start space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="px-6 py-2 rounded-full border border-primary/20 bg-primary/5 font-technical text-technical-sm uppercase tracking-[0.5em] text-primary font-black"
              >
                How It Works
              </motion.div>
              <h2 className="anti-broker-heading text-headline-lg md:text-display-hero font-black text-on-background tracking-tighter uppercase leading-[0.9] text-left font-display">
                <span className="word-reveal-1 inline-block">The</span>
                {' '}
                <span className="word-reveal-2 inline-block">Community</span>
                {' '}
                <span className="word-reveal-3 inline-block">Network</span>
              </h2>
            </div>
            <BentoGrid />
          </div>
        </section>

        {/* Community Benefits Section - Enhanced with Aceternity */}
        <section className="py-16 md:py-32 lg:py-40 px-mobile md:px-desktop relative z-10 w-full overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-primary/5 rounded-full blur-3xl opacity-20" />
            <div className="absolute bottom-0 right-1/4 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-secondary/5 rounded-full blur-3xl opacity-20" />
          </div>

          <div className="max-w-container mx-auto">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12 md:mb-24 text-center max-w-2xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-[9px] md:text-[10px] font-technical uppercase tracking-[0.3em] text-primary font-black">
                  Community-Driven Intelligence
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-on-surface uppercase tracking-tight leading-tight mb-4">
                Why Community Matters
              </h2>
              <p className="text-sm md:text-base text-on-surface-variant/70 font-medium leading-relaxed">
                Built by renters, for renters. Every feature designed to strengthen the peer-to-peer network and reward community participation.
              </p>
            </motion.div>

            {/* Benefits using StickyScrollReveal */}
            <StickyScrollReveal
              items={[
                {
                  title: 'Community Intelligence',
                  description: 'Real rents from real people. No middlemen. Pure peer-to-peer market data.',
                  content: (
                    <div className="space-y-4">
                      <div className="text-5xl font-black text-primary/30">📊</div>
                      <p className="text-sm text-on-surface font-medium">Access verified rental data collected directly from community members, ensuring accuracy and transparency.</p>
                    </div>
                  )
                },
                {
                  title: 'Zero Broker Friction',
                  description: 'Direct contact with landlords. Transparent terms. No commission feeds.',
                  content: (
                    <div className="space-y-4">
                      <div className="text-5xl font-black text-secondary/30">⚡</div>
                      <p className="text-sm text-on-surface font-medium">Connect directly with property owners and skip the middleman. Save money, time, and hassle.</p>
                    </div>
                  )
                },
                {
                  title: 'Good Faith Rewards',
                  description: 'Contribute verified listings. Earn rewards. Build community value.',
                  content: (
                    <div className="space-y-4">
                      <div className="text-5xl font-black text-amber-400/30">💰</div>
                      <p className="text-sm text-on-surface font-medium">Get rewarded for contributing accurate listing data and helping other renters find their perfect home.</p>
                    </div>
                  )
                },
                {
                  title: 'Transparent Verification',
                  description: 'Every rental verified by the community. Flags protect everyone.',
                  content: (
                    <div className="space-y-4">
                      <div className="text-5xl font-black text-blue-400/30">🔐</div>
                      <p className="text-sm text-on-surface font-medium">Community-driven verification ensures every listing is authentic and safe for renters and landlords.</p>
                    </div>
                  )
                },
                {
                  title: 'Market Intelligence',
                  description: 'Area statistics, price trends, demand heatmaps. Make informed decisions.',
                  content: (
                    <div className="space-y-4">
                      <div className="text-5xl font-black text-pink-400/30">📈</div>
                      <p className="text-sm text-on-surface font-medium">Real-time market insights help you understand trends and make data-driven rental decisions.</p>
                    </div>
                  )
                },
                {
                  title: 'Expanding Network',
                  description: 'Growing across metros. More cities, more rentals, stronger network.',
                  content: (
                    <div className="space-y-4">
                      <div className="text-5xl font-black text-cyan-400/30">🌐</div>
                      <p className="text-sm text-on-surface font-medium">Join a rapidly growing peer-to-peer rental network expanding to major cities across India.</p>
                    </div>
                  )
                }
              ]}
              contentClassName="text-on-surface"
            />

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-12 md:mt-20 p-5 md:p-8 rounded-lg md:rounded-2xl border border-primary/20 bg-primary/5 text-center"
            >
              <p className="text-sm md:text-base text-on-surface font-medium mb-1.5">
                Every listing verified. Every contributor rewarded.
              </p>
              <p className="text-xs text-on-surface-variant/60 font-technical uppercase tracking-[0.2em]">
                Join the peer-to-peer revolution
              </p>
            </motion.div>
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
