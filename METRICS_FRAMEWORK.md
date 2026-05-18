# Indian.Rent Analytics Framework v2.0
## Comprehensive Metrics for Data-Driven Insights

---

## 🎯 TIER 1: MACRO MARKET INSIGHTS (Platform Level)

### Market Size & Liquidity
- **Total Market Volume** = SUM(rent_amount) / 12 (annualized market cap)
- **Listings Velocity** = New listings per day (7-day rolling avg)
- **Market Density** = Listings per sq-km (heatmap)
- **Active Inventory** = Listings younger than 60 days / Total listings (%)
- **Churn Rate** = Listings marked as occupied / Total created (%)

### Supply-Demand Dynamics
- **Seeker-Listing Ratio** = Active seeker pins / Vacant listings (supply-demand gap)
- **Demand Intensity** = Seeker pins per locality per day (hotspot detection)
- **Absorption Rate** = Listings transitioned to occupied in last 30 days / Avg daily listings
- **Days-to-Rent** = Distribution percentile (P25, P50, P75, P90)

### Price Intelligence
- **Market Median Rent** = PERCENTILE(rent_amount, 0.5) per BHK per city
- **Rent Volatility** = STDDEV(rent_amount) / AVG(rent_amount) (price stability index)
- **Price per Sqft** = Rent / Size (value metric) - by BHK, furnishing, location
- **Premium Index** = High-end (P75) / Budget (P25) rent ratio (inequality metric)
- **Rent Trend** = MoM % change in median rent (inflation signal)

### Quality Signals
- **Transparency Score** = is_transparency_pin count / Total listings (%)
- **Verified Listings %** = Listings with 3+ community reviews
- **Community Engagement** = Avg ratings per listing (sentiment)
- **Data Completeness** = (Listings with size + maintenance + furnishing) / Total (%)

---

## 🏙️ TIER 2: CITY-WISE COMPARATIVE ANALYTICS

### Side-by-Side Comparison Grid

| Metric | Bengaluru | Hyderabad | Δ (BLR vs HYD) |
|--------|-----------|-----------|-----------------|
| **Supply Metrics** |
| Total Listings | COUNT | COUNT | % diff |
| New Listings (30d) | COUNT | COUNT | % diff |
| Inventory Age | Median days | Median days | +/- days |
| **Demand Metrics** |
| Seeker Pins | COUNT | COUNT | % diff |
| Seeker-Listing Ratio | Ratio | Ratio | % diff |
| **Price Metrics** |
| 1BHK Median | Rent | Rent | % diff |
| 2BHK Median | Rent | Rent | % diff |
| 3BHK Median | Rent | Rent | % diff |
| Price/Sqft | ₹/sqft | ₹/sqft | % diff |
| **Category Mix** |
| Gated % | % | % | +/- pts |
| Semi-Gated % | % | % | +/- pts |
| Standalone % | % | % | +/- pts |
| **Quality** |
| Transparency Score | % | % | +/- pts |
| Avg Community Rating | Stars | Stars | +/- stars |

---

## 📊 TIER 3: MICRO INSIGHTS (Locality & Segment Level)

### Locality Scorecards (Top 20 per city)
```
[Locality Name] [Supply📈] [Demand📊] [Price💰] [Trend🔄]
1. Whitefield      ⭐⭐⭐⭐⭐  ⭐⭐⭐⭐   🔴↓2% Hottest supply
2. Indiranagar     ⭐⭐⭐⭐   ⭐⭐⭐⭐⭐ 🟢↑5% High demand
3. Koramangala     ⭐⭐⭐    ⭐⭐⭐   🟡→0% Balanced
```

**Per-Locality Metrics:**
- **Supply Trend** = Listings in area for last (7d, 30d, 90d)
- **Demand Heat** = Seeker pins in last 30d (normalized by area)
- **Price Momentum** = (New median - Old median) / Old median (%)
- **Value Score** = (Price/Sqft vs City Avg) - (Time on market vs Avg) = opportunity score
- **Preference Alignment** = % listings matching top seeker preferences (tenant type, pets, etc)

