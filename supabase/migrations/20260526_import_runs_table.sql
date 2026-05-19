-- Create import_runs table for tracking batch import job statistics
CREATE TABLE IF NOT EXISTS import_runs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at     TIMESTAMPTZ DEFAULT NOW(),
  source     TEXT NOT NULL,
  total      INTEGER NOT NULL DEFAULT 0,
  imported   INTEGER NOT NULL DEFAULT 0,
  skipped    INTEGER NOT NULL DEFAULT 0,
  failed     INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE import_runs ENABLE ROW LEVEL SECURITY;

-- Service-only policy (no one can read, only service role can insert)
CREATE POLICY "import_runs_service_only"
  ON import_runs
  USING (false)
  WITH CHECK (false);

-- Create index on ran_at for time-series queries
CREATE INDEX idx_import_runs_ran_at ON import_runs(ran_at DESC);
CREATE INDEX idx_import_runs_source ON import_runs(source);
