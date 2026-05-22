'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Zap, DollarSign, Lock, TrendingUp, Globe } from 'lucide-react';
import { MobileCardReveal } from '@/components/animations/MobileCardReveal';

const benefits = [
  {
    icon: Users,
    title: 'Community Intelligence',
    description: 'Real rents from real people. No middlemen. Pure peer-to-peer market data.',
    color: 'from-emerald-500/20 to-emerald-500/5',
    accent: 'text-emerald-400',
    borderColor: 'border-emerald-500/30'
  },
  {
    icon: Zap,
    title: 'Zero Broker Friction',
    description: 'Direct contact with landlords. Transparent terms. No commission feeds.',
    color: 'from-amber-500/20 to-amber-500/5',
    accent: 'text-amber-400',
    borderColor: 'border-amber-500/30'
  },
  {
    icon: DollarSign,
    title: 'Good Faith Rewards',
    description: 'Contribute verified listings. Earn rewards. Build community value.',
    color: 'from-blue-500/20 to-blue-500/5',
    accent: 'text-blue-400',
    borderColor: 'border-blue-500/30'
  },
  {
    icon: Lock,
    title: 'Transparent Verification',
    description: 'Every rental verified by the community. Flags protect everyone.',
    color: 'from-purple-500/20 to-purple-500/5',
    accent: 'text-purple-400',
    borderColor: 'border-purple-500/30'
  },
  {
    icon: TrendingUp,
    title: 'Market Intelligence',
    description: 'Area statistics, price trends, demand heatmaps. Make informed decisions.',
    color: 'from-pink-500/20 to-pink-500/5',
    accent: 'text-pink-400',
    borderColor: 'border-pink-500/30'
  },
  {
    icon: Globe,
    title: 'Expanding Network',
    description: 'Growing across metros. More cities, more rentals, stronger network.',
    color: 'from-cyan-500/20 to-cyan-500/5',
    accent: 'text-cyan-400',
    borderColor: 'border-cyan-500/30'
  }
];

export function MobileOptimizedBenefitsSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={containerRef}
      className="py-16 md:py-32 lg:py-40 px-mobile md:px-desktop relative z-10 w-full overflow-hidden"
    >
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
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <span className="text-[8px] md:text-[10px] font-technical uppercase tracking-[0.3em] text-primary font-black">
              Why Choose Us
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-on-surface uppercase tracking-tight leading-tight mb-3">
            Community Benefits
          </h2>
          <p className="text-xs md:text-sm text-on-surface-variant/70 font-medium leading-relaxed">
            Built by renters, for renters. Every feature designed to strengthen the peer-to-peer network.
          </p>
        </motion.div>

        {/* Benefits Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <MobileCardReveal
                key={index}
                index={index}
                direction={index % 2 === 0 ? 'left' : 'right'}
                staggerDelay={0.08}
                className="h-full"
              >
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`relative h-full p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border ${benefit.borderColor} bg-gradient-to-br ${benefit.color} backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-lg`}
                >
                  {/* Gradient shine effect on hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 hover:opacity-30 transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(ellipse at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 70%)'
                    }}
                  />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col h-full gap-3">
                    {/* Icon container */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${benefit.accent} bg-current/10`}
                    >
                      <Icon size={20} className="opacity-80" />
                    </motion.div>

                    {/* Text */}
                    <div className="flex-1">
                      <h3 className="text-sm md:text-base font-black text-on-surface mb-1.5 uppercase tracking-tight">
                        {benefit.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant/60 font-medium leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>

                    {/* Bottom accent line - animated on hover */}
                    <motion.div
                      initial={{ width: 0 }}
                      whileHover={{ width: 24 }}
                      transition={{ duration: 0.3 }}
                      className={`h-0.5 ${benefit.accent} from-current`}
                    />
                  </div>
                </motion.div>
              </MobileCardReveal>
            );
          })}
        </div>

        {/* Call out section */}
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
  );
}
