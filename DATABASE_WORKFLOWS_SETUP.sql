-- =====================================================
-- Lab-IQ Workflows & Automation Tables Setup
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create workflows table
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

-- 2. Create workflow_executions table
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  logs JSONB DEFAULT '[]'::jsonb,
  result JSONB,
  error TEXT
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON public.workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view their own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can insert their own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can update their own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can delete their own workflows" ON public.workflows;

DROP POLICY IF EXISTS "Users can view executions of their workflows" ON public.workflow_executions;
DROP POLICY IF EXISTS "Users can insert executions of their workflows" ON public.workflow_executions;
DROP POLICY IF EXISTS "Users can update executions of their workflows" ON public.workflow_executions;

-- 6. Create RLS policies for workflows table
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

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to auto-update updated_at
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
