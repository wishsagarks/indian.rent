/*
  Task 6: Update Map Snapshot

  Rebuild refresh_map_snapshot() to include all new fields from Tasks 1-3:
  - maintenance_extra, maintenance_amount
  - tenant_preference, pets_allowed, deposit_months, is_transparency_pin
  - Other existing fields: bhk, furnishing, size_sqft, etc.

  Also filters out is_removed = true flats
*/

-- Ensure all new columns exist (idempotent check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flats' AND column_name = 'maintenance_extra'
  ) THEN
    RAISE EXCEPTION 'Migration 001 must run first (maintenance_extra column missing)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flats' AND column_name = 'tenant_preference'
  ) THEN
    RAISE EXCEPTION 'Migration 002 must run first (tenant_preference column missing)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flats' AND column_name = 'is_removed'
  ) THEN
    RAISE EXCEPTION 'Migration 003 must run first (is_removed column missing)';
  END IF;
END $$;

-- Drop and recreate to ensure we pick up the new columns
DROP FUNCTION IF EXISTS refresh_map_snapshot();

CREATE FUNCTION refresh_map_snapshot()
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
      b.address,
      b.city,
      b.ip_hash,
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
                      'id',                 fl.id,
                      'flat_number',        fl.flat_number,
                      'status',             fl.status,
                      'rent_amount',        fl.rent_amount,
                      'bhk',                fl.bhk,
                      'furnishing',         fl.furnishing,
                      'size_sqft',          fl.size_sqft,
                      'maintenance_extra',  fl.maintenance_extra,
                      'maintenance_amount', fl.maintenance_amount,
                      'tenant_preference',  fl.tenant_preference,
                      'pets_allowed',       fl.pets_allowed,
                      'deposit_months',     fl.deposit_months,
                      'is_transparency_pin',fl.is_transparency_pin,
                      'availability_date',  fl.availability_date,
                      'flatmate_needed',    fl.flatmate_needed,
                      'contributor_name',   fl.contributor_name,
                      'ip_hash',            fl.ip_hash,
                      'updated_at',         fl.updated_at
                    )
                  )
                  FROM flats fl
                  WHERE fl.floor_id = f.id
                    AND fl.status != 'occupied'
                    AND (fl.is_removed IS NULL OR fl.is_removed = false)
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

-- Rebuild snapshot with new fields immediately
SELECT refresh_map_snapshot();
