-- Fix missing message_count column in chat_channels
-- Run this in Supabase SQL Editor

-- Add missing column
ALTER TABLE chat_channels 
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_chat_channels_message_count 
ON chat_channels(message_count);

-- Update existing channels with current message counts
UPDATE chat_channels cc
SET message_count = (
    SELECT COUNT(*) 
    FROM chat_messages cm 
    WHERE cm.channel_id = cc.id
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Fixed chat_channels table - added message_count column';
END $$;
