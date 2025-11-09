-- Create enum for subscription tiers
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'student');

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.subscription_tier NOT NULL DEFAULT 'free',
  storage_limit_mb INTEGER NOT NULL DEFAULT 200,
  max_datasets INTEGER NOT NULL DEFAULT 5,
  max_experiments INTEGER NOT NULL DEFAULT 10,
  max_automations INTEGER NOT NULL DEFAULT 3,
  max_collaborators INTEGER NOT NULL DEFAULT 2,
  ai_requests_per_month INTEGER NOT NULL DEFAULT 100,
  student_verified BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to get user subscription tier
CREATE OR REPLACE FUNCTION public.get_user_tier(user_id_param UUID)
RETURNS public.subscription_tier
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tier public.subscription_tier;
BEGIN
  SELECT tier INTO user_tier
  FROM public.subscriptions
  WHERE user_id = user_id_param;
  
  RETURN COALESCE(user_tier, 'free'::public.subscription_tier);
END;
$$;

-- Create function to check if user has pro access
CREATE OR REPLACE FUNCTION public.has_pro_access(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tier public.subscription_tier;
BEGIN
  SELECT tier INTO user_tier
  FROM public.subscriptions
  WHERE user_id = user_id_param;
  
  RETURN user_tier IN ('pro', 'student');
END;
$$;

-- Trigger to create default subscription on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier, storage_limit_mb, max_datasets, max_experiments, max_automations, max_collaborators, ai_requests_per_month)
  VALUES (NEW.id, 'free', 200, 5, 10, 3, 2, 100);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- Add storage usage tracking to datasets
ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS file_size_mb DECIMAL(10,2) DEFAULT 0;

-- Create usage tracking table
CREATE TABLE public.usage_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  storage_used_mb DECIMAL(10,2) DEFAULT 0,
  ai_requests_used INTEGER DEFAULT 0,
  datasets_count INTEGER DEFAULT 0,
  experiments_count INTEGER DEFAULT 0,
  automations_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage stats"
  ON public.usage_stats
  FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_stats_updated_at
  BEFORE UPDATE ON public.usage_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();