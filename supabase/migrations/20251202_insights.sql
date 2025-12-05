-- Migration: Dataset Insights and Recommendations
-- Description: AI-generated insights, correlations, anomalies, and smart recommendations

-- Create dataset_insights table
CREATE TABLE IF NOT EXISTS public.dataset_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Insight details
  insight_type TEXT NOT NULL CHECK (insight_type IN ('correlation', 'anomaly', 'pattern', 'recommendation', 'quality', 'distribution')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Insight data
  data JSONB DEFAULT '{}'::jsonb, -- Specific data for the insight (e.g., correlation coefficient, anomaly details)
  affected_columns JSONB DEFAULT '[]'::jsonb, -- Columns involved in this insight
  
  -- Scoring
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  importance_score NUMERIC CHECK (importance_score >= 0 AND confidence_score <= 100),
  
  -- Actionability
  suggested_actions JSONB DEFAULT '[]'::jsonb, -- Array of suggested next steps
  is_actionable BOOLEAN DEFAULT FALSE,
  
  -- User interaction
  is_dismissed BOOLEAN DEFAULT FALSE,
  is_bookmarked BOOLEAN DEFAULT FALSE,
  user_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT dataset_insights_pkey PRIMARY KEY (id)
);

-- Create insight_actions table (track actions taken on insights)
CREATE TABLE IF NOT EXISTS public.insight_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  insight_id UUID REFERENCES public.dataset_insights(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Action details
  action_type TEXT NOT NULL, -- 'experiment_created', 'model_trained', 'workflow_created', etc.
  action_data JSONB DEFAULT '{}'::jsonb,
  reference_id UUID, -- ID of created experiment/model/workflow
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT insight_actions_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.dataset_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dataset_insights
CREATE POLICY "Users can view insights for their datasets"
  ON public.dataset_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create insights for their datasets"
  ON public.dataset_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON public.dataset_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights"
  ON public.dataset_insights FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for insight_actions
CREATE POLICY "Users can view their own insight actions"
  ON public.insight_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create insight actions"
  ON public.insight_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dataset_insights_dataset_id ON public.dataset_insights(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_insights_user_id ON public.dataset_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_dataset_insights_type ON public.dataset_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_dataset_insights_bookmarked ON public.dataset_insights(is_bookmarked) WHERE is_bookmarked = TRUE;
CREATE INDEX IF NOT EXISTS idx_insight_actions_insight_id ON public.insight_actions(insight_id);

-- Function to auto-generate basic insights on dataset upload
CREATE OR REPLACE FUNCTION generate_basic_insights()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate insights when dataset becomes ready
  IF NEW.status = 'ready' AND OLD.status = 'processing' THEN
    -- Insert a recommendation insight to explore the data
    INSERT INTO public.dataset_insights (
      dataset_id,
      user_id,
      insight_type,
      title,
      description,
      confidence_score,
      importance_score,
      suggested_actions
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'recommendation',
      'Dataset Ready for Analysis',
      format('Your dataset "%s" with %s rows and %s columns is ready. Consider these next steps.', 
        NEW.name, NEW.row_count, NEW.column_count),
      100,
      80,
      jsonb_build_array(
        jsonb_build_object('action', 'create_experiment', 'label', 'Create Experiment'),
        jsonb_build_object('action', 'train_model', 'label', 'Train ML Model'),
        jsonb_build_object('action', 'build_workflow', 'label', 'Build Workflow'),
        jsonb_build_object('action', 'analyze_ai', 'label', 'Analyze with AI')
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate insights
CREATE TRIGGER dataset_insights_generator
  AFTER UPDATE OF status ON public.datasets
  FOR EACH ROW
  EXECUTE FUNCTION generate_basic_insights();

-- Add comments
COMMENT ON TABLE public.dataset_insights IS 'AI-generated insights, patterns, and recommendations for datasets';
COMMENT ON TABLE public.insight_actions IS 'Actions taken by users based on insights';
