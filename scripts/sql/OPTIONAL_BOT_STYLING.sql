-- Optional: Add visual indicator column for bot messages
-- This helps the UI identify bot messages for special styling

-- Add bot styling metadata
UPDATE chat_messages 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('is_ai_response', true)
WHERE is_bot = true;

-- Create index for faster bot message queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_bot ON chat_messages(is_bot) WHERE is_bot = true;

-- Success
DO $$
BEGIN
  RAISE NOTICE '✅ Bot message styling metadata added';
END $$;
