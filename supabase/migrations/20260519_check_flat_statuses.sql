-- Check total flats vs available flats

-- 1. Total flats by status
SELECT
  'Flats by status' as check,
  status,
  COUNT(*) as count
FROM flats
GROUP BY status
ORDER BY count DESC;

-- 2. Total flats in Bengaluru buildings
SELECT
  'Total flats in Bengaluru buildings' as check,
  COUNT(*) as count
FROM flats f
JOIN floors fl ON f.floor_id = fl.id
JOIN buildings b ON fl.building_id = b.id
WHERE b.city = 'Bengaluru';

-- 3. Available flats (status != 'occupied') in Bengaluru
SELECT
  'Available flats in Bengaluru' as check,
  COUNT(*) as count
FROM flats f
JOIN floors fl ON f.floor_id = fl.id
JOIN buildings b ON fl.building_id = b.id
WHERE b.city = 'Bengaluru'
  AND f.status != 'occupied';

-- 4. Check import_sources table
SELECT
  'Import sources' as check,
  COUNT(*) as total_imports,
  COUNT(CASE WHEN flat_id IS NOT NULL THEN 1 END) as linked_to_flats,
  COUNT(CASE WHEN flat_id IS NULL THEN 1 END) as not_linked
FROM import_sources
WHERE source = 'bengaluru.rent';

-- 5. Check if flats are marked as removed
SELECT
  'Flats by is_removed status' as check,
  is_removed,
  COUNT(*) as count
FROM flats
GROUP BY is_removed;

-- 6. Total flats across all cities
SELECT
  'Total flats across all cities' as check,
  COUNT(*) as count
FROM flats;
