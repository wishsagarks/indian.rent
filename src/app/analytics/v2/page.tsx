'use client';

import React, { useState, useEffect } from 'react';
import { getCityMetrics, getOpportunityScores, transformMetrics, type CityMetricsUI } from '@/app/actions/analytics-actions';
import KPICard from '@/components/analytics/KPICard';
import CityComparisonGrid from '@/components/analytics/CityComparisonGrid';
import OpportunityTable from '@/components/analytics/OpportunityTable';
import { BarChart3, TrendingUp, Users, Home } from 'lucide-react';

type City = 'bengaluru' | 'hyderabad';

export default function AnalyticsDashboardV2() {
  const [selectedCity, setSelectedCity] = useState<City>('bengaluru');
  const [bengaluruMetrics, setBengaluruMetrics] = useState<CityMetricsUI | null>(null);
  const [hyderabadMetrics, setHyderabadMetrics] = useState<CityMetricsUI | null>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overall' | 'comparison' | 'opportunities'>('overall');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const [blrRaw, hydRaw, opps] = await Promise.all([
        getCityMetrics('Bengaluru'),
        getCityMetrics('Hyderabad'),
        getOpportunityScores('Bengaluru')
      ]);

      setBengaluruMetrics(transformMetrics(blrRaw));
      setHyderabadMetrics(transformMetrics(hydRaw));
      setOpportunities(opps);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentMetrics = selectedCity === 'bengaluru' ? bengaluruMetrics : hyderabadMetrics;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-black text-white">Market Analytics</h1>
              <p className="text-sm text-on-surface-variant mt-1">
                Real-time rental market intelligence
              </p>
            </div>

            <div className="flex gap-2">
              {(['bengaluru', 'hyderabad'] as const).map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-4 py-2 rounded-lg font-technical font-bold text-sm transition-all ${
                    selectedCity === city
                      ? 'bg-primary text-background'
                      : 'bg-surface border border-white/10 text-on-surface hover:border-white/20'
                  }`}
                >
                  🏙️ {city.charAt(0).toUpperCase() + city.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* KPI Cards */}
        <section>
          <h2 className="text-xs uppercase tracking-widest font-technical font-bold text-primary mb-6">
            Market Health Snapshot
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-surface rounded-lg border border-white/10 animate-pulse" />
              ))
            ) : currentMetrics ? (
              <>
                <KPICard
                  label="Supply"
                  value={currentMetrics.supply.count}
                  unit="listings"
                  trend={currentMetrics.supply.change}
                  interpretation={currentMetrics.supply.trend}
                  icon={<Home size={20} />}
                />
                <KPICard
                  label="Demand"
                  value={currentMetrics.demand.count}
                  unit="seekers"
                  interpretation={currentMetrics.demand.interpretation}
                  icon={<Users size={20} />}
                />
                <KPICard
                  label="Median Rent"
                  value={`₹${(currentMetrics.price.median / 1000).toFixed(1)}k`}
                  interpretation={`P75: ₹${(currentMetrics.price.p75 / 1000).toFixed(1)}k`}
                  icon={<TrendingUp size={20} />}
                  highlight
                />
                <KPICard
                  label="Market Quality"
                  value={currentMetrics.quality.transparencyScore.toFixed(0)}
                  unit="%"
                  interpretation="Transparency Score"
                  icon={<BarChart3 size={20} />}
                />
              </>
            ) : null}
          </div>
        </section>

        {/* Tabs */}
        <section>
          <div className="flex gap-4 border-b border-white/10 mb-6">
            {(['overall', 'comparison', 'opportunities'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-technical font-bold uppercase transition-all ${
                  tab === t
                    ? 'border-b-2 border-primary text-primary'
                    : 'border-b-2 border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t === 'overall' && 'Overall'}
                {t === 'comparison' && 'City Comparison'}
                {t === 'opportunities' && 'Opportunities'}
              </button>
            ))}
          </div>

          {tab === 'overall' && currentMetrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-lg border border-white/10 bg-surface/50">
                <div>
                  <p className="text-xs text-on-surface-variant mb-2">Seeker-Listing Ratio</p>
                  <p className="text-2xl font-bold text-white">1:{Math.round(1 / currentMetrics.demand.ratio)}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-2">Market Health</p>
                  <p className="text-2xl font-bold text-primary">{currentMetrics.demand.interpretation}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-2">Price Volatility</p>
                  <p className="text-2xl font-bold text-white">{currentMetrics.price.volatility.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-2">Premium Index</p>
                  <p className="text-2xl font-bold text-white">{currentMetrics.price.premiumIndex.toFixed(2)}x</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'comparison' && (
            <CityComparisonGrid
              bengaluru={bengaluruMetrics || undefined}
              hyderabad={hyderabadMetrics || undefined}
              loading={loading}
            />
          )}

          {tab === 'opportunities' && (
            <div>
              <h3 className="text-xs uppercase tracking-widest font-technical font-bold text-primary mb-4">
                Top Opportunities
              </h3>
              <OpportunityTable data={opportunities.slice(0, 10)} loading={loading} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
