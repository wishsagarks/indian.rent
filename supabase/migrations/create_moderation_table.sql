-- Create moderation queue table for flagged listings
CREATE TABLE IF NOT EXISTS moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id uuid NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  flag_count integer NOT NULL DEFAULT 1,
  flags_data jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  reviewer_notes text,
  reviewed_at timestamp,
  reviewed_by text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(flat_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_moderation_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_flag_count ON moderation_queue(flag_count DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_created_at ON moderation_queue(created_at DESC);

-- Create table for tracking individual flags
CREATE TABLE IF NOT EXISTS flag_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id uuid NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  ip_hash text,
  user_agent text,
  reason text,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flag_events_flat_id ON flag_events(flat_id);
CREATE INDEX IF NOT EXISTS idx_flag_events_created_at ON flag_events(created_at DESC);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON moderation_queue TO authenticated;
GRANT SELECT, INSERT ON flag_events TO authenticated;
