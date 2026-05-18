/*
  Simple fallback: Set default city to Bengaluru for all NULL values
  This is a quick fix to get analytics working while coordinate inference is being set up
*/

UPDATE buildings
SET city = 'Bengaluru'
WHERE city IS NULL;

-- Refresh snapshot with updated buildings
SELECT refresh_map_snapshot();
