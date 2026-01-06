-- ============================================================================
-- FIX DATASETS TABLE - Add ALL missing columns
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add all potentially missing columns
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS file_size_mb NUMERIC(10,2);
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS row_count INTEGER;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS column_count INTEGER;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS columns_info JSONB;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'processing';
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS source_id UUID;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON datasets(status);
CREATE INDEX IF NOT EXISTS idx_datasets_created ON datasets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_datasets_source ON datasets(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_datasets_columns ON datasets USING GIN (columns_info);

-- Update existing records to have default values
UPDATE datasets
SET
  status = COALESCE(status, 'ready'),
  columns_info = COALESCE(columns_info, '{}'::jsonb),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE status IS NULL OR columns_info IS NULL;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_datasets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS datasets_updated_at ON datasets;
CREATE TRIGGER datasets_updated_at
BEFORE UPDATE ON datasets
FOR EACH ROW
EXECUTE FUNCTION update_datasets_timestamp();

-- Verify all columns exist
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'datasets'
ORDER BY ordinal_position;

-- Success message
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'datasets';

  RAISE NOTICE '✅ datasets table fixed successfully!';
  RAISE NOTICE '📊 Total columns: %', col_count;
  RAISE NOTICE '📁 Key columns: file_path, file_name, file_size_mb, row_count, columns_info';
  RAISE NOTICE '🔄 Trigger: auto-update updated_at';
END $$;
