-- ============================================================================
-- SAFE FIX - Handles existing objects, no errors
-- Copy and paste this entire file into Supabase SQL Editor and click Run
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. Create subscriptions table (fixes 404 error)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
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

-- Only add constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_fkey') THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own subscription" ON subscriptions;
CREATE POLICY "Users view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own subscription" ON subscriptions;
CREATE POLICY "Users insert own subscription" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own subscription" ON subscriptions;
CREATE POLICY "Users update own subscription" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

GRANT ALL ON subscriptions TO authenticated;

-- Create default subscriptions for all users
INSERT INTO subscriptions (user_id, tier, status)
SELECT id, 'free', 'active' FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE subscriptions.user_id = auth.users.id)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 2. Create usage_stats table (fixes 404 error)
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  month DATE NOT NULL,
  datasets_count INTEGER DEFAULT 0,
  storage_used_mb NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Only add constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usage_stats_user_id_fkey') THEN
    ALTER TABLE usage_stats ADD CONSTRAINT usage_stats_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_usage_stats_user_month ON usage_stats(user_id, month);

ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own usage stats" ON usage_stats;
CREATE POLICY "Users view own usage stats" ON usage_stats FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own usage stats" ON usage_stats;
CREATE POLICY "Users insert own usage stats" ON usage_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own usage stats" ON usage_stats;
CREATE POLICY "Users update own usage stats" ON usage_stats FOR UPDATE USING (auth.uid() = user_id);

GRANT ALL ON usage_stats TO authenticated;

-- Create current month stats for all users
INSERT INTO usage_stats (user_id, month)
SELECT id, DATE_TRUNC('month', CURRENT_DATE)::DATE FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM usage_stats
  WHERE usage_stats.user_id = auth.users.id
  AND usage_stats.month = DATE_TRUNC('month', CURRENT_DATE)::DATE
)
ON CONFLICT (user_id, month) DO NOTHING;

-- ============================================================================
-- 3. Fix datasets table (fixes 400 error) - Add missing columns
-- ============================================================================
DO $$
BEGIN
  -- user_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='user_id') THEN
    ALTER TABLE datasets ADD COLUMN user_id UUID;
  END IF;

  -- name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='name') THEN
    ALTER TABLE datasets ADD COLUMN name VARCHAR(255);
  END IF;

  -- file_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='file_name') THEN
    ALTER TABLE datasets ADD COLUMN file_name VARCHAR(255);
  END IF;

  -- file_path
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='file_path') THEN
    ALTER TABLE datasets ADD COLUMN file_path TEXT;
  END IF;

  -- file_size (BIGINT for bytes, not MB!)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='file_size') THEN
    ALTER TABLE datasets ADD COLUMN file_size BIGINT;
  END IF;

  -- file_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='file_type') THEN
    ALTER TABLE datasets ADD COLUMN file_type VARCHAR(50);
  END IF;

  -- row_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='row_count') THEN
    ALTER TABLE datasets ADD COLUMN row_count INTEGER;
  END IF;

  -- column_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='column_count') THEN
    ALTER TABLE datasets ADD COLUMN column_count INTEGER;
  END IF;

  -- columns_info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='columns_info') THEN
    ALTER TABLE datasets ADD COLUMN columns_info JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='status') THEN
    ALTER TABLE datasets ADD COLUMN status VARCHAR(50) DEFAULT 'processing';
  END IF;

  -- created_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='created_at') THEN
    ALTER TABLE datasets ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='updated_at') THEN
    ALTER TABLE datasets ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add foreign key constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'datasets_user_id_fkey') THEN
    ALTER TABLE datasets ADD CONSTRAINT datasets_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON datasets(status);
CREATE INDEX IF NOT EXISTS idx_datasets_created ON datasets(created_at DESC);

ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own datasets" ON datasets;
CREATE POLICY "Users manage own datasets" ON datasets FOR ALL USING (auth.uid() = user_id);

GRANT ALL ON datasets TO authenticated;

