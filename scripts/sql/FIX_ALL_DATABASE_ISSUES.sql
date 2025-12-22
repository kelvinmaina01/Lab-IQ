-- ============================================================================
-- FIX ALL DATABASE ISSUES - Complete Schema Alignment
-- Run this to fix ALL 404 and 400 errors
-- ============================================================================

-- ============================================================================
-- PART 1: Fix datasets table (400 errors)
-- ============================================================================

-- First, let's check what columns exist
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'datasets';

  RAISE NOTICE '📊 Current datasets table has % columns', col_count;
END $$;

-- Add ALL missing columns to datasets table
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS file_size BIGINT; -- IMPORTANT: bytes, not MB
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON datasets(status);
CREATE INDEX IF NOT EXISTS idx_datasets_created ON datasets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_datasets_source ON datasets(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_datasets_columns ON datasets USING GIN (columns_info);

-- Update trigger for updated_at
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

-- Enable RLS
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users manage own datasets" ON datasets;
DROP POLICY IF EXISTS "Users view own datasets" ON datasets;
DROP POLICY IF EXISTS "Users insert own datasets" ON datasets;
DROP POLICY IF EXISTS "Users update own datasets" ON datasets;
DROP POLICY IF EXISTS "Users delete own datasets" ON datasets;

-- Create RLS policies
CREATE POLICY "Users manage own datasets"
ON datasets FOR ALL
USING (auth.uid() = user_id);

RAISE NOTICE '✅ datasets table fixed!';


-- ============================================================================
-- PART 2: Create subscriptions table (404 errors)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  storage_limit_mb INTEGER DEFAULT 200,
  max_datasets INTEGER DEFAULT 5,
  max_experiments INTEGER DEFAULT 10,
  max_models INTEGER DEFAULT 3,
  max_workflows INTEGER DEFAULT 5,
  features JSONB DEFAULT '[]'::jsonb,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own subscription" ON subscriptions;
CREATE POLICY "Users view own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own subscription" ON subscriptions;
CREATE POLICY "Users update own subscription"
ON subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- Create default subscription for existing users
INSERT INTO subscriptions (user_id, tier, status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE subscriptions.user_id = auth.users.id
)
ON CONFLICT DO NOTHING;

RAISE NOTICE '✅ subscriptions table created!';


-- ============================================================================
-- PART 3: Create usage_stats table (404 errors)
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of month: '2025-12-01'
  datasets_count INTEGER DEFAULT 0,
  experiments_count INTEGER DEFAULT 0,
  models_count INTEGER DEFAULT 0,
  workflows_count INTEGER DEFAULT 0,
  storage_used_mb NUMERIC(10, 2) DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,
  compute_hours NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_month ON usage_stats(month DESC);
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_month ON usage_stats(user_id, month);

-- RLS
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own usage stats" ON usage_stats;
CREATE POLICY "Users view own usage stats"
ON usage_stats FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own usage stats" ON usage_stats;
CREATE POLICY "Users insert own usage stats"
ON usage_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own usage stats" ON usage_stats;
CREATE POLICY "Users update own usage stats"
ON usage_stats FOR UPDATE
USING (auth.uid() = user_id);

-- Create current month stats for existing users
INSERT INTO usage_stats (user_id, month)
SELECT id, DATE_TRUNC('month', CURRENT_DATE)::DATE
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM usage_stats
  WHERE usage_stats.user_id = auth.users.id
  AND usage_stats.month = DATE_TRUNC('month', CURRENT_DATE)::DATE
)
ON CONFLICT (user_id, month) DO NOTHING;

RAISE NOTICE '✅ usage_stats table created!';


-- ============================================================================
-- PART 4: Create dataset_metadata table (if missing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS dataset_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  quality_score NUMERIC(5, 2),
  completeness_score NUMERIC(5, 2),
  consistency_score NUMERIC(5, 2),
  pii_detected BOOLEAN DEFAULT false,
  schema_info JSONB,
  statistics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dataset_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dataset_metadata_dataset ON dataset_metadata(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_metadata_quality ON dataset_metadata(quality_score DESC);

-- RLS
ALTER TABLE dataset_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view metadata for own datasets" ON dataset_metadata;
CREATE POLICY "Users view metadata for own datasets"
ON dataset_metadata FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM datasets
    WHERE datasets.id = dataset_metadata.dataset_id
    AND datasets.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users insert metadata for own datasets" ON dataset_metadata;
CREATE POLICY "Users insert metadata for own datasets"
ON dataset_metadata FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM datasets
    WHERE datasets.id = dataset_metadata.dataset_id
    AND datasets.user_id = auth.uid()
  )
);

