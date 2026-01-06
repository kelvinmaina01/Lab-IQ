-- =============================================================================
-- ADVANCED NOTIFICATIONS - DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- =============================================================================

-- 1. Add new columns to notification_preferences table
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS slack_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS slack_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS email_on_system_health BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS snooze_until TIMESTAMP WITH TIME ZONE;

-- 2. Add index for snooze queries
CREATE INDEX IF NOT EXISTS idx_notification_preferences_snooze 
ON notification_preferences(user_id, snooze_until) 
WHERE snooze_until IS NOT NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Advanced notification columns added successfully!';
    RAISE NOTICE 'New columns: email_enabled, slack_enabled, slack_webhook_url, email_on_system_health, snooze_until';
END $$;
