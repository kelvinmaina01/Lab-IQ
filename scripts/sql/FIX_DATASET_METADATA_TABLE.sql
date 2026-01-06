-- ============================================================================
-- FIX DATASET_METADATA TABLE - Add missing columns
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Check what columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'dataset_metadata'
ORDER BY ordinal_position;

-- Add potentially missing columns
ALTER TABLE dataset_metadata
ADD COLUMN IF NOT EXISTS completeness NUMERIC(5,2);

ALTER TABLE dataset_metadata
ADD COLUMN IF NOT EXISTS completeness_score NUMERIC(5,2);

ALTER TABLE dataset_metadata
ADD COLUMN IF NOT EXISTS consistency_score NUMERIC(5,2);

ALTER TABLE dataset_metadata
ADD COLUMN IF NOT EXISTS pii_detected BOOLEAN DEFAULT false;

ALTER TABLE dataset_metadata
ADD COLUMN IF NOT EXISTS schema_info JSONB;

-- Update existing records
UPDATE dataset_metadata
SET
  completeness = COALESCE(completeness, completeness_score, 1.0),
  completeness_score = COALESCE(completeness_score, completeness, 1.0),
  consistency_score = COALESCE(consistency_score, 0.98),
  pii_detected = COALESCE(pii_detected, false)
WHERE completeness IS NULL OR completeness_score IS NULL;

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'dataset_metadata'
ORDER BY ordinal_position;
