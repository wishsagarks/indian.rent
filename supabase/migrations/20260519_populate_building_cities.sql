/*
  Populate city field for buildings based on geographic proximity.
  This fixes the issue where buildings had NULL city values, breaking city-based filtering.
  Uses 30km radius around each city center for assignment.
*/

UPDATE buildings
SET city = CASE
  WHEN ST_DWithin(
    location::geography,
    ST_MakePoint(12.9716, 77.5946)::geography,
    30000
  ) THEN 'Bengaluru'
  WHEN ST_DWithin(
    location::geography,
    ST_MakePoint(17.3850, 78.4867)::geography,
    30000
  ) THEN 'Hyderabad'
  WHEN ST_DWithin(
    location::geography,
    ST_MakePoint(20.2961, 85.8245)::geography,
    30000
  ) THEN 'Bhubaneswar'
  WHEN ST_DWithin(
    location::geography,
    ST_MakePoint(20.4625, 85.8830)::geography,
    30000
  ) THEN 'Cuttack'
  ELSE city
END
WHERE city IS NULL;

-- Refresh the map snapshot to include updated city data
SELECT refresh_map_snapshot();