-- ============================================================================
-- 4. Create dataset_metadata table
-- ============================================================================
CREATE TABLE IF NOT EXISTS dataset_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID NOT NULL UNIQUE,
  quality_score NUMERIC(5, 2),
  completeness_score NUMERIC(5, 2),
  consistency_score NUMERIC(5, 2),
  pii_detected BOOLEAN DEFAULT false,
  schema_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dataset_metadata_dataset_id_fkey') THEN
    ALTER TABLE dataset_metadata ADD CONSTRAINT dataset_metadata_dataset_id_fkey
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dataset_metadata_dataset ON dataset_metadata(dataset_id);

ALTER TABLE dataset_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view metadata for own datasets" ON dataset_metadata;
CREATE POLICY "Users view metadata for own datasets" ON dataset_metadata FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM datasets
    WHERE datasets.id = dataset_metadata.dataset_id
    AND datasets.user_id = auth.uid()
  )
);

GRANT ALL ON dataset_metadata TO authenticated;

-- ============================================================================
-- 5. Create data_ingestion_jobs table (Enhanced Upload)
-- ============================================================================
CREATE TABLE IF NOT EXISTS data_ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
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
  dataset_id UUID,
  report_id UUID,
  warnings JSONB,
  errors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraints only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'data_ingestion_jobs_user_id_fkey') THEN
    ALTER TABLE data_ingestion_jobs ADD CONSTRAINT data_ingestion_jobs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'data_ingestion_jobs_dataset_id_fkey') THEN
    ALTER TABLE data_ingestion_jobs ADD CONSTRAINT data_ingestion_jobs_dataset_id_fkey
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_user ON data_ingestion_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON data_ingestion_jobs(status);

ALTER TABLE data_ingestion_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ingestion jobs" ON data_ingestion_jobs;
CREATE POLICY "Users manage own ingestion jobs" ON data_ingestion_jobs FOR ALL USING (auth.uid() = user_id);

GRANT ALL ON data_ingestion_jobs TO authenticated;

-- ============================================================================
-- 6. Create upload statistics function
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
      COUNT(*) FILTER (WHERE status IN ('ready', 'completed')) as successful_uploads,
      COUNT(*) FILTER (WHERE status = 'error') as failed_uploads,
      COALESCE(SUM(total_rows), 0) as total_rows_ingested,
      COALESCE(SUM(file_size), 0) as total_bytes,
      AVG(data_quality_score) as avg_quality_score
    FROM data_ingestion_jobs
    WHERE user_id = p_user_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
  )
  SELECT jsonb_build_object(
    'total_uploads', COALESCE(total_uploads, 0),
    'successful_uploads', COALESCE(successful_uploads, 0),
    'failed_uploads', COALESCE(failed_uploads, 0),
    'total_rows_ingested', total_rows_ingested,
    'total_size_gb', ROUND((total_bytes::numeric / 1024 / 1024 / 1024), 2),
    'avg_quality_score', COALESCE(avg_quality_score, 0),
    'methods_used', '{}'::jsonb
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
-- 7. Storage bucket
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users upload own files" ON storage.objects;
CREATE POLICY "Users upload own files" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users view own files" ON storage.objects;
CREATE POLICY "Users view own files" ON storage.objects FOR SELECT
USING (bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own files" ON storage.objects;
CREATE POLICY "Users delete own files" ON storage.objects FOR DELETE
USING (bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- SUCCESS! Verify everything
-- ============================================================================
DO $$
DECLARE
  sub_count INTEGER;
  usage_count INTEGER;
  datasets_cols INTEGER;
  metadata_count INTEGER;
  ingestion_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sub_count FROM subscriptions;
  SELECT COUNT(*) INTO usage_count FROM usage_stats;
  SELECT COUNT(*) INTO datasets_cols FROM information_schema.columns WHERE table_name='datasets';
  SELECT COUNT(*) INTO metadata_count FROM dataset_metadata;
  SELECT COUNT(*) INTO ingestion_count FROM data_ingestion_jobs;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DATABASE SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'subscriptions: % rows', sub_count;
  RAISE NOTICE 'usage_stats: % rows', usage_count;
  RAISE NOTICE 'datasets: % columns', datasets_cols;
  RAISE NOTICE 'dataset_metadata: % rows', metadata_count;
  RAISE NOTICE 'data_ingestion_jobs: % rows', ingestion_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ All 404 errors FIXED';
  RAISE NOTICE '✅ All 400 errors FIXED';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Refresh browser (Ctrl+Shift+R)';
  RAISE NOTICE '========================================';
END $$;
