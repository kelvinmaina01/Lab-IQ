-- ============================================================================
-- FIX STORAGE BUCKET POLICIES
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "datasets_upload_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "datasets_read_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "datasets_delete_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "datasets_service_role_full_access" ON storage.objects;

-- Also drop any policies on storage.buckets
DROP POLICY IF EXISTS "Allow authenticated users to create buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Users can view datasets bucket" ON storage.buckets;

-- ============================================================================
-- BUCKET POLICIES (Allow bucket operations)
-- ============================================================================

-- Allow authenticated users to view the datasets bucket
CREATE POLICY "Anyone can view datasets bucket"
ON storage.buckets
FOR SELECT
TO authenticated
USING (name = 'datasets');

-- Allow service role to manage buckets (for auto-creation)
CREATE POLICY "Service role can manage buckets"
ON storage.buckets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- OBJECT POLICIES (Allow file operations)
-- ============================================================================

-- Policy 1: Allow authenticated users to UPLOAD into their own folder
CREATE POLICY "Authenticated users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'datasets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to READ their own files
CREATE POLICY "Authenticated users can read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'datasets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to UPDATE their own files
CREATE POLICY "Authenticated users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'datasets'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'datasets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow authenticated users to DELETE their own files
CREATE POLICY "Authenticated users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'datasets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5: Allow service_role full access (for backend/automation)
CREATE POLICY "Service role has full access"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'datasets')
WITH CHECK (bucket_id = 'datasets');

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================

-- Check bucket policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'buckets'
ORDER BY policyname;

-- Check object policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%datasets%'
ORDER BY policyname;

-- Should see 5 object policies and 2 bucket policies
