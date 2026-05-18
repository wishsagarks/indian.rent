/*
  Task 1: Maintenance Extra Field

  - Replace maintenance_included BOOLEAN with maintenance_extra BOOLEAN
  - Add maintenance_amount INTEGER for optional ₹/mo estimate
*/

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
