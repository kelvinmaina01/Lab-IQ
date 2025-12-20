-- ============================================
-- STORAGE BUCKETS SETUP
-- Create storage buckets for collaboration files
-- Run this AFTER the main migration
-- ============================================

-- Note: Storage buckets are created via Supabase Dashboard or API
-- This script shows you what to create manually

/*
==============================================
MANUAL STEPS IN SUPABASE DASHBOARD:
==============================================

1. Go to Storage in Supabase Dashboard
2. Create these buckets:

BUCKET 1: collaboration-files
- Name: collaboration-files
- Public: NO (private)
- Allowed MIME types: (leave empty for all, or specify):
  - image/*
  - application/pdf
  - text/*
  - application/vnd.ms-excel
  - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  - application/zip
- File size limit: 50 MB

BUCKET 2: collaboration-avatars (optional)
- Name: collaboration-avatars
- Public: YES
- Allowed MIME types:
  - image/jpeg
  - image/png
  - image/gif
  - image/webp
- File size limit: 5 MB

BUCKET 3: collaboration-canvases (optional)
- Name: collaboration-canvases
- Public: NO
- Allowed MIME types:
  - application/json
  - image/*
- File size limit: 10 MB

==============================================
*/

-- ============================================
-- ALTERNATIVE: CREATE VIA SQL (if supported)
-- ============================================

-- Insert buckets (this might not work depending on Supabase version)
-- You may need to use the Dashboard or API instead

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('collaboration-files', 'collaboration-files', false, 52428800, ARRAY['image/*', 'application/pdf', 'text/*', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip']::text[]),
  ('collaboration-avatars', 'collaboration-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]),
  ('collaboration-canvases', 'collaboration-canvases', false, 10485760, ARRAY['application/json', 'image/*']::text[])
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES FOR collaboration-files
-- ============================================

-- Users can upload files to their lab's folder
DROP POLICY IF EXISTS "Users can upload files to their labs" ON storage.objects;
CREATE POLICY "Users can upload files to their labs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'collaboration-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view files from labs they're members of
DROP POLICY IF EXISTS "Users can view files from their labs" ON storage.objects;
CREATE POLICY "Users can view files from their labs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'collaboration-files' AND
    (storage.foldername(name))[2] IN (
      SELECT lab_id::text FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Users can delete their own uploaded files
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'collaboration-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- STORAGE POLICIES FOR collaboration-avatars
-- ============================================

-- Users can upload their own avatar
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'collaboration-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can view avatars (public bucket)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'collaboration-avatars');

-- Users can update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'collaboration-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'collaboration-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- STORAGE POLICIES FOR collaboration-canvases
-- ============================================

-- Users can upload canvases to their labs
DROP POLICY IF EXISTS "Users can upload canvases" ON storage.objects;
CREATE POLICY "Users can upload canvases" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'collaboration-canvases' AND
    (storage.foldername(name))[1] IN (
      SELECT lab_id::text FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Users can view canvases from their labs
DROP POLICY IF EXISTS "Users can view lab canvases" ON storage.objects;
CREATE POLICY "Users can view lab canvases" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'collaboration-canvases' AND
    (storage.foldername(name))[1] IN (
      SELECT lab_id::text FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Users can update canvases in their labs
DROP POLICY IF EXISTS "Users can update lab canvases" ON storage.objects;
CREATE POLICY "Users can update lab canvases" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'collaboration-canvases' AND
    (storage.foldername(name))[1] IN (
      SELECT lab_id::text FROM team_members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- Check buckets were created
SELECT
  'STORAGE BUCKETS' as check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id LIKE 'collaboration%'
ORDER BY name;

-- Check storage policies
SELECT
  'STORAGE POLICIES' as check_type,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%collaboration%'
ORDER BY policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✓✓✓ STORAGE BUCKETS SETUP COMPLETE ✓✓✓';
  RAISE NOTICE 'Buckets created: collaboration-files, collaboration-avatars, collaboration-canvases';
  RAISE NOTICE 'File uploads will work with proper permissions';
END $$;
