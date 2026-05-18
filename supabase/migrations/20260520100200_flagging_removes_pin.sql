/*
  Task 3: Flagging = Soft Remove

  - Add is_removed column (soft delete)
  - Update revert_on_flags() trigger: if intel_flags >= 3, set is_removed = true (not just for occupied status)
  - Map snapshot will exclude is_removed = true flats
*/

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
