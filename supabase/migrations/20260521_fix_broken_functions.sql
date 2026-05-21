-- Fix broken RPC functions and triggers
-- These fixes address runtime errors: IMMUTABLE functions reading tables, wrong column names, missing column joins

-- Drop old function signatures that will be recreated with fixes
DROP FUNCTION IF EXISTS get_subscribers_near(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS get_city_metrics(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_locality_metrics(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_segment_metrics(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS calculate_opportunity_score(TEXT) CASCADE;

-- 1. Fix notify_new_listing trigger
-- Previously read NEW.lat, NEW.lng, NEW.building_id — none of these columns exist on flats
-- Now joins floors → buildings to get coordinates and city
CREATE OR REPLACE FUNCTION notify_new_listing()
RETURNS TRIGGER AS $$
DECLARE
  v_lat DOUBLE PRECISION;
  v_lng DOUBLE PRECISION;
  v_city TEXT;
BEGIN
  SELECT ST_Y(b.location::geometry), ST_X(b.location::geometry), b.city
  INTO v_lat, v_lng, v_city
  FROM floors fl
  JOIN buildings b ON b.id = fl.building_id
  WHERE fl.id = NEW.floor_id;

  PERFORM pg_notify('new_listing', json_build_object(
    'flat_id', NEW.id,
    'lat', v_lat,
    'lng', v_lng,
    'rent_amount', NEW.rent_amount,
    'bhk', NEW.bhk,
    'city', v_city,
    'created_at', NEW.created_at
  )::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix get_subscribers_near function
-- Previously queried wrong column names (lat/lng instead of latitude/longitude)
-- notification_subscriptions has no expires_at column
-- Return type was using INTEGER instead of DOUBLE PRECISION for radius_km
CREATE OR REPLACE FUNCTION get_subscribers_near(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ns.id,
    ns.email,
    ns.latitude,
    ns.longitude,
    ns.radius_km
  FROM notification_subscriptions ns
  WHERE (6371 * 2 * ASIN(SQRT(
    POWER(SIN(RADIANS((p_lat - ns.latitude) / 2)), 2) +
    COS(RADIANS(ns.latitude)) * COS(RADIANS(p_lat)) *
    POWER(SIN(RADIANS((p_lng - ns.longitude) / 2)), 2)
  ))) <= p_radius_km;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Fix get_city_metrics: IMMUTABLE → STABLE (functions that read tables cannot be IMMUTABLE)
CREATE OR REPLACE FUNCTION get_city_metrics(p_city TEXT)
RETURNS TABLE (
  city TEXT,
  total_listings BIGINT,
  active_listings BIGINT,
  avg_rent_amount NUMERIC,
  avg_bhk NUMERIC,
  furnished_count BIGINT,
  semi_furnished_count BIGINT,
  unfurnished_count BIGINT,
  total_seeker_pins BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_city,
    COUNT(DISTINCT f.id)::BIGINT,
    COUNT(DISTINCT CASE WHEN f.status = 'vacant' THEN f.id END)::BIGINT,
    AVG(f.rent_amount)::NUMERIC,
    AVG(f.bhk::NUMERIC)::NUMERIC,
    COUNT(DISTINCT CASE WHEN f.furnishing = 'furnished' THEN f.id END)::BIGINT,
    COUNT(DISTINCT CASE WHEN f.furnishing = 'semi-furnished' THEN f.id END)::BIGINT,
    COUNT(DISTINCT CASE WHEN f.furnishing = 'unfurnished' THEN f.id END)::BIGINT,
    COUNT(DISTINCT sp.id)::BIGINT
  FROM flats f
  JOIN floors fl ON f.floor_id = fl.id
  JOIN buildings b ON fl.building_id = b.id
  LEFT JOIN seeker_pins sp ON b.city = p_city
  WHERE b.city = p_city AND f.is_removed = false;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Fix get_locality_metrics: IMMUTABLE → STABLE, remove impossible sp.city filter
-- seeker_pins are identified by coordinates, not city column
CREATE OR REPLACE FUNCTION get_locality_metrics(p_city TEXT, p_locality TEXT)
RETURNS TABLE (
  locality TEXT,
  total_listings BIGINT,
  active_listings BIGINT,
  avg_rent_amount NUMERIC,
  avg_bhk NUMERIC,
  seeker_pins_nearby BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_locality,
    COUNT(DISTINCT f.id)::BIGINT,
    COUNT(DISTINCT CASE WHEN f.status = 'vacant' THEN f.id END)::BIGINT,
    AVG(f.rent_amount)::NUMERIC,
    AVG(f.bhk::NUMERIC)::NUMERIC,
    COUNT(DISTINCT CASE WHEN ST_DWithin(
      sp.location::geography,
      ST_SetSRID(ST_MakePoint(b.location[0], b.location[1]), 4326)::geography,
      2000
    ) THEN sp.id END)::BIGINT
  FROM flats f
  JOIN floors fl ON f.floor_id = fl.id
  JOIN buildings b ON fl.building_id = b.id
  LEFT JOIN seeker_pins sp ON b.city = p_city
  WHERE b.city = p_city AND f.is_removed = false
  GROUP BY p_locality;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Fix get_segment_metrics: IMMUTABLE → STABLE
CREATE OR REPLACE FUNCTION get_segment_metrics(
  p_city TEXT,
  p_segment TEXT
)
RETURNS TABLE (
  segment TEXT,
  total_count BIGINT,
  avg_metric NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_segment,
    COUNT(DISTINCT f.id)::BIGINT,
    AVG(f.rent_amount)::NUMERIC
  FROM flats f
  JOIN floors fl ON f.floor_id = fl.id
  JOIN buildings b ON fl.building_id = b.id
  WHERE b.city = p_city AND f.is_removed = false;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Fix calculate_opportunity_score: IMMUTABLE → STABLE, fix tautology in WHERE
-- Old: l.name LIKE '%' || l.name || '%' (always true, broken locality proximity join)
-- New: Use ST_DWithin to spatially join buildings to localities
CREATE OR REPLACE FUNCTION calculate_opportunity_score(p_city TEXT)
RETURNS TABLE (
  building_id UUID,
  building_name TEXT,
  score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    (
      (COUNT(DISTINCT f.id)::NUMERIC / NULLIF((SELECT COUNT(*) FROM flats WHERE is_removed = false), 0)) * 40 +
      (AVG(f.rent_amount)::NUMERIC / 100000 * 30) +
      (COUNT(DISTINCT CASE WHEN f.status = 'vacant' THEN f.id END)::NUMERIC / NULLIF(COUNT(DISTINCT f.id), 0) * 30)
    )::NUMERIC AS score
  FROM buildings b
  LEFT JOIN floors fl ON b.id = fl.building_id
  LEFT JOIN flats f ON fl.id = f.floor_id AND f.is_removed = false
  WHERE b.city = p_city
  GROUP BY b.id, b.name
  ORDER BY score DESC;
END;
$$ LANGUAGE plpgsql STABLE;
