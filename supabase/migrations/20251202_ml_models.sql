-- Migration: ML Models System
-- Description: Tables for machine learning model management, training, and predictions

-- Create ml_models table
CREATE TABLE IF NOT EXISTS public.ml_models (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Model configuration
  model_type TEXT NOT NULL CHECK (model_type IN ('regression', 'classification', 'clustering', 'time_series')),
  algorithm TEXT NOT NULL, -- e.g., 'random_forest', 'linear_regression', 'kmeans', 'lstm'
  target_column TEXT, -- For supervised learning
  feature_columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  hyperparameters JSONB DEFAULT '{}'::jsonb,
  
  -- Model artifacts and storage
  model_artifact_url TEXT, -- URL to stored model file (Supabase Storage or S3)
  model_version INTEGER DEFAULT 1,
  
  -- Training metadata
  training_config JSONB DEFAULT '{}'::jsonb,
  training_logs JSONB DEFAULT '[]'::jsonb,
  
  -- Performance metrics
  metrics JSONB DEFAULT '{}'::jsonb, -- accuracy, rmse, r2, f1_score, etc.
  validation_metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Status tracking
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'training', 'ready', 'failed', 'archived')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  training_started_at TIMESTAMPTZ,
  training_completed_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  
  CONSTRAINT ml_models_pkey PRIMARY KEY (id)
);

-- Create model_predictions table (for tracking predictions)
CREATE TABLE IF NOT EXISTS public.model_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES public.ml_models(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Prediction data
  input_data JSONB NOT NULL,
  prediction JSONB NOT NULL,
  confidence NUMERIC,
  
  -- Metadata
  prediction_time TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT model_predictions_pkey PRIMARY KEY (id)
);

-- Create model_evaluations table (for A/B testing and comparison)
CREATE TABLE IF NOT EXISTS public.model_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES public.ml_models(id) ON DELETE CASCADE NOT NULL,
  
  -- Evaluation data
  test_dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
  metrics JSONB NOT NULL,
  confusion_matrix JSONB,
  feature_importance JSONB,
  
  -- Metadata
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT model_evaluations_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ml_models
CREATE POLICY "Users can view their own models"
  ON public.ml_models FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own models"
  ON public.ml_models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own models"
  ON public.ml_models FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own models"
  ON public.ml_models FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for model_predictions
CREATE POLICY "Users can view their own predictions"
  ON public.model_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create predictions"
  ON public.model_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for model_evaluations
CREATE POLICY "Users can view evaluations of their models"
  ON public.model_evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ml_models m 
      WHERE m.id = model_evaluations.model_id 
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create evaluations for their models"
  ON public.model_evaluations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ml_models m 
      WHERE m.id = model_evaluations.model_id 
      AND m.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ml_models_user_id ON public.ml_models(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_models_dataset_id ON public.ml_models(dataset_id);
CREATE INDEX IF NOT EXISTS idx_ml_models_status ON public.ml_models(status);
CREATE INDEX IF NOT EXISTS idx_model_predictions_model_id ON public.model_predictions(model_id);
CREATE INDEX IF NOT EXISTS idx_model_evaluations_model_id ON public.model_evaluations(model_id);

-- Add comments for documentation
COMMENT ON TABLE public.ml_models IS 'Machine learning models trained on datasets';
COMMENT ON TABLE public.model_predictions IS 'Predictions made using trained models';
COMMENT ON TABLE public.model_evaluations IS 'Model performance evaluations and metrics';