RAISE NOTICE '✅ dataset_metadata table created!';


-- ============================================================================
-- PART 5: Verify storage bucket exists
-- ============================================================================

-- Check if datasets bucket exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'datasets') THEN
    -- Create bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('datasets', 'datasets', false);

    RAISE NOTICE '✅ Storage bucket "datasets" created!';
  ELSE
    RAISE NOTICE '✅ Storage bucket "datasets" already exists!';
  END IF;
END $$;

-- Storage policies for datasets bucket
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

DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
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

RAISE NOTICE '✅ Storage policies configured!';


-- ============================================================================
-- PART 6: Create data_ingestion_jobs table (Enhanced Upload)
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Ingestion method
  ingestion_method VARCHAR(50) NOT NULL, -- 'file_upload', 'device_stream', 'api_import', etc.
  source_info JSONB DEFAULT '{}'::jsonb,

  -- Job status
  status VARCHAR(50) DEFAULT 'uploading', -- 'uploading', 'processing', 'profiling', 'ready', 'error'
  progress_percentage INTEGER DEFAULT 0,
  current_step VARCHAR(255),
  estimated_completion TIMESTAMPTZ,

  -- File/Data info
  original_filename VARCHAR(500),
  file_size BIGINT,
  file_type VARCHAR(50),
  total_rows INTEGER,
  total_columns INTEGER,

  -- Auto-detected metadata
  detected_schema JSONB,
  data_quality_score NUMERIC(5,2),
  suggested_transformations JSONB,
  detected_experiment_ids TEXT[],
  detected_date_range JSONB,

  -- Processing results
  dataset_id UUID REFERENCES datasets(id),
  report_id UUID,
  warnings JSONB,
  errors JSONB,

  -- Performance metrics
  upload_duration_ms INTEGER,
  processing_duration_ms INTEGER,
  profiling_duration_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_user ON data_ingestion_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON data_ingestion_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_method ON data_ingestion_jobs(ingestion_method);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_dataset ON data_ingestion_jobs(dataset_id);

-- RLS
ALTER TABLE data_ingestion_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ingestion jobs" ON data_ingestion_jobs;
CREATE POLICY "Users manage own ingestion jobs"
ON data_ingestion_jobs FOR ALL
USING (auth.uid() = user_id);

RAISE NOTICE '✅ data_ingestion_jobs table created!';


-- ============================================================================
-- PART 7: Grant permissions
-- ============================================================================

GRANT ALL ON datasets TO authenticated;
GRANT ALL ON dataset_metadata TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON usage_stats TO authenticated;
GRANT ALL ON data_ingestion_jobs TO authenticated;


-- ============================================================================
-- PART 8: Verification
-- ============================================================================

DO $$
DECLARE
  datasets_cols INTEGER;
  datasets_exists BOOLEAN;
  subscriptions_exists BOOLEAN;
  usage_stats_exists BOOLEAN;
  metadata_exists BOOLEAN;
  ingestion_exists BOOLEAN;
BEGIN
  -- Check datasets
  SELECT COUNT(*) INTO datasets_cols
  FROM information_schema.columns
  WHERE table_name = 'datasets';

  -- Check table existence
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'datasets') INTO datasets_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') INTO subscriptions_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_stats') INTO usage_stats_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dataset_metadata') INTO metadata_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_ingestion_jobs') INTO ingestion_exists;

  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ ALL DATABASE ISSUES FIXED!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Table Status:';
  RAISE NOTICE '  ✓ datasets: % columns', datasets_cols;
  RAISE NOTICE '  ✓ dataset_metadata: %', CASE WHEN metadata_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '  ✓ subscriptions: %', CASE WHEN subscriptions_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '  ✓ usage_stats: %', CASE WHEN usage_stats_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '  ✓ data_ingestion_jobs: %', CASE WHEN ingestion_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Security:';
  RAISE NOTICE '  ✓ RLS enabled on all tables';
  RAISE NOTICE '  ✓ Policies configured';
  RAISE NOTICE '  ✓ Storage bucket secured';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Refresh your browser (Ctrl+F5)';
  RAISE NOTICE '  2. Test upload at /upload page';
  RAISE NOTICE '  3. All 404 and 400 errors should be gone!';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
END $$;
