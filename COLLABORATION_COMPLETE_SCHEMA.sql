-- =====================================================================
-- LAB-IQ COLLABORATION SYSTEM - COMPLETE DATABASE SCHEMA
-- =====================================================================
-- Run this entire file in Supabase SQL Editor
-- Estimated time: ~30 seconds
-- =====================================================================

-- =====================================================================
-- PART 1: TEAM MANAGEMENT TABLES
-- =====================================================================

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'researcher', 'analyst', 'viewer')),
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline', 'busy')),
  display_name TEXT,
  avatar_url TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{"notifications": true, "email_digest": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lab_id)
);

-- Team Invitations
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'researcher', 'analyst', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lab_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for team tables
CREATE INDEX IF NOT EXISTS idx_team_members_lab ON team_members(lab_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);

-- =====================================================================
-- PART 2: CHAT SYSTEM TABLES
-- =====================================================================

-- Chat Channels (project-based or general)
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  lab_id UUID NOT NULL,
  type TEXT DEFAULT 'project' CHECK (type IN ('project', 'general', 'private', 'direct')),
  project_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  mentions UUID[],
  attachments JSONB DEFAULT '[]'::jsonb,
  reactions JSONB DEFAULT '{}'::jsonb,
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Typing Indicators
CREATE TABLE IF NOT EXISTS chat_typing (
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

-- Read Receipts
CREATE TABLE IF NOT EXISTS chat_read_receipts (
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

-- Indexes for chat tables
CREATE INDEX IF NOT EXISTS idx_chat_channels_lab ON chat_channels(lab_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_project ON chat_channels(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_parent ON chat_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_typing_channel ON chat_typing(channel_id);

-- =====================================================================
-- PART 3: PROJECT SHARING TABLES
-- =====================================================================

-- Shared Projects
CREATE TABLE IF NOT EXISTS shared_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lab_id UUID NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  visibility TEXT DEFAULT 'team' CHECK (visibility IN ('private', 'team', 'public')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Project Members
CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID REFERENCES shared_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{"read": true, "write": false, "delete": false}'::jsonb,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- Indexes for project tables
CREATE INDEX IF NOT EXISTS idx_shared_projects_lab ON shared_projects(lab_id);
CREATE INDEX IF NOT EXISTS idx_shared_projects_owner ON shared_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_projects_status ON shared_projects(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

-- =====================================================================
-- PART 4: FILE SHARING TABLES
-- =====================================================================

-- Shared Files
CREATE TABLE IF NOT EXISTS shared_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  mime_type TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN ('dataset', 'report', 'code', 'image', 'document', 'other')),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES shared_projects(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL,
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES shared_files(id) ON DELETE SET NULL,
  description TEXT,
  tags TEXT[],
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- File Access Log
CREATE TABLE IF NOT EXISTS file_access_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES shared_files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT CHECK (action IN ('view', 'download', 'edit', 'delete')),
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for file tables
CREATE INDEX IF NOT EXISTS idx_shared_files_project ON shared_files(project_id);
CREATE INDEX IF NOT EXISTS idx_shared_files_lab ON shared_files(lab_id);
CREATE INDEX IF NOT EXISTS idx_shared_files_uploaded_by ON shared_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_shared_files_category ON shared_files(category);
CREATE INDEX IF NOT EXISTS idx_file_access_log_file ON file_access_log(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_log_user ON file_access_log(user_id);

-- =====================================================================
-- PART 5: ACTIVITY FEED
-- =====================================================================

-- Collaboration Activity
CREATE TABLE IF NOT EXISTS collaboration_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('message', 'file_upload', 'file_download', 'member_invite', 'member_join', 'project_create', 'project_update', 'task_assign', 'comment')),
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for activity
CREATE INDEX IF NOT EXISTS idx_collaboration_activity_lab ON collaboration_activity(lab_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_activity_user ON collaboration_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_activity_type ON collaboration_activity(type);
CREATE INDEX IF NOT EXISTS idx_collaboration_activity_created ON collaboration_activity(created_at DESC);

-- =====================================================================
-- PART 6: TRIGGERS & FUNCTIONS
-- =====================================================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to team_members
DROP TRIGGER IF EXISTS team_members_updated_at ON team_members;
CREATE TRIGGER team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Helper function: Get user's lab ID
CREATE OR REPLACE FUNCTION get_user_lab_id(p_user_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT lab_id FROM team_members
    WHERE user_id = p_user_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check project access
CREATE OR REPLACE FUNCTION can_access_project(p_user_id UUID, p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE user_id = p_user_id AND project_id = p_project_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Log activity
CREATE OR REPLACE FUNCTION log_collaboration_activity(
  p_lab_id UUID,
  p_user_id UUID,
  p_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_metadata JSONB
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO collaboration_activity (
    lab_id, user_id, type, entity_type, entity_id, metadata
  ) VALUES (
    p_lab_id, p_user_id, p_type, p_entity_type, p_entity_id, p_metadata
  ) RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- PART 7: ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_activity ENABLE ROW LEVEL SECURITY;

-- Team Members Policies
DROP POLICY IF EXISTS "Users can view team members in their lab" ON team_members;
CREATE POLICY "Users can view team members in their lab"
  ON team_members FOR SELECT
  USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own team member record" ON team_members;
CREATE POLICY "Users can update their own team member record"
  ON team_members FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own team member record" ON team_members;
CREATE POLICY "Users can insert their own team member record"
  ON team_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Chat Channels Policies
DROP POLICY IF EXISTS "Users can view channels in their lab" ON chat_channels;
CREATE POLICY "Users can view channels in their lab"
  ON chat_channels FOR SELECT
  USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create channels in their lab" ON chat_channels;
CREATE POLICY "Users can create channels in their lab"
  ON chat_channels FOR INSERT
  WITH CHECK (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Chat Messages Policies
DROP POLICY IF EXISTS "Users can view messages in channels they have access to" ON chat_messages;
CREATE POLICY "Users can view messages in channels they have access to"
  ON chat_messages FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM chat_channels WHERE lab_id IN (
        SELECT lab_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can send messages to channels in their lab" ON chat_messages;
CREATE POLICY "Users can send messages to channels in their lab"
  ON chat_messages FOR INSERT
  WITH CHECK (
    channel_id IN (
      SELECT id FROM chat_channels WHERE lab_id IN (
        SELECT lab_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
CREATE POLICY "Users can update their own messages"
  ON chat_messages FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;
CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR DELETE
  USING (user_id = auth.uid());

-- Shared Projects Policies
DROP POLICY IF EXISTS "Users can view projects they are members of" ON shared_projects;
CREATE POLICY "Users can view projects they are members of"
  ON shared_projects FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ) OR owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create projects in their lab" ON shared_projects;
CREATE POLICY "Users can create projects in their lab"
  ON shared_projects FOR INSERT
  WITH CHECK (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Project Members Policies
DROP POLICY IF EXISTS "Users can view project members for their projects" ON project_members;
CREATE POLICY "Users can view project members for their projects"
  ON project_members FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Shared Files Policies
DROP POLICY IF EXISTS "Users can view files in projects they have access to" ON shared_files;
CREATE POLICY "Users can view files in projects they have access to"
  ON shared_files FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can upload files to projects they are members of" ON shared_files;
CREATE POLICY "Users can upload files to projects they are members of"
  ON shared_files FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own files" ON shared_files;
CREATE POLICY "Users can update their own files"
  ON shared_files FOR UPDATE
  USING (uploaded_by = auth.uid());

-- Collaboration Activity Policies
DROP POLICY IF EXISTS "Users can view activity in their lab" ON collaboration_activity;
CREATE POLICY "Users can view activity in their lab"
  ON collaboration_activity FOR SELECT
  USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create activity in their lab" ON collaboration_activity;
CREATE POLICY "Users can create activity in their lab"
  ON collaboration_activity FOR INSERT
  WITH CHECK (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- =====================================================================
-- VERIFICATION QUERIES (Run these after to verify)
-- =====================================================================

-- Check all tables were created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%team%'
    OR table_name LIKE '%chat%'
    OR table_name LIKE '%project%'
    OR table_name LIKE '%file%'
    OR table_name LIKE '%collaboration%'
  )
ORDER BY table_name;

-- Check indexes
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('team_members', 'chat_messages', 'shared_projects', 'shared_files', 'collaboration_activity')
ORDER BY tablename, indexname;

-- Check RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('team_members', 'chat_messages', 'shared_projects', 'shared_files')
ORDER BY tablename;

-- =====================================================================
-- SUCCESS MESSAGE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Collaboration system schema created successfully!';
  RAISE NOTICE '📊 Tables: team_members, chat_channels, chat_messages, shared_projects, shared_files, collaboration_activity';
  RAISE NOTICE '🔒 Row-Level Security: ENABLED on all tables';
  RAISE NOTICE '📈 Indexes: Created for optimal performance';
  RAISE NOTICE '⚙️ Functions: Helper functions ready';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Enable Realtime replication for: chat_messages, team_members, chat_typing';
  RAISE NOTICE '2. Create storage bucket: lab-iq-files (Private)';
  RAISE NOTICE '3. Run the verification queries above';
END $$;
