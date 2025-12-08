-- =====================================================
-- Lab-IQ Workflows & Automation Tables Setup
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create workflows table (if not exists)
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('dataset_upload', 'manual', 'schedule', 'threshold', 'event')),
  trigger_config JSONB DEFAULT '{}'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled')),
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1b. Add new columns to existing workflows table
DO $$
BEGIN
  -- Add category column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'category'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN category TEXT DEFAULT 'General';
  END IF;

  -- Add icon column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'icon'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN icon TEXT DEFAULT '⚙️';
  END IF;

  -- Add estimated_time_saved column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'estimated_time_saved'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN estimated_time_saved TEXT;
  END IF;
END $$;

-- 2. Create workflow_executions table (with comprehensive monitoring)
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  logs JSONB DEFAULT '[]'::jsonb,
  result JSONB,
  error TEXT
);

-- 2b. Add new columns to existing workflow_executions table
DO $$
BEGIN
  -- Add insights column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflow_executions'
    AND column_name = 'insights'
  ) THEN
    ALTER TABLE public.workflow_executions ADD COLUMN insights JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add metrics column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflow_executions'
    AND column_name = 'metrics'
  ) THEN
    ALTER TABLE public.workflow_executions ADD COLUMN metrics JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add current_step column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflow_executions'
    AND column_name = 'current_step'
  ) THEN
    ALTER TABLE public.workflow_executions ADD COLUMN current_step INTEGER DEFAULT 0;
  END IF;

  -- Add total_steps column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflow_executions'
    AND column_name = 'total_steps'
  ) THEN
    ALTER TABLE public.workflow_executions ADD COLUMN total_steps INTEGER DEFAULT 0;
  END IF;

  -- Add progress_percentage column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflow_executions'
    AND column_name = 'progress_percentage'
  ) THEN
    ALTER TABLE public.workflow_executions ADD COLUMN progress_percentage DECIMAL(5,2) DEFAULT 0.00;
  END IF;
END $$;

-- 2c. Update status constraint to include 'partial'
DO $$
BEGIN
  -- Drop old constraint if exists
  ALTER TABLE public.workflow_executions DROP CONSTRAINT IF EXISTS workflow_executions_status_check;

  -- Add new constraint with 'partial' status
  ALTER TABLE public.workflow_executions ADD CONSTRAINT workflow_executions_status_check
    CHECK (status IN ('running', 'success', 'failed', 'partial'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create workflow_insights table (AI-generated insights)
CREATE TABLE IF NOT EXISTS public.workflow_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('quality', 'anomaly', 'recommendation', 'warning', 'success')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  data JSONB DEFAULT '{}'::jsonb,
  is_significant BOOLEAN DEFAULT false,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create workflow_reports table
CREATE TABLE IF NOT EXISTS public.workflow_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('single_execution', 'workflow_summary', 'performance_analysis', 'insights_digest')),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  format TEXT DEFAULT 'json' CHECK (format IN ('json', 'pdf', 'html', 'csv')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  file_path TEXT
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON public.workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON public.workflows(category);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON public.workflow_executions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_insights_execution_id ON public.workflow_insights(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_insights_workflow_id ON public.workflow_insights(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_insights_significant ON public.workflow_insights(is_significant, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_insights_notification ON public.workflow_insights(notification_sent, is_significant);

CREATE INDEX IF NOT EXISTS idx_workflow_reports_workflow_id ON public.workflow_reports(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_reports_user_id ON public.workflow_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_reports_generated_at ON public.workflow_reports(generated_at DESC);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_reports ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view their own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can insert their own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can update their own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can delete their own workflows" ON public.workflows;

DROP POLICY IF EXISTS "Users can view executions of their workflows" ON public.workflow_executions;
DROP POLICY IF EXISTS "Users can insert executions of their workflows" ON public.workflow_executions;
DROP POLICY IF EXISTS "Users can update executions of their workflows" ON public.workflow_executions;

DROP POLICY IF EXISTS "Users can view insights of their workflows" ON public.workflow_insights;
DROP POLICY IF EXISTS "Users can insert insights of their workflows" ON public.workflow_insights;
DROP POLICY IF EXISTS "Users can update insights of their workflows" ON public.workflow_insights;

DROP POLICY IF EXISTS "Users can view their own reports" ON public.workflow_reports;
DROP POLICY IF EXISTS "Users can insert their own reports" ON public.workflow_reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON public.workflow_reports;

-- 8. Create RLS policies for workflows table
CREATE POLICY "Users can view their own workflows"
  ON public.workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workflows"
  ON public.workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
  ON public.workflows FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows"
  ON public.workflows FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create RLS policies for workflow_executions table
CREATE POLICY "Users can view executions of their workflows"
  ON public.workflow_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflows
      WHERE workflows.id = workflow_executions.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert executions of their workflows"
  ON public.workflow_executions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflows
      WHERE workflows.id = workflow_executions.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update executions of their workflows"
  ON public.workflow_executions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workflows
      WHERE workflows.id = workflow_executions.workflow_id
      AND workflows.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflows
      WHERE workflows.id = workflow_executions.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

-- 9. Create RLS policies for workflow_insights table
CREATE POLICY "Users can view insights of their workflows"
  ON public.workflow_insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflows
      WHERE workflows.id = workflow_insights.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert insights of their workflows"
  ON public.workflow_insights FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflows
      WHERE workflows.id = workflow_insights.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update insights of their workflows"
  ON public.workflow_insights FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workflows
      WHERE workflows.id = workflow_insights.workflow_id
      AND workflows.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflows
      WHERE workflows.id = workflow_insights.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

-- 10. Create RLS policies for workflow_reports table
CREATE POLICY "Users can view their own reports"
  ON public.workflow_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports"
  ON public.workflow_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON public.workflow_reports FOR DELETE
  USING (auth.uid() = user_id);

-- 11. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_workflows_updated_at ON public.workflows;
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Verification Queries (Optional - uncomment to test)
-- =====================================================

-- Check if tables were created
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('workflows', 'workflow_executions');

-- Check if policies were created
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('workflows', 'workflow_executions');

-- =====================================================
-- Success! Tables are ready for use.
-- =====================================================
