-- Extend get_area_stats to return gated/non-gated BHK breakdowns
-- so the filter toggle in AreaStatsModal can display filtered data client-side
CREATE OR REPLACE FUNCTION get_area_stats(
  min_lat DOUBLE PRECISION,
  min_lng DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  max_lng DOUBLE PRECISION
)
RETURNS TABLE(
  total_flats         BIGINT,
  avg_rent            NUMERIC,
  avg_rent_1bhk       NUMERIC,
  avg_rent_2bhk       NUMERIC,
  avg_rent_3bhk       NUMERIC,
  gated_count         BIGINT,
  non_gated_count     BIGINT,
  total_flats_gated   BIGINT,
  total_flats_non_gated BIGINT,
  avg_rent_1bhk_gated   NUMERIC,
  avg_rent_2bhk_gated   NUMERIC,
  avg_rent_3bhk_gated   NUMERIC,
  avg_rent_1bhk_non_gated NUMERIC,
  avg_rent_2bhk_non_gated NUMERIC,
  avg_rent_3bhk_non_gated NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(fl.id),
    ROUND(AVG(fl.rent_amount)::numeric, 0),
    ROUND(AVG(CASE WHEN fl.bhk = 1 THEN fl.rent_amount END)::numeric, 0),
    ROUND(AVG(CASE WHEN fl.bhk = 2 THEN fl.rent_amount END)::numeric, 0),
    ROUND(AVG(CASE WHEN fl.bhk = 3 THEN fl.rent_amount END)::numeric, 0),
    COUNT(CASE WHEN b.category = 'gated' THEN 1 END),
    COUNT(CASE WHEN b.category != 'gated' THEN 1 END),
    -- gated breakdown
    COUNT(CASE WHEN b.category = 'gated' THEN 1 END),
    COUNT(CASE WHEN b.category != 'gated' THEN 1 END),
    ROUND(AVG(CASE WHEN fl.bhk = 1 AND b.category = 'gated' THEN fl.rent_amount END)::numeric, 0),
    ROUND(AVG(CASE WHEN fl.bhk = 2 AND b.category = 'gated' THEN fl.rent_amount END)::numeric, 0),
    ROUND(AVG(CASE WHEN fl.bhk = 3 AND b.category = 'gated' THEN fl.rent_amount END)::numeric, 0),
    -- non-gated breakdown
    ROUND(AVG(CASE WHEN fl.bhk = 1 AND b.category != 'gated' THEN fl.rent_amount END)::numeric, 0),
    ROUND(AVG(CASE WHEN fl.bhk = 2 AND b.category != 'gated' THEN fl.rent_amount END)::numeric, 0),
    ROUND(AVG(CASE WHEN fl.bhk = 3 AND b.category != 'gated' THEN fl.rent_amount END)::numeric, 0)
  FROM flats fl
  JOIN floors f ON fl.floor_id = f.id
  JOIN buildings b ON f.building_id = b.id
  WHERE ST_Y(b.location::geometry) BETWEEN min_lat AND max_lat
    AND ST_X(b.location::geometry) BETWEEN min_lng AND max_lng
    AND fl.status != 'occupied';
END;
$$ LANGUAGE plpgsql STABLE;
