-- ============================================================================
-- SIMPLIFIED FIX - RUN THIS NOW
-- Copy and paste this entire file into Supabase SQL Editor and click Run
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. Create subscriptions table (fixes 404 error)
-- ============================================================================
DROP TABLE IF EXISTS subscriptions CASCADE;

CREATE TABLE subscriptions (
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

-- Add foreign key
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subscription" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own subscription" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON subscriptions TO authenticated;

-- Create default subscriptions
INSERT INTO subscriptions (user_id, tier, status)
SELECT id, 'free', 'active' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

SELECT 'subscriptions table created' as result;

-- ============================================================================
-- 2. Create usage_stats table (fixes 404 error)
-- ============================================================================
DROP TABLE IF EXISTS usage_stats CASCADE;

CREATE TABLE usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  month DATE NOT NULL,
  datasets_count INTEGER DEFAULT 0,
  storage_used_mb NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Add foreign key
ALTER TABLE usage_stats
ADD CONSTRAINT usage_stats_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX idx_usage_stats_user_month ON usage_stats(user_id, month);

-- Enable RLS
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users view own usage stats" ON usage_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own usage stats" ON usage_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own usage stats" ON usage_stats FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON usage_stats TO authenticated;

-- Create current month stats
INSERT INTO usage_stats (user_id, month)
SELECT id, DATE_TRUNC('month', CURRENT_DATE)::DATE FROM auth.users
ON CONFLICT (user_id, month) DO NOTHING;

SELECT 'usage_stats table created' as result;

-- ============================================================================
-- 3. Fix datasets table (fixes 400 error)
-- ============================================================================

-- Add missing columns one by one
DO $$
BEGIN
  -- Add user_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='user_id') THEN
    ALTER TABLE datasets ADD COLUMN user_id UUID;
    ALTER TABLE datasets ADD CONSTRAINT datasets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add name if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='name') THEN
    ALTER TABLE datasets ADD COLUMN name VARCHAR(255);
  END IF;

  -- Add file_name if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='file_name') THEN
    ALTER TABLE datasets ADD COLUMN file_name VARCHAR(255);
  END IF;

  -- Add file_path if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='file_path') THEN
    ALTER TABLE datasets ADD COLUMN file_path TEXT;
  END IF;

  -- Add file_size if missing (BIGINT for bytes)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='file_size') THEN
    ALTER TABLE datasets ADD COLUMN file_size BIGINT;
  END IF;

  -- Add file_type if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='file_type') THEN
    ALTER TABLE datasets ADD COLUMN file_type VARCHAR(50);
  END IF;

  -- Add row_count if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='row_count') THEN
    ALTER TABLE datasets ADD COLUMN row_count INTEGER;
  END IF;

  -- Add column_count if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='column_count') THEN
    ALTER TABLE datasets ADD COLUMN column_count INTEGER;
  END IF;

  -- Add columns_info if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='columns_info') THEN
    ALTER TABLE datasets ADD COLUMN columns_info JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add status if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='status') THEN
    ALTER TABLE datasets ADD COLUMN status VARCHAR(50) DEFAULT 'processing';
  END IF;

  -- Add created_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='created_at') THEN
    ALTER TABLE datasets ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='datasets' AND column_name='updated_at') THEN
    ALTER TABLE datasets ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON datasets(status);
CREATE INDEX IF NOT EXISTS idx_datasets_created ON datasets(created_at DESC);

-- Enable RLS
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users manage own datasets" ON datasets;
DROP POLICY IF EXISTS "Users view own datasets" ON datasets;
DROP POLICY IF EXISTS "Users insert own datasets" ON datasets;
DROP POLICY IF EXISTS "Users update own datasets" ON datasets;
DROP POLICY IF EXISTS "Users delete own datasets" ON datasets;

-- Create new policy
CREATE POLICY "Users manage own datasets" ON datasets FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON datasets TO authenticated;

SELECT 'datasets table fixed' as result;

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

-- Add foreign key
ALTER TABLE dataset_metadata
ADD CONSTRAINT dataset_metadata_dataset_id_fkey
FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_dataset_metadata_dataset ON dataset_metadata(dataset_id);

-- Enable RLS
ALTER TABLE dataset_metadata ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users view metadata for own datasets" ON dataset_metadata FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM datasets
    WHERE datasets.id = dataset_metadata.dataset_id
    AND datasets.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON dataset_metadata TO authenticated;

SELECT 'dataset_metadata table created' as result;

-- ============================================================================
-- 5. Create storage bucket
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', false)
ON CONFLICT (id) DO NOTHING;

SELECT 'storage bucket created' as result;

-- ============================================================================
-- 6. Storage policies
-- ============================================================================
DROP POLICY IF EXISTS "Users upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own files" ON storage.objects;

CREATE POLICY "Users upload own files" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users view own files" ON storage.objects FOR SELECT
USING (bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own files" ON storage.objects FOR DELETE
USING (bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text);

SELECT 'storage policies created' as result;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
SELECT
  '✅ ALL TABLES CREATED!' as status,
  (SELECT COUNT(*) FROM subscriptions) as subscriptions_count,
  (SELECT COUNT(*) FROM usage_stats) as usage_stats_count,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='datasets') as datasets_columns;
