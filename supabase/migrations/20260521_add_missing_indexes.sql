-- Add missing performance indexes (no data modifications)
-- These indexes optimize queries that filter/sort on these columns

-- Drop duplicate GIST index (identical to buildings_location_idx from initial schema)
DROP INDEX IF EXISTS idx_buildings_location_gist;

-- Index for flat status queries (every listing query filters status)
CREATE INDEX IF NOT EXISTS idx_flats_status ON flats(status);

-- Index for soft-delete queries (every query filters is_removed = false)
CREATE INDEX IF NOT EXISTS idx_flats_is_removed ON flats(is_removed);

-- Index for analytics city grouping and filtering
CREATE INDEX IF NOT EXISTS idx_buildings_city ON buildings(city);

-- Index for active seeker subscriptions (filters by expiry)
CREATE INDEX IF NOT EXISTS idx_seeker_pins_expires_at ON seeker_pins(expires_at);

-- Index for 30-day window queries (descending for recent first)
CREATE INDEX IF NOT EXISTS idx_seeker_pins_created_at ON seeker_pins(created_at DESC);
