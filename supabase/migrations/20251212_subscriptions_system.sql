-- =====================================================
-- SUBSCRIPTIONS SYSTEM MIGRATION
-- Creates or updates the subscriptions table with all required columns
-- =====================================================

-- First, check if table exists and add missing columns
DO $$
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
        CREATE TABLE public.subscriptions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            plan VARCHAR(50) NOT NULL DEFAULT 'free',
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            current_period_start TIMESTAMPTZ DEFAULT now(),
            current_period_end TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 year'),
            cancel_at_period_end BOOLEAN DEFAULT false,
            datasets_limit INTEGER DEFAULT 5,
            storage_limit_mb INTEGER DEFAULT 100,
            team_members_limit INTEGER DEFAULT 1,
            features JSONB DEFAULT '{}',
            stripe_customer_id VARCHAR(255),
            stripe_subscription_id VARCHAR(255),
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            UNIQUE(user_id)
        );
    ELSE
        -- Add missing columns to existing table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'plan') THEN
            ALTER TABLE public.subscriptions ADD COLUMN plan VARCHAR(50) NOT NULL DEFAULT 'free';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'status') THEN
            ALTER TABLE public.subscriptions ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'current_period_start') THEN
            ALTER TABLE public.subscriptions ADD COLUMN current_period_start TIMESTAMPTZ DEFAULT now();
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'current_period_end') THEN
            ALTER TABLE public.subscriptions ADD COLUMN current_period_end TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 year');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'cancel_at_period_end') THEN
            ALTER TABLE public.subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT false;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'datasets_limit') THEN
            ALTER TABLE public.subscriptions ADD COLUMN datasets_limit INTEGER DEFAULT 5;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'storage_limit_mb') THEN
            ALTER TABLE public.subscriptions ADD COLUMN storage_limit_mb INTEGER DEFAULT 100;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'team_members_limit') THEN
            ALTER TABLE public.subscriptions ADD COLUMN team_members_limit INTEGER DEFAULT 1;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'features') THEN
            ALTER TABLE public.subscriptions ADD COLUMN features JSONB DEFAULT '{}';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'stripe_customer_id') THEN
            ALTER TABLE public.subscriptions ADD COLUMN stripe_customer_id VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'stripe_subscription_id') THEN
            ALTER TABLE public.subscriptions ADD COLUMN stripe_subscription_id VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'created_at') THEN
            ALTER TABLE public.subscriptions ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'updated_at') THEN
            ALTER TABLE public.subscriptions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
        END IF;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

-- Create RLS policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.subscriptions TO authenticated;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON public.subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Create function to auto-create free subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, plan, status, datasets_limit, storage_limit_mb, team_members_limit, features)
    VALUES (
        NEW.id,
        'free',
        'active',
        5,
        100,
        1,
        '{"ai_models": 3, "analysis_modes": 1, "api_access": false, "priority_support": false}'::jsonb
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_subscription_updated_at();
