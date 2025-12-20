-- ============================================
-- INCREMENTAL SAFE MIGRATION
-- Only adds what's missing from existing schema
-- Run CHECK_EXISTING_SCHEMA.sql FIRST to see what you have
-- Date: 2025-12-19
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CREATE LABS TABLE (CRITICAL - likely missing)
-- ============================================
CREATE TABLE IF NOT EXISTS labs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create default lab if not exists
INSERT INTO labs (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Lab', 'Default lab for development and testing')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. FIX TEAM_MEMBERS - ADD LAB_ID FOREIGN KEY
-- ============================================
-- Add foreign key to labs if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'team_members_lab_id_fkey'
    AND table_name = 'team_members'
  ) THEN
    -- Check if lab_id column exists first
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'team_members' AND column_name = 'lab_id'
    ) THEN
      ALTER TABLE team_members
      ADD CONSTRAINT team_members_lab_id_fkey
      FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE;
      RAISE NOTICE '✓ Added foreign key team_members.lab_id -> labs.id';
    END IF;
  END IF;
END $$;

-- Add missing columns to team_members
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_members' AND column_name = 'status_message') THEN
    ALTER TABLE team_members ADD COLUMN status_message TEXT;
    RAISE NOTICE '✓ Added status_message to team_members';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_members' AND column_name = 'status_emoji') THEN
    ALTER TABLE team_members ADD COLUMN status_emoji TEXT;
    RAISE NOTICE '✓ Added status_emoji to team_members';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_members' AND column_name = 'timezone') THEN
    ALTER TABLE team_members ADD COLUMN timezone TEXT DEFAULT 'UTC';
    RAISE NOTICE '✓ Added timezone to team_members';
  END IF;
END $$;

-- ============================================
-- 3. CREATE CHANNEL_MEMBERS TABLE (CRITICAL)
-- ============================================
CREATE TABLE IF NOT EXISTS channel_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  last_read_message_id UUID,
  is_muted BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  UNIQUE(channel_id, team_member_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_team_member ON channel_members(team_member_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user ON channel_members(user_id);

-- ============================================
-- 4. CREATE DIRECT_MESSAGES TABLE (CRITICAL)
-- ============================================
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  reactions JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON direct_messages(recipient_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- 5. CREATE TYPING_INDICATORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_channel ON typing_indicators(channel_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires ON typing_indicators(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- 6. CREATE SHARED_RESOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shared_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES chat_channels(id) ON DELETE SET NULL,
  resource_id UUID NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('dataset', 'report', 'experiment', 'protocol', 'workflow')),
  shared_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_shared_resources_lab ON shared_resources(lab_id);
CREATE INDEX IF NOT EXISTS idx_shared_resources_channel ON shared_resources(channel_id);
CREATE INDEX IF NOT EXISTS idx_shared_resources_type ON shared_resources(resource_type);

-- ============================================
-- 7. CREATE SHARED_CANVASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shared_canvases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}'::jsonb,
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_canvases_lab ON shared_canvases(lab_id);

-- ============================================
-- 8. CREATE SHARED_LISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shared_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES shared_lists(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  assigned_to UUID REFERENCES auth.users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_lists_lab ON shared_lists(lab_id);
CREATE INDEX IF NOT EXISTS idx_list_items_list ON list_items(list_id);

-- ============================================
-- 9. CREATE NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mention', 'reply', 'reaction', 'system', 'dm')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- 10. CREATE COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT FALSE,
  likes UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- ============================================
-- 11. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================

-- Add columns to chat_channels
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'is_private') THEN
    ALTER TABLE chat_channels ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✓ Added is_private to chat_channels';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'is_archived') THEN
    ALTER TABLE chat_channels ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✓ Added is_archived to chat_channels';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'display_name') THEN
    ALTER TABLE chat_channels ADD COLUMN display_name TEXT;
    -- Copy name to display_name if null
    UPDATE chat_channels SET display_name = name WHERE display_name IS NULL;
    RAISE NOTICE '✓ Added display_name to chat_channels';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'topic') THEN
    ALTER TABLE chat_channels ADD COLUMN topic TEXT;
    RAISE NOTICE '✓ Added topic to chat_channels';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'last_message_at') THEN
    ALTER TABLE chat_channels ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✓ Added last_message_at to chat_channels';
  END IF;
END $$;

-- Add columns to chat_messages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'mentions') THEN
    ALTER TABLE chat_messages ADD COLUMN mentions UUID[];
    RAISE NOTICE '✓ Added mentions to chat_messages';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'attachments') THEN
    ALTER TABLE chat_messages ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✓ Added attachments to chat_messages';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'reply_count') THEN
    ALTER TABLE chat_messages ADD COLUMN reply_count INTEGER DEFAULT 0;
    RAISE NOTICE '✓ Added reply_count to chat_messages';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'last_reply_at') THEN
    ALTER TABLE chat_messages ADD COLUMN last_reply_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✓ Added last_reply_at to chat_messages';
  END IF;
END $$;

-- ============================================
-- 12. RLS POLICIES - CRITICAL
-- ============================================

