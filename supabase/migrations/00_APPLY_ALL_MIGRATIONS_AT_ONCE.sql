-- ============================================================================
-- APPLY ALL MIGRATIONS AT ONCE
-- Copy and run ALL of this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- Hotfix FIRST: Update refresh_map_snapshot() to use maintenance_extra
-- (Must come before Task 1 backfill, which triggers this function)
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_map_snapshot()
RETURNS void AS $$
BEGIN
  DELETE FROM map_snapshot WHERE id = 1;

  INSERT INTO map_snapshot (id, data)
  SELECT
    1,
    COALESCE(jsonb_agg(row_to_json(b_row)), '[]'::jsonb)
  FROM (
    SELECT
      b.id,
      b.name,
      b.category,
      b.city,
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
                      'maintenance_extra', fl.maintenance_extra,
                      'maintenance_amount', fl.maintenance_amount,
                      'tenant_preference', fl.tenant_preference,
                      'pets_allowed', fl.pets_allowed,
                      'deposit_months', fl.deposit_months,
                      'is_transparency_pin', fl.is_transparency_pin,
                      'availability_date', fl.availability_date,
                      'flatmate_needed', fl.flatmate_needed,
                      'contributor_name', fl.contributor_name,
                      'ip_hash', fl.ip_hash,
                      'updated_at', fl.updated_at
                    )
                  )
                  FROM flats fl
                  WHERE fl.floor_id = f.id AND fl.status != 'occupied' AND (fl.is_removed IS NULL OR fl.is_removed = false)
                ), '[]'::jsonb
              )
            )
          )
          FROM floors f
          WHERE f.building_id = b.id
        ), '[]'::jsonb
      ) AS floors
    FROM buildings b
    LIMIT 5000
  ) b_row;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Task 1: Maintenance Extra Field
-- ============================================================================

DO $$
BEGIN
  -- Check if old column exists and rename it (safe guard for idempotency)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flats' AND column_name = 'maintenance_included'
  ) THEN
    ALTER TABLE flats RENAME COLUMN maintenance_included TO maintenance_included_old;
  END IF;

  -- Add new maintenance_extra column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flats' AND column_name = 'maintenance_extra'
  ) THEN
    ALTER TABLE flats ADD COLUMN maintenance_extra BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Add new maintenance_amount column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flats' AND column_name = 'maintenance_amount'
  ) THEN
    ALTER TABLE flats ADD COLUMN maintenance_amount INTEGER DEFAULT NULL;
  END IF;
END $$;

-- Backfill: convert old boolean to new column (only if old column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flats' AND column_name = 'maintenance_included_old'
  ) THEN
    UPDATE flats
    SET maintenance_extra = COALESCE(maintenance_included_old, false)
    WHERE maintenance_included_old IS NOT NULL
      OR (maintenance_extra = false AND maintenance_included_old IS NULL);

    ALTER TABLE flats DROP COLUMN maintenance_included_old;
  END IF;
END $$;

-- ============================================================================
-- Task 2: Competitor Fields
-- ============================================================================

DO $$
BEGIN
  -- Add tenant_preference column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flats' AND column_name = 'tenant_preference'
  ) THEN
    ALTER TABLE flats ADD COLUMN tenant_preference TEXT
      CHECK (tenant_preference IN ('any', 'bachelors', 'family'))
      NOT NULL DEFAULT 'any';
  END IF;

  -- Add pets_allowed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flats' AND column_name = 'pets_allowed'
  ) THEN
    ALTER TABLE flats ADD COLUMN pets_allowed BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Add deposit_months column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flats' AND column_name = 'deposit_months'
  ) THEN
    ALTER TABLE flats ADD COLUMN deposit_months INTEGER NOT NULL DEFAULT 2;
  END IF;

  -- Add is_transparency_pin column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flats' AND column_name = 'is_transparency_pin'
  ) THEN
    ALTER TABLE flats ADD COLUMN is_transparency_pin BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============================================================================
-- Task 3: Flagging = Soft Remove
-- ============================================================================

DO $$
BEGIN
  -- Add is_removed column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flats' AND column_name = 'is_removed'
  ) THEN
    ALTER TABLE flats ADD COLUMN is_removed BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Replace trigger function to mark as removed on 3+ flags
CREATE OR REPLACE FUNCTION revert_on_flags()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.intel_flags >= 3 THEN
    NEW.is_removed := true;
    NEW.intel_flags := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and re-create trigger (to ensure clean state)
DROP TRIGGER IF EXISTS on_flag_threshold_reached ON flats;
CREATE TRIGGER on_flag_threshold_reached
  BEFORE UPDATE ON flats
  FOR EACH ROW
  WHEN (OLD.intel_flags IS DISTINCT FROM NEW.intel_flags)
  EXECUTE FUNCTION revert_on_flags();

-- ============================================================================
-- Task 4: Daily Bengaluru.rent Import Pipeline
-- ============================================================================

CREATE TABLE IF NOT EXISTS import_sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source      TEXT NOT NULL,
  source_id   TEXT NOT NULL,
  flat_id     UUID REFERENCES flats(id) ON DELETE SET NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, source_id)
);

