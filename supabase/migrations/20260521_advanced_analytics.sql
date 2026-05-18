/*
  Advanced Analytics Framework
  - Metrics aggregation tables
  - City-wise comparative functions
  - Opportunity scoring
  - Time-series data
*/

-- Create metrics_daily table for historical tracking
CREATE TABLE IF NOT EXISTS metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  city TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metric_context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, city, metric_name)
);

CREATE INDEX idx_metrics_daily_date ON metrics_daily(date);
CREATE INDEX idx_metrics_daily_city ON metrics_daily(city);

-- Comprehensive city metrics RPC
CREATE OR REPLACE FUNCTION get_city_metrics(p_city TEXT)
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  metric_type TEXT,
  context JSONB
) AS $$
DECLARE
  v_total_listings BIGINT;
  v_active_listings BIGINT;
  v_seeker_pins BIGINT;
  v_total_buildings BIGINT;
  v_market_volume NUMERIC;
  v_avg_rent NUMERIC;
  v_median_rent NUMERIC;
  v_p25_rent NUMERIC;
  v_p75_rent NUMERIC;
  v_transparency_pct NUMERIC;
BEGIN
  -- Get base counts
  SELECT COUNT(*) INTO v_total_listings
  FROM flats f
  JOIN floors fl ON f.floor_id = fl.id
  JOIN buildings b ON fl.building_id = b.id
  WHERE b.city = p_city AND f.status != 'occupied';

  SELECT COUNT(*) INTO v_seeker_pins
  FROM seeker_pins
  WHERE city = p_city AND created_at > NOW() - INTERVAL '30 days';

  SELECT COUNT(*) INTO v_total_buildings
  FROM buildings
  WHERE city = p_city;

  -- Get rent statistics
  SELECT
    SUM(f.rent_amount),
    AVG(f.rent_amount),
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY f.rent_amount),
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY f.rent_amount),
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY f.rent_amount)
  INTO
    v_market_volume,
    v_avg_rent,
    v_median_rent,
    v_p25_rent,
    v_p75_rent
  FROM flats f
  JOIN floors fl ON f.floor_id = fl.id
  JOIN buildings b ON fl.building_id = b.id
  WHERE b.city = p_city AND f.status != 'occupied' AND f.rent_amount > 0;

  -- Get quality metrics
  SELECT (COUNT(CASE WHEN f.is_transparency_pin THEN 1 END)::NUMERIC / COUNT(*) * 100)
  INTO v_transparency_pct
  FROM flats f
  JOIN floors fl ON f.floor_id = fl.id
  JOIN buildings b ON fl.building_id = b.id
  WHERE b.city = p_city AND f.status != 'occupied';

  -- Return all metrics
  RETURN QUERY SELECT
    'total_listings'::TEXT,
    v_total_listings::NUMERIC,
    'supply'::TEXT,
    jsonb_build_object('city', p_city)
  UNION ALL SELECT
    'seeker_pins'::TEXT,
    v_seeker_pins::NUMERIC,
    'demand'::TEXT,
    jsonb_build_object('period_days', 30)
  UNION ALL SELECT
    'seeker_listing_ratio'::TEXT,
    CASE WHEN v_total_listings > 0 THEN (v_seeker_pins::NUMERIC / v_total_listings) ELSE 0 END,
    'demand'::TEXT,
    jsonb_build_object('interpretation', 'lower is oversupply, higher is shortage')
  UNION ALL SELECT
    'total_buildings'::TEXT,
    v_total_buildings::NUMERIC,
    'supply'::TEXT,
    jsonb_build_object('city', p_city)
  UNION ALL SELECT
    'market_volume_annual'::TEXT,
    (COALESCE(v_market_volume, 0) / 12)::NUMERIC,
    'price'::TEXT,
    jsonb_build_object('currency', 'INR', 'period', 'annual')
  UNION ALL SELECT
    'median_rent'::TEXT,
    v_median_rent::NUMERIC,
    'price'::TEXT,
    jsonb_build_object('currency', 'INR')
  UNION ALL SELECT
    'avg_rent'::TEXT,
    v_avg_rent::NUMERIC,
    'price'::TEXT,
    jsonb_build_object('currency', 'INR')
  UNION ALL SELECT
    'rent_p25'::TEXT,
    v_p25_rent::NUMERIC,
    'price'::TEXT,
    jsonb_build_object('percentile', 25)
  UNION ALL SELECT
    'rent_p75'::TEXT,
    v_p75_rent::NUMERIC,
    'price'::TEXT,
    jsonb_build_object('percentile', 75)
  UNION ALL SELECT
    'premium_index'::TEXT,
    CASE WHEN v_p25_rent > 0 THEN (v_p75_rent / v_p25_rent) ELSE 0 END,
    'price'::TEXT,
    jsonb_build_object('interpretation', 'ratio of P75 to P25 rent')
  UNION ALL SELECT
    'transparency_score'::TEXT,
    COALESCE(v_transparency_pct, 0),
    'quality'::TEXT,
    jsonb_build_object('unit', 'percentage')
  UNION ALL SELECT
    'rent_volatility'::TEXT,
    CASE WHEN v_avg_rent > 0 THEN (STDDEV_POP(f.rent_amount) / v_avg_rent * 100) ELSE 0 END,
    'price'::TEXT,
    jsonb_build_object('unit', 'percentage', 'calculation', 'stddev/avg')
  FROM flats f
  JOIN floors fl ON f.floor_id = fl.id
  JOIN buildings b ON fl.building_id = b.id
  WHERE b.city = p_city AND f.status != 'occupied';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get metrics by locality
