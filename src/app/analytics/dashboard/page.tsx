'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSimpleAnalytics } from '@/app/actions/simple-analytics';
import {
  SupplyDemandChart,
  MarketSegmentChart,
} from '@/components/analytics/MetricsCharts';
import PriceDistributionChartEnhanced from '@/components/analytics/PriceDistributionChartEnhanced';
import KPICard3D from '@/components/analytics/KPICard3D';
import { BarChart3, TrendingUp, Users, Home, ChevronLeft } from 'lucide-react';

type City = 'Bengaluru' | 'Hyderabad';

export default function AnalyticsDashboard() {
  const [selectedCity, setSelectedCity] = useState<City>('Bengaluru');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedCity]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSimpleAnalytics(selectedCity);
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-primary/30 bg-background/90 backdrop-blur-xl shadow-glow-blue-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/analytics" className="p-2 rounded-lg border border-primary/40 hover:bg-primary/10 hover:border-primary/60 transition-all">
                <ChevronLeft size={20} className="text-primary" />
              </Link>
              <div>
                <h1 className="font-display text-3xl font-black text-white">Market Dashboard</h1>
                <p className="text-sm text-on-surface-variant mt-1">Real-time rental market metrics</p>
              </div>
            </div>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value as City)}
              className="px-4 py-2 rounded-lg font-technical font-bold text-sm bg-surface border border-white/10 text-on-surface hover:border-white/20 cursor-pointer focus:outline-none focus:border-primary/50"
            >
              <option value="Bengaluru">🏙️ Bengaluru</option>
              <option value="Hyderabad">🏙️ Hyderabad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {error && (
          <div className="mb-8 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400">
            ⚠️ {error}
            <button
              onClick={loadData}
              className="ml-4 px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 bg-surface rounded-xl border border-white/10 animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-surface rounded-xl border border-white/10 animate-pulse" />
              ))}
            </div>
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* KPI Cards */}
            <section>
              <h2 className="text-xs uppercase tracking-widest font-technical font-bold text-primary mb-6">
                Key Metrics — {selectedCity}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard3D
                  label="Total Listings"
                  value={data.basicStats.totalListings}
                  unit="properties"
                  icon={<Home size={20} />}
                />
                <KPICard3D
                  label="Total Buildings"
                  value={data.basicStats.totalBuildings}
                  unit="buildings"
                  icon={<Home size={20} />}
                />
                <KPICard3D
                  label="Seeker Demand"
                  value={data.basicStats.totalSeekers}
                  unit="seekers"
                  icon={<Users size={20} />}
                />
                <KPICard3D
                  label="Median Rent"
                  value={`₹${(data.basicStats.medianRent / 1000).toFixed(1)}k`}
                  interpretation={`Avg: ₹${(data.basicStats.avgRent / 1000).toFixed(1)}k`}
                  icon={<TrendingUp size={20} />}
                  highlight
                />
              </div>
            </section>

            {/* Charts */}
            <section>
              <h2 className="text-xs uppercase tracking-widest font-technical font-bold text-primary mb-6">
                Market Analysis
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.supplyTrend.length > 0 && (
                  <SupplyDemandChart
                    data={data.supplyTrend}
                    title="Supply & Demand Trend"
                    description="30-day listing activity"
                  />
                )}

                {data.priceData.length > 0 && (
                  <PriceDistributionChartEnhanced
                    data={data.priceData}
                    title="Price Distribution by BHK"
                    description="Market rent percentiles with toggles"
                  />
                )}

                {data.segmentData.length > 0 && (
                  <MarketSegmentChart
                    data={data.segmentData}
                    title="Market Segmentation"
                    description="Listings by BHK type"
                  />
                )}

                {/* Statistics Card */}
                <div className="bg-surface border border-white/10 rounded-lg p-6 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary font-technical">
                    Market Health Indicators
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-xs text-on-surface-variant">Listings per Building</span>
                      <span className="text-lg font-bold text-white">
                        {(data.basicStats.totalListings / Math.max(data.basicStats.totalBuildings, 1)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-xs text-on-surface-variant">Seeker to Listing Ratio</span>
                      <span className="text-lg font-bold text-white">
                        1:{Math.round(data.basicStats.totalListings / Math.max(data.basicStats.totalSeekers, 1))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-xs text-on-surface-variant">Avg Rent</span>
                      <span className="text-lg font-bold text-white">
                        ₹{(data.basicStats.avgRent / 1000).toFixed(1)}k
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <span className="text-xs text-on-surface-variant">Market Status</span>
                      <span className="text-lg font-bold text-primary">
                        {data.basicStats.totalListings > 100 ? '📈 Active' : '📊 Growing'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Summary */}
            <section className="p-6 rounded-lg border border-white/10 bg-surface/50">
              <h3 className="text-xs uppercase tracking-widest font-technical font-bold text-primary mb-4">
                Data Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-on-surface-variant text-xs mb-1">Total Supply</p>
                  <p className="text-xl font-bold text-white">{data.basicStats.totalListings}</p>
                  <p className="text-xs text-on-surface-variant mt-1">active listings</p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-xs mb-1">Total Demand</p>
                  <p className="text-xl font-bold text-white">{data.basicStats.totalSeekers}</p>
                  <p className="text-xs text-on-surface-variant mt-1">seeker pins</p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-xs mb-1">Price Range</p>
                  <p className="text-xl font-bold text-white">
                    ₹{(data.basicStats.medianRent / 1000).toFixed(0)}-{(data.basicStats.avgRent / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">median to average</p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-xs mb-1">Market Segments</p>
                  <p className="text-xl font-bold text-white">{data.segmentData.length}</p>
                  <p className="text-xs text-on-surface-variant mt-1">BHK categories</p>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
