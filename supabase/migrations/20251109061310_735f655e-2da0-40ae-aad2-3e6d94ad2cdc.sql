-- Notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_on_action_assignment BOOLEAN NOT NULL DEFAULT true,
  email_on_bottleneck_detection BOOLEAN NOT NULL DEFAULT true,
  email_on_experiment_complete BOOLEAN NOT NULL DEFAULT true,
  email_on_data_quality_issues BOOLEAN NOT NULL DEFAULT true,
  bottleneck_threshold INTEGER NOT NULL DEFAULT 30,
  data_quality_threshold INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Device streams table
CREATE TABLE IF NOT EXISTS public.device_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  stream_type TEXT NOT NULL, -- 'mqtt', 'webhook', 'token_auth', 'edge_gateway'
  status TEXT NOT NULL DEFAULT 'inactive', -- 'active', 'inactive', 'error'
  config JSONB NOT NULL DEFAULT '{}',
  last_data_received TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.device_streams ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own device streams"
  ON public.device_streams
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own device streams"
  ON public.device_streams
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device streams"
  ON public.device_streams
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device streams"
  ON public.device_streams
  FOR DELETE
  USING (auth.uid() = user_id);

-- Dataset metadata table (enhanced)
CREATE TABLE IF NOT EXISTS public.dataset_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  schema_info JSONB NOT NULL DEFAULT '{}',
  data_quality_score INTEGER,
  missingness_percentage NUMERIC,
  pii_classification TEXT, -- 'none', 'low', 'medium', 'high', 'phi'
  feature_tags JSONB DEFAULT '[]',
  lineage_info JSONB DEFAULT '{}',
  uploaded_by UUID,
  source_origin TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dataset_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view metadata for their datasets"
  ON public.dataset_metadata
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.datasets
    WHERE datasets.id = dataset_metadata.dataset_id
    AND datasets.user_id = auth.uid()
  ));

CREATE POLICY "Users can create metadata for their datasets"
  ON public.dataset_metadata
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.datasets
    WHERE datasets.id = dataset_metadata.dataset_id
    AND datasets.user_id = auth.uid()
  ));

CREATE POLICY "Users can update metadata for their datasets"
  ON public.dataset_metadata
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.datasets
    WHERE datasets.id = dataset_metadata.dataset_id
    AND datasets.user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_device_streams_updated_at
  BEFORE UPDATE ON public.device_streams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();