-- =====================================================
-- ADD PRO USER FOR TESTING
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, let's create a subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL DEFAULT 'free', -- free, pro, team, enterprise
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, cancelled, expired, trialing
    current_period_start TIMESTAMPTZ DEFAULT now(),
    current_period_end TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 year'),
    cancel_at_period_end BOOLEAN DEFAULT false,
    datasets_limit INTEGER DEFAULT 5,
    storage_limit_mb INTEGER DEFAULT 100,
    team_members_limit INTEGER DEFAULT 1,
    features JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

-- Create policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.subscriptions TO authenticated;

-- =====================================================
-- NOW ADD YOUR USER AS PRO
-- Replace the user_id below with your actual user ID
-- You can find your user ID in Supabase Auth > Users
-- =====================================================

-- Option 1: If you know your user_id, uncomment and run:
-- INSERT INTO public.subscriptions (user_id, plan, status, datasets_limit, storage_limit_mb, team_members_limit, features)
-- VALUES (
--     'YOUR_USER_ID_HERE',
--     'pro',
--     'active',
--     100,
--     10240, -- 10 GB in MB
--     5,
--     '{"ai_models": 16, "analysis_modes": 3, "api_access": true, "priority_support": true}'
-- )
-- ON CONFLICT (user_id) DO UPDATE SET
--     plan = 'pro',
--     status = 'active',
--     datasets_limit = 100,
--     storage_limit_mb = 10240,
--     team_members_limit = 5,
--     features = '{"ai_models": 16, "analysis_modes": 3, "api_access": true, "priority_support": true}',
--     current_period_end = now() + INTERVAL '1 year',
--     updated_at = now();

-- Option 2: Update ALL existing users to Pro (for testing only!)
-- WARNING: Only use this in development!
INSERT INTO public.subscriptions (user_id, plan, status, datasets_limit, storage_limit_mb, team_members_limit, features)
SELECT
    id as user_id,
    'pro' as plan,
    'active' as status,
    100 as datasets_limit,
    10240 as storage_limit_mb,
    5 as team_members_limit,
    '{"ai_models": 16, "analysis_modes": 3, "api_access": true, "priority_support": true}'::jsonb as features
FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET
    plan = 'pro',
    status = 'active',
    datasets_limit = 100,
    storage_limit_mb = 10240,
    team_members_limit = 5,
    features = '{"ai_models": 16, "analysis_modes": 3, "api_access": true, "priority_support": true}',
    current_period_end = now() + INTERVAL '1 year',
    updated_at = now();

-- Verify the subscription was created
SELECT
    s.user_id,
    u.email,
    s.plan,
    s.status,
    s.datasets_limit,
    s.storage_limit_mb,
    s.team_members_limit,
    s.current_period_end
FROM public.subscriptions s
JOIN auth.users u ON u.id = s.user_id;

-- =====================================================
-- SUCCESS!
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Pro subscription added successfully!';
    RAISE NOTICE 'You now have access to:';
    RAISE NOTICE '- 100 datasets';
    RAISE NOTICE '- 10 GB storage';
    RAISE NOTICE '- 5 team members';
    RAISE NOTICE '- 16+ AI models';
    RAISE NOTICE '- Priority support';
END $$;
