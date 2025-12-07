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

-- Project Members (who can access what)
CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID REFERENCES shared_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{"read": true, "write": false, "delete": false}'::jsonb,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- Indexes
CREATE INDEX idx_shared_projects_lab ON shared_projects(lab_id);
CREATE INDEX idx_shared_projects_owner ON shared_projects(owner_id);
CREATE INDEX idx_shared_projects_status ON shared_projects(status);
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
