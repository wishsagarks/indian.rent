/*
  # Create map_snapshot and localities tables

  1. New Tables
    - `map_snapshot`
      - `id` (integer, primary key, always 1 - singleton row)
      - `data` (jsonb, stores pre-computed marker payload)
      - `updated_at` (timestamptz, auto-updated)
    - `localities`
      - `id` (uuid, primary key)
      - `name` (text, locality/neighbourhood name)
      - `city` (text, default Hyderabad)
      - `latitude` (float)
      - `longitude` (float)

  2. Functions
    - `refresh_map_snapshot()` - Recomputes the snapshot from buildings/floors/flats
    - `trigger_snapshot_refresh()` - Trigger function that calls refresh on data changes
    - `search_localities(query text)` - RPC to search localities by partial name match

  3. Triggers
    - After INSERT/UPDATE/DELETE on flats -> refresh snapshot
    - After INSERT/UPDATE on buildings -> refresh snapshot

  4. Security
    - Enable RLS on both tables
    - map_snapshot: public read access
    - localities: public read access

  5. Seed Data
    - Initial Hyderabad localities (~50 popular neighbourhoods)
    - Initial empty map_snapshot row
*/

-- map_snapshot table (singleton pattern)
CREATE TABLE IF NOT EXISTS map_snapshot (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- localities table for local geocoding
CREATE TABLE IF NOT EXISTS localities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT DEFAULT 'Hyderabad',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL
);

-- Enable RLS
ALTER TABLE map_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE localities ENABLE ROW LEVEL SECURITY;

-- Policies: public read
CREATE POLICY "Map snapshot is publicly readable"
  ON map_snapshot FOR SELECT
  USING (true);

CREATE POLICY "Localities are publicly readable"
  ON localities FOR SELECT
  USING (true);

-- Function to recompute the snapshot
CREATE OR REPLACE FUNCTION refresh_map_snapshot()
RETURNS VOID AS $$
DECLARE
  snapshot JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(b_row)), '[]'::jsonb)
  INTO snapshot
  FROM (
    SELECT
      b.id,
      b.name,
      b.category,
      jsonb_build_object(
        'type', 'Point',
        'coordinates', jsonb_build_array(
          ST_X(b.location::geometry),
          ST_Y(b.location::geometry)
        )
      ) AS location,
      b.updated_at,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', f.id,
              'floor_number', f.floor_number,
              'flats', COALESCE(
                (
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'id', fl.id,
                      'flat_number', fl.flat_number,
                      'status', fl.status,
                      'rent_amount', fl.rent_amount,
                      'contributor_name', fl.contributor_name,
                      'updated_at', fl.updated_at
                    )
                  )
                  FROM flats fl
                  WHERE fl.floor_id = f.id AND fl.status != 'occupied'
                ), '[]'::jsonb
              )
            )
          )
          FROM floors f
          WHERE f.building_id = b.id
        ), '[]'::jsonb
      ) AS floors
    FROM buildings b
    LIMIT 500
  ) b_row;

  INSERT INTO map_snapshot (id, data, updated_at)
  VALUES (1, snapshot, NOW())
  ON CONFLICT (id) DO UPDATE
  SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function
CREATE OR REPLACE FUNCTION trigger_snapshot_refresh()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_map_snapshot();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers on flats changes
DROP TRIGGER IF EXISTS refresh_snapshot_on_flat_change ON flats;
CREATE TRIGGER refresh_snapshot_on_flat_change
  AFTER INSERT OR UPDATE OR DELETE ON flats
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_snapshot_refresh();

-- Triggers on buildings changes
DROP TRIGGER IF EXISTS refresh_snapshot_on_building_change ON buildings;
CREATE TRIGGER refresh_snapshot_on_building_change
  AFTER INSERT OR UPDATE ON buildings
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_snapshot_refresh();

-- Search localities RPC
CREATE OR REPLACE FUNCTION search_localities(query TEXT)
RETURNS TABLE(name TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION) AS $$
BEGIN
  RETURN QUERY
  SELECT l.name, l.latitude, l.longitude
  FROM localities l
  WHERE l.name ILIKE '%' || query || '%'
  ORDER BY l.name
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

-- Seed initial map_snapshot row
INSERT INTO map_snapshot (id, data, updated_at)
VALUES (1, '[]'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed Hyderabad localities
INSERT INTO localities (name, latitude, longitude) VALUES
  ('Banjara Hills', 17.4156, 78.4347),
  ('Jubilee Hills', 17.4319, 78.4071),
  ('Madhapur', 17.4483, 78.3915),
  ('Hitech City', 17.4435, 78.3772),
  ('Gachibowli', 17.4401, 78.3489),
  ('Kondapur', 17.4577, 78.3649),
  ('Kukatpally', 17.4947, 78.3996),
  ('Miyapur', 17.4969, 78.3544),
  ('Manikonda', 17.4012, 78.3862),
  ('Nanakramguda', 17.4185, 78.3670),
  ('Financial District', 17.4226, 78.3451),
  ('Begumpet', 17.4437, 78.4707),
  ('Ameerpet', 17.4375, 78.4482),
  ('SR Nagar', 17.4400, 78.4515),
  ('Somajiguda', 17.4280, 78.4684),
  ('Secunderabad', 17.4399, 78.4983),
  ('Kompally', 17.5360, 78.4863),
  ('Uppal', 17.4053, 78.5594),
  ('LB Nagar', 17.3477, 78.5479),
  ('Dilsukhnagar', 17.3688, 78.5260),
  ('Tarnaka', 17.4261, 78.5334),
  ('Habsiguda', 17.4152, 78.5334),
  ('ECIL', 17.4678, 78.5707),
  ('AS Rao Nagar', 17.4565, 78.5477),
  ('Malkajgiri', 17.4546, 78.5157),
  ('Tolichowki', 17.3950, 78.4260),
  ('Mehdipatnam', 17.3950, 78.4420),
  ('Attapur', 17.3762, 78.4220),
  ('Rajendra Nagar', 17.3800, 78.4700),
  ('Shamshabad', 17.2494, 78.4271),
  ('Kokapet', 17.4039, 78.3321),
  ('Tellapur', 17.4406, 78.3087),
  ('Nallagandla', 17.4520, 78.3290),
  ('Bachupally', 17.5328, 78.3843),
  ('Chandanagar', 17.4900, 78.3280),
  ('Lingampally', 17.4884, 78.3189),
  ('Serilingampally', 17.4858, 78.3032),
  ('Patancheru', 17.5313, 78.2641),
  ('Shamirpet', 17.5980, 78.5600),
  ('Alwal', 17.5077, 78.5182),
  ('Bowenpally', 17.4680, 78.4784),
  ('Trimulgherry', 17.4786, 78.4998),
  ('Kothapet', 17.3612, 78.5158),
  ('Chanda Nagar', 17.4881, 78.3280),
  ('Puppalguda', 17.3870, 78.3910),
  ('Narsingi', 17.3860, 78.3580),
  ('Khajaguda', 17.4180, 78.3730),
  ('Raidurg', 17.4280, 78.3800),
  ('Biodiversity Park Area', 17.4210, 78.3780),
  ('Botanical Garden Area', 17.4573, 78.3543)
ON CONFLICT DO NOTHING;

-- Run initial snapshot computation
SELECT refresh_map_snapshot();
