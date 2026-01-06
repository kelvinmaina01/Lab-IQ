-- ============================================
-- SCHEMA DIAGNOSTIC TOOL
-- Run this to see your actual database structure
-- ============================================

DO $$
DECLARE
  table_rec RECORD;
  col_rec RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 LAB IQ SCHEMA DIAGNOSTIC';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- List all collaboration-related tables
  RAISE NOTICE '📊 EXISTING TABLES:';
  RAISE NOTICE '----------------------------------------';

  FOR table_rec IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND (
      tablename LIKE '%team%' OR
      tablename LIKE '%chat%' OR
      tablename LIKE '%collab%' OR
      tablename LIKE '%project%' OR
      tablename LIKE '%file%' OR
      tablename LIKE '%activity%' OR
      tablename LIKE '%notification%'
    )
    ORDER BY tablename
  LOOP
    RAISE NOTICE '✓ %', table_rec.tablename;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 TABLE STRUCTURES:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Show structure of key tables
  RAISE NOTICE '🔹 team_members columns:';
  FOR col_rec IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'team_members'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '   - % (%)', col_rec.column_name, col_rec.data_type;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '🔹 channel_members columns:';
  FOR col_rec IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'channel_members'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '   - % (%)', col_rec.column_name, col_rec.data_type;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '🔹 chat_channels columns:';
  FOR col_rec IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'chat_channels'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '   - % (%)', col_rec.column_name, col_rec.data_type;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '🔹 chat_messages columns:';
  FOR col_rec IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'chat_messages'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '   - % (%)', col_rec.column_name, col_rec.data_type;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '🔹 shared_files columns:';
  FOR col_rec IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'shared_files'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '   - % (%)', col_rec.column_name, col_rec.data_type;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '🔹 shared_projects columns:';
  FOR col_rec IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'shared_projects'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '   - % (%)', col_rec.column_name, col_rec.data_type;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '🔹 project_members columns:';
  FOR col_rec IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'project_members'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '   - % (%)', col_rec.column_name, col_rec.data_type;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '🔹 notifications columns:';
  FOR col_rec IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'notifications'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '   - % (%)', col_rec.column_name, col_rec.data_type;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '🔹 collaboration_activity columns:';
  FOR col_rec IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'collaboration_activity'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '   - % (%)', col_rec.column_name, col_rec.data_type;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '🔹 typing_indicators (if exists):';
  FOR col_rec IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'typing_indicators'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '   - % (%)', col_rec.column_name, col_rec.data_type;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 INSTRUCTIONS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. Copy this entire output from the Supabase SQL Editor';
  RAISE NOTICE '2. Send it to Claude';
  RAISE NOTICE '3. I will create the perfect migration!';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
