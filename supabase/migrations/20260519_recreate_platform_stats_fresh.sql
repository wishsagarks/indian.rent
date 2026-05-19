-- Drop old version completely
DROP FUNCTION IF EXISTS get_platform_stats() CASCADE;

-- Create fresh version with monthly_velocity and area_distribution
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS TABLE(
  total_buildings    BIGINT,
  total_listings     BIGINT,
  total_rent_mapped  NUMERIC,
  total_seeker_pins  BIGINT,
  monthly_velocity   JSONB,
  area_distribution  JSONB,
  db_size_bytes      BIGINT,
  total_actions      BIGINT
) AS $$
DECLARE
  v_velocity JSONB;
  v_areas JSONB;
BEGIN
  -- Monthly deployment velocity: last 12 months of new listings
  SELECT COALESCE(jsonb_agg(month_row ORDER BY month_row->>'month'), '[]'::jsonb)
  INTO v_velocity
  FROM (
    SELECT jsonb_build_object(
      'month', TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM'),
      'count', COUNT(*)
    ) AS month_row
    FROM flats
    WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
      AND (is_removed IS NULL OR is_removed = false)
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at)
  ) months;

  -- Area distribution: top 10 localities by building count
  SELECT COALESCE(jsonb_agg(area_row), '[]'::jsonb)
  INTO v_areas
  FROM (
    SELECT jsonb_build_object(
      'area', COALESCE(loc.name, 'Unknown'),
      'count', COUNT(DISTINCT b.id),
      'pct', ROUND(COUNT(DISTINCT b.id) * 100.0 / NULLIF(
        (SELECT COUNT(*) FROM buildings), 0
      ), 1)
    ) AS area_row
    FROM buildings b
    LEFT JOIN localities loc ON ST_DWithin(
      b.location,
      ST_SetSRID(ST_MakePoint(loc.longitude, loc.latitude), 4326)::geography,
      500
    )
    GROUP BY loc.name
    ORDER BY COUNT(DISTINCT b.id) DESC
    LIMIT 10
  ) areas;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM buildings),
    (SELECT COUNT(*) FROM flats
     WHERE status != 'occupied'
       AND (is_removed IS NULL OR is_removed = false)),
    (SELECT COALESCE(SUM(rent_amount), 0) FROM flats
     WHERE status != 'occupied'
       AND (is_removed IS NULL OR is_removed = false)),
    (SELECT COUNT(*) FROM seeker_pins WHERE expires_at > NOW()),
    v_velocity,
    v_areas,
    pg_database_size(current_database()),
    (SELECT COUNT(*) FROM contributions);
END;
$$ LANGUAGE plpgsql STABLE;
