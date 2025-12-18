-- ============================================
-- STORAGE POLICIES - FINAL VERSION
-- Run this after creating the 3 storage buckets
-- Date: 2025-12-17
-- ============================================

-- Drop all existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload files to their channels" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files from their channels" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Project members can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Project members can view files" ON storage.objects;

-- ============================================
-- COLLABORATION-FILES BUCKET
-- ============================================

-- Users can upload files to channels they're members of
CREATE POLICY "Users can upload files to their channels"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'collaboration-files' AND
  (storage.foldername(name))[1] IN (
    SELECT cm.channel_id::text
    FROM channel_members cm
    JOIN team_members tm ON cm.team_member_id = tm.id
    WHERE tm.user_id = auth.uid()
  )
);

-- Users can view files from channels they're members of
CREATE POLICY "Users can view files from their channels"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'collaboration-files' AND
  (storage.foldername(name))[1] IN (
    SELECT cm.channel_id::text
    FROM channel_members cm
    JOIN team_members tm ON cm.team_member_id = tm.id
    WHERE tm.user_id = auth.uid()
  )
);

-- Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'collaboration-files' AND
  owner = auth.uid()
);

-- ============================================
-- AVATARS BUCKET
-- ============================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- PROJECT-ATTACHMENTS BUCKET
-- ============================================

-- Project members can upload files
CREATE POLICY "Project members can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT project_id::text
    FROM project_members
    WHERE user_id = auth.uid()
  )
);

-- Project members can view files
CREATE POLICY "Project members can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT project_id::text
    FROM project_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ STORAGE POLICIES APPLIED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ collaboration-files: Upload, view, delete policies';
  RAISE NOTICE '✓ avatars: Public access, user upload policies';
  RAISE NOTICE '✓ project-attachments: Project member policies';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 File sharing fully secured!';
  RAISE NOTICE '========================================';
END $$;
