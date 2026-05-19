-- Create flats_with_city view for analytics queries
-- This view exposes city directly on flats rows
-- Fixes the bug where queries used non-existent flats.city column

CREATE OR REPLACE VIEW flats_with_city AS
SELECT
  f.*,
  b.city,
  b.name AS building_name
FROM flats f
JOIN floors fl ON f.floor_id = fl.id
JOIN buildings b ON fl.building_id = b.id;

-- Fix get_price_distribution — now joins through floors/buildings correctly
DROP FUNCTION IF EXISTS get_price_distribution(TEXT);
CREATE OR REPLACE FUNCTION get_price_distribution(p_city TEXT)
RETURNS TABLE(
  category TEXT,
  "P25" NUMERIC,
  "Median" NUMERIC,
  "P75" NUMERIC,
  "Average" NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN f.bhk = 1 THEN '1BHK'
      WHEN f.bhk = 2 THEN '2BHK'
      WHEN f.bhk = 3 THEN '3BHK'
      ELSE 'Studio'
    END as category,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY f.rent_amount) as p25,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY f.rent_amount) as median,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY f.rent_amount) as p75,
    AVG(f.rent_amount)::NUMERIC as avg
  FROM flats f
  JOIN floors fl ON f.floor_id = fl.id
  JOIN buildings b ON fl.building_id = b.id
  WHERE b.city = p_city AND f.rent_amount > 0
  GROUP BY f.bhk
  ORDER BY f.bhk;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fix get_locality_rankings — now joins correctly, group by building name
DROP FUNCTION IF EXISTS get_locality_rankings(TEXT);
CREATE OR REPLACE FUNCTION get_locality_rankings(p_city TEXT)
RETURNS TABLE(
  locality TEXT,
  listing_count BIGINT,
  median_rent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.name as locality,
    COUNT(f.id)::BIGINT as listing_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY f.rent_amount)::NUMERIC as median_rent
  FROM flats f
  JOIN floors fl ON f.floor_id = fl.id
  JOIN buildings b ON fl.building_id = b.id
  WHERE b.city = p_city AND f.rent_amount > 0
  GROUP BY b.id, b.name
  ORDER BY COUNT(f.id) DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE;
