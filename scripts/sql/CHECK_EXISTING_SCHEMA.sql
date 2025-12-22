-- ============================================
-- DATABASE DIAGNOSTIC - CHECK WHAT EXISTS
-- Run this FIRST to see what you already have
-- ============================================

-- 1. Check which collaboration tables already exist
SELECT
    'EXISTING TABLES' as check_type,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'labs',
    'team_members',
    'team_invitations',
    'chat_channels',
    'channel_members',
    'chat_messages',
    'direct_messages',
    'typing_indicators',
    'user_presence',
    'shared_files',
    'shared_projects',
    'project_members',
    'notifications',
    'collaboration_activity',
    'bookmarks',
    'shared_resources',
    'shared_canvases',
    'shared_lists',
    'list_items',
    'comments',
    'read_receipts'
)
ORDER BY table_name;

-- 2. Check team_members table structure (CRITICAL)
SELECT
    'TEAM_MEMBERS COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'team_members'
ORDER BY ordinal_position;

-- 3. Check channel_members table structure (CRITICAL)
SELECT
    'CHANNEL_MEMBERS COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'channel_members'
ORDER BY ordinal_position;

-- 4. Check if labs table exists
SELECT
    'LABS TABLE' as check_type,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'labs') as exists;

-- 5. Check RLS policies on key tables
SELECT
    'RLS POLICIES' as check_type,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'team_members',
    'chat_channels',
    'channel_members',
    'chat_messages',
    'direct_messages'
)
GROUP BY tablename
ORDER BY tablename;

-- 6. Check storage buckets
SELECT
    'STORAGE BUCKETS' as check_type,
    name,
    public
FROM storage.buckets
ORDER BY name;

-- 7. Check for any existing data
SELECT 'DATA CHECK' as check_type, 'team_members' as table_name, COUNT(*) as row_count FROM team_members
UNION ALL
SELECT 'DATA CHECK', 'chat_channels', COUNT(*) FROM chat_channels
UNION ALL
SELECT 'DATA CHECK', 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'DATA CHECK', 'labs', COUNT(*) FROM labs WHERE EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'labs');

-- 8. Check your current user
SELECT
    'CURRENT USER' as check_type,
    auth.uid() as your_user_id,
    (SELECT COUNT(*) FROM team_members WHERE user_id = auth.uid()) as your_team_memberships;

-- 9. Check migration history (if you have migrations table)
SELECT
    'MIGRATION HISTORY' as check_type,
    version,
    name,
    executed_at
FROM supabase_migrations.schema_migrations
WHERE name LIKE '%collaboration%'
ORDER BY executed_at DESC
LIMIT 10;
