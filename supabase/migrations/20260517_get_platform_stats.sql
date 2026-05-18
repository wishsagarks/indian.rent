-- Returns aggregate platform stats for the landing page
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS TABLE(
  total_buildings BIGINT,
  total_listings  BIGINT,
  total_rent_mapped NUMERIC,
  total_seeker_pins BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM buildings),
    (SELECT COUNT(*) FROM flats WHERE status != 'occupied'),
    (SELECT COALESCE(SUM(rent_amount), 0) FROM flats WHERE status != 'occupied'),
    (SELECT COUNT(*) FROM seeker_pins WHERE expires_at > NOW());
END;
$$ LANGUAGE plpgsql STABLE;