ALTER TABLE import_sources ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write this table (no public exposure)
DROP POLICY IF EXISTS "import_sources_service_only" ON import_sources;
CREATE POLICY "import_sources_service_only"
  ON import_sources
  USING (false);   -- blocks anon key; service role bypasses RLS entirely

-- Atomic import RPC function
CREATE OR REPLACE FUNCTION import_bengaluru_pin(
  p_source         TEXT,
  p_source_id      TEXT,
  -- building fields
  p_lat            DOUBLE PRECISION,
  p_lng            DOUBLE PRECISION,
  p_society        TEXT,
  p_gated          BOOLEAN,
  -- flat fields
  p_rent_amount    NUMERIC,
  p_bhk            INTEGER,
  p_size_sqft      INTEGER,        -- nullable
  p_furnished      BOOLEAN,
  p_maintenance_extra BOOLEAN,     -- INVERTED from source maintenance_included
  p_deposit_months INTEGER,        -- parsed from string, default 2
  p_pets_allowed   BOOLEAN,
  p_listing_type   TEXT,           -- 'room'/'whole'/null
  p_available_from TEXT,           -- 'asap'/'next_month'/'flexible'
  p_looking_for_flatmate BOOLEAN,
  p_occupant_type  TEXT,           -- maps to tenant_preference
  p_ip_hash        TEXT            -- sha256(pin.id)
)
RETURNS UUID                        -- returns the new flat_id, or NULL if skipped
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_building_id  UUID;
  v_floor_id     UUID;
  v_flat_id      UUID;
  v_category     TEXT;
  v_status       TEXT;
  v_tenant_pref  TEXT;
  v_avail_date   DATE;
  v_furnishing   TEXT;
BEGIN
  -- IDEMPOTENCY CHECK: if already imported, return existing flat_id
  SELECT flat_id INTO v_flat_id
  FROM import_sources
  WHERE source = p_source AND source_id = p_source_id;
  IF FOUND THEN
    RETURN v_flat_id;
  END IF;

  -- FIELD MAPPINGS
  v_category    := CASE WHEN p_gated THEN 'gated' ELSE 'standalone' END;
  v_status      := CASE WHEN p_listing_type IS NULL THEN 'occupied'
                        ELSE 'vacant' END;
  v_tenant_pref := CASE p_occupant_type
                     WHEN 'family'   THEN 'family'
                     WHEN 'bachelor' THEN 'bachelors'
                     ELSE                 'any'
                   END;
  v_furnishing  := CASE WHEN p_furnished THEN 'furnished' ELSE 'unfurnished' END;
  v_avail_date  := CASE p_available_from
                     WHEN 'asap'       THEN CURRENT_DATE
                     WHEN 'next_month' THEN DATE_TRUNC('month', CURRENT_DATE)::DATE
                                            + INTERVAL '1 month'
                     ELSE                   NULL
                   END;

  -- BUILDING DEDUP: find existing building within 100m with same society name
  SELECT id INTO v_building_id
  FROM buildings
  WHERE
    ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      100
    )
    AND (
      (p_society IS NOT NULL AND name = p_society)
      OR
      (p_society IS NULL AND name = 'Property at ' || round(p_lat::numeric,4)
                                                   || ',' || round(p_lng::numeric,4))
    )
  LIMIT 1;

  -- CREATE BUILDING if not found
  IF v_building_id IS NULL THEN
    INSERT INTO buildings (name, category, location, address, city, ip_hash)
    VALUES (
      COALESCE(p_society, 'Property at ' || round(p_lat::numeric,4)
                                          || ',' || round(p_lng::numeric,4)),
      v_category,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      NULL,
      'Bengaluru',
      p_ip_hash
    )
    RETURNING id INTO v_building_id;
  END IF;

  -- FLOOR UPSERT (floor 1, default)
  INSERT INTO floors (building_id, floor_number)
  VALUES (v_building_id, 1)
  ON CONFLICT (building_id, floor_number) DO NOTHING;

  SELECT id INTO v_floor_id
  FROM floors
  WHERE building_id = v_building_id AND floor_number = 1;

  -- FLAT INSERT
  INSERT INTO flats (
    floor_id,
    flat_number,
    status,
    rent_amount,
    bhk,
    furnishing,
    size_sqft,
    maintenance_extra,
    tenant_preference,
    pets_allowed,
    deposit_months,
    is_transparency_pin,
    availability_date,
    flatmate_needed,
    contributor_name,
    ip_hash,
    intel_flags,
    is_removed
  )
  VALUES (
    v_floor_id,
    '1',                       -- default flat_number
    v_status,
    p_rent_amount,
    p_bhk,
    v_furnishing,
    p_size_sqft,
    p_maintenance_extra,
    v_tenant_pref,
    p_pets_allowed,
    p_deposit_months,
    FALSE,                     -- not a transparency pin
    v_avail_date,
    p_looking_for_flatmate,
    'bengaluru.rent',
    p_ip_hash,
    0,
    FALSE
  )
  RETURNING id INTO v_flat_id;

  -- TRACKING INSERT (idempotency record)
  INSERT INTO import_sources (source, source_id, flat_id)
  VALUES (p_source, p_source_id, v_flat_id);

  RETURN v_flat_id;

EXCEPTION WHEN OTHERS THEN
  -- Let the exception propagate so the caller's per-pin try/catch handles it
  RAISE;
END;
$$;
