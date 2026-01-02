-- ============================================================================
-- LabIQ Health - Datasets Schema Stability
-- Adds missing columns required by DatasetService and IngestionService
-- ============================================================================

-- Add metadata and preview columns to datasets
ALTER TABLE public.datasets 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS schema JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preview_data JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Index for metadata searches (useful for provider filtering)
CREATE INDEX IF NOT EXISTS idx_datasets_metadata ON public.datasets USING GIN (metadata);

-- Ensure RLS is updated (already enabled in init, but good to be safe)
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

-- Comment for clarity
COMMENT ON COLUMN public.datasets.metadata IS 'Stores flexible metadata including provider, health pattern results, and processing info';
COMMENT ON COLUMN public.datasets.schema IS 'Stores the parsed schema with column types and statistics';
COMMENT ON COLUMN public.datasets.preview_data IS 'Stores a sample of rows for immediate UI display';
