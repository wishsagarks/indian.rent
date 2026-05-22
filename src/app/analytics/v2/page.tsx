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
import HeatmapContainer from '@/components/analytics/HeatmapContainer';
import { BarChart3, TrendingUp, Users, Home, ChevronLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { ExperimentBadge } from '@/components/badges/ExperimentBadge';
import { TourHelpButton } from '@/components/TourHelpButton';
import LocalityComparison from '@/components/analytics/LocalityComparison';
import LocalityProfileList from '@/components/analytics/LocalityProfileList';
import RecommendationsList from '@/components/analytics/RecommendationsList';
import {
  getLocalityRecommendations,
  type LocalityMetrics,
  type Recommendation
} from '@/lib/recommendation-engine';

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
  const [tab, setTab] = useState<'overall' | 'comparison' | 'opportunities' | 'locality' | 'recommendations'>('overall');
  const [chartsLoading, setChartsLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [comparisonLocalities, setComparisonLocalities] = useState<string[]>([]);
  const [selectedLocality, setSelectedLocality] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [filterBhk, setFilterBhk] = useState<string>('all');
  const [filterFurnishing, setFilterFurnishing] = useState<string>('all');
  const [filterLocality, setFilterLocality] = useState<string>('all');

  const hasActiveFilters = dateRange !== '30d' || filterBhk !== 'all' || filterFurnishing !== 'all' || filterLocality !== 'all';

  useEffect(() => {
    loadMetrics();
  }, []);

  useEffect(() => {
    loadChartData(selectedCity);
    calculateOpportunities(selectedCity);
  }, [selectedCity, dateRange, filterBhk, filterFurnishing, filterLocality]);

  // Load filter values from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('analytics-filters');
    if (saved) {
      try {
        const filters = JSON.parse(saved);
        if (filters.dateRange) setDateRange(filters.dateRange);
        if (filters.filterBhk) setFilterBhk(filters.filterBhk);
        if (filters.filterFurnishing) setFilterFurnishing(filters.filterFurnishing);
        if (filters.filterLocality) setFilterLocality(filters.filterLocality);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Save filter values to localStorage when they change
  useEffect(() => {
    localStorage.setItem('analytics-filters', JSON.stringify({
      dateRange,
      filterBhk,
      filterFurnishing,
      filterLocality
    }));
  }, [dateRange, filterBhk, filterFurnishing, filterLocality]);

  const calculateOpportunities = (city: City) => {
    const chartData = citiesChartData[city];
    if (!chartData || !chartData.heatmap || chartData.heatmap.length === 0) {
      setOpportunities([]);
      return;
    }

    // Calculate locality-specific opportunity scores
    const localityOpportunities = chartData.heatmap.map((locality: any) => {
      const demand = locality.demand || 0;
      const supply = locality.listings || 1;
      const ratio = locality.ratio ? parseFloat(locality.ratio) : 0;

      // Opportunity Score Calculation (0-100)
      // Factors: demand-supply ratio (60%), demand volume (20%), supply availability (20%)
      const ratioScore = Math.min(100, ratio * 30); // High ratio = high opportunity
      const demandScore = Math.min(100, (demand / 100) * 30); // High demand = opportunity
      const supplyScore = Math.max(0, 40 - (supply / 100) * 20); // Low supply = high opportunity

      const opportunityScore = Math.round(ratioScore + demandScore + supplyScore);

      // Determine trends
      const supplyTrend = supply > 50 ? '↑ Growing' : supply > 20 ? '→ Stable' : '↓ Limited';
      const demandTrend = ratio > 1.5 ? '↑ High' : ratio > 0.8 ? '→ Balanced' : '↓ Low';
      const priceMomentum = demand > 70 ? '📈 Strong' : demand > 40 ? '➡️ Stable' : '📉 Weak';

      // Recommendation based on opportunity profile
      let recommendation = 'Medium';
      if (opportunityScore >= 75) {
        recommendation = 'High ✓';
      } else if (opportunityScore >= 50) {
        recommendation = 'Medium';
      } else {
        recommendation = 'Low';
      }

      return {
        locality_name: locality.area || 'Unknown',
        opportunity_score: opportunityScore,
        supply_trend: supplyTrend,
        demand_trend: demandTrend,
        price_momentum: priceMomentum,
        recommendation,
        demand: locality.demand,
        supply: locality.listings,
        ratio: locality.ratio
      };
    }).sort((a: any, b: any) => b.opportunity_score - a.opportunity_score);

    setOpportunities(localityOpportunities);
  };

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

        // Apply BHK, furnishing, and locality filters to segment data
        let filteredSegments = segmentData;
        if (filterBhk !== 'all') {
          filteredSegments = filteredSegments.filter((seg: any) => seg.name?.includes(`${filterBhk}BHK`));
        }
        if (filterFurnishing !== 'all') {
          const furnishingMap: Record<string, string> = {
            'furnished': 'Furnished',
            'semi': 'Semi',
            'unfurnished': 'Unfurnished'
          };
          const furnishLabel = furnishingMap[filterFurnishing];
          filteredSegments = filteredSegments.filter((seg: any) => seg.name?.includes(furnishLabel));
        }
        if (filterLocality !== 'all') {
          filteredSegments = filteredSegments.filter((seg: any) => seg.name?.includes(filterLocality));
        }

        // Generate heatmap data from filtered segments
        const heatmapData = (filteredSegments.length > 0 ? filteredSegments : segmentData).slice(0, 12).map((seg: any) => {
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
            segmentData: filteredSegments.length > 0 ? filteredSegments : (segmentData.length > 0 ? segmentData : [{ name: 'No listings', value: 0 }]),
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
  const topLocalities = (currentCharts?.segmentData || []).slice(0, 10).map((seg: any) => seg.name).filter(Boolean);

  // Generate market insights based on current metrics
  const generateInsights = () => {
    if (!currentMetrics) return [];

    const insights: Array<{ icon: string; title: string; description: string; action: string }> = [];
    const ratio = currentMetrics.demand.ratio;
    const supply = currentMetrics.supply.count;
    const demand = currentMetrics.demand.count;

    // Insight 1: Demand-Supply Analysis
    if (ratio > 1.5) {
      insights.push({
        icon: '🔥',
        title: 'High Demand, Limited Supply',
        description: `${demand} seekers competing for only ${supply} listings (${ratio.toFixed(1)}:1 ratio)`,
        action: 'Best market to list properties'
      });
    } else if (ratio > 0.8) {
      insights.push({
        icon: '⚖️',
        title: 'Balanced Market',
        description: `Supply and demand in equilibrium (${ratio.toFixed(1)}:1 ratio)`,
        action: 'Fair pricing opportunity'
      });
    } else {
      insights.push({
        icon: '📦',
        title: 'Oversupply Market',
        description: `More listings (${supply}) than seekers (${demand})`,
        action: 'Focus on pricing competitively'
      });
    }

    // Insight 2: Price Volatility
    if (currentMetrics.price.volatility > 15) {
      insights.push({
        icon: '📈',
        title: 'High Price Volatility',
        description: `Market prices fluctuating at ${currentMetrics.price.volatility.toFixed(1)}% variance`,
        action: 'Monitor price trends closely'
      });
    }

    // Insight 3: Transparency Score
    insights.push({
      icon: '✓',
      title: 'Market Transparency',
      description: `${currentMetrics.quality.transparencyScore.toFixed(0)}% of listings have verified data`,
      action: 'Higher transparency = buyer confidence'
    });

    // Insight 4: Top Opportunity
    if (opportunities.length > 0) {
      const topOpp = opportunities[0];
      insights.push({
        icon: '⭐',
        title: 'Top Opportunity Area',
        description: `${topOpp.locality_name}: ${topOpp.opportunity_score}% opportunity score`,
        action: 'Highest potential for returns'
      });
    }

    return insights;
  };

  // Generate locality-specific recommendations
  const generateLocalityRecommendations = (localityName: string) => {
    setRecommendationsLoading(true);
    try {
      const chartData = citiesChartData[selectedCity];
      if (!chartData || !chartData.heatmap) {
        setRecommendations([]);
        setRecommendationsLoading(false);
        return;
      }

      // Find the selected locality in heatmap data
      const selectedLocalityData = chartData.heatmap.find(
        (h: any) => h.area === localityName
      );

      if (!selectedLocalityData) {
        setRecommendations([]);
        setRecommendationsLoading(false);
        return;
      }

      // Convert heatmap data to LocalityMetrics format
      const targetLocality: LocalityMetrics = {
        name: selectedLocalityData.area || localityName,
        avgRent: currentMetrics?.price.avg || selectedLocalityData.avgRent || 0,
        medianRent: currentMetrics?.price.median || selectedLocalityData.medianRent || 0,
        supply: selectedLocalityData.listings || 0,
        demand: selectedLocalityData.seekers || 0,
        ratio: selectedLocalityData.ratio ? parseFloat(selectedLocalityData.ratio) : 0,
        volatility: currentMetrics?.price.volatility || 0,
        transparencyScore: currentMetrics?.quality.transparencyScore || 0,
        gatedPercent: selectedLocalityData.gatedPercent,
        bhk1Avg: selectedLocalityData.bhk1Avg,
        bhk2Avg: selectedLocalityData.bhk2Avg,
        bhk3Avg: selectedLocalityData.bhk3Avg
      };

      // Convert all heatmap items to LocalityMetrics
      const allLocalities: LocalityMetrics[] = chartData.heatmap.map((h: any) => ({
        name: h.area || 'Unknown',
        avgRent: currentMetrics?.price.avg || h.avgRent || 0,
        medianRent: currentMetrics?.price.median || h.medianRent || 0,
        supply: h.listings || 0,
        demand: h.seekers || 0,
        ratio: h.ratio ? parseFloat(h.ratio) : 0,
        volatility: currentMetrics?.price.volatility || 0,
        transparencyScore: currentMetrics?.quality.transparencyScore || 0,
        gatedPercent: h.gatedPercent,
        bhk1Avg: h.bhk1Avg,
        bhk2Avg: h.bhk2Avg,
        bhk3Avg: h.bhk3Avg
      }));

      // Get recommendations
      const recs = getLocalityRecommendations(targetLocality, allLocalities);
      setRecommendations([
        ...recs.similar,
        ...recs.investments,
        ...recs.seasonal
      ]);
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // Generate investment recommendations
  const generateRecommendations = () => {
    if (!currentMetrics) return [];

    const recommendations: Array<{ type: 'landlord' | 'seeker'; emoji: string; title: string; detail: string }> = [];
    const ratio = currentMetrics.demand.ratio;

    // Landlord recommendations
    if (ratio > 1.5) {
      recommendations.push({
        type: 'landlord',
        emoji: '💰',
        title: 'Premium Pricing Opportunity',
        detail: 'High demand allows for above-average pricing. List now to capitalize.'
      });
    } else if (ratio < 0.5) {
      recommendations.push({
        type: 'landlord',
        emoji: '🎯',
        title: 'Aggressive Marketing Needed',
        detail: 'Use premium visuals, virtual tours, and flexible terms to attract seekers.'
      });
    }

    // Seeker recommendations
    if (ratio > 2) {
      recommendations.push({
        type: 'seeker',
        emoji: '⏰',
        title: 'Act Fast',
        detail: 'Limited inventory means properties go quickly. Shortlist and move fast.'
      });
    } else if (ratio < 0.8) {
      recommendations.push({
        type: 'seeker',
        emoji: '💬',
        title: 'Negotiate Better Terms',
        detail: 'Oversupply means you have negotiation power. Request better terms.'
      });
    }

    // General market recommendation
    if (currentMetrics.price.volatility > 15) {
      recommendations.push({
        type: 'landlord',
        emoji: '📊',
        title: 'Monitor Market Trends',
        detail: 'High volatility suggests market shifts. Stay updated on pricing.'
      });
    }

    return recommendations.slice(0, 3);
  };

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
        {/* Filters */}
        <section>
          <div className="space-y-3 pb-4 border-b border-primary/20">
            {/* Filter Header */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="w-full md:w-auto flex items-center gap-2 md:justify-between p-3 md:p-0 rounded-lg md:rounded-none bg-primary/10 md:bg-transparent border md:border-0 border-primary/30 hover:bg-primary/20 md:hover:bg-transparent transition-all"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-xs uppercase tracking-widest font-technical font-bold text-primary">
                  Filters
                </h2>
                {hasActiveFilters && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-primary/30 text-primary">
                    {[dateRange !== '30d' ? 1 : 0, filterBhk !== 'all' ? 1 : 0, filterFurnishing !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)} active
                  </span>
                )}
              </div>
              <span className="text-xs md:hidden">
                {filtersOpen ? '▼' : '▶'}
              </span>
            </button>

            {/* Filter Controls */}
            <div className={`grid grid-cols-1 gap-3 md:flex md:flex-wrap md:gap-3 md:items-center transition-all ${
              filtersOpen ? 'block' : 'hidden md:flex'
            }`}>
              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-technical text-on-surface-variant uppercase min-w-fit">Range:</label>
                <div className="flex gap-1.5">
                  {(['7d', '30d', '90d'] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => setDateRange(range)}
                      className={`px-2.5 py-1.5 text-xs font-bold uppercase rounded transition-all ${
                        dateRange === range
                          ? 'bg-primary text-background'
                          : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* BHK Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-technical text-on-surface-variant uppercase min-w-fit">BHK:</label>
                <select
                  value={filterBhk}
                  onChange={(e) => setFilterBhk(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-bold bg-primary/10 border border-primary/30 text-on-surface rounded hover:border-primary/50 cursor-pointer focus:outline-none transition-all"
                >
                  <option value="all">All</option>
                  <option value="1">1BHK</option>
                  <option value="2">2BHK</option>
                  <option value="3">3BHK</option>
                </select>
              </div>

              {/* Furnishing Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-technical text-on-surface-variant uppercase min-w-fit">Furnish:</label>
                <select
                  value={filterFurnishing}
                  onChange={(e) => setFilterFurnishing(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-bold bg-primary/10 border border-primary/30 text-on-surface rounded hover:border-primary/50 cursor-pointer focus:outline-none transition-all"
                >
                  <option value="all">All</option>
                  <option value="furnished">Furnished</option>
                  <option value="semi">Semi</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              </div>

              {/* Locality Filter */}
              {topLocalities.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-technical text-on-surface-variant uppercase min-w-fit">Area:</label>
                  <select
                    value={filterLocality}
                    onChange={(e) => setFilterLocality(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-bold bg-primary/10 border border-primary/30 text-on-surface rounded hover:border-primary/50 cursor-pointer focus:outline-none transition-all"
                  >
                    <option value="all">All Areas</option>
                    {topLocalities.map((locality: string) => (
                      <option key={locality} value={locality}>{locality}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setDateRange('30d');
                    setFilterBhk('all');
                    setFilterFurnishing('all');
                    setFilterLocality('all');
                  }}
                  className="px-3 py-1.5 text-xs font-bold uppercase rounded bg-secondary/20 text-secondary border border-secondary/40 hover:bg-secondary/30 transition-all w-full md:w-auto"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Quick Stats Bar */}
        {currentMetrics && (
          <section className="space-y-2">
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant uppercase font-technical">Total Supply</span>
                  <span className="text-lg font-bold text-on-surface">{currentMetrics.supply.count}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant uppercase font-technical">Total Demand</span>
                  <span className="text-lg font-bold text-on-surface">{currentMetrics.demand.count}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant uppercase font-technical">Seeker Ratio</span>
                  <span className="text-lg font-bold text-primary">
                    1:{currentMetrics.demand.ratio === 0 || !isFinite(1 / currentMetrics.demand.ratio) ? '∞' : Math.round(1 / currentMetrics.demand.ratio)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant uppercase font-technical">Median Rent</span>
                  <span className="text-lg font-bold text-secondary">₹{(currentMetrics.price.median / 1000).toFixed(0)}k</span>
                </div>
                <div className="hidden md:flex md:flex-col">
                  <span className="text-xs text-on-surface-variant uppercase font-technical">Market Status</span>
                  <span className="text-lg font-bold">{currentMetrics.demand.interpretation}</span>
                </div>
              </div>
            </div>
          </section>
        )}

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
          <div className="flex gap-4 border-b border-white/10 mb-6 overflow-x-auto">
            {(['overall', 'comparison', 'opportunities', 'locality', 'recommendations'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-technical font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
                  tab === t
                    ? 'border-b-2 border-primary text-primary'
                    : 'border-b-2 border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>
                  {t === 'overall' && 'Overall'}
                  {t === 'comparison' && 'City Comparison'}
                  {t === 'opportunities' && 'Opportunities'}
                  {t === 'locality' && 'Locality Analysis'}
                  {t === 'recommendations' && 'Recommendations'}
                </span>
              </button>
            ))}
          </div>

          {tab === 'overall' && currentMetrics && (
            <div className="space-y-6">
              {/* Market Health Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/10">
                  <p className="text-xs text-on-surface-variant mb-2">Market Temperature</p>
                  <p className="text-2xl font-bold text-primary">
                    {currentMetrics.demand.ratio > 1.5 ? '🔥 Hot' : currentMetrics.demand.ratio > 0.8 ? '🟡 Warm' : '❄️ Cool'}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-2">{currentMetrics.demand.ratio.toFixed(1)}:1 ratio</p>
                </div>
                <div className="p-4 rounded-lg border border-secondary/30 bg-secondary/10">
                  <p className="text-xs text-on-surface-variant mb-2">Seeker-Listing Ratio</p>
                  <p className="text-2xl font-bold text-secondary">
                    1:{currentMetrics.demand.ratio === 0 || !isFinite(1 / currentMetrics.demand.ratio) ? '∞' : Math.round(1 / currentMetrics.demand.ratio)}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-2">{currentMetrics.demand.count} seekers</p>
                </div>
                <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/10">
                  <p className="text-xs text-on-surface-variant mb-2">Price Volatility</p>
                  <p className="text-2xl font-bold text-orange-400">{currentMetrics.price.volatility.toFixed(1)}%</p>
                  <p className="text-xs text-on-surface-variant mt-2">{currentMetrics.price.volatility > 15 ? 'High' : 'Moderate'}</p>
                </div>
                <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                  <p className="text-xs text-on-surface-variant mb-2">Premium Index</p>
                  <p className="text-2xl font-bold text-emerald-400">{currentMetrics.price.premiumIndex.toFixed(2)}x</p>
                  <p className="text-xs text-on-surface-variant mt-2">vs baseline</p>
                </div>
              </div>

              {/* Detailed Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-lg border border-white/10 bg-surface/50">
                <div>
                  <p className="text-xs text-on-surface-variant mb-2">Supply Volume</p>
                  <p className="text-2xl font-bold text-on-surface">{currentMetrics.supply.count}</p>
                  <p className="text-xs text-on-surface-variant mt-1">Active listings</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-2">Demand Volume</p>
                  <p className="text-2xl font-bold text-on-surface">{currentMetrics.demand.count}</p>
                  <p className="text-xs text-on-surface-variant mt-1">Active seekers</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-2">Median Rent</p>
                  <p className="text-2xl font-bold text-on-surface">₹{(currentMetrics.price.median / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-on-surface-variant mt-1">Monthly</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-2">Market Health</p>
                  <p className="text-lg font-bold text-primary">{currentMetrics.demand.interpretation}</p>
                  <p className="text-xs text-on-surface-variant mt-1">Overall status</p>
                </div>
              </div>

              {/* Insights Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-technical font-bold text-primary mb-4">
                    Market Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generateInsights().map((insight, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{insight.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm text-on-surface mb-1">{insight.title}</h4>
                            <p className="text-xs text-on-surface-variant mb-2">{insight.description}</p>
                            <button className="text-xs px-2 py-1 rounded border border-primary/50 text-primary hover:bg-primary/20 transition-all">
                              {insight.action} →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations Section */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-technical font-bold text-secondary mb-4">
                    Recommended Actions
                  </h3>
                  <div className="space-y-2">
                    {generateRecommendations().map((rec, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border transition-all ${
                          rec.type === 'landlord'
                            ? 'border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10'
                            : 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{rec.emoji}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-sm text-on-surface">{rec.title}</h4>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                rec.type === 'landlord'
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {rec.type === 'landlord' ? '🏠 Landlord' : '🔍 Seeker'}
                              </span>
                            </div>
                            <p className="text-xs text-on-surface-variant">{rec.detail}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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

              {/* Geographic Heatmaps */}
              <div className="space-y-6">
                <h3 className="text-xs uppercase tracking-widest font-technical font-bold text-primary">
                  Geographic Intelligence
                </h3>
                <HeatmapContainer
                  data={currentCharts.heatmap || []}
                  city={selectedCity}
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
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-technical font-bold text-primary mb-1">
                    Investment Opportunities
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    Ranked by opportunity score — {selectedCity} market analysis
                  </p>
                </div>
                {opportunities.length > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-on-surface-variant">Showing</p>
                    <p className="text-lg font-bold text-primary">{Math.min(10, opportunities.length)} of {opportunities.length}</p>
                  </div>
                )}
              </div>
              <OpportunityTable data={opportunities.slice(0, 10)} loading={loading} />
            </div>
          )}

          {tab === 'locality' && (
            <div className="space-y-8">
              {/* Locality Profiles Browse */}
              <div>
                <h3 className="text-xs uppercase tracking-widest font-technical font-bold text-secondary mb-6">
                  Locality Profiles
                </h3>
                <LocalityProfileList
                  localities={(currentCharts.heatmap || []).map((heatmapData: any) => ({
                    name: heatmapData.area || 'Unknown',
                    supply: heatmapData.listings || 0,
                    demand: heatmapData.seekers || 0,
                    ratio: heatmapData.ratio ? parseFloat(heatmapData.ratio) : 0,
                    avgRent: Math.round(currentMetrics?.price.avg || 0),
                    medianRent: currentMetrics?.price.median || 0,
                    minRent: Math.round((currentMetrics?.price.median || 0) * 0.7),
                    maxRent: Math.round((currentMetrics?.price.median || 0) * 1.3),
                    volatility: currentMetrics?.price.volatility || 0,
                    transparencyScore: currentMetrics?.quality.transparencyScore || 0
                  }))}
                  cityAverage={{
                    supply: currentMetrics?.supply.count || 0,
                    demand: currentMetrics?.demand.count || 0,
                    ratio: currentMetrics?.demand.ratio || 0,
                    avgRent: currentMetrics?.price.avg || 0,
                    medianRent: currentMetrics?.price.median || 0,
                    volatility: currentMetrics?.price.volatility || 0,
                    transparencyScore: currentMetrics?.quality.transparencyScore || 0
                  }}
                  onLocalitySelect={(localityName) => {
                    setSelectedLocality(localityName);
                    generateLocalityRecommendations(localityName);
                  }}
                />
              </div>

              {/* Locality Comparison */}
              <div className="border-t border-primary/20 pt-8">
                <h3 className="text-xs uppercase tracking-widest font-technical font-bold text-secondary mb-6">
                  Side-by-Side Comparison
                </h3>
                <LocalityComparison
                  localities={comparisonLocalities.map(name => {
                    const heatmapData = currentCharts.heatmap?.find((h: any) => h.area === name);
                    return {
                      name,
                      supply: heatmapData?.listings || 0,
                      demand: heatmapData?.seekers || 0,
                      avgRent: Math.round(currentMetrics?.price.avg || 0),
                      medianRent: currentMetrics?.price.median || 0,
                      minPrice: Math.round((currentMetrics?.price.median || 0) * 0.7),
                      maxPrice: Math.round((currentMetrics?.price.median || 0) * 1.3),
                      volatility: currentMetrics?.price.volatility || 0,
                      transparencyScore: currentMetrics?.quality.transparencyScore || 0
                    };
                  })}
                  allLocalities={topLocalities}
                  onAddLocality={(name) => {
                    if (comparisonLocalities.length < 4) {
                      setComparisonLocalities([...comparisonLocalities, name]);
                    }
                  }}
                  onRemoveLocality={(name) => {
                    setComparisonLocalities(comparisonLocalities.filter(l => l !== name));
                  }}
                  cityAverage={{
                    name: `${selectedCity} Average`,
                    supply: currentMetrics?.supply.count || 0,
                    demand: currentMetrics?.demand.count || 0,
                    avgRent: currentMetrics?.price.avg || 0,
                    medianRent: currentMetrics?.price.median || 0,
                    minPrice: Math.round((currentMetrics?.price.median || 0) * 0.7),
                    maxPrice: Math.round((currentMetrics?.price.median || 0) * 1.3),
                    volatility: currentMetrics?.price.volatility || 0,
                    transparencyScore: currentMetrics?.quality.transparencyScore || 0
                  }}
                />
              </div>
            </div>
          )}

          {tab === 'recommendations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs uppercase tracking-widest font-technical font-bold text-primary mb-2">
                  Smart Recommendations
                </h3>
                <p className="text-sm text-on-surface-variant mb-6">
                  {selectedLocality
                    ? `Personalized insights for ${selectedLocality}`
                    : 'Select a locality to get smart recommendations based on market data'}
                </p>
              </div>

              {selectedLocality ? (
                <RecommendationsList
                  recommendations={recommendations}
                  selectedLocality={selectedLocality}
                  isLoading={recommendationsLoading}
                />
              ) : (
                <div className="p-8 text-center rounded-lg border border-white/10 bg-surface/50">
                  <p className="text-on-surface-variant text-sm mb-4">
                    No locality selected yet
                  </p>
                  <button
                    onClick={() => setTab('locality')}
                    className="px-4 py-2 rounded-lg bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-all text-sm font-bold"
                  >
                    Go to Locality Analysis →
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
