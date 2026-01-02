-- =============================================================================
-- NOTIFICATIONS TABLE - SAFE MIGRATION (Handles existing objects)
-- Run this in Supabase SQL Editor
-- =============================================================================

-- Create notifications table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category TEXT DEFAULT 'general',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their notifications" ON notifications;

-- Create policies
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their notifications" ON notifications
    FOR DELETE USING (user_id = auth.uid());

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Notifications table setup complete!';
    RAISE NOTICE 'Table: notifications (with RLS enabled)';
    RAISE NOTICE 'Indexes: 5 indexes created';
    RAISE NOTICE 'Policies: 4 RLS policies active';
END $$;
