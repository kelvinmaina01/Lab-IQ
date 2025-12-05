-- Migration: Workflow Automation System
-- Description: Tables for workflow automation, scheduling, and execution tracking

-- Create workflows table
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Trigger configuration
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'dataset_upload', 'schedule', 'webhook')),
  trigger_config JSONB DEFAULT '{}'::jsonb, -- cron schedule, dataset filters, etc.
  
  -- Workflow definition (linear for now)
  steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of step definitions
  
  -- Status and settings
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled')),
  enabled BOOLEAN DEFAULT TRUE,
  
  -- Execution tracking
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  
  -- Metadata
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT workflows_pkey PRIMARY KEY (id)
);

-- Create workflow_runs table
CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Execution data
  trigger_source TEXT, -- 'manual', 'schedule', 'upload', etc.
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  
  -- Step execution tracking
  current_step INTEGER DEFAULT 0,
  completed_steps JSONB DEFAULT '[]'::jsonb,
  step_outputs JSONB DEFAULT '{}'::jsonb,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  error_step INTEGER,
  
  -- Performance metrics
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  
  CONSTRAINT workflow_runs_pkey PRIMARY KEY (id)
);

-- Create workflow_templates table (predefined workflows)
CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'ml', 'data_processing', 'analysis', etc.
  
  -- Template definition
  template_steps JSONB NOT NULL,
  default_config JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT workflow_templates_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflows
CREATE POLICY "Users can view their own workflows"
  ON public.workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create workflows"
  ON public.workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
  ON public.workflows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows"
  ON public.workflows FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for workflow_runs
CREATE POLICY "Users can view their own workflow runs"
  ON public.workflow_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create workflow runs"
  ON public.workflow_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflow runs"
  ON public.workflow_runs FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for workflow_templates
CREATE POLICY "Everyone can view public templates"
  ON public.workflow_templates FOR SELECT
  USING (is_public = TRUE OR auth.uid() = created_by);

CREATE POLICY "Users can create templates"
  ON public.workflow_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON public.workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON public.workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON public.workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_started_at ON public.workflow_runs(started_at DESC);

-- Create function to update workflow stats after run
CREATE OR REPLACE FUNCTION update_workflow_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE public.workflows
    SET 
      last_run_at = NEW.completed_at,
      last_run_status = 'completed',
      total_runs = total_runs + 1,
      successful_runs = successful_runs + 1
    WHERE id = NEW.workflow_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE public.workflows
    SET 
      last_run_at = NEW.completed_at,
      last_run_status = 'failed',
      total_runs = total_runs + 1,
      failed_runs = failed_runs + 1
    WHERE id = NEW.workflow_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update workflow stats
CREATE TRIGGER workflow_run_completed
  AFTER UPDATE OF status ON public.workflow_runs
  FOR EACH ROW
  WHEN (OLD.status != NEW.status AND (NEW.status IN ('completed', 'failed')))
  EXECUTE FUNCTION update_workflow_stats();

-- Add comments
COMMENT ON TABLE public.workflows IS 'Automated workflow definitions';
COMMENT ON TABLE public.workflow_runs IS 'Workflow execution history and status';
COMMENT ON TABLE public.workflow_templates IS 'Predefined workflow templates';
