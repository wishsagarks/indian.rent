-- Create helper function to find subscribers near a location
CREATE OR REPLACE FUNCTION get_subscribers_near(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 5
) RETURNS TABLE (
  id UUID,
  email TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ns.id,
    ns.email,
    ns.lat,
    ns.lng,
    ns.radius_km
  FROM notification_subscriptions ns
  WHERE
    -- Within radius using Haversine formula
    (6371 * 2 * ASIN(SQRT(
      POWER(SIN(RADIANS((p_lat - ns.lat) / 2)), 2) +
      COS(RADIANS(ns.lat)) * COS(RADIANS(p_lat)) *
      POWER(SIN(RADIANS((p_lng - ns.lng) / 2)), 2)
    ))) <= p_radius_km
    AND ns.expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to notify subscribers when new listing is added
CREATE OR REPLACE FUNCTION notify_new_listing()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast new listing event for subscribers to consume
  PERFORM pg_notify(
    'new_listing',
    json_build_object(
      'flat_id', NEW.id,
      'lat', NEW.lat,
      'lng', NEW.lng,
      'rent_amount', NEW.rent_amount,
      'bhk', NEW.bhk,
      'building_id', NEW.building_id,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger on flats table INSERT
DROP TRIGGER IF EXISTS flats_notify_new_listing ON flats;
CREATE TRIGGER flats_notify_new_listing
  AFTER INSERT ON flats
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_listing();
