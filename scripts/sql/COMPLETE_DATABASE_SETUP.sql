-- ============================================================================
-- COMPLETE DATABASE SETUP - Run This First
-- This fixes ALL 404 and 400 errors and sets up the complete system
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: Fix datasets table (fixes 400 errors)
-- ============================================================================

-- Add ALL missing columns
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS row_count INTEGER;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS column_count INTEGER;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS columns_info JSONB DEFAULT '{}'::jsonb;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'processing';
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS source_id UUID;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON datasets(status);
CREATE INDEX IF NOT EXISTS idx_datasets_created ON datasets(created_at DESC);

-- RLS
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own datasets" ON datasets;
CREATE POLICY "Users manage own datasets" ON datasets FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 2: Create subscriptions table (fixes 404 error)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier VARCHAR(50) DEFAULT 'free',
  status VARCHAR(50) DEFAULT 'active',
  storage_limit_mb INTEGER DEFAULT 200,
  max_datasets INTEGER DEFAULT 5,
  max_experiments INTEGER DEFAULT 10,
  max_models INTEGER DEFAULT 3,
  max_workflows INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own subscription" ON subscriptions;
CREATE POLICY "Users view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Create default subscriptions for all users
INSERT INTO subscriptions (user_id, tier, status)
SELECT id, 'free', 'active' FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE subscriptions.user_id = auth.users.id)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 3: Create usage_stats table (fixes 404 error)
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  datasets_count INTEGER DEFAULT 0,
  storage_used_mb NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_usage_stats_user_month ON usage_stats(user_id, month);

ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own usage stats" ON usage_stats;
CREATE POLICY "Users view own usage stats" ON usage_stats FOR SELECT USING (auth.uid() = user_id);

-- Create current month stats
INSERT INTO usage_stats (user_id, month)
SELECT id, DATE_TRUNC('month', CURRENT_DATE)::DATE FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM usage_stats
  WHERE usage_stats.user_id = auth.users.id
  AND usage_stats.month = DATE_TRUNC('month', CURRENT_DATE)::DATE
)
ON CONFLICT (user_id, month) DO NOTHING;

-- ============================================================================
-- STEP 4: Create dataset_metadata table
-- ============================================================================

CREATE TABLE IF NOT EXISTS dataset_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID NOT NULL UNIQUE REFERENCES datasets(id) ON DELETE CASCADE,
  quality_score NUMERIC(5, 2),
  completeness_score NUMERIC(5, 2),
  consistency_score NUMERIC(5, 2),
  pii_detected BOOLEAN DEFAULT false,
  schema_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dataset_metadata_dataset ON dataset_metadata(dataset_id);

ALTER TABLE dataset_metadata ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view metadata for own datasets" ON dataset_metadata;
CREATE POLICY "Users view metadata for own datasets"
ON dataset_metadata FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM datasets
    WHERE datasets.id = dataset_metadata.dataset_id
    AND datasets.user_id = auth.uid()
  )
);

-- ============================================================================
-- STEP 5: Create data_ingestion_jobs table (Enhanced Upload)
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingestion_method VARCHAR(50) NOT NULL,
  source_info JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'uploading',
  progress_percentage INTEGER DEFAULT 0,
  current_step VARCHAR(255),
  estimated_completion TIMESTAMPTZ,
  original_filename VARCHAR(500),
  file_size BIGINT,
  file_type VARCHAR(50),
  total_rows INTEGER,
  total_columns INTEGER,
  detected_schema JSONB,
  data_quality_score NUMERIC(5,2),
  suggested_transformations JSONB,
  detected_experiment_ids TEXT[],
  dataset_id UUID REFERENCES datasets(id),
  report_id UUID,
  warnings JSONB,
  errors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_user ON data_ingestion_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON data_ingestion_jobs(status);

ALTER TABLE data_ingestion_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own ingestion jobs" ON data_ingestion_jobs;
CREATE POLICY "Users manage own ingestion jobs" ON data_ingestion_jobs FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 6: Create helper functions for upload statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_upload_statistics(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  WITH job_stats AS (
    SELECT
      COUNT(*) as total_uploads,
      COUNT(*) FILTER (WHERE status = 'ready' OR status = 'completed') as successful_uploads,
      COUNT(*) FILTER (WHERE status = 'error') as failed_uploads,
      SUM(total_rows) as total_rows_ingested,
      SUM(file_size) as total_bytes,
      AVG(data_quality_score) as avg_quality_score,
      jsonb_object_agg(
        ingestion_method,
        COUNT(*)
      ) FILTER (WHERE ingestion_method IS NOT NULL) as methods_used
    FROM data_ingestion_jobs
    WHERE user_id = p_user_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
  )
  SELECT jsonb_build_object(
    'total_uploads', COALESCE(total_uploads, 0),
    'successful_uploads', COALESCE(successful_uploads, 0),
    'failed_uploads', COALESCE(failed_uploads, 0),
    'total_rows_ingested', COALESCE(total_rows_ingested, 0),
    'total_size_gb', ROUND((COALESCE(total_bytes, 0)::numeric / 1024 / 1024 / 1024), 2),
    'avg_quality_score', COALESCE(avg_quality_score, 0),
    'methods_used', COALESCE(methods_used, '{}'::jsonb)
  ) INTO stats
  FROM job_stats;

  RETURN COALESCE(stats, jsonb_build_object(
    'total_uploads', 0,
    'successful_uploads', 0,
    'failed_uploads', 0,
    'total_rows_ingested', 0,
    'total_size_gb', 0,
    'avg_quality_score', 0,
    'methods_used', '{}'::jsonb
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: Storage bucket setup
-- ============================================================================

-- Insert bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'datasets',
  'datasets',
  false,
  52428800, -- 50MB
  ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']::text[];

-- Storage policies
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'datasets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'datasets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'datasets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- STEP 8: Grant permissions
-- ============================================================================

GRANT ALL ON datasets TO authenticated;
GRANT ALL ON dataset_metadata TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON usage_stats TO authenticated;
GRANT ALL ON data_ingestion_jobs TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '✅ COMPLETE DATABASE SETUP - SUCCESS!';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created/Fixed:';
  RAISE NOTICE '  ✓ datasets (with all required columns)';
  RAISE NOTICE '  ✓ dataset_metadata';
  RAISE NOTICE '  ✓ subscriptions';
  RAISE NOTICE '  ✓ usage_stats';
  RAISE NOTICE '  ✓ data_ingestion_jobs';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Security Configured:';
  RAISE NOTICE '  ✓ RLS enabled on all tables';
  RAISE NOTICE '  ✓ Policies configured';
  RAISE NOTICE '  ✓ Storage bucket secured';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Storage:';
  RAISE NOTICE '  ✓ datasets bucket created';
  RAISE NOTICE '  ✓ 50MB file size limit';
  RAISE NOTICE '  ✓ CSV/Excel allowed';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Refresh your browser (Ctrl+F5)';
  RAISE NOTICE '  2. All 404 errors should be GONE';
  RAISE NOTICE '  3. All 400 errors should be GONE';
  RAISE NOTICE '  4. Test upload at /upload page';
  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '';
END $$;
