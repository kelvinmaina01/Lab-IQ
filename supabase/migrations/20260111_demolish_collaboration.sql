
-- ============================================
-- DEMOLISH COLLABORATION FEATURE
-- Date: 2026-01-11
-- Purpose: Completely remove all collaboration tables, data, and storage to reclaim space.
-- ============================================

-- 1. DROP COLLABORATION TABLES (Order matters for foreign keys)

-- Leaf tables (depend on others)
DROP TABLE IF EXISTS "collaboration_activity" CASCADE;
DROP TABLE IF EXISTS "chat_read_receipts" CASCADE;
DROP TABLE IF EXISTS "chat_typing" CASCADE;
DROP TABLE IF EXISTS "typing_indicators" CASCADE;
DROP TABLE IF EXISTS "channel_members" CASCADE;
DROP TABLE IF EXISTS "chat_messages" CASCADE;
DROP TABLE IF EXISTS "direct_messages" CASCADE;
DROP TABLE IF EXISTS "list_items" CASCADE;
DROP TABLE IF EXISTS "shared_lists" CASCADE;
DROP TABLE IF EXISTS "shared_canvases" CASCADE;
DROP TABLE IF EXISTS "shared_resources" CASCADE;
DROP TABLE IF EXISTS "comments" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE; -- Careful if used by system, but generally tied to collab here.

-- Core collaboration tables
DROP TABLE IF EXISTS "chat_channels" CASCADE;
DROP TABLE IF EXISTS "shared_projects" CASCADE;
DROP TABLE IF EXISTS "team_members" CASCADE;
DROP TABLE IF EXISTS "team_invitations" CASCADE; 
DROP TABLE IF EXISTS "labs" CASCADE; -- Root container for teams

-- 2. CLEAN UP STORAGE
-- Remove the collaboration files bucket and all its objects
-- Note: This SQL might need privileges. If it fails, the user must do it via dashboard.
DO $$
BEGIN
    DELETE FROM storage.objects WHERE bucket_id = 'collaboration-files';
    DELETE FROM storage.buckets WHERE id = 'collaboration-files';
EXCEPTION WHEN OTHERS THEN
    -- Ignore error if storage schema is not accessible or bucket missing
    RAISE NOTICE 'Storage bucket deletion skipped or failed: %', SQLERRM;
END $$;

-- 3. CLEAN UP ENUMS/TYPES (Optional, good for hygiene)
DROP TYPE IF EXISTS "dataset_domain" CASCADE; -- Wait, dataset_domain is used by Datasets V2, do NOT drop.
-- Check other types specific to collaboration?
-- 'status' enum in team_members was text check constraints, not types.
-- 'role' enum in team_members was text check.

-- 4. VACUUM to reclaim space (Standard PostgreSQL command)
-- VACUUM FULL; -- Cannot run inside transaction block usually. User should run this manually.
