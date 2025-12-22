-- Auto-trigger LabAI bot when @LabAI is mentioned
-- This uses Supabase's http extension to call the edge function

-- 1. Enable http extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- 2. Create function to trigger bot
CREATE OR REPLACE FUNCTION trigger_labai_bot()
RETURNS TRIGGER AS $$
DECLARE
  bot_url TEXT;
  response extensions.http_response;
BEGIN
  -- Only trigger if message contains @LabAI (case insensitive)
  IF NEW.content ~* '@labai' AND NEW.is_bot IS NOT TRUE THEN
    
    -- Construct edge function URL
    bot_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/chat-bot-ai';
    
    -- If supabase_url not set, use default
    IF bot_url IS NULL OR bot_url = '/functions/v1/chat-bot-ai' THEN
      bot_url := 'https://engqgzznccvoqeiiuchn.supabase.co/functions/v1/chat-bot-ai';
    END IF;
    
    -- Call edge function asynchronously using pg_net (Supabase's async http)
    PERFORM net.http_post(
      url := bot_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'token'
      ),
      body := jsonb_build_object(
        'message', NEW.content,
        'channelId', NEW.channel_id::text,
        'userId', NEW.user_id::text,
        'history', '[]'::jsonb
      )
    );
    
    RAISE NOTICE 'LabAI bot triggered for message: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger
DROP TRIGGER IF EXISTS auto_trigger_labai ON chat_messages;
CREATE TRIGGER auto_trigger_labai
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_labai_bot();

-- Success
DO $$
BEGIN
  RAISE NOTICE '✅ LabAI auto-trigger installed!';
  RAISE NOTICE '📝 Bot will now respond automatically to @LabAI mentions';
END $$;
