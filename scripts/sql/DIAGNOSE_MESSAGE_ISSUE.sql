-- Quick check for message sending issues
-- Run this in Supabase SQL Editor

-- 1. Check if chat_messages table exists
SELECT 'Table exists:' as check_type, EXISTS(
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'chat_messages'
) as result;

-- 2. Check RLS policies on chat_messages
SELECT 
  'RLS Policies' as check_type,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'chat_messages';

-- 3. Check if you're a team member
SELECT 
  'Your team_members record' as check_type,
  tm.*
FROM team_members tm
WHERE tm.user_id = auth.uid();

-- 4. Check chat channels
SELECT 
  'Available channels' as check_type,
  cc.*
FROM chat_channels cc
WHERE cc.lab_id IN (
  SELECT lab_id FROM team_members WHERE user_id = auth.uid()
);

-- 5. Test INSERT permission
DO $$
DECLARE
  test_channel_id UUID;
  test_user_id UUID := auth.uid();
BEGIN
  -- Get first channel
  SELECT id INTO test_channel_id 
  FROM chat_channels 
  WHERE lab_id IN (SELECT lab_id FROM team_members WHERE user_id = test_user_id)
  LIMIT 1;
  
  IF test_channel_id IS NOT NULL THEN
    -- Try inserting
    INSERT INTO chat_messages (channel_id, user_id, content)
    VALUES (test_channel_id, test_user_id, 'TEST MESSAGE - DELETE ME');
    
    RAISE NOTICE 'SUCCESS: Can insert messages';
    
    -- Clean up
    DELETE FROM chat_messages 
    WHERE content = 'TEST MESSAGE - DELETE ME' 
    AND user_id = test_user_id;
  ELSE
    RAISE NOTICE 'ERROR: No channels found for your user';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: Cannot insert - %', SQLERRM;
END $$;
