-- ============================================
-- LAB IQ COLLABORATION SYSTEM v2 (SAFE MIGRATION)
-- Handles existing tables gracefully with IF NOT EXISTS
-- Date: 2025-12-17
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TEAM MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lab_id UUID,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'guest', 'researcher', 'analyst', 'viewer')),
  display_name TEXT,
  title TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  status_message TEXT,
  status_emoji TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{
    "notifications": {
      "mentions": true,
      "directMessages": true,
      "channelMessages": false,
      "emailDigest": true
    },
    "theme": "system",
    "soundEnabled": true
  }'::jsonb,
  timezone TEXT DEFAULT 'UTC',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'team_members_user_id_lab_id_key'
  ) THEN
    ALTER TABLE team_members ADD CONSTRAINT team_members_user_id_lab_id_key UNIQUE(user_id, lab_id);
  END IF;
END $$;

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_lab_id ON team_members(lab_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- ============================================
-- 2. TEAM INVITATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  lab_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'guest', 'researcher', 'analyst', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invitation_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_lab_id ON team_invitations(lab_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(invitation_token);

-- ============================================
-- 3. CHAT CHANNELS
-- ============================================

CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('public', 'private', 'direct', 'project', 'general')),
  project_id UUID,
  dataset_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  topic TEXT,
  pinned_message_ids UUID[],
  settings JSONB DEFAULT '{
    "allowThreads": true,
    "allowReactions": true,
    "allowFileUploads": true,
    "retentionDays": null,
    "slowModeSeconds": 0
  }'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  member_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_channels_lab_id_name_key'
  ) THEN
    ALTER TABLE chat_channels ADD CONSTRAINT chat_channels_lab_id_name_key UNIQUE(lab_id, name);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_channels_lab_id ON chat_channels(lab_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_type ON chat_channels(type);
CREATE INDEX IF NOT EXISTS idx_chat_channels_project_id ON chat_channels(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_archived ON chat_channels(is_archived);

-- ============================================
-- 4. CHANNEL MEMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS channel_members (
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  notification_level TEXT DEFAULT 'all' CHECK (notification_level IN ('all', 'mentions', 'none')),
  is_muted BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_message_id UUID,
  unread_count INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);

-- ============================================
-- 5. CHAT MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  thread_id UUID,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'code', 'file', 'system')),
  formatted_content JSONB,
  mentions UUID[],
  mentioned_channels UUID[],
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_system_message BOOLEAN DEFAULT FALSE,
  reply_count INTEGER DEFAULT 0,
  reply_users UUID[],
  last_reply_at TIMESTAMP WITH TIME ZONE,
  reactions JSONB DEFAULT '{}'::jsonb,
  reaction_count INTEGER DEFAULT 0,
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_parent_id ON chat_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_mentions ON chat_messages USING GIN(mentions);
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_search ON chat_messages USING GIN(to_tsvector('english', content));

