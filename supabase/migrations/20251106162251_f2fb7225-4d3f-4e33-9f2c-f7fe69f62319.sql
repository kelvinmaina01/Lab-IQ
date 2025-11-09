-- Create lab_profiles table to store user's selected lab profile
CREATE TABLE public.lab_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('clinical', 'drug-discovery', 'synthetic-bio', 'computational-genomics', 'university')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.lab_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own lab profile"
ON public.lab_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lab profile"
ON public.lab_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lab profile"
ON public.lab_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Create activities table for real activity tracking
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  item TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own activities"
ON public.activities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities"
ON public.activities FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create bottlenecks table for AI-identified bottlenecks
CREATE TABLE public.bottlenecks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_score INTEGER NOT NULL CHECK (impact_score >= 0 AND impact_score <= 100),
  suggested_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.bottlenecks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own bottlenecks"
ON public.bottlenecks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bottlenecks"
ON public.bottlenecks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bottlenecks"
ON public.bottlenecks FOR UPDATE
USING (auth.uid() = user_id);

-- Create predictive_insights table for AI predictions
CREATE TABLE public.predictive_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  estimated_days NUMERIC NOT NULL,
  confidence_interval NUMERIC NOT NULL,
  velocity_score INTEGER NOT NULL,
  pipeline_flow_score INTEGER NOT NULL,
  active_experiments_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.predictive_insights ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own predictive insights"
ON public.predictive_insights FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own predictive insights"
ON public.predictive_insights FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create next_actions table for prioritized tasks
CREATE TABLE public.next_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_percentage INTEGER NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Zap',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.next_actions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own next actions"
ON public.next_actions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own next actions"
ON public.next_actions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own next actions"
ON public.next_actions FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_lab_profiles_updated_at
BEFORE UPDATE ON public.lab_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();