-- Enable RLS on all tables
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Labs policies
DROP POLICY IF EXISTS "Users can view labs they are members of" ON labs;
CREATE POLICY "Users can view labs they are members of" ON labs
  FOR SELECT USING (
    id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
  );

-- Team members policies
DROP POLICY IF EXISTS "Users can view team members in their labs" ON team_members;
CREATE POLICY "Users can view team members in their labs" ON team_members
  FOR SELECT USING (
    lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own team member record" ON team_members;
CREATE POLICY "Users can update their own team member record" ON team_members
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert themselves as team members" ON team_members;
CREATE POLICY "Users can insert themselves as team members" ON team_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Chat channels policies
DROP POLICY IF EXISTS "Users can view channels in their labs" ON chat_channels;
CREATE POLICY "Users can view channels in their labs" ON chat_channels
  FOR SELECT USING (
    lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create channels in their labs" ON chat_channels;
CREATE POLICY "Users can create channels in their labs" ON chat_channels
  FOR INSERT WITH CHECK (
    lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
  );

-- Channel members policies
DROP POLICY IF EXISTS "Users can view channel memberships" ON channel_members;
CREATE POLICY "Users can view channel memberships" ON channel_members
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their channel memberships" ON channel_members;
CREATE POLICY "Users can manage their channel memberships" ON channel_members
  FOR ALL USING (user_id = auth.uid());

-- Chat messages policies
DROP POLICY IF EXISTS "Users can view messages in their channels" ON chat_messages;
CREATE POLICY "Users can view messages in their channels" ON chat_messages
  FOR SELECT USING (
    channel_id IN (
      SELECT channel_id FROM channel_members WHERE user_id = auth.uid()
    ) OR
    channel_id IN (
      SELECT id FROM chat_channels WHERE lab_id IN (
        SELECT lab_id FROM team_members WHERE user_id = auth.uid()
      ) AND is_private = FALSE
    )
  );

DROP POLICY IF EXISTS "Users can create messages" ON chat_messages;
CREATE POLICY "Users can create messages" ON chat_messages
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (user_id = auth.uid());

-- Direct messages policies
DROP POLICY IF EXISTS "Users can view their own DMs" ON direct_messages;
CREATE POLICY "Users can view their own DMs" ON direct_messages
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can send DMs" ON direct_messages;
CREATE POLICY "Users can send DMs" ON direct_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own DMs" ON direct_messages;
CREATE POLICY "Users can update their own DMs" ON direct_messages
  FOR UPDATE USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Typing indicators policies
DROP POLICY IF EXISTS "Users can view typing indicators" ON typing_indicators;
CREATE POLICY "Users can view typing indicators" ON typing_indicators
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can manage their typing status" ON typing_indicators;
CREATE POLICY "Users can manage their typing status" ON typing_indicators
  FOR ALL USING (
    team_member_id IN (SELECT id FROM team_members WHERE user_id = auth.uid())
  );

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (TRUE);

-- Comments policies
DROP POLICY IF EXISTS "Users can view comments" ON comments;
CREATE POLICY "Users can view comments" ON comments
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (user_id = auth.uid());

-- Shared resources policies
DROP POLICY IF EXISTS "Users can view shared resources in their labs" ON shared_resources;
CREATE POLICY "Users can view shared resources in their labs" ON shared_resources
  FOR SELECT USING (
    lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can share resources" ON shared_resources;
CREATE POLICY "Users can share resources" ON shared_resources
  FOR INSERT WITH CHECK (shared_by = auth.uid());

-- Canvases policies
DROP POLICY IF EXISTS "Users can view canvases in their labs" ON shared_canvases;
CREATE POLICY "Users can view canvases in their labs" ON shared_canvases
  FOR SELECT USING (
    lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create canvases" ON shared_canvases;
CREATE POLICY "Users can create canvases" ON shared_canvases
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update canvases" ON shared_canvases;
CREATE POLICY "Users can update canvases" ON shared_canvases
  FOR UPDATE USING (
    lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
  );

-- Lists policies
DROP POLICY IF EXISTS "Users can view lists in their labs" ON shared_lists;
CREATE POLICY "Users can view lists in their labs" ON shared_lists
  FOR SELECT USING (
    lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage lists" ON shared_lists;
CREATE POLICY "Users can manage lists" ON shared_lists
  FOR ALL USING (
    lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
  );

-- List items policies
DROP POLICY IF EXISTS "Users can view list items" ON list_items;
CREATE POLICY "Users can view list items" ON list_items
  FOR SELECT USING (
    list_id IN (
      SELECT id FROM shared_lists WHERE lab_id IN (
        SELECT lab_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can manage list items" ON list_items;
CREATE POLICY "Users can manage list items" ON list_items
  FOR ALL USING (
    list_id IN (
      SELECT id FROM shared_lists WHERE lab_id IN (
        SELECT lab_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- 13. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✓✓✓ INCREMENTAL MIGRATION COMPLETE ✓✓✓';
  RAISE NOTICE 'Next step: Run SETUP_COLLABORATION.sql to bootstrap your account';
END $$;
