-- Activity Feed (consolidated from existing activities table if needed)
CREATE TABLE IF NOT EXISTS collaboration_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('message', 'file_upload', 'file_download', 'member_invite', 'member_join', 'project_create', 'project_update', 'task_assign', 'comment')),
  entity_type TEXT, -- 'project', 'file', 'message', etc.
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb, -- {project_name, file_name, message, etc.}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_collaboration_activity_lab ON collaboration_activity(lab_id);
CREATE INDEX idx_collaboration_activity_user ON collaboration_activity(user_id);
CREATE INDEX idx_collaboration_activity_type ON collaboration_activity(type);
CREATE INDEX idx_collaboration_activity_created ON collaboration_activity(created_at DESC);
