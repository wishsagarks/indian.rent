/*
  Fix analytics RPC to work with actual database schema
  - seeker_pins doesn't have a city column
  - Only infer city from coordinates for seeker_pins
  - buildings table has city column
*/

DROP FUNCTION IF EXISTS infer_city_from_coordinates(geography);
DROP FUNCTION IF EXISTS get_city_metrics(TEXT);

-- Helper function to infer city from coordinates
CREATE OR REPLACE FUNCTION infer_city_from_coordinates(location geography)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    WITH city_centers AS (
      SELECT 'Bengaluru' as city, ST_MakePoint(77.5946, 12.9716)::geography as center
      UNION ALL
      SELECT 'Hyderabad', ST_MakePoint(78.4867, 17.3850)::geography
      UNION ALL
      SELECT 'Bhubaneswar', ST_MakePoint(85.8245, 20.2961)::geography
      UNION ALL
      SELECT 'Cuttack', ST_MakePoint(85.8830, 20.4625)::geography
    )
    SELECT city FROM city_centers ORDER BY location <-> center LIMIT 1
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Updated get_city_metrics with correct schema
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
  -- Count listings in the city
  SELECT COUNT(*) INTO v_total_listings
  FROM flats f
  JOIN floors fl ON f.floor_id = fl.id
  JOIN buildings b ON fl.building_id = b.id
  WHERE b.city = p_city AND f.status != 'occupied';

  -- Count seeker pins - infer city from coordinates since seeker_pins has no city column
  SELECT COUNT(*) INTO v_seeker_pins
  FROM seeker_pins sp
  WHERE infer_city_from_coordinates(ST_MakePoint(sp.longitude, sp.latitude)::geography) = p_city
    AND created_at > NOW() - INTERVAL '30 days';

  -- Count buildings in the city
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
  SELECT (COUNT(CASE WHEN f.is_transparency_pin THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100)
  INTO v_transparency_pct
  FROM flats f
  JOIN floors fl ON f.floor_id = fl.id
  JOIN buildings b ON fl.building_id = b.id
  WHERE b.city = p_city AND f.status != 'occupied';

  -- Return all metrics
  RETURN QUERY SELECT
    'total_listings'::TEXT,
    COALESCE(v_total_listings, 0)::NUMERIC,
    'supply'::TEXT,
    jsonb_build_object('city', p_city)
  UNION ALL SELECT
    'seeker_pins'::TEXT,
    COALESCE(v_seeker_pins, 0)::NUMERIC,
    'demand'::TEXT,
    jsonb_build_object('period_days', 30)
  UNION ALL SELECT
    'seeker_listing_ratio'::TEXT,
    CASE WHEN v_total_listings > 0 THEN (COALESCE(v_seeker_pins, 0)::NUMERIC / v_total_listings) ELSE 0 END,
    'demand'::TEXT,
    jsonb_build_object('interpretation', 'lower is oversupply, higher is shortage')
  UNION ALL SELECT
    'total_buildings'::TEXT,
    COALESCE(v_total_buildings, 0)::NUMERIC,
    'supply'::TEXT,
    jsonb_build_object('city', p_city)
  UNION ALL SELECT
    'median_rent'::TEXT,
    COALESCE(v_median_rent, 0)::NUMERIC,
    'price'::TEXT,
    jsonb_build_object('currency', 'INR')
  UNION ALL SELECT
    'avg_rent'::TEXT,
    COALESCE(v_avg_rent, 0)::NUMERIC,
    'price'::TEXT,
    jsonb_build_object('currency', 'INR')
  UNION ALL SELECT
    'rent_p25'::TEXT,
    COALESCE(v_p25_rent, 0)::NUMERIC,
    'price'::TEXT,
    jsonb_build_object('percentile', 25)
  UNION ALL SELECT
    'rent_p75'::TEXT,
    COALESCE(v_p75_rent, 0)::NUMERIC,
    'price'::TEXT,
    jsonb_build_object('percentile', 75)
  UNION ALL SELECT
    'premium_index'::TEXT,
    CASE WHEN COALESCE(v_p25_rent, 0) > 0 THEN (COALESCE(v_p75_rent, 0) / v_p25_rent) ELSE 0 END,
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
      WHERE b.city = p_city AND f.status != 'occupied' AND f.rent_amount > 0
    ) ELSE 0 END,
    'price'::TEXT,
    jsonb_build_object('unit', 'percentage');
END;
$$ LANGUAGE plpgsql;
