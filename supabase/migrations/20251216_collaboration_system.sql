-- ============================================
-- LAB IQ COLLABORATION SYSTEM (Slack-like)
-- Migration: Complete collaboration infrastructure
-- Date: 2025-12-16
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TEAM MANAGEMENT (Like Slack Workspaces)
-- ============================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lab_id UUID, -- Your lab/organization identifier
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  display_name TEXT,
  title TEXT, -- e.g., "Senior Researcher", "Lab Analyst"
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  status_message TEXT, -- Custom status like "In meeting until 3pm"
  status_emoji TEXT, -- e.g., "🔬", "🧪", "📊"
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lab_id)
);

CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_lab_id ON team_members(lab_id);
CREATE INDEX idx_team_members_status ON team_members(status);

-- ============================================
-- 2. TEAM INVITATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  lab_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'guest')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invitation_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT, -- Personal message from inviter
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_team_invitations_lab_id ON team_invitations(lab_id);
CREATE INDEX idx_team_invitations_token ON team_invitations(invitation_token);

-- ============================================
-- 3. CHAT CHANNELS (Like Slack Channels)
-- ============================================

CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL,
  name TEXT NOT NULL, -- e.g., "general", "experiments", "qc-results"
  display_name TEXT NOT NULL, -- e.g., "General Discussion", "Experiment Planning"
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('public', 'private', 'direct', 'project')),
  project_id UUID, -- Link to specific project/experiment
  dataset_id UUID, -- Link to specific dataset
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE, -- Auto-join for new members
  topic TEXT, -- Current channel topic
  pinned_message_ids UUID[], -- Array of pinned message IDs
  settings JSONB DEFAULT '{
    "allowThreads": true,
    "allowReactions": true,
    "allowFileUploads": true,
    "retentionDays": null,
    "slowModeSeconds": 0
  }'::jsonb,
  member_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lab_id, name)
);

CREATE INDEX idx_chat_channels_lab_id ON chat_channels(lab_id);
CREATE INDEX idx_chat_channels_type ON chat_channels(type);
CREATE INDEX idx_chat_channels_project_id ON chat_channels(project_id);
CREATE INDEX idx_chat_channels_archived ON chat_channels(is_archived);

-- ============================================
-- 4. CHANNEL MEMBERS (Who can see what)
-- ============================================

CREATE TABLE IF NOT EXISTS channel_members (
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  notification_level TEXT DEFAULT 'all' CHECK (notification_level IN ('all', 'mentions', 'none')),
  is_muted BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE, -- Star important channels
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_message_id UUID,
  unread_count INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

CREATE INDEX idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX idx_channel_members_channel_id ON channel_members(channel_id);

-- ============================================
-- 5. CHAT MESSAGES (Like Slack Messages)
-- ============================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE, -- For threading
  thread_id UUID, -- Root message of thread
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'code', 'file', 'system')),
  formatted_content JSONB, -- Rich text formatting (bold, italic, links, etc.)
  mentions UUID[], -- Array of mentioned user IDs
  mentioned_channels UUID[], -- Array of mentioned channel IDs
  attachments JSONB DEFAULT '[]'::jsonb, -- File attachments
  metadata JSONB DEFAULT '{}'::jsonb, -- For experiment links, dataset refs, etc.

  -- Slack-like features
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_system_message BOOLEAN DEFAULT FALSE, -- e.g., "User joined channel"

  -- Thread metadata
  reply_count INTEGER DEFAULT 0,
  reply_users UUID[], -- Users who replied to this thread
  last_reply_at TIMESTAMP WITH TIME ZONE,

  -- Reactions
  reactions JSONB DEFAULT '{}'::jsonb, -- {"👍": ["user1", "user2"], "🔬": ["user3"]}
  reaction_count INTEGER DEFAULT 0,

  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_parent_id ON chat_messages(parent_id);
CREATE INDEX idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_mentions ON chat_messages USING GIN(mentions);

-- Full-text search for messages
CREATE INDEX idx_chat_messages_content_search ON chat_messages USING GIN(to_tsvector('english', content));

-- ============================================
-- 6. DIRECT MESSAGES (DMs)
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

