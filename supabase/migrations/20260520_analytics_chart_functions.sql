-- Price distribution function for analytics charts
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
      WHEN bhk = 1 THEN '1BHK'
      WHEN bhk = 2 THEN '2BHK'
      WHEN bhk = 3 THEN '3BHK'
      ELSE 'Studio'
    END as category,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY rent_amount) as p25,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rent_amount) as median,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY rent_amount) as p75,
    AVG(rent_amount)::NUMERIC as avg
  FROM flats
  WHERE city = p_city AND rent_amount > 0
  GROUP BY bhk
  ORDER BY bhk;
END;
$$ LANGUAGE plpgsql;

-- Locality performance and ranking function
CREATE OR REPLACE FUNCTION get_locality_rankings(p_city TEXT)
RETURNS TABLE(
  locality TEXT,
  listing_count BIGINT,
  seeker_count BIGINT,
  median_rent NUMERIC,
  demand_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH locality_stats AS (
    SELECT
      COALESCE(area, 'Unknown') as locality,
      COUNT(*) as listing_count,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rent_amount)::NUMERIC as median_rent
    FROM flats
    WHERE city = p_city AND rent_amount > 0
    GROUP BY area
  )
  SELECT
    ls.locality,
    ls.listing_count,
    COALESCE(COUNT(DISTINCT sp.id)::BIGINT, 0) as seeker_count,
    ls.median_rent,
    (ls.listing_count::NUMERIC / NULLIF(COUNT(DISTINCT sp.id), 0))::NUMERIC as demand_score
  FROM locality_stats ls
  LEFT JOIN seeker_pins sp ON
    sp.city = p_city AND
    sp.area = ls.locality
  GROUP BY ls.locality, ls.listing_count, ls.median_rent
  ORDER BY ls.listing_count DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;
