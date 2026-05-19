/*
  Security Hardening: RLS Policy Tightening

  Drop permissive anon policies to prevent unauthorized updates/deletes.
  Server actions use service role and bypass RLS, so app functionality unaffected.

  Changes:
  1. Drop open UPDATE policy on flats (allows any anon to modify any flat)
  2. Drop overly-permissive DELETE policy on seeker_pins
  3. Enable RLS on metrics_daily table (currently has no RLS at all)
*/

-- Drop the open UPDATE policy that allows anonymous users to update any flat
DROP POLICY IF EXISTS "Anyone can update flats status" ON flats;

-- Drop the overly-permissive DELETE policy on seeker_pins
DROP POLICY IF EXISTS "Anyone can delete their own seeker pins" ON seeker_pins;

-- Enable RLS on metrics_daily table and create service-only policy
ALTER TABLE metrics_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "metrics_daily_service_only" ON metrics_daily;
CREATE POLICY "metrics_daily_service_only"
  ON metrics_daily
  USING (false);  -- blocks anon key; service role bypasses RLS entirely