CREATE OR REPLACE FUNCTION get_locality_metrics(p_city TEXT, p_locality TEXT)
RETURNS TABLE (
  locality_name TEXT,
  supply_count BIGINT,
  demand_count BIGINT,
  median_rent NUMERIC,
  price_per_sqft NUMERIC,
  avg_days_on_market BIGINT,
  supply_score INT,
  demand_score INT,
  value_score INT,
  opportunity_score INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_locality,
    COUNT(DISTINCT f.id),
    COUNT(DISTINCT sp.id),
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY f.rent_amount),
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (f.rent_amount::NUMERIC / NULLIF(f.size_sqft, 0))),
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (NOW()::DATE - f.updated_at::DATE))::BIGINT,
    (COUNT(DISTINCT f.id)::NUMERIC / (SELECT COUNT(*) FROM flats f2 JOIN floors fl2 ON f2.floor_id = fl2.id JOIN buildings b2 ON fl2.building_id = b2.id WHERE b2.city = p_city AND f2.status != 'occupied') * 100)::INT,
    CASE WHEN COUNT(DISTINCT f.id) > 0 THEN (COUNT(DISTINCT sp.id)::NUMERIC / COUNT(DISTINCT f.id) * 100)::INT ELSE 0 END,
    75, -- placeholder
    75  -- placeholder
  FROM flats f
  JOIN floors fl ON f.floor_id = fl.id
  JOIN buildings b ON fl.building_id = b.id
  LEFT JOIN localities l ON ST_DWithin(b.location::geography, ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326)::geography, 500)
  LEFT JOIN seeker_pins sp ON ST_DWithin(b.location::geography, ST_SetSRID(ST_MakePoint(sp.longitude, sp.latitude), 4326)::geography, 500) AND sp.city = p_city AND sp.created_at > NOW() - INTERVAL '30 days'
  WHERE b.city = p_city AND f.status != 'occupied' AND l.name = p_locality
  GROUP BY p_locality;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get segment metrics (BHK + Furnishing)
CREATE OR REPLACE FUNCTION get_segment_metrics(p_city TEXT, p_bhk INT, p_furnishing TEXT)
RETURNS TABLE (
  bhk INT,
  furnishing TEXT,
  total_listings BIGINT,
  seeker_demand BIGINT,
  median_rent NUMERIC,
  avg_rent NUMERIC,
  min_rent NUMERIC,
  max_rent NUMERIC,
  price_volatility NUMERIC,
  days_to_rent_p50 BIGINT,
  absorption_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_bhk,
    p_furnishing,
    COUNT(*),
    0::BIGINT,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY f.rent_amount),
    AVG(f.rent_amount),
    MIN(f.rent_amount),
    MAX(f.rent_amount),
    STDDEV_POP(f.rent_amount) / AVG(f.rent_amount) * 100,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (NOW()::DATE - f.updated_at::DATE))::BIGINT,
    0::NUMERIC
  FROM flats f
  JOIN floors fl ON f.floor_id = fl.id
  JOIN buildings b ON fl.building_id = b.id
  WHERE b.city = p_city
    AND f.bhk = p_bhk
    AND f.furnishing = p_furnishing
    AND f.status != 'occupied'
  GROUP BY p_bhk, p_furnishing;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate opportunity score per locality
