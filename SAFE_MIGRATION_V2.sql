-- ============================================
-- ULTRA-SAFE MIGRATION
-- Works with your existing schema
-- Only creates what's absolutely missing
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CREATE LABS TABLE (Simple, no dependencies)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'labs') THEN
    CREATE TABLE labs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE '✓ Created labs table';

    -- Create default lab immediately
    INSERT INTO labs (id, name, description)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Default Lab', 'Default workspace')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✓ Created default lab';
  ELSE
    RAISE NOTICE '- Labs table already exists';
  END IF;
END $$;

-- Enable RLS on labs
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view labs" ON labs;
CREATE POLICY "Anyone can view labs" ON labs FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users can create labs" ON labs;
CREATE POLICY "Authenticated users can create labs" ON labs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update labs" ON labs;
CREATE POLICY "Users can update labs" ON labs
  FOR UPDATE USING (
    id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 2. CREATE CHANNEL_MEMBERS TABLE
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channel_members') THEN
    CREATE TABLE channel_members (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      channel_id UUID NOT NULL,
      team_member_id UUID,
      user_id UUID NOT NULL,
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_read_at TIMESTAMP WITH TIME ZONE,
      is_muted BOOLEAN DEFAULT FALSE,
      is_favorite BOOLEAN DEFAULT FALSE
    );

    -- Add foreign keys only if referenced tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_channels') THEN
      ALTER TABLE channel_members ADD CONSTRAINT channel_members_channel_id_fkey
        FOREIGN KEY (channel_id) REFERENCES chat_channels(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
      ALTER TABLE channel_members ADD CONSTRAINT channel_members_team_member_id_fkey
        FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE;
    END IF;

    CREATE INDEX idx_channel_members_channel ON channel_members(channel_id);
    CREATE INDEX idx_channel_members_user ON channel_members(user_id);

    RAISE NOTICE '✓ Created channel_members table';
  ELSE
    RAISE NOTICE '- channel_members table already exists';
  END IF;
END $$;

ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their memberships" ON channel_members;
CREATE POLICY "Users can view their memberships" ON channel_members
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their memberships" ON channel_members;
CREATE POLICY "Users can manage their memberships" ON channel_members
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- 3. CREATE DIRECT_MESSAGES TABLE
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'direct_messages') THEN
    CREATE TABLE direct_messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      sender_id UUID NOT NULL,
      recipient_id UUID NOT NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      edited_at TIMESTAMP WITH TIME ZONE,
      deleted_at TIMESTAMP WITH TIME ZONE,
      reactions JSONB DEFAULT '{}'::jsonb
    );

    CREATE INDEX idx_direct_messages_sender ON direct_messages(sender_id);
    CREATE INDEX idx_direct_messages_recipient ON direct_messages(recipient_id);
    CREATE INDEX idx_direct_messages_created ON direct_messages(created_at DESC);

    RAISE NOTICE '✓ Created direct_messages table';
  ELSE
    RAISE NOTICE '- direct_messages table already exists';
  END IF;
