'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Home, Banknote, Users, Zap, Shield, Target, Map as MapIcon, ChevronLeft, ArrowUpRight, Globe, Activity, Menu, LayoutDashboard, Info, Satellite } from 'lucide-react';
import Link from 'next/link';
import type { PlatformStatsData } from '@/components/PlatformStats';
import UnifiedMenu from '@/components/UnifiedMenu';
import ThemeToggle from '@/components/ThemeToggle';
import { ExperimentBadge } from '@/components/badges/ExperimentBadge';

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
      description: "Active structural nodes deployed across our rental network."
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
      sub: "Monthly P2P Flow",
      icon: Banknote,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      description: "Total monthly rental volume bypassed from traditional brokerage fees."
    },
    {
      title: "Brokerage Bypassed",
      value: formatCurrency(stats.totalRentMapped * 1.2), // Derived: ~1.2x monthly rent (1mo fee + admin)
      sub: "Economy Thwarted",
      icon: Zap,
      color: "text-primary",
      bg: "bg-primary/10",
      description: "Estimated capital retained (based on avg 1.2x monthly rent broker fee)"
    }
  ];

  const dbSizeMB = Math.round((stats.dbSizeBytes || 0) / 1024 / 1024);
  const dbPercent = Math.min((dbSizeMB / 500) * 100, 100);

  const systemMetrics = [
    {
      label: "DB Storage",
      value: dbSizeMB.toLocaleString(),
      limit: "500 MB",
      percent: dbPercent,
      sub: "Supabase Free Tier",
      icon: Activity,
      color: "text-secondary"
    },
    {
      label: "Snapshot Sync",
      value: stats.totalListings > 0 ? 'Live' : '—',
      limit: "Real-time",
      percent: 100,
      sub: "Realtime Updates",
      icon: Globe,
      color: "text-primary"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-on-background font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-secondary/5 to-background" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(0,102,255,0.05)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(47,248,1,0.05)_1px,_transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <nav className="fixed top-0 w-full z-50 flex justify-center h-20 bg-background/90 backdrop-blur-xl border-b border-primary/30 shadow-glow-blue-sm px-mobile md:px-desktop">
        <div className="max-w-container w-full flex justify-between items-center">
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
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24 px-mobile md:px-desktop max-w-container mx-auto">
        <header className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-technical text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-6"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span className="block">System Metrics // Data Visualization</span>
              <ExperimentBadge size="md" />
            </div>
            <Link href="/analytics/v2" className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-secondary/30 to-secondary/20 border-2 border-secondary shadow-glow-green rounded-xl hover:shadow-[0_0_20px_rgba(47,248,1,0.6)] hover:from-secondary/50 hover:to-secondary/30 transition-all group active:scale-95 whitespace-nowrap text-xs md:text-[12px]">
              <span className="font-black uppercase tracking-widest text-secondary drop-shadow-lg">✨ v2</span>
              <svg className="w-4 md:w-5 h-4 md:h-5 text-secondary group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none font-display mb-6">
            Network <br/> Intelligence
          </h1>
          <p className="text-on-surface-variant max-w-2xl font-medium opacity-60 uppercase tracking-widest text-[11px] font-technical leading-relaxed">
            Real-time telemetry from the direct rental protocol. Monitoring P2P value exchange, node health, and community deployment velocity.
          </p>
        </header>

        {/* Resource Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {systemMetrics.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`glass-plate border p-6 rounded-lg flex flex-col gap-4 ${
                m.color === 'text-secondary'
                  ? 'border-secondary/50 shadow-glow-green-sm'
                  : 'border-primary/50 shadow-glow-blue-sm'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <m.icon className={`${m.color} drop-shadow-lg`} size={18} />
                  <span className="font-technical text-[10px] font-black uppercase tracking-widest text-on-surface">{m.label}</span>
                </div>
                <div className="text-[10px] font-technical opacity-60 uppercase tracking-widest">
                  {m.value} / {m.limit}
                </div>
              </div>
              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden border border-primary/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.percent}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className={`h-full ${m.color === 'text-secondary' ? 'bg-secondary shadow-glow-green' : 'bg-primary shadow-glow-blue'}`}
                />
              </div>
              <p className="font-technical text-[8px] uppercase tracking-[0.3em] opacity-50">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Bento Grid Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className={`glass-plate border p-8 rounded-lg relative overflow-hidden group transition-all ${
                i % 2 === 0
                  ? 'border-primary/40 shadow-glow-blue-sm hover:shadow-glow-blue'
                  : 'border-secondary/40 shadow-glow-green-sm hover:shadow-glow-green'
              }`}
            >
              <div className={`absolute -right-4 -top-4 w-24 h-24 ${card.bg} blur-2xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity`} />
              <card.icon className={`${card.color} mb-6 drop-shadow-lg`} size={32} />
              <div className="text-4xl font-black tracking-tighter mb-1 text-on-background drop-shadow-md">
                {card.value}
              </div>
              <div className="font-technical text-[10px] uppercase tracking-[0.2em] font-black text-primary/80 mb-4">
                {card.sub}
              </div>
              <p className="text-[10px] font-technical uppercase tracking-widest leading-relaxed opacity-50 group-hover:opacity-70 transition-opacity">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* API Quotas Section */}
        <div className="mt-12 glass-plate border border-primary/30 shadow-glow-blue-sm p-8 rounded-lg">
          <h3 className="text-xl font-black uppercase tracking-tight mb-8">API Quotas (This Month)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(() => {
              const API_QUOTAS = {
                google_maps: { label: 'Google Maps', monthly: 28_500 },
                mapbox: { label: 'Mapbox', monthly: 50_000 },
                supabase_reads: { label: 'Supabase Reads', monthly: 500_000 },
              };
              const apiUsage = stats.apiUsage || {};

              return Object.entries(API_QUOTAS).map(([key, quota]) => {
                const used = apiUsage[key] || 0;
                const percent = Math.min((used / quota.monthly) * 100, 100);
                return (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-technical text-[10px] uppercase tracking-widest font-black opacity-60">
                        {quota.label}
                      </span>
                      <span className="text-[10px] font-technical font-black opacity-40">
                        {used.toLocaleString()} / {quota.monthly.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-surface-container rounded-full overflow-hidden border border-primary/20">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ delay: 1.2, duration: 1 }}
                        className={`h-full rounded-full ${
                          percent > 80 ? 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.5)]' : percent > 50 ? 'bg-amber-500 shadow-[0_0_8px_rgba(255,165,0,0.5)]' : 'bg-primary shadow-glow-blue-sm'
                        }`}
                      />
                    </div>
                    <div className="text-[8px] text-on-surface-variant/50 font-technical uppercase tracking-widest">
                      {percent.toFixed(1)}% used
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
          {/* Growth Chart Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 glass-plate border border-secondary/50 shadow-glow-green-sm p-8 rounded-lg"
          >
            {/* Velocity Chart */}
            {(() => {
              const velocityData = stats.monthlyVelocity || [];
              const maxCount = Math.max(...(velocityData.map(v => v.count) || [1]), 1);
              const growth = velocityData.length >= 2
                ? (((velocityData[velocityData.length - 1].count - velocityData[velocityData.length - 2].count) / Math.max(velocityData[velocityData.length - 2].count, 1)) * 100).toFixed(1)
                : '0.0';

              return (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Deployment Velocity</h3>
                      <p className="font-technical text-[9px] uppercase tracking-[0.3em] opacity-40">Monthly growth trajectory</p>
                    </div>
                    {velocityData.length > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full">
                        <ArrowUpRight size={12} className="text-secondary" />
                        <span className="text-secondary font-technical text-[9px] font-black tracking-widest">+{growth}%</span>
                      </div>
                    )}
                  </div>

                  <div className="h-64 w-full flex items-end gap-2 px-2">
                    {velocityData.length > 0 ? (
                      velocityData.map((v, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-white/10 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest z-10 whitespace-nowrap">
                            {v.count} Nodes
                          </div>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(v.count / maxCount) * 100}%` }}
                            transition={{ delay: 0.8 + (i * 0.05), duration: 1, ease: "circOut" }}
                            className="w-full bg-gradient-to-t from-secondary/50 to-secondary/20 group-hover:from-secondary/80 group-hover:to-secondary/40 transition-colors rounded-t-sm relative shadow-glow-green-sm"
                          >
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-secondary shadow-glow-green" />
                          </motion.div>
                          <span className="text-[7px] font-technical font-black opacity-20 uppercase tracking-tighter">{v.month.slice(5)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center">
                        <div className="text-on-surface-variant/50 font-technical text-[10px] uppercase tracking-widest font-black">📊 No data yet</div>
                        <div className="text-on-surface-variant/40 font-technical text-[9px] leading-relaxed">Add your first listing to see<br/>deployment velocity trends</div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-plate border border-primary/50 shadow-glow-blue-sm p-8 rounded-lg flex flex-col"
          >
            <h3 className="text-xl font-black uppercase tracking-tight mb-8">Grid Distribution</h3>
            {(() => {
              const areaData = (stats.areaDistribution || []).slice(0, 6);
              const colors = ['bg-primary shadow-glow-blue-sm', 'bg-secondary shadow-glow-green-sm', 'bg-primary/80 shadow-glow-blue-sm', 'bg-secondary/80 shadow-glow-green-sm', 'bg-primary/60 shadow-glow-blue-sm', 'bg-secondary/60 shadow-glow-green-sm'];

              return (
                <>
                  <div className="space-y-6 flex-1">
                    {areaData.length > 0 ? (
                      areaData.map((item, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-technical uppercase tracking-widest font-black opacity-60">{item.area}</span>
                            <span className="text-[10px] font-technical font-black uppercase tracking-widest opacity-40">{item.pct.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden border border-primary/20">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.pct}%` }}
                              transition={{ delay: 1 + (i * 0.1), duration: 1 }}
                              className={`h-full ${colors[i]}`}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                        <div className="text-on-surface-variant/50 font-technical text-[10px] uppercase tracking-widest font-black">📍 No areas yet</div>
                        <div className="text-on-surface-variant/40 font-technical text-[9px] leading-relaxed">Add listings to see<br/>geographic distribution</div>
                      </div>
                    )}
                  </div>

                  {areaData.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-white/5">
                      <div className="flex items-center gap-4 group">
                        <Activity size={16} className="text-secondary opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] font-technical uppercase tracking-widest font-black opacity-60">System Resilience: High</span>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </motion.div>
        </div>

        {/* Seeker Demand Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 glass-plate border border-emerald-400/50 shadow-glow-green-sm p-8 rounded-lg"
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Seeker Demand Intelligence</h3>
              <p className="font-technical text-[9px] uppercase tracking-[0.3em] opacity-40 mt-2">Heatmap of flat-hunting demand by geographic area</p>
            </div>
            <div className="px-4 py-2 bg-emerald-400/10 border border-emerald-400/30 rounded-lg">
              <div className="text-emerald-400 font-technical text-[11px] font-black uppercase tracking-widest">
                {(stats.seekerPinStats?.totalPins || 0).toLocaleString()} Active Seekers
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Heat Map - Top Seeking Areas */}
            <div className="space-y-4">
              <div className="font-technical text-[9px] uppercase tracking-[0.3em] opacity-60 font-black mb-4">Top Seeking Areas</div>
              {(() => {
                const seekingAreas = (stats.seekerPinStats?.areaDistribution || []).slice(0, 5);
                const maxPins = Math.max(...(seekingAreas.map(a => a.count) || [1]), 1);
                const colors = ['bg-emerald-500', 'bg-emerald-400', 'bg-teal-400', 'bg-cyan-400', 'bg-blue-400'];

                return seekingAreas.length > 0 ? (
                  seekingAreas.map((area, i) => (
                    <div key={i} className="space-y-2 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${colors[i]}`} />
                          <span className="text-[9px] font-technical uppercase tracking-widest font-black text-on-surface group-hover:text-emerald-400 transition-colors">{area.area}</span>
                        </div>
                        <span className="text-[9px] font-technical font-black uppercase tracking-widest opacity-40">{area.count} pins</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden border border-emerald-400/20">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(area.count / maxPins) * 100}%` }}
                          transition={{ delay: 0.9 + (i * 0.1), duration: 1 }}
                          className={`h-full ${colors[i]} shadow-[0_0_8px_rgba(16,185,129,0.5)]`}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                    <div className="text-on-surface-variant/50 font-technical text-[10px] uppercase tracking-widest font-black">🔍 No demand data yet</div>
                    <div className="text-on-surface-variant/40 font-technical text-[9px] leading-relaxed">Users haven't dropped seeker pins yet</div>
                  </div>
                );
              })()}
            </div>

            {/* Demand vs Supply Comparison */}
            <div className="space-y-4">
              <div className="font-technical text-[9px] uppercase tracking-[0.3em] opacity-60 font-black mb-4">Demand Metrics</div>
              {(() => {
                const metrics = [
                  {
                    label: 'Total Seeker Pins',
                    value: (stats.seekerPinStats?.totalPins || 0).toLocaleString(),
                    icon: Users,
                    color: 'text-emerald-400',
                    sub: 'Active flat hunters'
                  },
                  {
                    label: 'Avg Budget',
                    value: stats.seekerPinStats?.avgBudget ? `₹${(stats.seekerPinStats.avgBudget / 1000).toFixed(0)}K` : '—',
                    icon: Banknote,
                    color: 'text-cyan-400',
                    sub: 'Monthly rent range'
                  },
                  {
                    label: 'BHK Distribution',
                    value: stats.seekerPinStats?.topBhk || '1-2 BHK',
                    icon: Building2,
                    color: 'text-teal-400',
                    sub: 'Most sought configuration'
                  },
                  {
                    label: 'Coverage',
                    value: `${(stats.seekerPinStats?.areaCoverage || 0).toLocaleString()} areas`,
                    icon: MapIcon,
                    color: 'text-blue-400',
                    sub: 'Geographic spread'
                  }
                ];

                return metrics.length > 0 && stats.seekerPinStats?.totalPins ? (
                  <div className="grid grid-cols-2 gap-4">
                    {metrics.map((m, i) => (
                      <div key={i} className="glass-plate border border-emerald-400/30 p-4 rounded-lg hover:border-emerald-400/50 transition-all group">
                        <m.icon className={`${m.color} mb-2`} size={16} />
                        <div className="text-lg font-black text-on-background mb-1">{m.value}</div>
                        <div className="text-[8px] font-technical uppercase tracking-widest opacity-40 group-hover:opacity-60 transition-opacity">{m.sub}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                    <div className="text-on-surface-variant/50 font-technical text-[10px] uppercase tracking-widest font-black">📊 No metrics</div>
                    <div className="text-on-surface-variant/40 font-technical text-[9px] leading-relaxed">Demand data will appear here</div>
                  </div>
                );
              })()}
            </div>
          </div>
        </motion.div>

        <section className="mt-24 text-center">
           <Link href="/explore">
              <button className="px-12 py-5 bg-white/5 border border-white/10 rounded-lg font-black uppercase tracking-[0.4em] text-[11px] hover:bg-primary hover:text-on-primary transition-all active:scale-95 shadow-xl">
                Return to Tactical Grid &rarr;
              </button>
           </Link>
        </section>
      </main>

      <footer className="py-24 px-mobile md:px-desktop border-t border-secondary/20 relative z-10 bg-background/50 backdrop-blur-md mt-12">
         <div className="max-w-container mx-auto flex flex-col md:flex-row justify-between items-center gap-12 w-full text-center md:text-left">
           <div className="flex flex-col items-center md:items-start gap-1">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <Satellite className="text-on-primary" size={20} strokeWidth={2.5} />
               </div>
               <span className="font-display text-xl text-on-surface font-black tracking-tighter uppercase">indian.rent</span>
             </div>
             <div className="font-technical text-[9px] uppercase tracking-[0.4em] text-primary opacity-60 ml-1 font-black">WishLabs Intelligence HQ</div>
           </div>
           <div className="flex gap-12 font-technical text-technical-sm uppercase tracking-widest opacity-40">
             <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
             <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
             <a href="mailto:support@wishlabs.in" className="hover:text-primary transition-colors">HQ Support</a>
           </div>
           <div className="font-technical text-[9px] uppercase tracking-[0.6em] opacity-20 font-black">&copy; 2026 Direct Rental Protocol • A WishLabs Production</div>
         </div>
      </footer>
    </div>
  );
}
