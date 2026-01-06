-- =====================================================
-- SETTINGS & USER PREFERENCES TABLES
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. USER PREFERENCES TABLE (for onboarding, theme, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_completed_at TIMESTAMPTZ,
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

-- Create policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- 2. LAB PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lab_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_type VARCHAR(50) DEFAULT 'clinical',
    profile_name VARCHAR(100),
    description TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.lab_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own lab profile" ON public.lab_profiles;
DROP POLICY IF EXISTS "Users can insert own lab profile" ON public.lab_profiles;
DROP POLICY IF EXISTS "Users can update own lab profile" ON public.lab_profiles;

-- Create policies
CREATE POLICY "Users can view own lab profile" ON public.lab_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lab profile" ON public.lab_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lab profile" ON public.lab_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 3. NOTIFICATION PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_on_action_assignment BOOLEAN DEFAULT true,
    email_on_bottleneck_detection BOOLEAN DEFAULT true,
    email_on_experiment_complete BOOLEAN DEFAULT true,
    email_on_data_quality_issues BOOLEAN DEFAULT true,
    push_notifications_enabled BOOLEAN DEFAULT true,
    bottleneck_threshold INTEGER DEFAULT 30,
    data_quality_threshold INTEGER DEFAULT 70,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;

-- Create policies
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. NOTIFICATIONS TABLE (inbox)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
    read BOOLEAN DEFAULT false,
    link VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- Create policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

-- 5. NEXT ACTIONS TABLE (for AI-suggested actions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.next_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    action_type VARCHAR(50) DEFAULT 'task', -- task, review, fix, optimize
    priority INTEGER DEFAULT 3, -- 1=highest, 5=lowest
    impact_percentage INTEGER DEFAULT 0,
    source VARCHAR(100), -- bottleneck, experiment, workflow, ai_suggestion
    source_id UUID,
    link VARCHAR(500),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.next_actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own next actions" ON public.next_actions;
DROP POLICY IF EXISTS "Users can insert own next actions" ON public.next_actions;
DROP POLICY IF EXISTS "Users can update own next actions" ON public.next_actions;
DROP POLICY IF EXISTS "Users can delete own next actions" ON public.next_actions;

-- Create policies
CREATE POLICY "Users can view own next actions" ON public.next_actions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own next actions" ON public.next_actions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own next actions" ON public.next_actions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own next actions" ON public.next_actions
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_next_actions_user_id ON public.next_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_next_actions_priority ON public.next_actions(user_id, priority, completed_at);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.lab_profiles TO authenticated;
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.next_actions TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Settings tables created successfully!';
    RAISE NOTICE 'Tables created: user_preferences, lab_profiles, notification_preferences, notifications, next_actions';
END $$;
