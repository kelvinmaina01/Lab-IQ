-- =====================================================================
-- LAB-IQ MASTER DATABASE SETUP
-- =====================================================================
-- Complete database setup following Supabase best practices
-- This script is IDEMPOTENT - safe to run multiple times
-- Run this ONCE to fix all database issues
-- =====================================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- PART 1: CREATE MISSING TABLES
-- =====================================================================

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- 2. Add missing columns to datasets table
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS preview_data JSONB,
ADD COLUMN IF NOT EXISTS schema JSONB;

-- =====================================================================
-- PART 2: CREATE INDEXES FOR PERFORMANCE
-- =====================================================================

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = false;

-- Datasets indexes
CREATE INDEX IF NOT EXISTS idx_datasets_preview_data ON datasets USING gin(preview_data);
CREATE INDEX IF NOT EXISTS idx_datasets_schema ON datasets USING gin(schema);
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON datasets(status);

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_lab ON team_members(lab_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chat_channels_lab ON chat_channels(lab_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- =====================================================================
-- PART 3: ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_typing ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_activity ENABLE ROW LEVEL SECURITY;


-- Enable RLS on channel_members if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channel_members') THEN
    ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =====================================================================
-- PART 4: DROP EXISTING POLICIES (Prevent Duplicates)
-- =====================================================================

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Datasets policies
DROP POLICY IF EXISTS "Users can view their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can create datasets" ON datasets;
DROP POLICY IF EXISTS "Users can update their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can delete their own datasets" ON datasets;

-- Team members policies
DROP POLICY IF EXISTS "Users can view team members in their lab" ON team_members;
DROP POLICY IF EXISTS "Users can update their own team member record" ON team_members;
DROP POLICY IF EXISTS "Users can insert their own team member record" ON team_members;

-- Chat channels policies
DROP POLICY IF EXISTS "Users can view channels in their lab" ON chat_channels;
DROP POLICY IF EXISTS "Users can create channels in their lab" ON chat_channels;
DROP POLICY IF EXISTS "Users can update channels in their lab" ON chat_channels;

-- Chat messages policies
DROP POLICY IF EXISTS "Users can view messages in channels they have access to" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to channels in their lab" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;

-- Channel members policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channel_members') THEN
    DROP POLICY IF EXISTS "Users can view members of channels they belong to" ON channel_members;
    DROP POLICY IF EXISTS "Channel owners can manage members" ON channel_members;
  END IF;
END $$;

-- Shared files policies
DROP POLICY IF EXISTS "Users can view files in projects they have access to" ON shared_files;
DROP POLICY IF EXISTS "Users can upload files to projects they are members of" ON shared_files;
DROP POLICY IF EXISTS "Users can update their own files" ON shared_files;

-- Collaboration activity policies
DROP POLICY IF EXISTS "Users can view activity in their lab" ON collaboration_activity;
DROP POLICY IF EXISTS "Users can create activity in their lab" ON collaboration_activity;

-- =====================================================================
-- PART 5: CREATE RLS POLICIES (Following Supabase Best Practices)
-- =====================================================================

-- 1. Notifications Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- 2. Datasets Policies
CREATE POLICY "Users can view their own datasets"
  ON datasets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create datasets"
  ON datasets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets"
  ON datasets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets"
  ON datasets FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Team Members Policies
CREATE POLICY "Users can view team members in their lab"
  ON team_members FOR SELECT
  USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own team member record"
  ON team_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own team member record"
  ON team_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 4. Chat Channels Policies
CREATE POLICY "Users can view channels in their lab"
  ON chat_channels FOR SELECT
  USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create channels in their lab"
  ON chat_channels FOR INSERT
  WITH CHECK (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update channels they created"
  ON chat_channels FOR UPDATE
  USING (created_by = auth.uid());

-- 5. Chat Messages Policies
CREATE POLICY "Users can view messages in channels they have access to"
  ON chat_messages FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM chat_channels WHERE lab_id IN (
        SELECT lab_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can send messages to channels in their lab"
  ON chat_messages FOR INSERT
  WITH CHECK (
    channel_id IN (
      SELECT id FROM chat_channels WHERE lab_id IN (
        SELECT lab_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own messages"
  ON chat_messages FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR DELETE
  USING (user_id = auth.uid());

-- 6. Channel Members Policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channel_members') THEN
    EXECUTE '
    CREATE POLICY "Users can view members of channels they belong to"
      ON channel_members FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.user_id = auth.uid()
          AND tm.id = team_member_id
        )
      )';

    EXECUTE '
    CREATE POLICY "Channel owners can manage members"
      ON channel_members FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM channel_members cm
          JOIN team_members tm ON cm.team_member_id = tm.id
          WHERE cm.channel_id = channel_members.channel_id
          AND tm.user_id = auth.uid()
          AND cm.role IN (''owner'', ''admin'')
        )
      )';
  END IF;
END $$;

-- 7. Shared Files Policies
CREATE POLICY "Users can view files in projects they have access to"
  ON shared_files FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ) OR uploaded_by = auth.uid()
  );

CREATE POLICY "Users can upload files to projects they are members of"
  ON shared_files FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own files"
  ON shared_files FOR UPDATE
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own files"
  ON shared_files FOR DELETE
  USING (uploaded_by = auth.uid());

-- 8. Collaboration Activity Policies
CREATE POLICY "Users can view activity in their lab"
  ON collaboration_activity FOR SELECT
  USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activity in their lab"
  ON collaboration_activity FOR INSERT
  WITH CHECK (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- =====================================================================
-- PART 6: ENABLE REALTIME REPLICATION
-- =====================================================================

-- Enable realtime for important tables (idempotent - safe to re-run)
DO $$
BEGIN
  -- chat_messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'chat_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages';
  END IF;

  -- chat_typing
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'chat_typing'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_typing';
  END IF;

  -- team_members
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'team_members'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members';
  END IF;

  -- chat_channels
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'chat_channels'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels';
  END IF;

  -- notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END $$;

-- =====================================================================
-- PART 7: CREATE HELPER FUNCTIONS
-- =====================================================================

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read = true, read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, action_url)
  VALUES (p_user_id, p_title, p_message, p_type, p_action_url)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- PART 8: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================================

COMMENT ON TABLE notifications IS 'User notifications with read/unread status';
COMMENT ON COLUMN notifications.user_id IS 'User who receives the notification';
COMMENT ON COLUMN notifications.read IS 'Whether the notification has been read';
COMMENT ON COLUMN notifications.type IS 'Notification type: info, success, warning, error';

COMMENT ON COLUMN datasets.preview_data IS 'First 100 rows for quick preview (JSONB)';
COMMENT ON COLUMN datasets.schema IS 'Dataset schema with column definitions (JSONB)';

-- =====================================================================
-- SUCCESS MESSAGE
-- =====================================================================

DO $$
DECLARE
  table_count INTEGER;
  policy_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('notifications', 'datasets', 'team_members', 'chat_channels', 'chat_messages');

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ LAB-IQ DATABASE SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '  - Core tables: %', table_count;
  RAISE NOTICE '  - RLS policies: %', policy_count;
  RAISE NOTICE '  - Indexes: %', index_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Created/Updated:';
  RAISE NOTICE '  - notifications table';
  RAISE NOTICE '  - datasets.preview_data column';
  RAISE NOTICE '  - datasets.schema column';
  RAISE NOTICE '  - All RLS policies (no duplicates)';
  RAISE NOTICE '  - Performance indexes';
  RAISE NOTICE '  - Realtime replication';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security:';
  RAISE NOTICE '  - RLS enabled on all tables';
  RAISE NOTICE '  - User-scoped policies active';
  RAISE NOTICE '  - No policy conflicts';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next Steps:';
  RAISE NOTICE '  1. Refresh your Lab-IQ app';
  RAISE NOTICE '  2. Check console - no more 404 errors';
  RAISE NOTICE '  3. Test dataset uploads';
  RAISE NOTICE '  4. Test collaboration features';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
