-- ============================================
-- BULLETPROOF MIGRATION - ONLY CRITICAL TABLES
-- Run this in Supabase SQL Editor
-- Safe to run multiple times
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CREATE LABS TABLE (Simple version)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'labs') THEN
    CREATE TABLE labs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      owner_id UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE '✓ Created labs table';
  ELSE
    RAISE NOTICE '- Labs table already exists';
  END IF;
END $$;

-- Enable RLS on labs
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;

-- Labs policies
DROP POLICY IF EXISTS "Users can view their own labs" ON labs;
CREATE POLICY "Users can view their own labs" ON labs
  FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create labs" ON labs;
CREATE POLICY "Users can create labs" ON labs
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their labs" ON labs;
CREATE POLICY "Users can update their labs" ON labs
  FOR UPDATE USING (owner_id = auth.uid());

-- ============================================
-- 2. UPDATE TEAM_MEMBERS (Add foreign key to labs)
-- ============================================
DO $$
BEGIN
  -- Add foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_members_lab_id_fkey'
  ) THEN
    ALTER TABLE team_members
    ADD CONSTRAINT team_members_lab_id_fkey
    FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE;
    RAISE NOTICE '✓ Added foreign key: team_members.lab_id -> labs.id';
  ELSE
    RAISE NOTICE '- Foreign key already exists';
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

-- Update RLS on team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view team members in their labs" ON team_members;
CREATE POLICY "Users can view team members in their labs" ON team_members
  FOR SELECT USING (
    lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own record" ON team_members;
CREATE POLICY "Users can update their own record" ON team_members
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert themselves" ON team_members;
CREATE POLICY "Users can insert themselves" ON team_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- 3. UPDATE CHAT_CHANNELS (Add foreign key to labs)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chat_channels_lab_id_fkey'
  ) THEN
    ALTER TABLE chat_channels
    ADD CONSTRAINT chat_channels_lab_id_fkey
    FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE;
    RAISE NOTICE '✓ Added foreign key: chat_channels.lab_id -> labs.id';
  ELSE
    RAISE NOTICE '- Foreign key already exists';
  END IF;
END $$;

-- Add missing columns to chat_channels
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'is_archived') THEN
    ALTER TABLE chat_channels ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✓ Added is_archived to chat_channels';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'is_private') THEN
    ALTER TABLE chat_channels ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✓ Added is_private to chat_channels';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'display_name') THEN
    ALTER TABLE chat_channels ADD COLUMN display_name TEXT;
    UPDATE chat_channels SET display_name = name WHERE display_name IS NULL;
    RAISE NOTICE '✓ Added display_name to chat_channels';
  END IF;
END $$;

-- Update RLS on chat_channels
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view channels in their labs" ON chat_channels;
CREATE POLICY "Users can view channels in their labs" ON chat_channels
  FOR SELECT USING (
    lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create channels" ON chat_channels;
CREATE POLICY "Users can create channels" ON chat_channels
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
  );

-- ============================================
-- 4. CREATE CHANNEL_MEMBERS TABLE
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

ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view channel memberships" ON channel_members;
CREATE POLICY "Users can view channel memberships" ON channel_members
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their channel memberships" ON channel_members;
CREATE POLICY "Users can manage their channel memberships" ON channel_members
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- 5. CREATE DIRECT_MESSAGES TABLE
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

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their DMs" ON direct_messages;
CREATE POLICY "Users can view their DMs" ON direct_messages
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can send DMs" ON direct_messages;
CREATE POLICY "Users can send DMs" ON direct_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can update DMs" ON direct_messages;
CREATE POLICY "Users can update DMs" ON direct_messages
  FOR UPDATE USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- ============================================
-- 6. CREATE TYPING_INDICATORS TABLE
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

ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view typing" ON typing_indicators;
CREATE POLICY "Anyone can view typing" ON typing_indicators FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can manage their typing" ON typing_indicators;
CREATE POLICY "Users can manage their typing" ON typing_indicators
  FOR ALL USING (
    team_member_id IN (SELECT id FROM team_members WHERE user_id = auth.uid())
  );

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

ALTER TABLE shared_canvases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage canvases" ON shared_canvases;
CREATE POLICY "Users can manage canvases" ON shared_canvases
  FOR ALL USING (
    lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
  );

-- ============================================
-- 8. CREATE SHARED_LISTS TABLES
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

ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage lists" ON shared_lists;
CREATE POLICY "Users can manage lists" ON shared_lists
  FOR ALL USING (
    lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
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

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can create notifications" ON notifications;
CREATE POLICY "Anyone can create notifications" ON notifications
  FOR INSERT WITH CHECK (TRUE);

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

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view comments" ON comments;
CREATE POLICY "Users can view comments" ON comments FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can manage their comments" ON comments;
CREATE POLICY "Users can manage their comments" ON comments
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- 11. CREATE SHARED_RESOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shared_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES chat_channels(id) ON DELETE SET NULL,
  resource_id UUID NOT NULL,
  resource_type TEXT NOT NULL,
  shared_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_shared_resources_lab ON shared_resources(lab_id);

ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view shared resources" ON shared_resources;
CREATE POLICY "Users can view shared resources" ON shared_resources
  FOR ALL USING (
    lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
  );

-- ============================================
-- 12. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT
  'VERIFICATION' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'labs') as labs_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'channel_members') as channel_members_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'direct_messages') as direct_messages_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'typing_indicators') as typing_indicators_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'shared_canvases') as canvases_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'shared_lists') as lists_exists;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓✓✓ MIGRATION SUCCESSFUL ✓✓✓';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All critical tables created!';
  RAISE NOTICE 'Now go to http://localhost:8080/collaboration';
  RAISE NOTICE 'App will AUTO-CREATE your lab on first visit!';
  RAISE NOTICE '========================================';
END $$;