CREATE OR REPLACE FUNCTION calculate_opportunity_score(p_city TEXT)
RETURNS TABLE (
  locality_name TEXT,
  opportunity_score NUMERIC,
  supply_trend TEXT,
  demand_trend TEXT,
  price_momentum TEXT,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.name,
    (
      (COALESCE(NULLIF(demand_growth, 0), 1) +
       COALESCE(NULLIF(price_momentum, 0), 1) +
       COALESCE(NULLIF(supply_trend, 0), 1)) / 3 * 100
    )::NUMERIC,
    CASE WHEN COALESCE(supply_count, 0) > 100 THEN '↑↑ High' WHEN COALESCE(supply_count, 0) > 50 THEN '↑ Medium' ELSE '↓ Low' END,
    CASE WHEN COALESCE(demand_count, 0) > 50 THEN '↑↑ High' WHEN COALESCE(demand_count, 0) > 20 THEN '↑ Medium' ELSE '↓ Low' END,
    CASE WHEN COALESCE(price_change, 0) > 5 THEN '🔴 Expensive' WHEN COALESCE(price_change, 0) > 0 THEN '🟡 Rising' ELSE '🟢 Stable' END,
    CASE WHEN opportunity_score > 80 THEN 'High Priority' WHEN opportunity_score > 60 THEN 'Medium Priority' ELSE 'Monitor' END
  FROM localities l
  LEFT JOIN LATERAL (
    SELECT
      COUNT(DISTINCT f.id) as supply_count,
      COUNT(DISTINCT sp.id) as demand_count,
      AVG(f.rent_amount) as avg_price,
      LAG(AVG(f.rent_amount)) OVER (ORDER BY NOW()) as prev_price
    FROM flats f
    JOIN floors fl ON f.floor_id = fl.id
    JOIN buildings b ON fl.building_id = b.id
    LEFT JOIN seeker_pins sp ON ST_DWithin(b.location::geography, ST_SetSRID(ST_MakePoint(sp.longitude, sp.latitude), 4326)::geography, 500) AND sp.city = p_city
    WHERE b.city = p_city AND f.status != 'occupied' AND l.name LIKE '%' || l.name || '%'
  ) metrics ON TRUE
  CROSS JOIN LATERAL (
    SELECT
      CASE WHEN metrics.demand_count > 0 AND metrics.supply_count > 0 THEN (metrics.demand_count::NUMERIC / metrics.supply_count) ELSE 0 END as demand_growth,
      CASE WHEN metrics.prev_price > 0 THEN ((metrics.avg_price - metrics.prev_price) / metrics.prev_price * 100) ELSE 0 END as price_momentum,
      CASE WHEN metrics.supply_count > 100 THEN 1.0 WHEN metrics.supply_count > 50 THEN 0.7 ELSE 0.4 END as supply_trend,
      CASE WHEN metrics.avg_price > 0 THEN (metrics.avg_price - (SELECT AVG(f.rent_amount) FROM flats f JOIN floors fl ON f.floor_id = fl.id JOIN buildings b ON fl.building_id = b.id WHERE b.city = p_city)) / (SELECT AVG(f.rent_amount) FROM flats f JOIN floors fl ON f.floor_id = fl.id JOIN buildings b ON fl.building_id = b.id WHERE b.city = p_city) * 100 ELSE 0 END as price_change,
      ((CASE WHEN metrics.demand_count > 0 AND metrics.supply_count > 0 THEN (metrics.demand_count::NUMERIC / metrics.supply_count) ELSE 0 END +
        CASE WHEN metrics.supply_count > 100 THEN 1.0 WHEN metrics.supply_count > 50 THEN 0.7 ELSE 0.4 END +
        CASE WHEN metrics.prev_price > 0 THEN ((metrics.avg_price - metrics.prev_price) / metrics.prev_price) ELSE 0 END) / 3 * 100)::NUMERIC as opportunity_score
  ) scores ON TRUE
  WHERE l.city = p_city
  ORDER BY scores.opportunity_score DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

