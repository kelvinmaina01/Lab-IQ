-- ============================================================================
-- FIX DATASETS TABLE - Add missing columns_info column
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add the missing columns_info column
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS columns_info JSONB;

-- Add other potentially missing columns
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS column_count INTEGER;

ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);

ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS source_id UUID;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_datasets_source ON datasets(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_datasets_columns ON datasets USING GIN (columns_info);

-- Update existing records to have default values
UPDATE datasets
SET columns_info = '{}'::jsonb
WHERE columns_info IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'datasets'
AND column_name IN ('columns_info', 'column_count', 'source_type', 'source_id')
ORDER BY column_name;

-- Should show all 4 columns exist now
