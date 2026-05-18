/*
  Task 5: Analytics & API Quota Tracking

  1. Extended get_platform_stats() RPC:
     - monthly_velocity: last 12 months of flat deployments
     - area_distribution: top 10 localities by building count
     - db_size_bytes: Supabase free tier limit tracking
     - total_actions: all-time contributions count

  2. api_usage table: track Google Maps, Mapbox, Supabase quota usage per month
     - service: 'google_maps' | 'mapbox' | 'supabase_reads'
     - month: 'YYYY-MM'
     - count: incrementing usage counter

  3. increment_api_usage() RPC: upsert monthly counters
*/

-- Create api_usage table (if not exists)
CREATE TABLE IF NOT EXISTS api_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service     TEXT NOT NULL,
  month       TEXT NOT NULL,
  count       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service, month)
);

-- Enable RLS
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Public read policy
DROP POLICY IF EXISTS "api_usage_public_read" ON api_usage;
CREATE POLICY "api_usage_public_read"
  ON api_usage FOR SELECT
  USING (true);

-- Drop old get_platform_stats if it exists with different return type
DROP FUNCTION IF EXISTS get_platform_stats();

-- Extended platform stats RPC
CREATE FUNCTION get_platform_stats()
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
  -- Monthly deployment velocity: last 12 months
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
  -- Uses localities table matched via ST_DWithin(500m)
  SELECT COALESCE(jsonb_agg(area_row), '[]'::jsonb)
  INTO v_areas
  FROM (
    SELECT jsonb_build_object(
      'area', loc.name,
      'count', COUNT(DISTINCT b.id),
      'pct', ROUND(COUNT(DISTINCT b.id) * 100.0 / NULLIF(
        (SELECT COUNT(*) FROM buildings), 0
      ), 1)
    ) AS area_row
    FROM buildings b
    JOIN localities loc ON ST_DWithin(
      b.location,
      ST_SetSRID(ST_MakePoint(loc.longitude, loc.latitude), 4326)::geography,
      500
    )
    WHERE (b.created_at IS NOT NULL)  -- Just in case
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

-- API usage tracking RPC
CREATE OR REPLACE FUNCTION increment_api_usage(p_service TEXT, p_month TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO api_usage (service, month, count, updated_at)
  VALUES (p_service, p_month, 1, NOW())
  ON CONFLICT (service, month) DO UPDATE
  SET count = api_usage.count + 1,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Don't rebuild snapshot here — let migration 005 do it after all columns exist
