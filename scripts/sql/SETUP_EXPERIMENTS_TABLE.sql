-- =====================================================
-- COMPLETE EXPERIMENTS TABLE SETUP
-- Run this in Supabase SQL Editor if table is missing
-- Date: 2025-12-22
-- =====================================================

-- 1. Create experiments table (with all needed columns)
CREATE TABLE IF NOT EXISTS public.experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
  auto_created BOOLEAN DEFAULT false,
  protocol JSONB DEFAULT '{}'::jsonb,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add missing columns if table already exists
DO $$
BEGIN
  -- Add dataset_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'experiments' AND column_name = 'dataset_id'
  ) THEN
    ALTER TABLE public.experiments ADD COLUMN dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL;
    RAISE NOTICE '✓ Added dataset_id column';
  END IF;

  -- Add auto_created if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'experiments' AND column_name = 'auto_created'
  ) THEN
    ALTER TABLE public.experiments ADD COLUMN auto_created BOOLEAN DEFAULT false;
    RAISE NOTICE '✓ Added auto_created column';
  END IF;

  -- Add protocol if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'experiments' AND column_name = 'protocol'
  ) THEN
    ALTER TABLE public.experiments ADD COLUMN protocol JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✓ Added protocol column';
  END IF;

  -- Add progress if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'experiments' AND column_name = 'progress'
  ) THEN
    ALTER TABLE public.experiments ADD COLUMN progress INTEGER DEFAULT 0;
    RAISE NOTICE '✓ Added progress column';
  END IF;

  -- Add type if missing (required by frontend)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'experiments' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.experiments ADD COLUMN type TEXT DEFAULT 'General';
    RAISE NOTICE '✓ Added type column';
  END IF;
END $$;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_experiments_user_id ON public.experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON public.experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_dataset_id ON public.experiments(dataset_id);
CREATE INDEX IF NOT EXISTS idx_experiments_created_at ON public.experiments(created_at DESC);

-- 4. Enable RLS
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Users can view their own experiments" ON public.experiments;
DROP POLICY IF EXISTS "Users can insert their own experiments" ON public.experiments;
DROP POLICY IF EXISTS "Users can update their own experiments" ON public.experiments;
DROP POLICY IF EXISTS "Users can delete their own experiments" ON public.experiments;

-- 6. Create RLS policies
CREATE POLICY "Users can view their own experiments"
  ON public.experiments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experiments"
  ON public.experiments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experiments"
  ON public.experiments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experiments"
  ON public.experiments FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_experiments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_experiments_updated_at ON public.experiments;
CREATE TRIGGER update_experiments_updated_at
  BEFORE UPDATE ON public.experiments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_experiments_updated_at();

-- 8. Verify setup
SELECT 
  'SETUP VERIFICATION' AS check_type,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'experiments') AS total_columns,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'experiments') AS total_policies;

-- Show all columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'experiments'
ORDER BY ordinal_position;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ EXPERIMENTS TABLE SETUP COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'The experiments table is now ready.';
  RAISE NOTICE 'Refresh the Experiments page to test.';
  RAISE NOTICE '========================================';
END $$;
