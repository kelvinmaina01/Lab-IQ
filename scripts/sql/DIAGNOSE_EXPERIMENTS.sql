-- =====================================================
-- EXPERIMENTS PAGE DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor to diagnose issues
-- Date: 2025-12-22
-- =====================================================

-- =====================================================
-- 1. CHECK IF EXPERIMENTS TABLE EXISTS
-- =====================================================
SELECT 
  'EXPERIMENTS TABLE EXISTS' AS check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'experiments')
    THEN '✅ YES'
    ELSE '❌ NO - Table does not exist!'
  END AS result;

-- =====================================================
-- 2. CHECK EXPERIMENTS TABLE COLUMNS
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'experiments'
ORDER BY ordinal_position;

-- =====================================================
-- 3. CHECK REQUIRED COLUMNS FOR EXPERIMENTS.TSX
-- The frontend expects these columns:
--   - id, user_id, title, description, type, status
--   - dataset_id, auto_created, protocol
--   - created_at, updated_at
-- =====================================================
SELECT 
  'REQUIRED COLUMNS CHECK' AS check_type,
  (SELECT CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'id') AS id,
  (SELECT CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'user_id') AS user_id,
  (SELECT CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'title') AS title,
  (SELECT CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'description') AS description,
  (SELECT CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'type') AS type,
  (SELECT CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'status') AS status,
  (SELECT CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'dataset_id') AS dataset_id,
  (SELECT CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'auto_created') AS auto_created,
  (SELECT CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'protocol') AS protocol,
  (SELECT CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'created_at') AS created_at;

-- =====================================================
-- 4. CHECK RLS POLICIES ON EXPERIMENTS TABLE
-- =====================================================
SELECT 
  policyname AS policy_name,
  permissive,
  roles,
  cmd AS action,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'experiments';

-- =====================================================
-- 5. CHECK IF RLS IS ENABLED
-- =====================================================
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '⚠️ RLS Disabled' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'experiments';

-- =====================================================
-- 6. COUNT EXPERIMENTS BY USER (Anonymized)
-- =====================================================
SELECT 
  LEFT(user_id::text, 8) || '...' AS user_id_prefix,
  COUNT(*) AS experiment_count,
  MAX(created_at) AS last_created
FROM experiments
GROUP BY user_id
ORDER BY experiment_count DESC
LIMIT 10;

-- =====================================================
-- 7. CHECK DATASETS TABLE (Used by Experiments)
-- =====================================================
SELECT 
  'DATASETS TABLE EXISTS' AS check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'datasets')
    THEN '✅ YES'
    ELSE '❌ NO - Table does not exist!'
  END AS result;

-- =====================================================
-- 8. SAMPLE EXPERIMENTS DATA (5 most recent)
-- =====================================================
SELECT 
  id,
  LEFT(title, 30) AS title_preview,
  status,
  type,
  CASE WHEN dataset_id IS NOT NULL THEN '✅' ELSE '❌' END AS has_dataset,
  created_at
FROM experiments
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- 9. CHECK FOR ORPHANED DATASET REFERENCES
-- =====================================================
SELECT 
  COUNT(*) AS orphaned_dataset_refs
FROM experiments e
WHERE e.dataset_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM datasets d WHERE d.id = e.dataset_id);

-- =====================================================
-- 10. CREATE EXPERIMENTS TABLE IF MISSING
-- (Uncomment to run if table doesn't exist)
-- =====================================================
/*
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
  auto_created BOOLEAN DEFAULT false,
  protocol JSONB DEFAULT '{}'::jsonb,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own experiments"
  ON experiments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experiments"
  ON experiments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experiments"
  ON experiments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experiments"
  ON experiments FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_experiments_user_id ON experiments(user_id);
CREATE INDEX idx_experiments_status ON experiments(status);
CREATE INDEX idx_experiments_dataset_id ON experiments(dataset_id);
*/

-- =====================================================
-- DIAGNOSTIC COMPLETE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNOSTIC COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Check the results above for:';
  RAISE NOTICE '1. Missing table (create it if needed)';
  RAISE NOTICE '2. Missing columns (add them)';
  RAISE NOTICE '3. Missing RLS policies (add them)';
  RAISE NOTICE '4. Orphaned dataset references';
  RAISE NOTICE '========================================';
END $$;
