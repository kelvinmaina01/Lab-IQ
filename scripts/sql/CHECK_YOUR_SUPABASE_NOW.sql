-- ============================================
-- CHECK YOUR ACTUAL SUPABASE SCHEMAA
-- Copy this entire script and run in Supabase SQL Editor
-- This will show EXACTLY what you have right now
-- ============================================

-- 1. List ALL collaboration tables that exist
SELECT
    'EXISTING TABLES' as check_type,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%team%' OR
    table_name LIKE '%chat%' OR
    table_name LIKE '%collaboration%' OR
    table_name LIKE '%direct%' OR
    table_name LIKE '%message%' OR
    table_name LIKE '%channel%' OR
    table_name LIKE '%typing%' OR
    table_name LIKE '%notification%' OR
    table_name LIKE '%comment%' OR
    table_name LIKE '%shared%' OR
    table_name LIKE '%canvas%' OR
    table_name LIKE '%list%' OR
    table_name = 'labs'
  )
ORDER BY table_name;

-- 2. Check if CRITICAL tables exist
SELECT
    'CRITICAL TABLES CHECK' as check_type,
    'labs' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'labs') as exists
UNION ALL
SELECT 'CRITICAL TABLES CHECK', 'team_members', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members')
UNION ALL
SELECT 'CRITICAL TABLES CHECK', 'chat_channels', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_channels')
UNION ALL
SELECT 'CRITICAL TABLES CHECK', 'channel_members', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'channel_members')
UNION ALL
SELECT 'CRITICAL TABLES CHECK', 'chat_messages', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages')
UNION ALL
SELECT 'CRITICAL TABLES CHECK', 'direct_messages', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'direct_messages')
UNION ALL
SELECT 'CRITICAL TABLES CHECK', 'typing_indicators', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'typing_indicators')
UNION ALL
SELECT 'CRITICAL TABLES CHECK', 'notifications', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
UNION ALL
SELECT 'CRITICAL TABLES CHECK', 'shared_canvases', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'shared_canvases')
UNION ALL
SELECT 'CRITICAL TABLES CHECK', 'shared_lists', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'shared_lists');

-- 3. Check team_members structure (CRITICAL)
SELECT
    'TEAM_MEMBERS STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'team_members'
ORDER BY ordinal_position;

-- 4. Check if labs table has foreign key in team_members
SELECT
    'FOREIGN KEYS' as check_type,
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid::regclass::text IN ('team_members', 'chat_channels', 'channel_members', 'chat_messages')
ORDER BY conrelid::regclass::text;

-- 5. Check channel_members structure (CRITICAL)
SELECT
    'CHANNEL_MEMBERS STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'channel_members'
ORDER BY ordinal_position;

-- 6. Check RLS policies count
SELECT
    'RLS POLICIES COUNT' as check_type,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'labs', 'team_members', 'chat_channels', 'channel_members',
    'chat_messages', 'direct_messages', 'typing_indicators',
    'notifications', 'shared_canvases', 'shared_lists'
  )
GROUP BY tablename
ORDER BY tablename;

-- 7. Check your user's current state
SELECT
    'YOUR USER INFO' as check_type,
    auth.uid() as your_user_id,
    (SELECT COUNT(*) FROM team_members WHERE user_id = auth.uid()) as your_memberships,
    (SELECT lab_id FROM team_members WHERE user_id = auth.uid() LIMIT 1) as your_lab_id;

-- 8. Check if default lab exists
SELECT
    'DEFAULT LAB CHECK' as check_type,
    id,
    name,
    description
FROM labs
WHERE id = '00000000-0000-0000-0000-000000000001'
LIMIT 1;

-- 9. Check data counts
SELECT 'DATA COUNTS' as check_type, 'labs' as table_name, COUNT(*) as row_count
FROM labs
UNION ALL
SELECT 'DATA COUNTS', 'team_members', COUNT(*) FROM team_members
UNION ALL
SELECT 'DATA COUNTS', 'chat_channels', COUNT(*) FROM chat_channels
UNION ALL
SELECT 'DATA COUNTS', 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'DATA COUNTS', 'direct_messages', COUNT(*) FROM direct_messages WHERE EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'direct_messages');

-- 10. Check storage buckets
SELECT
    'STORAGE BUCKETS' as check_type,
    id,
    name,
    public,
    file_size_limit
FROM storage.buckets
WHERE name LIKE 'collaboration%'
ORDER BY name;

-- ============================================
-- SAVE THIS OUTPUT!
-- Copy all results and send them to me
-- ============================================
