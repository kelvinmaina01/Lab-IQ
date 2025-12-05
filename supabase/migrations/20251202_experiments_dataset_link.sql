-- Migration: Link Experiments to Datasets
-- Description: Add dataset linkage to experiments table for traceability

-- Add dataset_id column to experiments table
ALTER TABLE public.experiments 
ADD COLUMN IF NOT EXISTS dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS auto_created BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS protocol JSONB DEFAULT '{}'::jsonb;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_experiments_dataset_id ON public.experiments(dataset_id);

-- Add comment
COMMENT ON COLUMN public.experiments.dataset_id IS 'Dataset used for this experiment';
COMMENT ON COLUMN public.experiments.auto_created IS 'Whether experiment was auto-created from dataset';
COMMENT ON COLUMN public.experiments.protocol IS 'Experiment protocol and steps';
