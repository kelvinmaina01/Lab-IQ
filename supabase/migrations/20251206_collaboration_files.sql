-- Shared Files (metadata - actual files in Supabase Storage)
CREATE TABLE IF NOT EXISTS shared_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  size_bytes BIGINT NOT NULL,
  mime_type TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN ('dataset', 'report', 'code', 'image', 'document', 'other')),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES shared_projects(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL,
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES shared_files(id) ON DELETE SET NULL, -- For versioning
  description TEXT,
  tags TEXT[],
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- File Access Log (for audit)
CREATE TABLE IF NOT EXISTS file_access_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES shared_files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT CHECK (action IN ('view', 'download', 'edit', 'delete')),
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_shared_files_project ON shared_files(project_id);
CREATE INDEX idx_shared_files_lab ON shared_files(lab_id);
CREATE INDEX idx_shared_files_uploaded_by ON shared_files(uploaded_by);
CREATE INDEX idx_shared_files_category ON shared_files(category);
CREATE INDEX idx_file_access_log_file ON file_access_log(file_id);
CREATE INDEX idx_file_access_log_user ON file_access_log(user_id);
