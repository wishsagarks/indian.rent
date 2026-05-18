/*
  Fix analytics queries to work with NULL city fields by inferring city from coordinates.
  This allows analytics to work until the city population migration is applied.
*/

-- Helper function to infer city from coordinates
CREATE OR REPLACE FUNCTION infer_city_from_coordinates(location geography)
RETURNS TEXT AS $$
DECLARE
  closest_city TEXT;
  min_distance FLOAT;
BEGIN
  WITH city_centers AS (
    SELECT 'Bengaluru' as city, ST_MakePoint(77.5946, 12.9716)::geography as center
    UNION ALL
    SELECT 'Hyderabad', ST_MakePoint(78.4867, 17.3850)::geography
    UNION ALL
    SELECT 'Bhubaneswar', ST_MakePoint(85.8245, 20.2961)::geography
    UNION ALL
    SELECT 'Cuttack', ST_MakePoint(85.8830, 20.4625)::geography
  )
  SELECT city INTO closest_city
  FROM city_centers
  ORDER BY location <-> center
  LIMIT 1;

  RETURN closest_city;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Updated get_city_metrics to infer city when NULL
CREATE OR REPLACE FUNCTION get_city_metrics(p_city TEXT)
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  metric_type TEXT,
  context JSONB
) AS $$
DECLARE
  v_total_listings BIGINT;
  v_seeker_pins BIGINT;
  v_total_buildings BIGINT;
  v_market_volume NUMERIC;
  v_avg_rent NUMERIC;
  v_median_rent NUMERIC;
  v_p25_rent NUMERIC;
  v_p75_rent NUMERIC;
  v_transparency_pct NUMERIC;
BEGIN
  -- Get base counts with city inference fallback
  SELECT COUNT(*) INTO v_total_listings
  FROM flats f
  JOIN floors fl ON f.floor_id = fl.id
  JOIN buildings b ON fl.building_id = b.id
  WHERE (b.city = p_city OR (b.city IS NULL AND infer_city_from_coordinates(b.location) = p_city))
    AND f.status != 'occupied';

  SELECT COUNT(*) INTO v_seeker_pins
  FROM seeker_pins
  WHERE (city = p_city OR (city IS NULL AND infer_city_from_coordinates(ST_MakePoint(longitude, latitude)::geography) = p_city))
    AND created_at > NOW() - INTERVAL '30 days';

  SELECT COUNT(*) INTO v_total_buildings
  FROM buildings b
  WHERE b.city = p_city OR (b.city IS NULL AND infer_city_from_coordinates(b.location) = p_city);

  -- Get rent statistics with city inference
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
  WHERE (b.city = p_city OR (b.city IS NULL AND infer_city_from_coordinates(b.location) = p_city))
    AND f.status != 'occupied'
    AND f.rent_amount > 0;

  -- Get quality metrics with city inference
  SELECT (COUNT(CASE WHEN f.is_transparency_pin THEN 1 END)::NUMERIC / COUNT(*) * 100)
  INTO v_transparency_pct
  FROM flats f
  JOIN floors fl ON f.floor_id = fl.id
  JOIN buildings b ON fl.building_id = b.id
  WHERE (b.city = p_city OR (b.city IS NULL AND infer_city_from_coordinates(b.location) = p_city))
    AND f.status != 'occupied';

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
    CASE WHEN v_avg_rent > 0 THEN (
      SELECT COALESCE(STDDEV_POP(f.rent_amount), 0) / v_avg_rent * 100
      FROM flats f
      JOIN floors fl ON f.floor_id = fl.id
      JOIN buildings b ON fl.building_id = b.id
      WHERE (b.city = p_city OR (b.city IS NULL AND infer_city_from_coordinates(b.location) = p_city))
        AND f.status != 'occupied'
        AND f.rent_amount > 0
    ) ELSE 0 END,
    'price'::TEXT,
    jsonb_build_object('unit', 'percentage', 'calculation', 'stddev/avg');
END;
$$ LANGUAGE plpgsql IMMUTABLE;
