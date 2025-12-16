-- ============================================================================
-- CREATE DATASET_METADATA TABLE
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Create the dataset_metadata table
CREATE TABLE IF NOT EXISTS dataset_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,

  -- Quality metrics
  quality_score NUMERIC(5,2),
  completeness NUMERIC(5,2),
  completeness_score NUMERIC(5,2),
  consistency_score NUMERIC(5,2),

  -- Privacy
  pii_detected BOOLEAN DEFAULT false,

  -- Schema information
  schema_info JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one metadata record per dataset
  UNIQUE(dataset_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dataset_metadata_dataset_id
ON dataset_metadata(dataset_id);

CREATE INDEX IF NOT EXISTS idx_dataset_metadata_quality
ON dataset_metadata(quality_score DESC);

CREATE INDEX IF NOT EXISTS idx_dataset_metadata_schema
ON dataset_metadata USING GIN (schema_info);

-- Enable Row Level Security
ALTER TABLE dataset_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own dataset metadata"
ON dataset_metadata
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM datasets
    WHERE datasets.id = dataset_metadata.dataset_id
    AND datasets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert metadata for their datasets"
ON dataset_metadata
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM datasets
    WHERE datasets.id = dataset_metadata.dataset_id
    AND datasets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own dataset metadata"
ON dataset_metadata
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM datasets
    WHERE datasets.id = dataset_metadata.dataset_id
    AND datasets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own dataset metadata"
ON dataset_metadata
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM datasets
    WHERE datasets.id = dataset_metadata.dataset_id
    AND datasets.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON dataset_metadata TO authenticated;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_dataset_metadata_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dataset_metadata_updated_at ON dataset_metadata;
CREATE TRIGGER dataset_metadata_updated_at
BEFORE UPDATE ON dataset_metadata
FOR EACH ROW
EXECUTE FUNCTION update_dataset_metadata_timestamp();

-- Verify
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'dataset_metadata'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ dataset_metadata table created successfully!';
  RAISE NOTICE '📊 Columns: id, dataset_id, quality_score, completeness, completeness_score, consistency_score, pii_detected, schema_info';
  RAISE NOTICE '🔒 RLS enabled with 4 policies';
END $$;
