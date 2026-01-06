-- ============================================
-- COLLABORATION SYSTEM COMPLETE FIX & SETUP
-- Date: 2025-12-19
-- Purpose: Ensure all tables exist with proper RLS policies
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. LABS TABLE (Foundation)
-- ============================================
CREATE TABLE IF NOT EXISTS labs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for labs
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view labs they are members of" ON labs;
CREATE POLICY "Users can view labs they are members of" ON labs
  FOR SELECT USING (
    id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage labs" ON labs;
CREATE POLICY "Admins can manage labs" ON labs
  FOR ALL USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.lab_id = labs.id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'admin'
    )
  );

-- ============================================
-- 2. TEAM MEMBERS TABLE (Core)
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'researcher', 'analyst', 'viewer')),
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline', 'busy')),
  display_name TEXT,
  avatar_url TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{"notifications": true, "email_digest": true}'::jsonb,
  status_message TEXT,
  status_emoji TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lab_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_lab ON team_members(lab_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- RLS for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view team members in their labs" ON team_members;
CREATE POLICY "Users can view team members in their labs" ON team_members
  FOR SELECT USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own team member record" ON team_members;
CREATE POLICY "Users can update their own team member record" ON team_members
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert themselves as team members" ON team_members;
CREATE POLICY "Users can insert themselves as team members" ON team_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- 3. CHAT CHANNELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'project', 'announcement', 'private', 'direct')),
  is_private BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  topic TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(lab_id, name)
);

CREATE INDEX IF NOT EXISTS idx_chat_channels_lab ON chat_channels(lab_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_type ON chat_channels(type);

-- RLS for chat_channels
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view channels in their labs" ON chat_channels;
CREATE POLICY "Users can view channels in their labs" ON chat_channels
  FOR SELECT USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create channels in their labs" ON chat_channels;
CREATE POLICY "Users can create channels in their labs" ON chat_channels
  FOR INSERT WITH CHECK (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 4. CHANNEL MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS channel_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  is_muted BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  UNIQUE(channel_id, team_member_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_team_member ON channel_members(team_member_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user ON channel_members(user_id);

-- RLS for channel_members
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view channel memberships" ON channel_members;
CREATE POLICY "Users can view channel memberships" ON channel_members
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can join/leave channels" ON channel_members;
CREATE POLICY "Users can join/leave channels" ON channel_members
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- 5. CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  reactions JSONB DEFAULT '{}'::jsonb,
  mentions UUID[],
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_parent ON chat_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- RLS for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- 6. DIRECT MESSAGES TABLE
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
  reactions JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON direct_messages(recipient_id, is_read) WHERE is_read = FALSE;

-- RLS for direct_messages
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own DMs" ON direct_messages;
CREATE POLICY "Users can view their own DMs" ON direct_messages
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can send DMs" ON direct_messages;
CREATE POLICY "Users can send DMs" ON direct_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own DMs" ON direct_messages;
CREATE POLICY "Users can update their own DMs" ON direct_messages
  FOR UPDATE USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- ============================================
-- 7. TYPING INDICATORS TABLE
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

-- RLS for typing_indicators
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view typing indicators" ON typing_indicators;
CREATE POLICY "Users can view typing indicators" ON typing_indicators
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can manage their typing status" ON typing_indicators;
CREATE POLICY "Users can manage their typing status" ON typing_indicators
  FOR ALL USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 8. SHARED RESOURCES TABLE
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

-- RLS for shared_resources
ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view shared resources in their labs" ON shared_resources;
CREATE POLICY "Users can view shared resources in their labs" ON shared_resources
  FOR SELECT USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can share resources" ON shared_resources;
CREATE POLICY "Users can share resources" ON shared_resources
  FOR INSERT WITH CHECK (shared_by = auth.uid());

-- ============================================
-- 9. SHARED CANVASES TABLE
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

-- RLS for shared_canvases
ALTER TABLE shared_canvases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view canvases in their labs" ON shared_canvases;
CREATE POLICY "Users can view canvases in their labs" ON shared_canvases
  FOR SELECT USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create canvases" ON shared_canvases;
CREATE POLICY "Users can create canvases" ON shared_canvases
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update canvases" ON shared_canvases;
CREATE POLICY "Users can update canvases" ON shared_canvases
  FOR UPDATE USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 10. SHARED LISTS TABLE
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

-- RLS for shared_lists
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view lists in their labs" ON shared_lists;
CREATE POLICY "Users can view lists in their labs" ON shared_lists
  FOR SELECT USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage lists" ON shared_lists;
CREATE POLICY "Users can manage lists" ON shared_lists
  FOR ALL USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- RLS for list_items
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

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
-- 11. NOTIFICATIONS TABLE
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

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (TRUE);

-- ============================================
-- 12. COMMENTS TABLE
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

-- RLS for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view comments" ON comments;
CREATE POLICY "Users can view comments" ON comments
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- 13. COLLABORATION ACTIVITY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS collaboration_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collaboration_activity_lab ON collaboration_activity(lab_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_activity_created ON collaboration_activity(created_at DESC);

-- RLS for collaboration_activity
ALTER TABLE collaboration_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view activity in their labs" ON collaboration_activity;
CREATE POLICY "Users can view activity in their labs" ON collaboration_activity
  FOR SELECT USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create activity" ON collaboration_activity;
CREATE POLICY "Users can create activity" ON collaboration_activity
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- 14. SHARED PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shared_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id),
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_projects_lab ON shared_projects(lab_id);
CREATE INDEX IF NOT EXISTS idx_shared_projects_owner ON shared_projects(owner_id);

-- RLS for shared_projects
ALTER TABLE shared_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view projects in their labs" ON shared_projects;
CREATE POLICY "Users can view projects in their labs" ON shared_projects
  FOR SELECT USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage projects" ON shared_projects;
CREATE POLICY "Users can manage projects" ON shared_projects
  FOR ALL USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- CREATE DEFAULT LAB FOR TESTING
-- ============================================
INSERT INTO labs (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Lab', 'Default lab for testing')
ON CONFLICT (id) DO NOTHING;
