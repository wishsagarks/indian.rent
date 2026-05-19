-- Diagnose why seeker_pins aren't showing in city metrics

-- 1. How many seeker_pins exist and are active?
SELECT 'Total seeker pins' as check_type, COUNT(*) as count FROM seeker_pins
UNION ALL
SELECT 'Active (not expired)', COUNT(*) FROM seeker_pins WHERE expires_at > NOW()
UNION ALL
SELECT 'Within last 30 days', COUNT(*) FROM seeker_pins WHERE created_at > NOW() - INTERVAL '30 days';

-- 2. Check if infer_city_from_coordinates function exists and works
SELECT 'Testing infer_city_from_coordinates' as test;

SELECT
  sp.id,
  sp.latitude,
  sp.longitude,
  infer_city_from_coordinates(ST_MakePoint(sp.longitude, sp.latitude)::geography) as inferred_city
FROM seeker_pins sp
LIMIT 5;

-- 3. How many seeker_pins would match Bengaluru filter?
SELECT 'Seeker pins matching Bengaluru' as check_type;

SELECT COUNT(*) as bengaluru_seeker_pins
FROM seeker_pins sp
WHERE infer_city_from_coordinates(ST_MakePoint(sp.longitude, sp.latitude)::geography) = 'Bengaluru'
  AND created_at > NOW() - INTERVAL '30 days';

-- 4. Check all seeker_pins by inferred city
SELECT
  infer_city_from_coordinates(ST_MakePoint(sp.longitude, sp.latitude)::geography) as city,
  COUNT(*) as pin_count,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as within_30_days
FROM seeker_pins sp
GROUP BY city
ORDER BY pin_count DESC;

-- 5. Sample seeker_pins data
SELECT
  id,
  latitude,
  longitude,
  created_at,
  expires_at,
  (expires_at > NOW()) as is_active,
  (created_at > NOW() - INTERVAL '30 days') as within_30_days
FROM seeker_pins
LIMIT 10;