CREATE INDEX idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX idx_direct_messages_created_at ON direct_messages(created_at DESC);
CREATE INDEX idx_direct_messages_unread ON direct_messages(recipient_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- 7. TYPING INDICATORS (Real-time)
-- ============================================

CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 seconds'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

CREATE INDEX idx_typing_indicators_channel ON typing_indicators(channel_id);
CREATE INDEX idx_typing_indicators_expires ON typing_indicators(expires_at);

-- ============================================
-- 8. PRESENCE TRACKING (Online/Away/Offline)
-- ============================================

CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active_channel_id UUID REFERENCES chat_channels(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_presence_status ON user_presence(status);
CREATE INDEX idx_user_presence_last_seen ON user_presence(last_seen);

-- ============================================
-- 9. SHARED FILES (File Management)
-- ============================================

CREATE TABLE IF NOT EXISTS shared_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL,
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type
  file_size BIGINT NOT NULL, -- bytes
  file_category TEXT CHECK (file_category IN ('image', 'document', 'spreadsheet', 'presentation', 'code', 'data', 'other')),
  storage_path TEXT NOT NULL, -- Supabase Storage path
  thumbnail_path TEXT, -- For images/videos
  download_url TEXT,

  -- Lab-specific metadata
  experiment_id UUID,
  dataset_id UUID,
  is_result_file BOOLEAN DEFAULT FALSE, -- Is this an experiment result?

  -- File metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  download_count INTEGER DEFAULT 0,

  -- Versioning
  version INTEGER DEFAULT 1,
  parent_file_id UUID REFERENCES shared_files(id) ON DELETE SET NULL,

  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shared_files_lab_id ON shared_files(lab_id);
CREATE INDEX idx_shared_files_channel_id ON shared_files(channel_id);
CREATE INDEX idx_shared_files_uploaded_by ON shared_files(uploaded_by);
CREATE INDEX idx_shared_files_experiment_id ON shared_files(experiment_id);
CREATE INDEX idx_shared_files_created_at ON shared_files(created_at DESC);

-- ============================================
-- 10. SHARED PROJECTS (Project Collaboration)
-- ============================================

CREATE TABLE IF NOT EXISTS shared_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'team')),

  -- Lab-specific
  experiment_ids UUID[], -- Linked experiments
  dataset_ids UUID[], -- Linked datasets
  protocol_ids UUID[],

  -- Project metadata
  tags TEXT[],
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),

  -- Collaboration stats
  member_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  file_count INTEGER DEFAULT 0,

  -- Default channel for project
  default_channel_id UUID REFERENCES chat_channels(id) ON DELETE SET NULL,

  archived_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shared_projects_lab_id ON shared_projects(lab_id);
CREATE INDEX idx_shared_projects_owner_id ON shared_projects(owner_id);
CREATE INDEX idx_shared_projects_status ON shared_projects(status);

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

CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);

-- ============================================
-- 12. NOTIFICATIONS (Like Slack Notifications)
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mention', 'reply', 'dm', 'channel_invite', 'project_invite', 'file_shared', 'reaction', 'system')),
  title TEXT NOT NULL,
  message TEXT,

  -- Links to source
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  project_id UUID REFERENCES shared_projects(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who triggered this

  metadata JSONB DEFAULT '{}'::jsonb,

  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- 13. ACTIVITY FEED (Timeline)
-- ============================================

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'joined', 'uploaded', etc.
  entity_type TEXT NOT NULL, -- 'message', 'file', 'project', 'channel', etc.
  entity_id UUID,
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  project_id UUID REFERENCES shared_projects(id) ON DELETE CASCADE,

  description TEXT NOT NULL, -- Human-readable description
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_feed_lab_id ON activity_feed(lab_id);
CREATE INDEX idx_activity_feed_actor_id ON activity_feed(actor_id);
CREATE INDEX idx_activity_feed_created_at ON activity_feed(created_at DESC);

-- ============================================
-- 14. BOOKMARKS/SAVED ITEMS (Like Slack Saved Items)
-- ============================================

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('message', 'file', 'project', 'channel')),
  item_id UUID NOT NULL,
  note TEXT, -- Personal note about why it's bookmarked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);

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

-- Apply to all tables with updated_at
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_channels_updated_at BEFORE UPDATE ON chat_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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

CREATE TRIGGER update_thread_count AFTER INSERT ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_thread_reply_count();

-- Function: Clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Create activity feed entry
CREATE OR REPLACE FUNCTION create_activity_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Add activity feed logic here based on trigger
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
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
-- SEED DATA (Default Channels)
-- ============================================

-- Function to create default channels for new labs
CREATE OR REPLACE FUNCTION create_default_channels(p_lab_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- General channel
  INSERT INTO chat_channels (lab_id, name, display_name, description, type, created_by, is_default)
  VALUES (p_lab_id, 'general', '# general', 'General lab discussion', 'public', p_user_id, TRUE);

  -- Random channel (like Slack's random)
  INSERT INTO chat_channels (lab_id, name, display_name, description, type, created_by, is_default)
  VALUES (p_lab_id, 'random', '# random', 'Non-work related chat', 'public', p_user_id, TRUE);

  -- Experiments channel
  INSERT INTO chat_channels (lab_id, name, display_name, description, type, created_by, is_default)
  VALUES (p_lab_id, 'experiments', '# experiments', 'Discuss ongoing experiments', 'public', p_user_id, TRUE);

  -- Results channel
  INSERT INTO chat_channels (lab_id, name, display_name, description, type, created_by, is_default)
  VALUES (p_lab_id, 'results', '# results', 'Share and discuss results', 'public', p_user_id, TRUE);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE team_members IS 'Lab team members with presence and status (Slack-like workspace members)';
COMMENT ON TABLE chat_channels IS 'Communication channels for teams (like Slack channels)';
COMMENT ON TABLE chat_messages IS 'All chat messages with threading, reactions, and mentions';
COMMENT ON TABLE direct_messages IS 'Private 1-on-1 conversations';
COMMENT ON TABLE typing_indicators IS 'Real-time typing indicators for channels';
COMMENT ON TABLE user_presence IS 'User online/offline status tracking';
COMMENT ON TABLE shared_files IS 'File sharing and storage metadata';
COMMENT ON TABLE shared_projects IS 'Collaborative lab projects';
COMMENT ON TABLE notifications IS 'User notifications for mentions, replies, etc.';
COMMENT ON TABLE activity_feed IS 'Lab-wide activity timeline';
COMMENT ON TABLE bookmarks IS 'User-saved messages, files, and resources';
