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

-- Chat Messages Policies
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

-- Project Members Policies
CREATE POLICY "Users can view projects they are members of"
  ON shared_projects FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ) OR owner_id = auth.uid()
  );

-- Shared Files Policies
CREATE POLICY "Users can view files in projects they have access to"
  ON shared_files FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files to projects they are members of"
  ON shared_files FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Helper Functions
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

CREATE OR REPLACE FUNCTION can_access_project(p_user_id UUID, p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE user_id = p_user_id AND project_id = p_project_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
