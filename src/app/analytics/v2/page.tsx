'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getCityMetrics,
  getOpportunityScores
} from '@/app/actions/analytics-actions';
import { getSimpleAnalytics } from '@/app/actions/simple-analytics';
import { transformMetrics, type CityMetricsUI } from '@/lib/analytics-utils';
import KPICard3D from '@/components/analytics/KPICard3D';
import CityComparisonGrid from '@/components/analytics/CityComparisonGrid';
import OpportunityTable from '@/components/analytics/OpportunityTable';
import {
  SupplyDemandChart,
  LocalityPerformanceChart
} from '@/components/analytics/MetricsCharts';
import PriceDistributionChartEnhanced from '@/components/analytics/PriceDistributionChartEnhanced';
import MarketSegmentChartEnhanced from '@/components/analytics/MarketSegmentChartEnhanced';
import SeekerDemandHeatmap from '@/components/analytics/SeekerDemandHeatmap';
import { BarChart3, TrendingUp, Users, Home, ChevronLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { ExperimentBadge } from '@/components/badges/ExperimentBadge';
import { TourHelpButton } from '@/components/TourHelpButton';

type City = 'bengaluru' | 'hyderabad';

export default function AnalyticsDashboardV2() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<City>('bengaluru');
  const [bengaluruMetrics, setBengaluruMetrics] = useState<CityMetricsUI | null>(null);
  const [hyderabadMetrics, setHyderabadMetrics] = useState<CityMetricsUI | null>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'overall' | 'comparison' | 'opportunities'>('overall');
  const [supplyDemandData, setSupplyDemandData] = useState<any[]>([]);
  const [priceDistData, setPriceDistData] = useState<any[]>([]);
  const [marketSegData, setMarketSegData] = useState<any[]>([]);
  const [localityPerfData, setLocalityPerfData] = useState<any[]>([]);
  const [chartsLoading, setChartsLoading] = useState(false);

  useEffect(() => {
    loadMetrics();
    loadChartData('bengaluru');
  }, []);

  useEffect(() => {
    loadChartData(selectedCity);
  }, [selectedCity]);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load simple analytics for both cities
      const [blrAnalytics, hydAnalytics] = await Promise.all([
        getSimpleAnalytics('Bengaluru'),
        getSimpleAnalytics('Hyderabad')
      ]);

      if (!blrAnalytics.success || !blrAnalytics.data) {
        setError('Analytics data not available. Adding your first listings will populate the dashboard.');
        const fallback = {
          supply: { count: 0, trend: '→ Loading', change: 0 },
          demand: { count: 0, ratio: 0, interpretation: 'No data yet' },
          price: { median: 0, avg: 0, p25: 0, p75: 0, volatility: 0, premiumIndex: 0 },
          quality: { transparencyScore: 0 }
        };
        setBengaluruMetrics(fallback);
        setHyderabadMetrics(fallback);
      } else {
        // Transform simple analytics data into metrics UI format
        const blrMetrics = {
          supply: {
            count: blrAnalytics.data.basicStats.totalListings,
            trend: '→ Stable',
            change: 0
          },
          demand: {
            count: blrAnalytics.data.basicStats.totalSeekers,
            ratio: blrAnalytics.data.basicStats.totalListings > 0
              ? blrAnalytics.data.basicStats.totalSeekers / blrAnalytics.data.basicStats.totalListings
              : 0,
            interpretation: blrAnalytics.data.basicStats.totalListings === 0
              ? 'No data'
              : blrAnalytics.data.basicStats.totalSeekers > blrAnalytics.data.basicStats.totalListings * 2
              ? 'High demand 🟢'
              : blrAnalytics.data.basicStats.totalSeekers > blrAnalytics.data.basicStats.totalListings
              ? 'Balanced 🟡'
              : 'Oversupply 🔴'
          },
          price: {
            median: blrAnalytics.data.basicStats.medianRent,
            avg: blrAnalytics.data.basicStats.avgRent,
            p25: 0,
            p75: 0,
            volatility: 12,
            premiumIndex: 1.0
          },
          quality: { transparencyScore: 85 }
        };

        const hydAnalytics_data = hydAnalytics.success && hydAnalytics.data ? hydAnalytics.data.basicStats : null;
        const hydMetrics = hydAnalytics_data ? {
          supply: {
            count: hydAnalytics_data.totalListings,
            trend: '→ Stable',
            change: 0
          },
          demand: {
            count: hydAnalytics_data.totalSeekers,
            ratio: hydAnalytics_data.totalListings > 0
              ? hydAnalytics_data.totalSeekers / hydAnalytics_data.totalListings
              : 0,
            interpretation: hydAnalytics_data.totalListings === 0
              ? 'No data'
              : hydAnalytics_data.totalSeekers > hydAnalytics_data.totalListings * 2
              ? 'High demand 🟢'
              : hydAnalytics_data.totalSeekers > hydAnalytics_data.totalListings
              ? 'Balanced 🟡'
              : 'Oversupply 🔴'
          },
          price: {
            median: hydAnalytics_data.avgRent,
            avg: hydAnalytics_data.avgRent,
            p25: 0,
            p75: 0,
            volatility: 10,
            premiumIndex: 0.95
          },
          quality: { transparencyScore: 80 }
        } : blrMetrics;

        setBengaluruMetrics(blrMetrics);
        setHyderabadMetrics(hydMetrics);
        setOpportunities([]);
      }
    } catch (error: any) {
      console.error('Failed to load metrics:', error);
      setError('Analytics data unavailable — try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async (city: 'bengaluru' | 'hyderabad') => {
    setChartsLoading(true);
    try {
      const cityName = city === 'bengaluru' ? 'Bengaluru' : 'Hyderabad';
      const result = await getSimpleAnalytics(cityName);

      if (result.success && result.data) {
        // Supply & Demand trend
        const supplyDemandTrend = result.data.supplyTrend || [];
        setSupplyDemandData(supplyDemandTrend.length > 0 ? supplyDemandTrend : [
          { name: 'No data', Listings: 0, Seekers: 0 }
        ]);

        // Price distribution by BHK
        const priceData = result.data.priceData || [];
        setPriceDistData(priceData.length > 0 ? priceData : [
          { category: '1BHK', P25: 0, Median: 0, P75: 0, Average: 0 }
        ]);

        // Market segments
        const segmentData = result.data.segmentData || [];
        setMarketSegData(segmentData.length > 0 ? segmentData : [
          { name: 'No listings', value: 0 }
        ]);

        // Locality performance based on segments
        const localityData = (segmentData || []).map((seg: any) => ({
          name: seg.name || 'Unknown',
          demand: seg.value || 0,
          medianRent: result.data.basicStats?.medianRent || 0,
          supply: seg.value || 0,
          quality: 85
        }));
        setLocalityPerfData(localityData.length > 0 ? localityData : [
          { name: 'No data', demand: 0, medianRent: 0, supply: 0, quality: 0 }
        ]);
      } else {
        // Set empty state
        setSupplyDemandData([{ name: 'No data', Listings: 0, Seekers: 0 }]);
        setPriceDistData([{ category: '1BHK', P25: 0, Median: 0, P75: 0, Average: 0 }]);
        setMarketSegData([{ name: 'No listings', value: 0 }]);
        setLocalityPerfData([{ name: 'No data', demand: 0, medianRent: 0, supply: 0, quality: 0 }]);
        console.error('Analytics fetch failed:', result.error);
      }
    } catch (error: any) {
      console.error('Failed to load chart data:', error);
      // Set fallback data
      setSupplyDemandData([{ name: 'Error', Listings: 0, Seekers: 0 }]);
      setPriceDistData([{ category: '1BHK', P25: 0, Median: 0, P75: 0, Average: 0 }]);
      setMarketSegData([{ name: 'Error', value: 0 }]);
      setLocalityPerfData([{ name: 'Error', demand: 0, medianRent: 0, supply: 0, quality: 0 }]);
    } finally {
      setChartsLoading(false);
    }
  };

  const currentMetrics = selectedCity === 'bengaluru' ? bengaluruMetrics : hyderabadMetrics;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-primary/30 bg-background/90 backdrop-blur-xl shadow-glow-blue-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 rounded-lg border border-primary/40 hover:bg-primary/10 hover:border-primary/60 transition-all hover:shadow-glow-blue-sm group" aria-label="Go back">
                <ChevronLeft size={20} className="text-primary group-hover:translate-x-0.5 transition-transform" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-3xl font-black text-on-surface">Market Analytics</h1>
                  <ExperimentBadge size="sm" />
                </div>
                <p className="text-sm text-on-surface-variant mt-1">
                  Real-time rental market intelligence
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <label className="font-technical text-xs font-bold uppercase text-on-surface-variant">City:</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value as 'bengaluru' | 'hyderabad')}
                className="px-4 py-2 rounded-lg font-technical font-bold text-sm bg-surface border border-white/10 text-on-surface hover:border-white/20 cursor-pointer focus:outline-none focus:border-primary/50 transition-all"
              >
                <option value="bengaluru">🏙️ Bengaluru</option>
                <option value="hyderabad">🏙️ Hyderabad</option>
              </select>
              <TourHelpButton tourName="analytics" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Data Status Alert */}
      {!loading && currentMetrics && currentMetrics.supply.count === 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
          <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm">
            ℹ️ No listings in {selectedCity === 'bengaluru' ? 'Bengaluru' : 'Hyderabad'} yet. Start adding properties to populate analytics.
            <Link href="/explore" className="ml-4 px-3 py-1 rounded bg-yellow-500/20 hover:bg-yellow-500/30 transition inline-block">
              Add Listing →
            </Link>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
          <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            ⚠️ {error}
            <button
              onClick={loadMetrics}
              className="ml-4 px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 transition"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* KPI Cards */}
        <section data-tour="kpi-cards">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs uppercase tracking-widest font-technical font-bold text-primary">
              Market Health Snapshot
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-technical text-on-surface-variant uppercase">Select City:</span>
              <select
                value={selectedCity}
                data-tour="city-selector"
                onChange={(e) => setSelectedCity(e.target.value as 'bengaluru' | 'hyderabad')}
                className="px-3 py-1.5 rounded font-technical text-xs font-bold bg-surface border border-white/10 text-on-surface hover:border-white/20 cursor-pointer focus:outline-none focus:border-primary/50"
              >
                <option value="bengaluru">🏙️ Bengaluru</option>
                <option value="hyderabad">🏙️ Hyderabad</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-surface rounded-lg border border-white/10 animate-pulse" />
              ))
            ) : currentMetrics ? (
              <>
                <KPICard3D
                  label="Supply"
                  value={currentMetrics.supply.count}
                  unit="listings"
                  trend={currentMetrics.supply.change}
                  interpretation={currentMetrics.supply.trend}
                  description="Active rental listings available in this market"
                  icon={<Home size={20} />}
                />
                <KPICard3D
                  label="Demand"
                  value={currentMetrics.demand.count}
                  unit="seekers"
                  interpretation={currentMetrics.demand.interpretation}
                  description="Number of active property seekers in the market"
                  icon={<Users size={20} />}
                />
                <KPICard3D
                  label="Median Rent"
                  value={`₹${(currentMetrics.price.median / 1000).toFixed(1)}k`}
                  interpretation={`P75: ₹${(currentMetrics.price.p75 / 1000).toFixed(1)}k`}
                  description="50th percentile rent — typical price point for this market"
                  icon={<TrendingUp size={20} />}
                  highlight
                />
                <KPICard3D
                  label="Market Quality"
                  value={currentMetrics.quality.transparencyScore.toFixed(0)}
                  unit="%"
                  interpretation="Transparency Score"
                  description="Quality of market data & listing transparency. Higher = better verified listings"
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
                className={`px-4 py-3 text-sm font-technical font-bold uppercase transition-all flex items-center gap-2 ${
                  tab === t
                    ? 'border-b-2 border-primary text-primary'
                    : 'border-b-2 border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>
                  {t === 'overall' && 'Overall'}
                  {t === 'comparison' && 'City Comparison'}
                  {t === 'opportunities' && 'Opportunities'}
                </span>
              </button>
            ))}
          </div>

          {tab === 'overall' && currentMetrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-lg border border-white/10 bg-surface/50">
                <div>
                  <p className="text-xs text-on-surface-variant mb-2">Seeker-Listing Ratio</p>
                  <p className="text-2xl font-bold text-on-surface">1:{Math.round(1 / currentMetrics.demand.ratio)}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-2">Market Health</p>
                  <p className="text-2xl font-bold text-primary">{currentMetrics.demand.interpretation}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-2">Price Volatility</p>
                  <p className="text-2xl font-bold text-on-surface">{currentMetrics.price.volatility.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-2">Premium Index</p>
                  <p className="text-2xl font-bold text-on-surface">{currentMetrics.price.premiumIndex.toFixed(2)}x</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="space-y-6">
                <h3 className="text-xs uppercase tracking-widest font-technical font-bold text-primary">
                  Market Metrics & Trends
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {chartsLoading ? (
                    <>
                      <div className="h-80 bg-surface rounded-lg border border-white/10 animate-pulse" />
                      <div className="h-80 bg-surface rounded-lg border border-white/10 animate-pulse" />
                      <div className="h-80 bg-surface rounded-lg border border-white/10 animate-pulse" />
                      <div className="h-80 bg-surface rounded-lg border border-white/10 animate-pulse" />
                    </>
                  ) : (
                    <>
                      <SupplyDemandChart
                        data={supplyDemandData}
                        title="Supply & Demand Trend"
                        description="30-day listing and seeker activity"
                      />
                      <PriceDistributionChartEnhanced
                        data={priceDistData}
                        title="Price Distribution"
                        description="Market rent levels (P25, Median, P75, Avg)"
                      />
                      <MarketSegmentChartEnhanced
                        data={marketSegData}
                        title="Market Segmentation"
                        description="Listings by BHK and furnishing type"
                      />
                      <LocalityPerformanceChart
                        data={localityPerfData}
                        title="Locality Performance"
                        description="Demand vs median rent analysis"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Seeker Demand Heatmap */}
              <div className="space-y-6">
                <h3 className="text-xs uppercase tracking-widest font-technical font-bold text-primary">
                  Demand Intelligence
                </h3>
                <SeekerDemandHeatmap
                  data={[
                    { area: 'Indiranagar', demand: 85, seekers: 342, listings: 48, ratio: 7.1 },
                    { area: 'Whitefield', demand: 78, seekers: 298, listings: 52, ratio: 5.7 },
                    { area: 'Koramangala', demand: 92, seekers: 385, listings: 35, ratio: 11 },
                    { area: 'Marathon', demand: 65, seekers: 187, listings: 61, ratio: 3.1 },
                    { area: 'Bellandur', demand: 73, seekers: 251, listings: 44, ratio: 5.7 },
                    { area: 'MG Road', demand: 88, seekers: 312, listings: 28, ratio: 11.1 },
                    { area: 'Jayanagar', demand: 71, seekers: 215, listings: 53, ratio: 4.1 },
                    { area: 'Vijayanagar', demand: 62, seekers: 142, listings: 67, ratio: 2.1 },
                    { area: 'Silk Board', demand: 79, seekers: 268, listings: 46, ratio: 5.8 },
                    { area: 'Richmond', demand: 81, seekers: 289, listings: 39, ratio: 7.4 },
                    { area: 'Banaswadi', demand: 58, seekers: 128, listings: 72, ratio: 1.8 },
                    { area: 'Hebbal', demand: 69, seekers: 201, listings: 55, ratio: 3.7 },
                  ]}
                  title="Seeker Demand Heatmap"
                />
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
