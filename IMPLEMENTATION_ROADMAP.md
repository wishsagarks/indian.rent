# Analytics Dashboard Implementation Roadmap

## Phase 1: Backend Foundation (SQL + API Layer)
✅ **DONE**: 
- `get_city_metrics(p_city)` RPC
- `get_locality_metrics(p_city, p_locality)` RPC  
- `get_segment_metrics(p_city, p_bhk, p_furnishing)` RPC
- `calculate_opportunity_score(p_city)` RPC
- `metrics_daily` table for historical data

---

## Phase 2: API Routes (Next.js Server Actions)

### Files to Create:
```
src/app/actions/analytics-actions.ts

Exports:
- getCityMetrics(city: string)
- getLocalityMetrics(city: string, locality: string)
- getSegmentMetrics(city: string, bhk: number, furnishing: string)
- getOpportunityScores(city: string)
```

Example implementation:
```typescript
export async function getCityMetrics(city: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_city_metrics', { p_city: city });
  if (error) throw error;
  // Transform into UI-friendly format
  return transformMetrics(data);
}
```

---

## Phase 3: UI Components (React)

### 3.1 **Main Analytics Dashboard**
📁 `src/app/analytics/v2-AnalyticsDashboard.tsx`

**Key Sections:**
1. **Hero Banner** 
   - Market headline with trending metrics
   - City selector (defaulting to Bengaluru)
   
2. **KPI Cards Grid** (4 columns on desktop)
   ```
   ┌─────────┬─────────┬─────────┬─────────┐
   │ Supply  │ Demand  │ Price   │ Trend   │
   │ 12,430  │ 1,240   │ ₹25.2k  │ ↑3% YoY │
   └─────────┴─────────┴─────────┴─────────┘
   ```
   - Real-time values
   - Arrow indicators (↑/↓/→)
   - MoM/YoY % change badges
   - Trending context ("Healthy" / "Tight" / "Concerning")

3. **Market Health Indicator**
   - Seeker-Listing Ratio gauge (1:5, 1:10, 1:20 scale)
   - Color coding: Green (balanced), Yellow (tight), Red (oversupply)
   
4. **Tab: Overall vs By City**
   - Overall = Aggregated
   - By City = Bengaluru vs Hyderabad comparison grid

### 3.2 **Comparison Grid Component**
📁 `src/components/analytics/CityComparisonGrid.tsx`

**Props:**
```typescript
{
  metrics: CityMetricsData[],  // [bengaluru_metrics, hyderabad_metrics]
  highlighted?: string[]        // metrics to highlight
}
```

**Displays:**
- Side-by-side metric table
- Delta column showing % difference
- Color coding for better/worse

### 3.3 **Heatmap Visualization**
📁 `src/components/analytics/LocalityHeatmap.tsx`

**Tech Stack:**
- Mapbox GL or Google Maps
- D3.js for overlays
- Viridis colorscale (green=affordable, red=expensive)

**Features:**
- Geographic scatter of localities
- Color intensity = Price per sqft
- Bubble size = Supply volume
- Hover = Show locality details
- Click = Drill into locality detail view

### 3.4 **Locality Detail Card**
📁 `src/components/analytics/LocalityDetailCard.tsx`

**Layout:**
```
[Locality Name] [City] [Opportunity Score: ⭐⭐⭐⭐⭐]
┌───────────────────────────────────────┐
│ Supply:          ⭐⭐⭐⭐⭐ 92%        │
│ Demand:          ⭐⭐⭐⭐  78%        │
│ Value Score:     ⭐⭐⭐⭐  81%        │
│ Price Momentum:  🟢 +5% (Rising)      │
├───────────────────────────────────────┤
│ Total Listings:  320 | Days-to-Rent: 14 days
│ Median Rent:     ₹28,500 | Price/Sqft: ₹45
│ Price Range:     ₹18k - ₹65k
│ Seeker Pins:     12 (Last 30d)
├───────────────────────────────────────┤
│ [View all listings] [Compare with...]  │
└───────────────────────────────────────┘
```

### 3.5 **Segment Waterfall**
📁 `src/components/analytics/SegmentWaterfall.tsx`

**Tech:** Recharts or custom SVG
**Data:**
- Parent: Total market
- Children: BHK breakdown
- Grandchildren: Furnishing breakdown

### 3.6 **Time Series Charts**
📁 `src/components/analytics/TimeSeriesCharts.tsx`

**Multiple charts:**
1. Rent Trend (6 months)
   - X: Weeks
   - Y: Median rent by BHK
   - Bands: P25-P75 envelope

2. Supply-Demand Convergence
   - Dual-axis: Listings (blue) vs Seekers (red)
   
3. Absorption Rate Trajectory
   - % of listings transitioned to occupied

**Tech:** Recharts or Chart.js

### 3.7 **Opportunity Score Table**
📁 `src/components/analytics/OpportunityTable.tsx`

**Columns:**
- Locality Name
- Opportunity Score (⭐⭐⭐⭐⭐)
- Supply Trend (↑↑/↑/→/↓)
- Demand Trend (↑↑/↑/→/↓)
- Price Momentum (🔴/🟡/🟢)
- Recommendation (High Priority / Medium / Monitor)

**Features:**
- Sortable columns
- Filterable by score range
- Click row → Detail card