END $$;

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
-- 4. CREATE TYPING_INDICATORS TABLE
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'typing_indicators') THEN
    CREATE TABLE typing_indicators (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      channel_id UUID NOT NULL,
      team_member_id UUID,
      user_id UUID,
      is_typing BOOLEAN DEFAULT TRUE,
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_typing_indicators_channel ON typing_indicators(channel_id);

    RAISE NOTICE '✓ Created typing_indicators table';
  ELSE
    RAISE NOTICE '- typing_indicators table already exists';
  END IF;
END $$;

ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view typing" ON typing_indicators;
CREATE POLICY "Anyone can view typing" ON typing_indicators FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can manage typing" ON typing_indicators;
CREATE POLICY "Users can manage typing" ON typing_indicators FOR ALL USING (TRUE);

-- ============================================
-- 5. CREATE SHARED_CANVASES TABLE
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shared_canvases') THEN
    CREATE TABLE shared_canvases (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      content JSONB DEFAULT '{}'::jsonb,
      lab_id UUID NOT NULL,
      created_by UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_shared_canvases_lab ON shared_canvases(lab_id);

    RAISE NOTICE '✓ Created shared_canvases table';
  ELSE
    RAISE NOTICE '- shared_canvases table already exists';
  END IF;
END $$;

ALTER TABLE shared_canvases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage canvases" ON shared_canvases;
CREATE POLICY "Users can manage canvases" ON shared_canvases FOR ALL USING (TRUE);

-- ============================================
-- 6. CREATE SHARED_LISTS TABLES
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shared_lists') THEN
    CREATE TABLE shared_lists (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      description TEXT,
      lab_id UUID NOT NULL,
      created_by UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_shared_lists_lab ON shared_lists(lab_id);

    RAISE NOTICE '✓ Created shared_lists table';
  ELSE
    RAISE NOTICE '- shared_lists table already exists';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'list_items') THEN
    CREATE TABLE list_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      list_id UUID NOT NULL,
      content TEXT NOT NULL,
      is_completed BOOLEAN DEFAULT FALSE,
      assigned_to UUID,
      due_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add foreign key only if shared_lists exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shared_lists') THEN
      ALTER TABLE list_items ADD CONSTRAINT list_items_list_id_fkey
        FOREIGN KEY (list_id) REFERENCES shared_lists(id) ON DELETE CASCADE;
    END IF;

    CREATE INDEX idx_list_items_list ON list_items(list_id);

    RAISE NOTICE '✓ Created list_items table';
  ELSE
    RAISE NOTICE '- list_items table already exists';
  END IF;
END $$;

ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage lists" ON shared_lists;
CREATE POLICY "Users can manage lists" ON shared_lists FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "Users can manage list items" ON list_items;
CREATE POLICY "Users can manage list items" ON list_items FOR ALL USING (TRUE);

-- ============================================
-- 7. CREATE NOTIFICATIONS TABLE
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      link TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'::jsonb
    );

    CREATE INDEX idx_notifications_user ON notifications(user_id);
    CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

    RAISE NOTICE '✓ Created notifications table';
  ELSE
    RAISE NOTICE '- notifications table already exists';
  END IF;
END $$;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can create notifications" ON notifications;
CREATE POLICY "Anyone can create notifications" ON notifications FOR INSERT WITH CHECK (TRUE);

-- ============================================
-- 8. CREATE COMMENTS TABLE
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
    CREATE TABLE comments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      entity_id UUID NOT NULL,
      entity_type TEXT NOT NULL,
      user_id UUID,
      content TEXT NOT NULL,
      parent_id UUID,
      is_pinned BOOLEAN DEFAULT FALSE,
      likes UUID[] DEFAULT ARRAY[]::UUID[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE
    );

    CREATE INDEX idx_comments_entity ON comments(entity_id, entity_type);
    CREATE INDEX idx_comments_user ON comments(user_id);

    RAISE NOTICE '✓ Created comments table';
  ELSE
    RAISE NOTICE '- comments table already exists';
  END IF;
END $$;

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view comments" ON comments;
CREATE POLICY "Users can view comments" ON comments FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can manage comments" ON comments;
CREATE POLICY "Users can manage comments" ON comments FOR ALL USING (TRUE);

-- ============================================
-- 9. CREATE SHARED_RESOURCES TABLE
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shared_resources') THEN
    CREATE TABLE shared_resources (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      lab_id UUID NOT NULL,
      channel_id UUID,
      resource_id UUID NOT NULL,
      resource_type TEXT NOT NULL,
      shared_by UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'::jsonb
    );

    CREATE INDEX idx_shared_resources_lab ON shared_resources(lab_id);

    RAISE NOTICE '✓ Created shared_resources table';
  ELSE
    RAISE NOTICE '- shared_resources table already exists';
  END IF;
END $$;

ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage resources" ON shared_resources;
CREATE POLICY "Users can manage resources" ON shared_resources FOR ALL USING (TRUE);

-- ============================================
-- 10. ADD MISSING COLUMNS SAFELY
-- ============================================
DO $$
BEGIN
  -- Add is_archived to chat_channels if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'is_archived') THEN
    ALTER TABLE chat_channels ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✓ Added is_archived to chat_channels';
  END IF;

  -- Add is_private to chat_channels if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'is_private') THEN
    ALTER TABLE chat_channels ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✓ Added is_private to chat_channels';
  END IF;

  -- Add display_name to chat_channels if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'display_name') THEN
    ALTER TABLE chat_channels ADD COLUMN display_name TEXT;
    UPDATE chat_channels SET display_name = name WHERE display_name IS NULL;
    RAISE NOTICE '✓ Added display_name to chat_channels';
  END IF;
END $$;

-- ============================================
-- 11. ENSURE DEFAULT LAB EXISTS
-- ============================================
INSERT INTO labs (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Lab', 'Default workspace for all users')
ON CONFLICT (id) DO UPDATE SET name = 'Default Lab';

-- ============================================
-- 12. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT
  'TABLES CREATED' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'labs') as labs,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'channel_members') as channel_members,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'direct_messages') as direct_messages,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'typing_indicators') as typing_indicators,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'shared_canvases') as canvases,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'shared_lists') as lists;

-- ============================================
-- SUCCESS
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓✓✓ MIGRATION COMPLETE ✓✓✓';
  RAISE NOTICE 'Critical tables created!';
  RAISE NOTICE 'Now refresh http://localhost:8080/collaboration';
  RAISE NOTICE '========================================';
END $$;