-- ============================================
-- 6. DIRECT MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  formatted_content JSONB,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  reactions JSONB DEFAULT '{}'::jsonb,
  edited_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON direct_messages(recipient_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- 7. TYPING INDICATORS
-- ============================================

CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 seconds'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'typing_indicators_channel_id_user_id_key'
  ) THEN
    ALTER TABLE typing_indicators ADD CONSTRAINT typing_indicators_channel_id_user_id_key UNIQUE(channel_id, user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_typing_indicators_channel ON typing_indicators(channel_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires ON typing_indicators(expires_at);

-- ============================================
-- 8. USER PRESENCE
-- ============================================

CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active_channel_id UUID REFERENCES chat_channels(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

-- ============================================
-- 9. SHARED FILES
-- ============================================

CREATE TABLE IF NOT EXISTS shared_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL,
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_category TEXT CHECK (file_category IN ('image', 'document', 'spreadsheet', 'presentation', 'code', 'data', 'other')),
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  download_url TEXT,
  experiment_id UUID,
  dataset_id UUID,
  is_result_file BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  download_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  parent_file_id UUID REFERENCES shared_files(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_files_lab_id ON shared_files(lab_id);
CREATE INDEX IF NOT EXISTS idx_shared_files_channel_id ON shared_files(channel_id);
CREATE INDEX IF NOT EXISTS idx_shared_files_uploaded_by ON shared_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_shared_files_experiment_id ON shared_files(experiment_id);
CREATE INDEX IF NOT EXISTS idx_shared_files_created_at ON shared_files(created_at DESC);

-- ============================================
-- 10. SHARED PROJECTS
-- ============================================

CREATE TABLE IF NOT EXISTS shared_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'team')),
  experiment_ids UUID[],
  dataset_ids UUID[],
  protocol_ids UUID[],
  tags TEXT[],
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  member_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  file_count INTEGER DEFAULT 0,
  default_channel_id UUID REFERENCES chat_channels(id) ON DELETE SET NULL,
  archived_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_projects_lab_id ON shared_projects(lab_id);
CREATE INDEX IF NOT EXISTS idx_shared_projects_owner_id ON shared_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_projects_status ON shared_projects(status);

-- ============================================
-- 11. PROJECT MEMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID REFERENCES shared_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  can_edit BOOLEAN DEFAULT TRUE,
  can_invite BOOLEAN DEFAULT FALSE,
  notification_level TEXT DEFAULT 'all' CHECK (notification_level IN ('all', 'mentions', 'none')),
  is_starred BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);

-- ============================================
-- 12. NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mention', 'reply', 'dm', 'channel_invite', 'project_invite', 'file_shared', 'reaction', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  project_id UUID REFERENCES shared_projects(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- 13. ACTIVITY FEED
-- ============================================

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  project_id UUID REFERENCES shared_projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_lab_id ON activity_feed(lab_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor_id ON activity_feed(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);

-- ============================================
-- 14. BOOKMARKS
-- ============================================

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('message', 'file', 'project', 'channel')),
  item_id UUID NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_user_id_item_type_item_id_key'
  ) THEN
    ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_user_id_item_type_item_id_key UNIQUE(user_id, item_type, item_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist and recreate
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_channels_updated_at ON chat_channels;
CREATE TRIGGER update_chat_channels_updated_at BEFORE UPDATE ON chat_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shared_projects_updated_at ON shared_projects;
CREATE TRIGGER update_shared_projects_updated_at BEFORE UPDATE ON shared_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Increment message count in channel
CREATE OR REPLACE FUNCTION increment_channel_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_channels
  SET message_count = message_count + 1,
      last_message_at = NEW.created_at
  WHERE id = NEW.channel_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_message_count ON chat_messages;
CREATE TRIGGER increment_message_count AFTER INSERT ON chat_messages FOR EACH ROW EXECUTE FUNCTION increment_channel_message_count();

-- Function: Update thread reply count
CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    UPDATE chat_messages
    SET reply_count = reply_count + 1,
        last_reply_at = NEW.created_at,
        reply_users = array_append(
          COALESCE(reply_users, ARRAY[]::UUID[]),
          NEW.user_id
        )
    WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_thread_count ON chat_messages;
CREATE TRIGGER update_thread_count AFTER INSERT ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_thread_reply_count();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view team members in their lab" ON team_members;
DROP POLICY IF EXISTS "Users can update their own team profile" ON team_members;
DROP POLICY IF EXISTS "Users can view channels they're members of" ON chat_channels;
DROP POLICY IF EXISTS "Users can create channels in their lab" ON chat_channels;
DROP POLICY IF EXISTS "Users can view messages in their channels" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their channels" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view their DMs" ON direct_messages;
DROP POLICY IF EXISTS "Users can send DMs" ON direct_messages;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view files in their channels" ON shared_files;
DROP POLICY IF EXISTS "Users can upload files to their channels" ON shared_files;
DROP POLICY IF EXISTS "Users can view projects they're members of" ON shared_projects;
DROP POLICY IF EXISTS "Project members can view membership" ON project_members;

-- RLS Policies: Team Members
CREATE POLICY "Users can view team members in their lab" ON team_members FOR SELECT USING (
  lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own team profile" ON team_members FOR UPDATE USING (
  user_id = auth.uid()
);

-- RLS Policies: Chat Channels
CREATE POLICY "Users can view channels they're members of" ON chat_channels FOR SELECT USING (
  id IN (SELECT channel_id FROM channel_members WHERE user_id = auth.uid())
  OR type = 'public'
  OR created_by = auth.uid()
);

CREATE POLICY "Users can create channels in their lab" ON chat_channels FOR INSERT WITH CHECK (
  lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
);

-- RLS Policies: Chat Messages
CREATE POLICY "Users can view messages in their channels" ON chat_messages FOR SELECT USING (
  channel_id IN (SELECT channel_id FROM channel_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can send messages to their channels" ON chat_messages FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  channel_id IN (SELECT channel_id FROM channel_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own messages" ON chat_messages FOR UPDATE USING (
  user_id = auth.uid()
);

-- RLS Policies: Direct Messages
CREATE POLICY "Users can view their DMs" ON direct_messages FOR SELECT USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);

CREATE POLICY "Users can send DMs" ON direct_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
);

-- RLS Policies: Notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (
  user_id = auth.uid()
);

-- RLS Policies: Shared Files
CREATE POLICY "Users can view files in their channels" ON shared_files FOR SELECT USING (
  channel_id IN (SELECT channel_id FROM channel_members WHERE user_id = auth.uid())
  OR uploaded_by = auth.uid()
);

CREATE POLICY "Users can upload files to their channels" ON shared_files FOR INSERT WITH CHECK (
  uploaded_by = auth.uid() AND
  channel_id IN (SELECT channel_id FROM channel_members WHERE user_id = auth.uid())
);

-- RLS Policies: Projects
CREATE POLICY "Users can view projects they're members of" ON shared_projects FOR SELECT USING (
  id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  OR owner_id = auth.uid()
  OR visibility = 'public'
);

CREATE POLICY "Project members can view membership" ON project_members FOR SELECT USING (
  project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Lab IQ Collaboration System v2 migration completed successfully!';
  RAISE NOTICE '📊 14 tables created/verified';
  RAISE NOTICE '🔒 RLS policies applied';
  RAISE NOTICE '⚡ Indexes optimized';
  RAISE NOTICE '🎉 Ready to use!';
END $$;
