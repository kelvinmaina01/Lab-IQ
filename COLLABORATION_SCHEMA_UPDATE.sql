-- =====================================================================
-- LAB-IQ COLLABORATION SYSTEM - SCHEMA UPDATE
-- =====================================================================
-- This file adds missing columns to the chat_channels table
-- Run this in Supabase SQL Editor AFTER running COLLABORATION_COMPLETE_SCHEMA.sql
-- =====================================================================

-- Add display_name column to chat_channels table
ALTER TABLE chat_channels
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add is_private column to chat_channels table
ALTER TABLE chat_channels
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Add archived_at column for soft deletes
ALTER TABLE chat_channels
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Update existing channels to have display_name same as name
UPDATE chat_channels
SET display_name = name
WHERE display_name IS NULL;

-- Update metadata column type if needed
ALTER TABLE chat_channels
ALTER COLUMN type TYPE TEXT;

-- Update type constraint to include new types
ALTER TABLE chat_channels
DROP CONSTRAINT IF EXISTS chat_channels_type_check;

ALTER TABLE chat_channels
ADD CONSTRAINT chat_channels_type_check
CHECK (type IN ('general', 'project', 'announcement', 'private', 'direct'));

-- Create channel_members table for private channel access control
CREATE TABLE IF NOT EXISTS channel_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, team_member_id)
);

-- Create index for channel_members
CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_team_member ON channel_members(team_member_id);

-- Update chat_read_receipts to use team_member_id instead of user_id
-- First, check if the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'chat_read_receipts'
    AND column_name = 'user_id'
  ) THEN
    -- Drop the old constraint
    ALTER TABLE chat_read_receipts
    DROP CONSTRAINT IF EXISTS chat_read_receipts_pkey;

    -- Add new column
    ALTER TABLE chat_read_receipts
    ADD COLUMN IF NOT EXISTS team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE;

    -- Migrate data: Find team_member_id for each user_id
    UPDATE chat_read_receipts crr
    SET team_member_id = tm.id
    FROM team_members tm
    WHERE crr.user_id = tm.user_id;

    -- Drop old column
    ALTER TABLE chat_read_receipts
    DROP COLUMN IF EXISTS user_id;

    -- Add new primary key
    ALTER TABLE chat_read_receipts
    ADD PRIMARY KEY (channel_id, team_member_id);
  END IF;
END $$;

-- Update chat_read_receipts to include last_read_at timestamp
ALTER TABLE chat_read_receipts
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create RLS policies for channel_members table
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of channels they belong to"
  ON channel_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.id = team_member_id
    )
  );

CREATE POLICY "Channel owners can manage members"
  ON channel_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM channel_members cm
      JOIN team_members tm ON cm.team_member_id = tm.id
      WHERE cm.channel_id = channel_members.channel_id
      AND tm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
  );

-- =====================================================================
-- SUCCESS MESSAGE
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Schema update completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Added columns:';
  RAISE NOTICE '  - chat_channels.display_name';
  RAISE NOTICE '  - chat_channels.is_private';
  RAISE NOTICE '  - chat_channels.archived_at';
  RAISE NOTICE '';
  RAISE NOTICE 'Created table:';
  RAISE NOTICE '  - channel_members';
  RAISE NOTICE '';
  RAISE NOTICE '✅ You can now create channels with the new UI!';
END $$;
