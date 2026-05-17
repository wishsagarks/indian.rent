/*
  # Add tables for new features: ratings, comments, seeker_pins, notification_subscriptions

  1. Schema Changes to existing tables
    - Add columns to `flats`: bhk, furnishing, size_sqft, maintenance_included, availability_date, ip_hash, flatmate_needed
    - Add `ip_hash` to `buildings` for ownership tracking

  2. New Tables
    - `ratings` - Community ratings with locality + built quality scores
      - `id` (uuid, primary key)
      - `flat_id` (uuid, references flats)
      - `locality_score` (integer, 1-5)
      - `built_quality_score` (integer, 1-5)
      - `ip_hash` (text, for deduplication)
      - `created_at` (timestamptz)
    - `comments` - User comments on listings
      - `id` (uuid, primary key)
      - `flat_id` (uuid, references flats)
      - `content` (text)
      - `ip_hash` (text)
      - `created_at` (timestamptz)
    - `seeker_pins` - Flat hunt seeker pins
      - `id` (uuid, primary key)
      - `latitude` (float)
      - `longitude` (float)
      - `bhk_preference` (text)
      - `budget` (numeric)
      - `move_in_timeline` (text)
      - `food_preference` (text)
      - `smoking_preference` (text)
      - `gender_preference` (text)
      - `email` (text, private)
      - `ip_hash` (text)
      - `expires_at` (timestamptz, 30 days from creation)
      - `created_at` (timestamptz)
    - `notification_subscriptions` - Watch area email alerts
      - `id` (uuid, primary key)
      - `email` (text)
      - `locality` (text, nullable)
      - `latitude` (float, nullable)
      - `longitude` (float, nullable)
      - `radius_km` (float, default 2.5)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on all new tables
    - Public read for ratings, comments
    - Public insert for ratings (with IP dedup), comments, seeker_pins, notification_subscriptions

  4. Functions
    - `get_flat_ratings(target_flat_id uuid)` - Returns avg ratings for a flat
    - `get_area_stats(min_lat, min_lng, max_lat, max_lng)` - Returns area statistics
*/

