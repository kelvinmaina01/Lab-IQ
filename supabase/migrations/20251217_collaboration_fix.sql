-- ============================================
-- LAB IQ COLLABORATION SYSTEM - SAFE FIX
-- Handles existing tables and adds missing columns
-- Date: 2025-12-17
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- FIX EXISTING TABLES (Add missing columns)
-- ============================================

-- Add missing columns to team_invitations if they don't exist
DO $$
BEGIN
  -- Add invitation_token if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_invitations' AND column_name = 'invitation_token'
  ) THEN
    ALTER TABLE team_invitations ADD COLUMN invitation_token TEXT;
    -- Add unique constraint
    ALTER TABLE team_invitations ADD CONSTRAINT team_invitations_invitation_token_key UNIQUE(invitation_token);
    -- Generate tokens for existing rows
    UPDATE team_invitations SET invitation_token = gen_random_uuid()::text WHERE invitation_token IS NULL;
    -- Make it NOT NULL
    ALTER TABLE team_invitations ALTER COLUMN invitation_token SET NOT NULL;
  END IF;

  -- Add email_sent_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_invitations' AND column_name = 'email_sent_at'
  ) THEN
    ALTER TABLE team_invitations ADD COLUMN email_sent_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add metadata if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_invitations' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE team_invitations ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add missing columns to team_members if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'title'
  ) THEN
    ALTER TABLE team_members ADD COLUMN title TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'status_message'
  ) THEN
    ALTER TABLE team_members ADD COLUMN status_message TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'status_emoji'
  ) THEN
    ALTER TABLE team_members ADD COLUMN status_emoji TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE team_members ADD COLUMN preferences JSONB DEFAULT '{
      "notifications": {
        "mentions": true,
        "directMessages": true,
        "channelMessages": false,
        "emailDigest": true
      },
      "theme": "system",
      "soundEnabled": true
    }'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE team_members ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
END $$;

-- Add missing columns to chat_channels if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_channels' AND column_name = 'is_private'
  ) THEN
    ALTER TABLE chat_channels ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_channels' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE chat_channels ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_channels' AND column_name = 'settings'
  ) THEN
    ALTER TABLE chat_channels ADD COLUMN settings JSONB DEFAULT '{
      "allowThreads": true,
      "allowReactions": true,
      "allowFileUploads": true,
      "retentionDays": null,
      "slowModeSeconds": 0
    }'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_channels' AND column_name = 'pinned_message_ids'
  ) THEN
    ALTER TABLE chat_channels ADD COLUMN pinned_message_ids UUID[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_channels' AND column_name = 'topic'
  ) THEN
    ALTER TABLE chat_channels ADD COLUMN topic TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_channels' AND column_name = 'is_default'
  ) THEN
    ALTER TABLE chat_channels ADD COLUMN is_default BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_channels' AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE chat_channels ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add missing columns to chat_messages if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'mentions'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN mentions UUID[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'mentioned_channels'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN mentioned_channels UUID[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'reply_count'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN reply_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'reply_users'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN reply_users UUID[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'last_reply_at'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN last_reply_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'reaction_count'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN reaction_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'is_system_message'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN is_system_message BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'formatted_content'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN formatted_content JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'content_type'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'code', 'file', 'system'));
  END IF;
END $$;

-- ============================================
-- CREATE NEW TABLES (Only if they don't exist)
-- ============================================

-- TYPING INDICATORS
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

-- USER PRESENCE
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active_channel_id UUID REFERENCES chat_channels(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

-- DIRECT MESSAGES
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

-- CHANNEL MEMBERS
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

-- PROJECT MEMBERS
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

-- BOOKMARKS
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
-- CREATE INDEXES (Only if they don't exist)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_lab_id ON team_invitations(lab_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(invitation_token);

CREATE INDEX IF NOT EXISTS idx_chat_messages_mentions ON chat_messages USING GIN(mentions);
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_search ON chat_messages USING GIN(to_tsvector('english', content));

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

-- Drop and recreate triggers
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

-- Create RLS policies
CREATE POLICY "Users can view team members in their lab" ON team_members FOR SELECT USING (
  lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own team profile" ON team_members FOR UPDATE USING (
  user_id = auth.uid()
);

CREATE POLICY "Users can view channels they're members of" ON chat_channels FOR SELECT USING (
  id IN (SELECT channel_id FROM channel_members WHERE user_id = auth.uid())
  OR type IN ('public', 'general')
  OR created_by = auth.uid()
);

CREATE POLICY "Users can create channels in their lab" ON chat_channels FOR INSERT WITH CHECK (
  lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())
);

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

CREATE POLICY "Users can view their DMs" ON direct_messages FOR SELECT USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);

CREATE POLICY "Users can send DMs" ON direct_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
);

CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (
  user_id = auth.uid()
);

CREATE POLICY "Users can view files in their channels" ON shared_files FOR SELECT USING (
  channel_id IN (SELECT channel_id FROM channel_members WHERE user_id = auth.uid())
  OR uploaded_by = auth.uid()
);

CREATE POLICY "Users can upload files to their channels" ON shared_files FOR INSERT WITH CHECK (
  uploaded_by = auth.uid() AND
  channel_id IN (SELECT channel_id FROM channel_members WHERE user_id = auth.uid())
);

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
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ COLLABORATION SYSTEM FIXED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Missing columns added';
  RAISE NOTICE '✓ New tables created';
  RAISE NOTICE '✓ Indexes optimized';
  RAISE NOTICE '✓ RLS policies applied';
  RAISE NOTICE '✓ Triggers configured';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Ready to use!';
  RAISE NOTICE '========================================';
END $$;
