-- Check what columns chat_channels actually has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_channels'
ORDER BY ordinal_position;

-- Check what columns team_members actually has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'team_members'
ORDER BY ordinal_position;

-- Check if labs table exists
SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'labs') as labs_exists;

-- Check all foreign keys on team_members
SELECT
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    a.attname as column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.contype = 'f'
  AND c.conrelid::regclass::text = 'team_members';