### Segment Deep Dives (By BHK + Furnishing)
**1BHK Furnished:**
- Supply: 2,340 listings | Demand: 450 seekers | Ratio: 5.2:1
- Median Rent: ₹18,500 | Range: ₹12k-₹35k | Volatility: 8.2%
- Top Localities: Whitefield (320), Indiranagar (280), Koramangala (210)
- Days to Rent (P50): 12 days | Absorption: 8.2% monthly

**2BHK Semi-Furnished:**
- Supply: 4,120 listings | Demand: 620 seekers | Ratio: 6.6:1
- Median Rent: ₹28,000 | Range: ₹18k-₹65k | Volatility: 12.1%
- Top Localities: MG Road (410), Hebbal (380), JP Nagar (290)
- Days to Rent (P50): 18 days | Absorption: 6.1% monthly

---

## 🔍 TIER 4: INTELLIGENCE & ANOMALIES

### Market Alerts
- **Emerging Hotspots** = Localities with 150%+ YoY seeker growth
- **Price Anomalies** = Listings 2.5σ away from locality median (outlier detection)
- **Supply Crunch** = Localities with seeker-listing ratio > 3:1
- **Stale Inventory** = Listings older than 120 days (unsold signal)
- **Quality Gaps** = Localities with <30% transparency score (red zone)

### Competitive Intelligence
- **Market Share** = Listings per contributor (concentration analysis)
- **Contributor Health** = Active contributors / Total who ever contributed (retention rate)
- **Platform Stickiness** = Avg listings per returning contributor (re-engagement metric)

### Opportunity Score (per locality)
```
Opportunity = (Demand Growth + Price Momentum + Supply Shortage) / Saturation
            = (Seeker↑% + Rent↑% + Low Inventory) / Total Listings
```
Higher score = More attractive for investor/owner attention

---

## 📈 TIER 5: TIME SERIES & TRENDS

### Daily/Weekly/Monthly Trends
**Rent Trend Chart (6-month):**
- X-axis: Time (weeks)
- Y-axis: Median rent by BHK
- Multiple lines: 1BHK, 2BHK, 3BHK (city-wise)
- Shaded bands: P25-P75 range (volatility envelope)

**Supply-Demand Convergence:**
- X-axis: Time (weeks)
- Y-axis: Listings & Seekers (dual axis)
- Shows gap closing/widening (market tightness indicator)

**Absorption Rate Trajectory:**
- X-axis: Time (months)
- Y-axis: % of listings that transitioned to occupied
- Trend = Getting faster or slower? (market health signal)

---

## 💡 TIER 6: USER-CENTRIC METRICS

