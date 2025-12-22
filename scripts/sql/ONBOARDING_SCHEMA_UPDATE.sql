-- Add onboarding columns to user_preferences table if they don't exist
-- Run this in your Supabase SQL Editor

-- First, check if the user_preferences table exists, create it if not
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_preferences
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
  DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
  DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;

  -- Create policies
  CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);
END $$;

-- Now add the onboarding-specific columns if they don't exist
DO $$
BEGIN
  -- Add onboarding_completed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_preferences'
      AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.user_preferences
    ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add onboarding_completed_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_preferences'
      AND column_name = 'onboarding_completed_at'
  ) THEN
    ALTER TABLE public.user_preferences
    ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add onboarding_step column (optional - to track where user is in tour)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_preferences'
      AND column_name = 'onboarding_step'
  ) THEN
    ALTER TABLE public.user_preferences
    ADD COLUMN onboarding_step INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
ON public.user_preferences(user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Verify the schema
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_preferences'
ORDER BY ordinal_position;
