-- ============================================
-- COLLABORATION SETUP & USER BOOTSTRAP
-- Run this in Supabase SQL Editor after running the migration
-- ============================================

-- Step 1: Ensure default lab exists
INSERT INTO labs (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Lab', 'Default lab for testing and development')
ON CONFLICT (id) DO UPDATE SET name = 'Default Lab';

-- Step 2: Add current user to default lab (REPLACE WITH YOUR USER ID)
-- To find your user ID, run: SELECT auth.uid();
INSERT INTO team_members (user_id, lab_id, role, display_name, status)
VALUES (
  auth.uid(), -- Your current user ID
  '00000000-0000-0000-0000-000000000001', -- Default lab
  'admin', -- Role
  'Lab Admin', -- Display name (change this)
  'online'
)
ON CONFLICT (user_id, lab_id) DO UPDATE
SET status = 'online', last_active = NOW();

-- Step 3: Create default channels
INSERT INTO chat_channels (lab_id, name, display_name, description, type, created_by)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'general', 'General', 'General discussion', 'general', auth.uid()),
  ('00000000-0000-0000-0000-000000000001', 'announcements', 'Announcements', 'Important announcements', 'announcement', auth.uid()),
  ('00000000-0000-0000-0000-000000000001', 'random', 'Random', 'Off-topic chat', 'general', auth.uid())
ON CONFLICT (lab_id, name) DO NOTHING;

-- Step 4: Verify setup
SELECT
  'Labs' as table_name,
  COUNT(*) as count
FROM labs
UNION ALL
SELECT
  'Team Members' as table_name,
  COUNT(*) as count
FROM team_members WHERE user_id = auth.uid()
UNION ALL
SELECT
  'Chat Channels' as table_name,
  COUNT(*) as count
FROM chat_channels
UNION ALL
SELECT
  'Your Team Member Record' as table_name,
  COUNT(*) as count
FROM team_members WHERE user_id = auth.uid() AND lab_id = '00000000-0000-0000-0000-000000000001';

-- Step 5: Check your user ID (you'll need this)
SELECT
  auth.uid() as your_user_id,
  (SELECT COUNT(*) FROM team_members WHERE user_id = auth.uid()) as your_memberships,
  (SELECT COUNT(*) FROM labs) as total_labs;