### For Seekers
- **Match Score** = % listings matching YOUR preferences (tenant type, budget, furnishing)
- **Your Options** = Listings within your criteria (vs market avg)
- **Your Advantage** = Your seeker pin visibility reach (# of properties within 5km)
- **Price You're Chasing** = Your target rent vs median for your BHK/furnishing (premium %)

### For Landlords/Agents
- **Your Listing Health** = Days on market vs median (fast/slow indicator)
- **Your Rent Competitiveness** = Your rent vs median in locality (premium/discount %)
- **Your Visibility** = Views/clicks your listing gets vs similar listings
- **Your Market Position** = Your portfolio size vs average contributor (concentration)

---

## 🎨 VISUALIZATION RECOMMENDATIONS

### 1. **Market Health Dashboard** (Main)
```
┌─────────────────────────────────────────┐
│  🏙️ Bengaluru  |  🏙️ Hyderabad  [+Compare]
├─────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐       │
│ │ Supply │ │ Demand │ │ Price  │       │
│ │ 12,430 │ │  1,240 │ │ ₹25.2k │       │
│ │  ↑8%   │ │  ↑12%  │ │  ↓2%   │       │
│ └────────┘ └────────┘ └────────┘       │
├─────────────────────────────────────────┤
│ Seeker-Listing Ratio: 1:10 🟢 Healthy   │
│ Median Rent Trend: ↑3% (YoY)            │
│ Market Absorption: 7.2% (Monthly)       │
├─────────────────────────────────────────┤
│ [Supply Heatmap] [Demand Hotspots]      │
│ [Price Trends]   [Opportunity Score]    │
└─────────────────────────────────────────┘
```

### 2. **Locality Heatmap**
- X-Y: Geographic scatter
- Color intensity: Price per sqft (red=expensive, green=affordable)
- Bubble size: Supply volume
- Overlay: Seeker density (gradient)
- Interactive: Click locality → drill into detailed card

### 3. **Segment Waterfall**
```
Market (12,430 listings)
├─ 1BHK: 4,230 (34%)
│  ├─ Furnished: 1,840 (43%)
│  ├─ Semi: 1,560 (37%)
│  └─ Unfurnished: 830 (20%)
├─ 2BHK: 5,120 (41%)
│  └─ [breakdown]
└─ 3BHK+: 3,080 (25%)
   └─ [breakdown]
```

### 4. **Market Dynamics Dual-Axis Chart**
```
Listings (🔵) & Seekers (🔴) Over Time
     |
  2k |       ╱╲
     |      ╱  ╲    ╱╲
  1.5k|    ╱    ╲  ╱  ╲
     |   ╱      ╲╱    ╲╱
  1k |  ╱
     |_/_________________________
     Q4   Q1   Q2   Q3   Q4
```

### 5. **Opportunity Scorecard** (Per Locality)
```
Whitefield
┌───────────────────────────────┐
│ Supply Score:       ⭐⭐⭐⭐⭐ 92% │
│ Demand Growth:      ⭐⭐⭐⭐  78% │
│ Price Momentum:     ⭐⭐⭐   65% │
│ Value (Price/Sqft): ⭐⭐⭐⭐  81% │
├───────────────────────────────┤
│ Overall Opportunity:  ⭐⭐⭐⭐⭐ │
│ Recommendation: High Priority  │
└───────────────────────────────┘
```

### 6. **Time Series with Forecast**
```
Rent Trend (Actual + Forecast)
  40k |          ╱┄┄┄┄
     |         ╱ ┄  ┄
  30k|   ╱╲   ╱ ┄  ┄
     |  ╱  ╲╱ ┄   ┄
  20k|_╱_____┄___┄_____
     | Actual | Forecast
```

---

## 🔢 METRICS CALCULATION QUERIES

### Master Metrics Table
```sql
-- Create a metrics_daily table (run daily via cron)
INSERT INTO metrics_daily (date, city, metric_name, metric_value, metric_context)
SELECT
  CURRENT_DATE,
  'bengaluru',
  'total_listings',
  COUNT(*),
  jsonb_build_object(
    'by_bhk', jsonb_object_agg(bhk, COUNT(*)),
    'by_category', jsonb_object_agg(category, COUNT(*))
  )
FROM flats f
JOIN floors fl ON f.floor_id = fl.id
JOIN buildings b ON fl.building_id = b.id
WHERE b.city = 'bengaluru'
  AND f.status != 'occupied'
GROUP BY CURRENT_DATE, 'bengaluru';
```

---

## 📱 USER EXPERIENCE FLOW

### Landing → Analytics Deep Dive
1. **Hero** = Market headline ("Bengaluru: 12.4k listings, demand ↑12% MoM")
2. **KPI Cards** = Supply, Demand, Price, Trend
3. **Tab**: Overall vs Visible Area
4. **Tab**: By City Comparison
5. **Deep Dive**: Select locality → see all 6 tiers of data
6. **Export**: CSV/PDF for investors/landlords

---

## 🎯 SUCCESS METRICS

Users should feel:
- ✅ **Informed**: "I understand the market dynamics"
- ✅ **Empowered**: "I can make smart decisions"
- ✅ **Engaged**: "I want to come back for the latest data"
- ✅ **Confident**: "I trust these numbers"