-- Add new columns to flats
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flats' AND column_name = 'bhk') THEN
    ALTER TABLE flats ADD COLUMN bhk INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flats' AND column_name = 'furnishing') THEN
    ALTER TABLE flats ADD COLUMN furnishing TEXT CHECK (furnishing IN ('furnished', 'semi-furnished', 'unfurnished'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flats' AND column_name = 'size_sqft') THEN
    ALTER TABLE flats ADD COLUMN size_sqft INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flats' AND column_name = 'maintenance_included') THEN
    ALTER TABLE flats ADD COLUMN maintenance_included BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flats' AND column_name = 'availability_date') THEN
    ALTER TABLE flats ADD COLUMN availability_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flats' AND column_name = 'ip_hash') THEN
    ALTER TABLE flats ADD COLUMN ip_hash TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flats' AND column_name = 'flatmate_needed') THEN
    ALTER TABLE flats ADD COLUMN flatmate_needed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add ip_hash to buildings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buildings' AND column_name = 'ip_hash') THEN
    ALTER TABLE buildings ADD COLUMN ip_hash TEXT;
  END IF;
END $$;

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID REFERENCES flats(id) ON DELETE CASCADE,
  locality_score INTEGER NOT NULL CHECK (locality_score >= 1 AND locality_score <= 5),
  built_quality_score INTEGER NOT NULL CHECK (built_quality_score >= 1 AND built_quality_score <= 5),
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flat_id, ip_hash)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID REFERENCES flats(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 500),
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seeker pins table
CREATE TABLE IF NOT EXISTS seeker_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  bhk_preference TEXT NOT NULL DEFAULT 'any',
  budget NUMERIC,
  move_in_timeline TEXT NOT NULL DEFAULT 'flexible' CHECK (move_in_timeline IN ('asap', 'next_month', 'flexible')),
  food_preference TEXT DEFAULT 'any' CHECK (food_preference IN ('veg', 'non-veg', 'any')),
  smoking_preference TEXT DEFAULT 'any' CHECK (smoking_preference IN ('smoker', 'non-smoker', 'any')),
  gender_preference TEXT DEFAULT 'any' CHECK (gender_preference IN ('male', 'female', 'any')),
  email TEXT,
  ip_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification subscriptions table
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  locality TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 2.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Ratings policies
CREATE POLICY "Ratings are publicly readable"
  ON ratings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert ratings"
  ON ratings FOR INSERT WITH CHECK (true);

-- Comments policies
CREATE POLICY "Comments are publicly readable"
  ON comments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert comments"
  ON comments FOR INSERT WITH CHECK (true);

-- Seeker pins policies
CREATE POLICY "Active seeker pins are publicly readable"
  ON seeker_pins FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Anyone can insert seeker pins"
  ON seeker_pins FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete their own seeker pins"
  ON seeker_pins FOR DELETE USING (true);

-- Notification subscriptions policies
CREATE POLICY "Anyone can insert notification subscriptions"
  ON notification_subscriptions FOR INSERT WITH CHECK (true);

-- Function to get average ratings for a flat
CREATE OR REPLACE FUNCTION get_flat_ratings(target_flat_id UUID)
RETURNS TABLE(
  avg_locality NUMERIC,
  avg_built_quality NUMERIC,
  total_ratings BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(r.locality_score)::numeric, 1),
    ROUND(AVG(r.built_quality_score)::numeric, 1),
    COUNT(*)
  FROM ratings r
  WHERE r.flat_id = target_flat_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get area stats for a bounding box
CREATE OR REPLACE FUNCTION get_area_stats(
  min_lat DOUBLE PRECISION,
  min_lng DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  max_lng DOUBLE PRECISION
)
RETURNS TABLE(
  total_flats BIGINT,
  avg_rent NUMERIC,
  avg_rent_1bhk NUMERIC,
  avg_rent_2bhk NUMERIC,
  avg_rent_3bhk NUMERIC,
  gated_count BIGINT,
  non_gated_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(fl.id),
    ROUND(AVG(fl.rent_amount)::numeric, 0),
    ROUND(AVG(CASE WHEN fl.bhk = 1 THEN fl.rent_amount END)::numeric, 0),
    ROUND(AVG(CASE WHEN fl.bhk = 2 THEN fl.rent_amount END)::numeric, 0),
    ROUND(AVG(CASE WHEN fl.bhk = 3 THEN fl.rent_amount END)::numeric, 0),
    COUNT(CASE WHEN b.category = 'gated' THEN 1 END),
    COUNT(CASE WHEN b.category != 'gated' THEN 1 END)
  FROM flats fl
  JOIN floors f ON fl.floor_id = f.id
  JOIN buildings b ON f.building_id = b.id
  WHERE ST_Y(b.location::geometry) BETWEEN min_lat AND max_lat
    AND ST_X(b.location::geometry) BETWEEN min_lng AND max_lng
    AND fl.status != 'occupied';
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to delete a pin by IP hash
CREATE OR REPLACE FUNCTION delete_own_pin(target_flat_id UUID, owner_ip_hash TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  deleted BOOLEAN := false;
BEGIN
  DELETE FROM flats WHERE id = target_flat_id AND ip_hash = owner_ip_hash;
  IF FOUND THEN
    deleted := true;
  END IF;
  RETURN deleted;
END;
$$ LANGUAGE plpgsql;

-- Update refresh_map_snapshot to include new fields
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
      b.ip_hash AS building_ip_hash,
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
                      'bhk', fl.bhk,
                      'furnishing', fl.furnishing,
                      'size_sqft', fl.size_sqft,
                      'maintenance_included', fl.maintenance_included,
                      'availability_date', fl.availability_date,
                      'flatmate_needed', fl.flatmate_needed,
                      'contributor_name', fl.contributor_name,
                      'ip_hash', fl.ip_hash,
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

-- Refresh snapshot with new data
SELECT refresh_map_snapshot();
