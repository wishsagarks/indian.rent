-- ============================================================================
-- COMPREHENSIVE DIAGNOSTIC: Check all tables, functions, and data
-- This script ONLY reads data - does NOT delete or modify anything
-- ============================================================================

-- ============================================================================
-- 1. CHECK TABLE EXISTENCE AND ROW COUNTS
-- ============================================================================

SELECT 'buildings' as table_name, COUNT(*) as row_count FROM buildings
UNION ALL
SELECT 'floors', COUNT(*) FROM floors
UNION ALL
SELECT 'flats', COUNT(*) FROM flats
UNION ALL
SELECT 'seeker_pins', COUNT(*) FROM seeker_pins
UNION ALL
SELECT 'localities', COUNT(*) FROM localities;

-- ============================================================================
-- 2. CHECK DATA BY CITY
-- ============================================================================

SELECT
  'Buildings' as type,
  b.city,
  COUNT(*) as count
FROM buildings b
GROUP BY b.city
ORDER BY count DESC;

SELECT
  'Flats' as type,
  b.city,
  COUNT(fl.id) as count
FROM buildings b
LEFT JOIN floors f ON b.id = f.building_id
LEFT JOIN flats fl ON f.id = fl.floor_id AND fl.status != 'occupied'
GROUP BY b.city
ORDER BY count DESC;

-- ============================================================================
-- 3. CHECK GET_PLATFORM_STATS() RPC
-- ============================================================================

SELECT
  total_buildings,
  total_listings,
  total_rent_mapped,
  total_seeker_pins,
  (monthly_velocity IS NOT NULL AND monthly_velocity != '[]'::jsonb) as has_monthly_velocity,
  (area_distribution IS NOT NULL AND area_distribution != '[]'::jsonb) as has_area_distribution,
  db_size_bytes,
  total_actions
FROM get_platform_stats();

-- ============================================================================
-- 4. CHECK GET_CITY_METRICS() RPC FOR BENGALURU
-- ============================================================================

SELECT metric_name, metric_value, metric_type
FROM get_city_metrics('Bengaluru')
ORDER BY metric_type, metric_name;

-- ============================================================================
-- 5. CHECK GET_CITY_METRICS() RPC FOR HYDERABAD
-- ============================================================================

SELECT metric_name, metric_value, metric_type
FROM get_city_metrics('Hyderabad')
ORDER BY metric_type, metric_name;

-- ============================================================================
-- 6. CHECK FUNCTION EXISTENCE
-- ============================================================================

SELECT
  proname as function_name
FROM pg_proc
WHERE proname IN (
  'get_platform_stats',
  'get_city_metrics',
  'infer_city_from_coordinates',
  'refresh_map_snapshot',
  'get_area_stats'
)
ORDER BY proname;

-- ============================================================================
-- 7. CHECK MAP_SNAPSHOT STATUS
-- ============================================================================

SELECT
  id,
  jsonb_array_length(data) as pin_count,
  (data IS NOT NULL AND data != '[]'::jsonb) as has_data
FROM map_snapshot;

-- ============================================================================
-- 8. CHECK IMPORT_SOURCES TABLE (if exists)
-- ============================================================================

SELECT
  COUNT(*) as total_imports,
  COUNT(DISTINCT source) as unique_sources,
  COUNT(CASE WHEN flat_id IS NOT NULL THEN 1 END) as linked_to_flats
FROM import_sources;

-- ============================================================================
-- 9. CHECK RENTAL VOLUME STATS
-- ============================================================================

SELECT
  b.city,
  COUNT(DISTINCT b.id) as buildings,
  COUNT(DISTINCT f.id) as listings,
  SUM(fl.rent_amount) as total_monthly_rent,
  AVG(fl.rent_amount) as avg_rent
FROM buildings b
LEFT JOIN floors f ON b.id = f.building_id
LEFT JOIN flats fl ON f.id = fl.floor_id AND fl.status != 'occupied'
WHERE fl.rent_amount > 0
GROUP BY b.city
ORDER BY total_monthly_rent DESC NULLS LAST;

-- ============================================================================
-- 10. CHECK SEEKER PIN DISTRIBUTION
-- ============================================================================

SELECT
  COUNT(*) as total_seeker_pins,
  COUNT(CASE WHEN sp.expires_at > NOW() THEN 1 END) as active_pins,
  COUNT(CASE WHEN sp.expires_at <= NOW() THEN 1 END) as expired_pins
FROM seeker_pins sp;

-- ============================================================================
-- 11. CRITICAL CHECK: Does get_platform_stats() return any data?
-- ============================================================================

SELECT
  CASE
    WHEN total_buildings = 0 THEN 'ERROR: get_platform_stats() returning zeros!'
    ELSE 'SUCCESS: get_platform_stats() has data'
  END as status,
  total_buildings,
  total_listings
FROM get_platform_stats();
