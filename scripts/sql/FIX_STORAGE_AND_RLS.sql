-- ============================================
-- FIX STORAGE BUCKET AND RLS RECURSION
-- Run this in Supabase SQL Editor
-- Date: 2025-12-22
-- ============================================

-- ============================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================

-- Create the 'datasets' bucket for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'datasets',
  'datasets',
  false,
  52428800, -- 50MB limit
  ARRAY['text/csv', 'application/json', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Create the 'avatars' bucket for profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create the 'attachments' bucket for chat files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
  52428800, -- 50MB limit
  NULL -- Allow all file types
)
ON CONFLICT (id) DO NOTHING;

RAISE NOTICE '✓ Storage buckets created: datasets, avatars, attachments';

-- ============================================
-- 2. STORAGE POLICIES FOR DATASETS BUCKET
-- ============================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload datasets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their datasets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their datasets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their datasets" ON storage.objects;

-- Users can upload to datasets bucket
CREATE POLICY "Users can upload datasets" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'datasets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own datasets
CREATE POLICY "Users can view their datasets" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'datasets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own datasets
CREATE POLICY "Users can delete their datasets" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'datasets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own datasets
CREATE POLICY "Users can update their datasets" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'datasets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

RAISE NOTICE '✓ Storage policies created for datasets bucket';

-- ============================================
-- 3. STORAGE POLICIES FOR AVATARS BUCKET
-- ============================================

DROP POLICY IF EXISTS "Public avatars access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;

-- Anyone can view avatars (public bucket)
CREATE POLICY "Public avatars access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update avatars" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete avatars" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

RAISE NOTICE '✓ Storage policies created for avatars bucket';

-- ============================================
-- 4. FIX PROJECT_MEMBERS RLS INFINITE RECURSION
-- The issue is that the policy SELECT from project_members 
-- while trying to check SELECT permissions on project_members
-- ============================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Project members can view membership" ON project_members;

-- Create a fixed policy that uses direct user_id check instead of subquery
-- This avoids the infinite recursion by checking the row directly
CREATE POLICY "Project members can view membership" ON project_members FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM shared_projects sp 
    WHERE sp.id = project_members.project_id 
    AND (sp.owner_id = auth.uid() OR sp.visibility = 'public')
  )
);

-- Allow users to insert themselves as project members
DROP POLICY IF EXISTS "Users can join projects" ON project_members;
CREATE POLICY "Users can join projects" ON project_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Allow users to leave projects (delete their own membership)
DROP POLICY IF EXISTS "Users can leave projects" ON project_members;
CREATE POLICY "Users can leave projects" ON project_members FOR DELETE USING (
  user_id = auth.uid()
);

-- Allow project owners to manage members
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;
CREATE POLICY "Project owners can manage members" ON project_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM shared_projects sp
    WHERE sp.id = project_members.project_id
    AND sp.owner_id = auth.uid()
  )
);

RAISE NOTICE '✓ Fixed project_members RLS policies (no more recursion)';

-- ============================================
-- 5. ATTACHMENTS BUCKET POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view attachments" ON storage.objects;

CREATE POLICY "Users can upload attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'attachments' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view attachments" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'attachments' AND
  auth.uid() IS NOT NULL
);

RAISE NOTICE '✓ Storage policies created for attachments bucket';

-- ============================================
-- 6. VERIFICATION
-- ============================================

DO $$
DECLARE
  bucket_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bucket_count FROM storage.buckets WHERE id IN ('datasets', 'avatars', 'attachments');
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Storage buckets found: %', bucket_count;
  RAISE NOTICE '✓ RLS policies fixed for project_members';
  RAISE NOTICE '✓ Storage policies created for all buckets';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 You can now run the demo pipeline!';
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 7. FIX WORKFLOWS TABLE COLUMNS
-- The service sends 'tags' and 'enabled' but table may not have these
-- ============================================

DO $$
BEGIN
  -- Add 'tags' column if not exists (service stores category/icon here)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN tags TEXT;
    RAISE NOTICE '✓ Added tags column to workflows';
  END IF;

  -- Add 'enabled' column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'enabled'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN enabled BOOLEAN DEFAULT true;
    RAISE NOTICE '✓ Added enabled column to workflows';
  END IF;

  -- Add 'total_runs' column if not exists (rename from success_count + failure_count)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'total_runs'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN total_runs INTEGER DEFAULT 0;
    RAISE NOTICE '✓ Added total_runs column to workflows';
  END IF;

  -- Add 'successful_runs' as alias if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'successful_runs'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN successful_runs INTEGER DEFAULT 0;
    RAISE NOTICE '✓ Added successful_runs column to workflows';
  END IF;

  -- Add 'failed_runs' as alias if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'failed_runs'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN failed_runs INTEGER DEFAULT 0;
    RAISE NOTICE '✓ Added failed_runs column to workflows';
  END IF;
END $$;

-- ============================================
-- 8. FINAL SUMMARY
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL FIXES APPLIED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. Storage buckets: datasets, avatars, attachments';
  RAISE NOTICE '2. RLS fixed for project_members (no more recursion)';
  RAISE NOTICE '3. Workflows table columns updated';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '- Run DATABASE_WORKFLOWS_SETUP.sql if not already done';
  RAISE NOTICE '- Refresh the page to test pipeline and workflows';
  RAISE NOTICE '========================================';
END $$;

