-- =====================================================================
-- DATABASE HEALTH CHECK - Complete Analysis
-- =====================================================================
-- Run this to see what tables exist and what's missing
-- =====================================================================

-- 1. List ALL tables in the public schema
SELECT
    'EXISTING TABLES' as check_type,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check for REQUIRED tables that might be missing
SELECT
    'MISSING TABLES CHECK' as check_type,
    table_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables t
            WHERE t.table_schema = 'public' AND t.table_name = required_tables.table_name
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (VALUES
    ('datasets'),
    ('dataset_columns'),
    ('dataset_rows'),
    ('dataset_quality'),
    ('notifications'),
    ('team_members'),
    ('team_invitations'),
    ('chat_channels'),
    ('chat_messages'),
    ('chat_typing'),
    ('chat_read_receipts'),
    ('channel_members'),
    ('shared_projects'),
    ('project_members'),
    ('shared_files'),
    ('file_access_log'),
    ('collaboration_activity'),
    ('device_streams'),
    ('activities'),
    ('usage_stats')
) AS required_tables(table_name)
ORDER BY status DESC, table_name;

-- 3. Check datasets table structure
SELECT
    'DATASETS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'datasets'
ORDER BY ordinal_position;

-- 4. Check for duplicate RLS policies
SELECT
    'RLS POLICIES CHECK' as check_type,
    schemaname,
    tablename,
    policyname,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename, policyname
HAVING COUNT(*) > 1
ORDER BY tablename, policyname;

-- 5. Check RLS status on important tables
SELECT
    'RLS STATUS' as check_type,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN ('datasets', 'team_members', 'chat_channels', 'chat_messages', 'shared_files', 'notifications')
ORDER BY tablename;

-- 6. Check for indexes
SELECT
    'INDEXES CHECK' as check_type,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('datasets', 'chat_channels', 'chat_messages', 'team_members')
ORDER BY tablename, indexname;

-- Summary report
DO $$
DECLARE
    table_count INTEGER;
    missing_count INTEGER;
BEGIN
    -- Count existing tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public';

    -- Count missing required tables
    SELECT COUNT(*) INTO missing_count
    FROM (VALUES
        ('datasets'), ('notifications'), ('team_members'), ('chat_channels'),
        ('chat_messages'), ('shared_files'), ('collaboration_activity')
    ) AS required_tables(table_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.tables t
        WHERE t.table_schema = 'public' AND t.table_name = required_tables.table_name
    );

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 DATABASE HEALTH CHECK SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total tables in public schema: %', table_count;
    RAISE NOTICE 'Missing required tables: %', missing_count;
    RAISE NOTICE '';

    IF missing_count = 0 THEN
        RAISE NOTICE '✅ All required tables exist!';
    ELSE
        RAISE NOTICE '⚠️  Some tables are missing - check results above';
    END IF;

    RAISE NOTICE '========================================';
END $$;