### 3.8 **Market Alert Banner**
📁 `src/components/analytics/MarketAlerts.tsx`

**Examples:**
- 🔴 "Whitefield: Supply crunch! Seeker-Listing ratio 3:1"
- 🟡 "Indiranagar: Prices rising +5% this week"
- 🟢 "Koramangala: Stable market conditions"

---

## Phase 4: Data Transformations

### File: `src/lib/analytics-transform.ts`

```typescript
// Transform RPC responses into UI-friendly format
export function transformCityMetrics(raw: any): CityMetricsUI {
  return {
    supply: {
      count: raw.total_listings,
      trend: calculateTrend(raw),
      growth: calculateGrowth(raw)
    },
    demand: {
      count: raw.seeker_pins,
      ratio: raw.seeker_listing_ratio,
      interpretation: interpretRatio(raw.seeker_listing_ratio)
    },
    price: {
      median: raw.median_rent,
      avg: raw.avg_rent,
      volatility: raw.rent_volatility,
      momentum: calculatePriceMomentum(raw),
      premiumIndex: raw.premium_index
    },
    quality: {
      transparencyScore: raw.transparency_score,
      engagement: calculateEngagement(raw)
    }
  };
}

// Calculate trend interpretation
function interpretRatio(ratio: number): string {
  if (ratio > 2) return 'Supply Crunch ⚠️';
  if (ratio > 1) return 'Balanced 🟢';
  if (ratio > 0.5) return 'Oversupply 📉';
  return 'Heavy Oversupply 🔴';
}
```

---

## Phase 5: Page Layout

### Main Analytics Page
📁 `src/app/analytics/page.tsx`

```
┌─────────────────────────────────────────────┐
│ Header: Market Headline + City Selector      │
├─────────────────────────────────────────────┤
│                                             │
│  ┌────────┬────────┬────────┬────────┐     │
│  │ Supply │ Demand │ Price  │ Trend  │     │
│  │ 12,430 │ 1,240  │ ₹25.2k │ ↑3%    │     │
│  └────────┴────────┴────────┴────────┘     │
│                                             │
│  [Overall] [By City] [Deep Dive]            │
│  ┌─────────────────────────────────────┐   │
│  │ Seeker-Listing: 1:10 🟢 Healthy    │   │
│  │ Absorption: 7.2% (Monthly)         │   │
│  │ Market Volatility: 8.2%            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Supply Heatmap] [Demand Hotspots]        │
│  [Price Trends]   [Opportunity Score]      │
│                                             │
│  Market Alerts & Insights                  │
│  ┌─────────────────────────────────────┐   │
│  │ 🔴 Whitefield: Supply crunch        │   │
│  │ 🟡 Indiranagar: Prices rising       │   │
│  │ 🟢 Koramangala: Stable market       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Top Opportunities (Locality Table)         │
│  ┌─────────────────────────────────────┐   │
│  │ Whitefield    ⭐⭐⭐⭐⭐ High Prior.  │   │
│  │ Indiranagar   ⭐⭐⭐⭐  Medium       │   │
│  │ Koramangala   ⭐⭐⭐    Monitor      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Export CSV] [Export PDF]                  │
└─────────────────────────────────────────────┘
```

---

## Phase 6: Integration Points

### With Existing Code:
1. **PlaceAutocomplete** → Add locality click to drill into detail view
2. **AnalyticsDashboard** → Replace with new v2 dashboard
3. **LiveStatsPanel** → Add "Compare with overall" button

### New Server Actions:
```typescript
// src/app/actions/analytics-actions.ts
export async function getCityMetrics(city: string)
export async function getLocalityMetrics(city: string, locality: string)
export async function getSegmentMetrics(city: string, bhk: number, furnishing: string)
export async function getOpportunityScores(city: string)
export async function getTimeSeriesMetrics(city: string, days: number = 180)
export async function getMarketAlerts(city: string)
```

---

## Phase 7: Styling & Polish

### Design System:
- Color palette:
  - Healthy/Positive: `#22c55e` (green)
  - Warning/Caution: `#eab308` (yellow)
  - Concerning/Negative: `#ef4444` (red)
  - Neutral/Data: `#0066ff` (primary blue)

- Typography:
  - Headlines: Display font (bold)
  - Metrics: Technical monospace (numbers)
  - Labels: Sans-serif (regular)

- Animations:
  - Number transitions: Smooth 500ms
  - Chart animations: 800ms easing
  - Expand/collapse: 300ms

---

## Implementation Priority

**Week 1:**
- ✅ SQL backend (already done)
- Analytics API routes
- CityComparisonGrid component
- KPI Cards component

**Week 2:**
- LocalityDetailCard
- Heatmap visualization
- OpportunityTable
- Market alerts

**Week 3:**
- TimeSeriesCharts
- SegmentWaterfall
- Full page integration
- Export functionality

**Week 4:**
- Polish & animations
- Mobile responsiveness
- Performance optimization
- User testing

---

## Success Metrics for Analytics

Track that users:
- ✅ Visit analytics section (weekly)
- ✅ Drill down into localities (% of visits)
- ✅ Use filters/comparisons (engagement)
- ✅ Export data (value signal)
- ✅ Time spent on analytics (10+ min per session)

