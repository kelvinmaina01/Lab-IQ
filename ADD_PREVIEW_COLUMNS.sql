-- =====================================================================
-- Add Preview Data Columns to Datasets Table
-- =====================================================================
-- Run this FIRST before FIX_EXISTING_DATASET.sql
-- =====================================================================

-- Add preview_data column (stores first 100 rows as JSONB)
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS preview_data JSONB;

-- Add schema column (stores column definitions as JSONB)
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS schema JSONB;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_datasets_preview_data ON datasets USING gin(preview_data);
CREATE INDEX IF NOT EXISTS idx_datasets_schema ON datasets USING gin(schema);

-- Add comment for documentation
COMMENT ON COLUMN datasets.preview_data IS 'First 100 rows of the dataset for quick preview';
COMMENT ON COLUMN datasets.schema IS 'Dataset schema with column definitions';

-- =====================================================================
-- SUCCESS MESSAGE
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Added preview_data and schema columns to datasets table';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now run FIX_EXISTING_DATASET.sql to backfill data';
END $$;
