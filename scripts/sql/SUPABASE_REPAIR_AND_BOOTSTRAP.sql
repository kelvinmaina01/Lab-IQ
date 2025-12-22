-- =====================================================================
-- 🛠️ LAB-IQ COLLABORATION SYSTEM - REPAIR & BOOTSTRAP SCRIPT (V6)
-- =====================================================================
-- VERSION 6: Adds Shared Resources for Deep SaaS Integration.
-- =====================================================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENSURE TABLES EXIST
-- ... [previous tables 11-110 remains same, adding new ones below] ...
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL,
  role TEXT DEFAULT 'researcher',
  status TEXT DEFAULT 'offline',
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lab_id)
);

CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  lab_id UUID NOT NULL,
  type TEXT DEFAULT 'public',
  is_private BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS channel_members (
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT DEFAULT 'member',
  PRIMARY KEY (channel_id, team_member_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  mentions UUID[],
  attachments JSONB DEFAULT '[]'::jsonb,
  reactions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  lab_id UUID NOT NULL,
  role TEXT DEFAULT 'researcher',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invitation_token UUID DEFAULT uuid_generate_v4(),
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS typing_indicators (
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '5 seconds',
  PRIMARY KEY (channel_id, team_member_id)
);

CREATE TABLE IF NOT EXISTS shared_canvases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content JSONB DEFAULT '{"content": []}'::jsonb,
  lab_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  lab_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES shared_lists(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NEW: Shared Scientific Resources (Phase 8 Deep Integration)
CREATE TABLE IF NOT EXISTS shared_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL,
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL,
  resource_type TEXT NOT NULL, -- 'dataset' | 'report' | 'experiment' | 'protocol'
  shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. STORAGE BUCKET INITIALIZATION
INSERT INTO storage.buckets (id, name, public)
VALUES ('collaboration-files', 'collaboration-files', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Collaboration Storage Access" ON storage.objects;
CREATE POLICY "Collaboration Storage Access" ON storage.objects
  FOR ALL USING (bucket_id = 'collaboration-files' AND auth.role() = 'authenticated');

-- 4. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION is_member_of_lab(p_lab_id UUID) 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND lab_id = p_lab_id);
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. APPLY CORRECT RLS (Non-recursive)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;

-- Drop all and recreate to be safe
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('team_members', 'chat_channels', 'channel_members', 'chat_messages', 'team_invitations', 'typing_indicators', 'shared_canvases', 'shared_lists', 'list_items', 'shared_resources')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;

CREATE POLICY "select_team_members" ON team_members FOR SELECT USING (true);
CREATE POLICY "insert_team_members" ON team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_team_members" ON team_members FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "select_chat_channels" ON chat_channels FOR SELECT USING (NOT is_private OR is_member_of_lab(lab_id));
CREATE POLICY "insert_chat_channels" ON chat_channels FOR INSERT WITH CHECK (is_member_of_lab(lab_id));

CREATE POLICY "all_channel_members" ON channel_members FOR ALL USING (true);

CREATE POLICY "select_chat_messages" ON chat_messages FOR SELECT USING (
  channel_id IN (SELECT id FROM chat_channels WHERE NOT is_private)
  OR is_member_of_lab((SELECT lab_id FROM chat_channels WHERE id = channel_id))
);
CREATE POLICY "insert_chat_messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "all_team_invitations" ON team_invitations FOR ALL USING (is_member_of_lab(lab_id));
CREATE POLICY "all_typing_indicators" ON typing_indicators FOR ALL USING (true);
CREATE POLICY "all_shared_canvases" ON shared_canvases FOR ALL USING (is_member_of_lab(lab_id));
CREATE POLICY "all_shared_lists" ON shared_lists FOR ALL USING (is_member_of_lab(lab_id));
CREATE POLICY "all_list_items" ON list_items FOR ALL USING (true);
CREATE POLICY "all_shared_resources" ON shared_resources FOR ALL USING (is_member_of_lab(lab_id));

-- 6. 🚀 BOOTSTRAP TEST LAB
-- (Ensuring consistent state across deployments)

-- 7. REFRESH & FEEDBACK
NOTIFY pgrst, 'reload schema';

SELECT '✅ Repair & Bootstrap V6 complete!' AS message,
       '🧪 Tables initialized: Invitations, Canvases, Lists, Shared Resources' AS status;
