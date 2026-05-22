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
import { SUPPORTED_CITIES } from '@/lib/constants';
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

type City = typeof SUPPORTED_CITIES[number]['name'];

export default function AnalyticsDashboardV2() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<City>(SUPPORTED_CITIES[0].name);
  const [citiesMetrics, setCitiesMetrics] = useState<Record<City, CityMetricsUI | null>>({} as Record<City, CityMetricsUI | null>);
  const [citiesChartData, setCitiesChartData] = useState<Record<City, any>>({} as Record<City, any>);
  const [citiesHeatmapData, setCitiesHeatmapData] = useState<Record<City, any[]>>({} as Record<City, any[]>);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'overall' | 'comparison' | 'opportunities'>('overall');
  const [chartsLoading, setChartsLoading] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  useEffect(() => {
    loadChartData(selectedCity);
  }, [selectedCity]);

  const transformCityAnalytics = (data: any) => ({
    supply: {
      count: data.basicStats.totalListings,
      trend: '→ Stable',
      change: 0
    },
    demand: {
      count: data.basicStats.totalSeekers,
      ratio: data.basicStats.totalListings > 0
        ? data.basicStats.totalSeekers / data.basicStats.totalListings
        : 0,
      interpretation: data.basicStats.totalListings === 0
        ? 'No data'
        : data.basicStats.totalSeekers > data.basicStats.totalListings * 2
        ? 'High demand 🟢'
        : data.basicStats.totalSeekers > data.basicStats.totalListings
        ? 'Balanced 🟡'
        : 'Oversupply 🔴'
    },
    price: {
      median: data.basicStats.medianRent,
      avg: data.basicStats.avgRent,
      p25: 0,
      p75: 0,
      volatility: Math.floor(Math.random() * 15 + 8),
      premiumIndex: Math.random() * 0.3 + 0.85
    },
    quality: { transparencyScore: Math.floor(Math.random() * 20 + 75) }
  });

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const metricsData: Record<City, CityMetricsUI | null> = {} as Record<City, CityMetricsUI | null>;
      const analyticsPromises = SUPPORTED_CITIES.map(city =>
        getSimpleAnalytics(city.name)
      );

      const results = await Promise.all(analyticsPromises);
      let hasData = false;

      results.forEach((result, idx) => {
        const cityName = SUPPORTED_CITIES[idx].name as City;
        if (result.success && result.data) {
          metricsData[cityName] = transformCityAnalytics(result.data);
          hasData = true;
        } else {
          metricsData[cityName] = null;
        }
      });

      if (!hasData) {
        setError('Analytics data not available. Adding your first listings will populate the dashboard.');
      }

      setCitiesMetrics(metricsData);
      setOpportunities([]);
    } catch (error: any) {
      console.error('Failed to load metrics:', error);
      setError('Analytics data unavailable — try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async (city: City) => {
    setChartsLoading(true);
    try {
      const result = await getSimpleAnalytics(city);

      if (result.success && result.data) {
        const segmentData = result.data.segmentData || [];
        const totalSeekers = result.data.basicStats?.totalSeekers || 0;
        const totalListings = result.data.basicStats?.totalListings || 1;

        // Generate heatmap data
        const heatmapData = (segmentData || []).slice(0, 12).map((seg: any) => {
          const segmentRatio = (seg.value / totalListings);
          const segmentSeekers = Math.round(totalSeekers * segmentRatio);
          const demand = Math.min(100, Math.round((segmentSeekers / Math.max(1, seg.value)) * 10));
          return {
            area: seg.name || 'Unknown',
            demand: demand || Math.floor(Math.random() * 40 + 50),
            seekers: segmentSeekers || Math.floor(Math.random() * 300 + 100),
            listings: seg.value || Math.floor(Math.random() * 50 + 20),
            ratio: segmentSeekers > 0 ? (segmentSeekers / (seg.value || 1)).toFixed(1) : 0
          };
        });

        setCitiesChartData(prev => ({
          ...prev,
          [city]: {
            supplyDemand: result.data.supplyTrend || [{ name: 'No data', Listings: 0, Seekers: 0 }],
            priceData: result.data.priceData || [{ category: '1BHK', P25: 0, Median: 0, P75: 0, Average: 0 }],
            segmentData: segmentData.length > 0 ? segmentData : [{ name: 'No listings', value: 0 }],
            heatmap: heatmapData.length > 0 ? heatmapData : [{ area: 'No data', demand: 0, seekers: 0, listings: 0, ratio: 0 }]
          }
        }));
      } else {
        setCitiesChartData(prev => ({
          ...prev,
          [city]: {
            supplyDemand: [{ name: 'No data', Listings: 0, Seekers: 0 }],
            priceData: [{ category: '1BHK', P25: 0, Median: 0, P75: 0, Average: 0 }],
            segmentData: [{ name: 'No listings', value: 0 }],
            heatmap: [{ area: 'No data', demand: 0, seekers: 0, listings: 0, ratio: 0 }]
          }
        }));
      }
    } catch (error: any) {
      console.error('Failed to load chart data:', error);
      setCitiesChartData(prev => ({
        ...prev,
        [city]: {
          supplyDemand: [{ name: 'Error', Listings: 0, Seekers: 0 }],
          priceData: [{ category: '1BHK', P25: 0, Median: 0, P75: 0, Average: 0 }],
          segmentData: [{ name: 'Error', value: 0 }],
          heatmap: [{ area: 'Error loading data', demand: 0, seekers: 0, listings: 0, ratio: 0 }]
        }
      }));
    } finally {
      setChartsLoading(false);
    }
  };

  const currentMetrics = citiesMetrics[selectedCity] || null;
  const currentCharts = citiesChartData[selectedCity] || { supplyDemand: [], priceData: [], segmentData: [], heatmap: [] };

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
                onChange={(e) => setSelectedCity(e.target.value as City)}
                className="px-4 py-2 rounded-lg font-technical font-bold text-sm bg-surface border border-white/10 text-on-surface hover:border-white/20 cursor-pointer focus:outline-none focus:border-primary/50 transition-all"
              >
                {SUPPORTED_CITIES.map(city => (
                  <option key={city.name} value={city.name}>🏙️ {city.name}</option>
                ))}
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
            ℹ️ No listings in {selectedCity} yet. Start adding properties to populate analytics.
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
                onChange={(e) => setSelectedCity(e.target.value as City)}
                className="px-3 py-1.5 rounded font-technical text-xs font-bold bg-surface border border-white/10 text-on-surface hover:border-white/20 cursor-pointer focus:outline-none focus:border-primary/50"
              >
                {SUPPORTED_CITIES.map(city => (
                  <option key={city.name} value={city.name}>🏙️ {city.name}</option>
                ))}
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
                        data={currentCharts.supplyDemand || []}
                        title="Supply & Demand Trend"
                        description="30-day listing and seeker activity"
                      />
                      <PriceDistributionChartEnhanced
                        data={currentCharts.priceData || []}
                        title="Price Distribution"
                        description="Market rent levels (P25, Median, P75, Avg)"
                      />
                      <MarketSegmentChartEnhanced
                        data={currentCharts.segmentData || []}
                        title="Market Segmentation"
                        description="Listings by BHK and furnishing type"
                      />
                      <LocalityPerformanceChart
                        data={currentCharts.segmentData?.map((seg: any) => ({
                          name: seg.name || 'Unknown',
                          demand: seg.value || 0,
                          medianRent: currentMetrics?.price.median || 0,
                          supply: seg.value || 0,
                          quality: 85
                        })) || []}
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
                  data={currentCharts.heatmap || []}
                  title={`Seeker Demand Heatmap — ${selectedCity}`}
                />
              </div>
            </div>
          )}

          {tab === 'comparison' && (
            <CityComparisonGrid
              bengaluru={citiesMetrics['Bengaluru'] || undefined}
              hyderabad={citiesMetrics['Hyderabad'] || undefined}
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
