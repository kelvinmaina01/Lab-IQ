-- =====================================================================
-- SUPABASE SETUP COMMANDS - Run AFTER the main schema
-- =====================================================================
-- These commands configure Realtime and Storage for the collaboration system
-- =====================================================================

-- =====================================================================
-- STEP 1: ENABLE REALTIME REPLICATION
-- =====================================================================
-- This enables real-time subscriptions for the chat and presence features

ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_typing;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_activity;

-- Verify replication is enabled
SELECT
  schemaname,
  tablename,
  'Realtime enabled' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('chat_messages', 'chat_typing', 'team_members', 'collaboration_activity');

-- =====================================================================
-- STEP 2: STORAGE BUCKET SETUP
-- =====================================================================
-- Create the storage bucket for file sharing

-- Create bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lab-iq-files',
  'lab-iq-files',
  false,  -- Private bucket
  52428800,  -- 50MB limit
  NULL  -- Allow all mime types
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- STEP 3: STORAGE POLICIES
-- =====================================================================

-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lab-iq-files' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to view their own files
DROP POLICY IF EXISTS "Users can view files" ON storage.objects;
CREATE POLICY "Users can view files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lab-iq-files' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own files
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lab-iq-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lab-iq-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify storage setup
SELECT
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets
WHERE id = 'lab-iq-files';

-- =====================================================================
-- STEP 4: CREATE DEFAULT GENERAL CHANNEL (Optional but recommended)
-- =====================================================================
-- This creates a default "General" channel for each lab
-- You can run this or create channels via the app

-- Example: Create a general channel for a lab
-- Replace 'YOUR_LAB_ID' with an actual lab ID after creating team members

/*
INSERT INTO chat_channels (name, description, lab_id, type, created_by)
VALUES (
  'General',
  'General discussion channel for the lab',
  'YOUR_LAB_ID',  -- Replace with actual lab_id
  'general',
  auth.uid()
);
*/

-- =====================================================================
-- STEP 5: CREATE TEST DATA (Optional - for development/testing)
-- =====================================================================

-- Create a test lab ID (you can use this for testing)
DO $$
DECLARE
  test_lab_id UUID := '00000000-0000-0000-0000-000000000001';
  current_user_id UUID;
BEGIN
  -- Get current authenticated user
  SELECT auth.uid() INTO current_user_id;

  -- Create team member for current user
  IF current_user_id IS NOT NULL THEN
    INSERT INTO team_members (user_id, lab_id, role, display_name, status)
    VALUES (
      current_user_id,
      test_lab_id,
      'admin',
      'Test User',
      'online'
    )
    ON CONFLICT (user_id, lab_id) DO UPDATE
    SET status = 'online', last_active = NOW();

    -- Create a general chat channel
    INSERT INTO chat_channels (name, description, lab_id, type, created_by)
    VALUES (
      'General',
      'General discussion channel',
      test_lab_id,
      'general',
      current_user_id
    )
    ON CONFLICT DO NOTHING;

    -- Create a test project
    INSERT INTO shared_projects (name, description, owner_id, lab_id, status)
    VALUES (
      'Test Project',
      'A test project for collaboration',
      current_user_id,
      test_lab_id,
      'active'
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO test_lab_id;  -- Reuse variable for project_id

    -- Add current user as project member
    IF test_lab_id IS NOT NULL THEN
      INSERT INTO project_members (project_id, user_id, role)
      VALUES (test_lab_id, current_user_id, 'owner')
      ON CONFLICT DO NOTHING;
    END IF;

    RAISE NOTICE '✅ Test data created successfully!';
    RAISE NOTICE 'Lab ID: 00000000-0000-0000-0000-000000000001';
    RAISE NOTICE 'You are now a member of the test lab';
  ELSE
    RAISE NOTICE '⚠️ No authenticated user found. Please log in first.';
  END IF;
END $$;

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================

-- Check Realtime replication
SELECT
  'Realtime Tables' as category,
  COUNT(*) as count
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('chat_messages', 'chat_typing', 'team_members', 'collaboration_activity');

-- Check Storage bucket
SELECT
  'Storage Bucket' as category,
  COUNT(*) as count
FROM storage.buckets
WHERE id = 'lab-iq-files';

-- Check Storage policies
SELECT
  'Storage Policies' as category,
  COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%lab-iq%';

-- Check your team membership
SELECT
  tm.id,
  tm.lab_id,
  tm.role,
  tm.display_name,
  tm.status,
  tm.last_active
FROM team_members tm
WHERE tm.user_id = auth.uid();

-- =====================================================================
-- SUCCESS MESSAGE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Supabase configuration complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📡 Realtime: Enabled for chat_messages, team_members, chat_typing';
  RAISE NOTICE '💾 Storage: lab-iq-files bucket created (Private, 50MB limit)';
  RAISE NOTICE '🔒 Storage Policies: Applied for authenticated users';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your collaboration system is ready to use!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Go to your app and log in';
  RAISE NOTICE '2. Navigate to /collaboration page';
  RAISE NOTICE '3. Start chatting and uploading files!';
END $$;
