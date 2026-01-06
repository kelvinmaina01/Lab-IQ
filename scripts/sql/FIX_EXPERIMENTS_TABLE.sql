-- Fix Experiments Table - Add Missing Columns
-- Run this in Supabase SQL Editor

-- Add missing auto_created column
ALTER TABLE experiments
ADD COLUMN IF NOT EXISTS auto_created BOOLEAN DEFAULT false;

-- Add other potentially missing columns for better functionality
ALTER TABLE experiments
ADD COLUMN IF NOT EXISTS dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL;

-- Update existing records to have default values
UPDATE experiments
SET auto_created = false
WHERE auto_created IS NULL;

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_experiments_dataset_id ON experiments(dataset_id);
CREATE INDEX IF NOT EXISTS idx_experiments_auto_created ON experiments(auto_created);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'experiments'
ORDER BY ordinal_position;
