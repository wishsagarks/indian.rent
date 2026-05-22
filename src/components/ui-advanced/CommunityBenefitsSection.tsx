'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, Zap, DollarSign, Lock, TrendingUp, Globe } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const benefits = [
  {
    icon: Users,
    title: 'Community Intelligence',
    description: 'Real rents from real people. No middlemen. Pure peer-to-peer market data.',
    color: 'from-emerald-500/20 to-emerald-500/5',
    accent: 'text-emerald-400'
  },
  {
    icon: Zap,
    title: 'Zero Broker Friction',
    description: 'Direct contact with landlords. Transparent terms. No commission feeds.',
    color: 'from-amber-500/20 to-amber-500/5',
    accent: 'text-amber-400'
  },
  {
    icon: DollarSign,
    title: 'Good Faith Rewards',
    description: 'Contribute verified listings. Earn rewards. Build community value.',
    color: 'from-blue-500/20 to-blue-500/5',
    accent: 'text-blue-400'
  },
  {
    icon: Lock,
    title: 'Transparent Verification',
    description: 'Every rental verified by the community. Flags protect everyone.',
    color: 'from-purple-500/20 to-purple-500/5',
    accent: 'text-purple-400'
  },
  {
    icon: TrendingUp,
    title: 'Market Intelligence',
    description: 'Area statistics, price trends, demand heatmaps. Make informed decisions.',
    color: 'from-pink-500/20 to-pink-500/5',
    accent: 'text-pink-400'
  },
  {
    icon: Globe,
    title: 'Expanding Network',
    description: 'Growing across metros. More cities, more rentals, stronger network.',
    color: 'from-cyan-500/20 to-cyan-500/5',
    accent: 'text-cyan-400'
  }
];

export function CommunityBenefitsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = cardsRef.current;

    // Stagger animation on scroll
    cards.forEach((card, index) => {
      gsap.fromTo(
        card,
        {
          opacity: 0,
          y: 60,
          rotateX: -10
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            end: 'top 50%',
            scrub: 0.5,
            markers: false
          },
          delay: index * 0.1
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <section className="community-benefits py-20 md:py-32 lg:py-40 px-mobile md:px-desktop relative z-10 w-full overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="max-w-container mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 md:mb-24 text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-technical uppercase tracking-[0.3em] text-primary font-black">
              How It Works
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-on-surface uppercase tracking-tight leading-tight mb-4">
            Community-Driven Rental Intelligence
          </h2>
          <p className="text-sm md:text-base text-on-surface-variant/70 font-medium leading-relaxed">
            Built by renters, for renters. Every feature designed to strengthen the peer-to-peer network and reward community participation.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                ref={(el) => {
                  if (el) cardsRef.current[index] = el;
                }}
                className="group perspective"
              >
                <motion.div
                  whileHover={{ y: -8, rotateX: 2 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className={`relative h-full p-6 md:p-8 rounded-2xl border border-outline/20 bg-gradient-to-br ${benefit.color} backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-outline/40`}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-300" style={{
                    background: 'radial-gradient(ellipse at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 70%)'
                  }} />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Icon container */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${benefit.accent} bg-current/10`}>
                      <Icon size={24} className="opacity-80" />
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-black text-on-surface mb-2 uppercase tracking-tight">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-on-surface-variant/60 font-medium leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>

                    {/* Bottom accent line */}
                    <div className={`mt-4 h-1 w-0 group-hover:w-8 bg-gradient-to-r ${benefit.accent} from-current transition-all duration-500`} />
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Call out section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 md:mt-28 p-8 md:p-12 rounded-2xl border border-primary/20 bg-primary/5 text-center"
        >
          <p className="text-base md:text-lg text-on-surface font-medium mb-2">
            Every listing verified. Every contributor rewarded.
          </p>
          <p className="text-sm text-on-surface-variant/60 font-technical uppercase tracking-[0.2em]">
            Welcome to the peer-to-peer rental revolution
          </p>
        </motion.div>
      </div>
    </section>
  );
}
