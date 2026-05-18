'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Home, Banknote, Users, Zap, Shield, Target, Map as MapIcon, ChevronLeft, ArrowUpRight, Globe, Activity, Menu, LayoutDashboard, Info, Satellite } from 'lucide-react';
import Link from 'next/link';
import type { PlatformStatsData } from '@/components/PlatformStats';
import UnifiedMenu from '@/components/UnifiedMenu';

export default function AnalyticsDashboard({ stats }: { stats: PlatformStatsData }) {
  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString()}`;
  };

  const cards = [
    {
      title: "Tactical Nodes",
      value: stats.totalBuildings.toLocaleString(),
      sub: "Verified Buildings",
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/10",
      description: "Active structural nodes deployed across the Hyderabad tactical grid."
    },
    {
      title: "Live Intel",
      value: stats.totalListings.toLocaleString(),
      sub: "Active Listings",
      icon: Home,
      color: "text-secondary",
      bg: "bg-secondary/10",
      description: "Direct-to-consumer rental opportunities currently available for deployment."
    },
    {
      title: "Value Mapped",
      value: formatCurrency(stats.totalRentMapped),
      sub: "P2P Economy",
      icon: Banknote,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      description: "Total monthly rental volume bypasssed from traditional brokerage fees."
    },
    {
      title: "Active Seekers",
      value: stats.totalSeekerPins.toLocaleString(),
      sub: "Network Demand",
      icon: Users,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      description: "Live seeker pins identifying high-demand sectors in the community."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-on-background font-sans selection:bg-primary/20">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(255,255,255,0.02)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(255,255,255,0.02)_1px,_transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <nav className="fixed top-0 w-full z-50 flex justify-center h-20 bg-background/80 backdrop-blur-xl border-b border-white/5 shadow-2xl px-6">
        <div className="max-w-7xl w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <UnifiedMenu />
            <Link href="/" className="flex items-center gap-4 group">
               <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <ChevronLeft size={18} className="text-on-primary" strokeWidth={3} />
               </div>
               <div className="flex flex-col -gap-1">
                 <span className="font-display text-xl text-primary font-black tracking-tighter uppercase">indian.rent</span>
                 <span className="text-[7px] uppercase tracking-[0.4em] text-primary/40 font-black">Intelligence HQ</span>
               </div>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <div className="font-technical text-[10px] font-black uppercase tracking-widest text-secondary flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
               Protocol Link Stable
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">
        <header className="mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-technical text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-4"
          >
            System Metrics // Data Visualization
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none font-display mb-6">
            Network <br/> Intelligence
          </h1>
          <p className="text-on-surface-variant max-w-2xl font-medium opacity-60 uppercase tracking-widest text-[11px] font-technical leading-relaxed">
            Real-time telemetry from the direct rental protocol. Monitoring P2P value exchange, node health, and community deployment velocity.
          </p>
        </header>

        {/* Bento Grid Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {cards.map((card, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="glass-plate border border-white/5 p-8 rounded-lg relative overflow-hidden group"
            >
              <div className={`absolute -right-4 -top-4 w-24 h-24 ${card.bg} blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity`} />
              <card.icon className={`${card.color} mb-6`} size={32} />
              <div className="text-4xl font-black tracking-tighter mb-1 text-on-background">
                {card.value}
              </div>
              <div className="font-technical text-[10px] uppercase tracking-[0.2em] font-black opacity-40 mb-4">
                {card.sub}
              </div>
              <p className="text-[10px] font-technical uppercase tracking-widest leading-relaxed opacity-30 group-hover:opacity-60 transition-opacity">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Growth Chart Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 glass-plate border border-white/5 p-8 rounded-lg"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Deployment Velocity</h3>
                <p className="font-technical text-[9px] uppercase tracking-[0.3em] opacity-40">Monthly growth trajectory</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full">
                <ArrowUpRight size={12} className="text-secondary" />
                <span className="text-secondary font-technical text-[9px] font-black tracking-widest">+12.4%</span>
              </div>
            </div>
            
            <div className="h-64 w-full flex items-end gap-2 px-2">
               {[40, 60, 45, 70, 90, 85, 100, 110, 130, 150, 140, 180].map((h, i) => (
                 <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.8 + (i * 0.05), duration: 1, ease: "circOut" }}
                      className="w-full bg-primary/20 group-hover:bg-primary/50 transition-colors rounded-t-sm relative"
                    >
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_rgba(179,197,255,0.8)]" />
                    </motion.div>
                    <span className="text-[7px] font-technical font-black opacity-20 uppercase tracking-tighter">M{i+1}</span>
                 </div>
               ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-plate border border-white/5 p-8 rounded-lg flex flex-col"
          >
            <h3 className="text-xl font-black uppercase tracking-tight mb-8">Network Status</h3>
            <div className="space-y-6 flex-1">
               {[
                 { label: 'Satellite Uplink', status: 'Optimal', icon: Globe, color: 'text-secondary' },
                 { label: 'Blockchain Cache', status: 'Synced', icon: Zap, color: 'text-primary' },
                 { label: 'Community Trust', status: 'High', icon: Shield, color: 'text-emerald-400' },
                 { label: 'Sector Coverage', status: '84%', icon: Target, color: 'text-amber-400' },
                 { label: 'API Latency', status: '42ms', icon: Activity, color: 'text-secondary' }
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <item.icon size={16} className={`${item.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                       <span className="text-[10px] font-technical uppercase tracking-widest font-black opacity-60">{item.label}</span>
                    </div>
                    <span className={`text-[10px] font-technical font-black uppercase tracking-widest ${item.color}`}>{item.status}</span>
                 </div>
               ))}
            </div>
            <div className="mt-8 pt-8 border-t border-white/5">
               <p className="font-technical text-[8px] uppercase tracking-[0.5em] opacity-20 leading-relaxed">
                 Next telemetry sweep in 04:22:15. Protocol version 1.0.2 active.
               </p>
            </div>
          </motion.div>
        </div>

        <section className="mt-24 text-center">
           <Link href="/explore">
              <button className="px-12 py-5 bg-white/5 border border-white/10 rounded-lg font-black uppercase tracking-[0.4em] text-[11px] hover:bg-primary hover:text-on-primary transition-all active:scale-95 shadow-xl">
                Return to Tactical Grid &rarr;
              </button>
           </Link>
        </section>
      </main>

      <footer className="py-24 px-6 border-t border-white/5 relative z-10 bg-background/50 backdrop-blur-md mt-12">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 w-full text-center md:text-left">
           <div className="flex flex-col items-center md:items-start gap-1">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm">satellite_alt</span>
               </div>
               <span className="font-display text-xl text-on-surface font-black tracking-tighter uppercase">indian.rent</span>
             </div>
             <div className="font-technical text-[9px] uppercase tracking-[0.4em] text-primary opacity-60 ml-1 font-black">WishLabs Intelligence HQ</div>
           </div>
           <div className="flex gap-12 font-technical text-technical-sm uppercase tracking-widest opacity-40">
             <a href="#" className="hover:text-primary transition-colors">Documentation</a>
             <a href="#" className="hover:text-primary transition-colors">Privacy</a>
             <a href="#" className="hover:text-primary transition-colors">T&C</a>
             <a href="#" className="hover:text-primary transition-colors">HQ Support</a>
           </div>
           <div className="font-technical text-[9px] uppercase tracking-[0.6em] opacity-20 font-black">&copy; 2026 Direct Rental Protocol • A WishLabs Production</div>
         </div>
      </footer>
    </div>
  );
}
