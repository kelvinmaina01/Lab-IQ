-- ============================================
-- COMPREHENSIVE FIX: Storage + Datasets Schema
-- Date: 2025-12-28
-- ============================================

-- ============================================
-- STEP 1: Add missing columns to datasets table
-- ============================================

ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS columns_info jsonb;
ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS preview_data jsonb;
ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS schema jsonb;
ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS columns jsonb;

-- ============================================
-- STEP 2: Create datasets storage bucket
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 3: Drop ALL existing problematic storage policies
-- ============================================

DROP POLICY IF EXISTS "Project members can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Project members can view files" ON storage.objects;
DROP POLICY IF EXISTS "dataset_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "dataset_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "dataset_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload datasets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to datasets" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view own dataset files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own dataset files" ON storage.objects;

-- ============================================
-- STEP 4: Create simple storage policies for datasets bucket
-- These use folder structure: {user_id}/filename.csv
-- ============================================

CREATE POLICY "datasets_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'datasets');

CREATE POLICY "datasets_select_policy"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'datasets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "datasets_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'datasets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- STEP 5: Fix project_members if it exists
-- ============================================

DO $$
BEGIN
  -- Check if project_members table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_members') THEN
    -- Drop problematic recursive policies
    DROP POLICY IF EXISTS "Project members can view membership" ON project_members;
    DROP POLICY IF EXISTS "project_members_select_policy" ON project_members;
    DROP POLICY IF EXISTS "project_members_select_v2" ON project_members;
    
    -- Create simple non-recursive policy
    CREATE POLICY "pm_simple_select"
    ON project_members FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================
-- STEP 6: Refresh PostgREST schema cache
-- ============================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'COMPREHENSIVE FIX APPLIED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added columns: file_path, metadata, columns_info, preview_data, schema, columns';
  RAISE NOTICE 'Created datasets bucket with simple policies';
  RAISE NOTICE 'Fixed project_members if exists';
  RAISE NOTICE 'Triggered PostgREST reload';
  RAISE NOTICE '========================================';
END $$;
