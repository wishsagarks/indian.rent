/*
  Task 2: Competitor Fields

  - tenant_preference: 'any' | 'bachelors' | 'family'
  - pets_allowed: boolean
  - deposit_months: integer (months of deposit required)
  - is_transparency_pin: boolean (resident adding building for reference, not renting)
*/

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
