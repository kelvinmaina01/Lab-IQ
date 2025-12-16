-- ============================================================================
-- AUTOMATED REPORTING SYSTEM - Google/Meta Level Intelligence
-- Auto-generates reports with AI-powered insights and perfect templates
-- ============================================================================

-- ============================================================================
-- PART 1: REPORT TEMPLATES & CONFIGURATION
-- ============================================================================

-- Report templates table (predefined report types)
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'device', 'dataset', 'experiment', 'workflow', 'ml', 'executive'
  description TEXT,
  template_config JSONB NOT NULL, -- Sections, charts, metrics to include
  auto_trigger_conditions JSONB, -- When to auto-generate this report
  priority INTEGER DEFAULT 0, -- Higher priority templates selected first
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User report preferences
CREATE TABLE IF NOT EXISTS report_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_generate_enabled BOOLEAN DEFAULT true,
  report_frequency VARCHAR(50) DEFAULT 'daily', -- 'realtime', 'hourly', 'daily', 'weekly', 'monthly'
  preferred_templates UUID[], -- Array of template IDs
  delivery_methods JSONB DEFAULT '{"email": true, "in_app": true}'::jsonb,
  notification_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Generated reports table
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES report_templates(id),
  report_type VARCHAR(100) NOT NULL, -- 'device_summary', 'dataset_quality', 'experiment_results', etc.
  title VARCHAR(500) NOT NULL,
  summary TEXT,

  -- Report content
  sections JSONB NOT NULL, -- Structured report sections
  visualizations JSONB, -- Chart configurations and data
  insights JSONB, -- AI-generated insights
  recommendations JSONB, -- Actionable recommendations

  -- Metadata
  data_sources JSONB, -- Which datasets/devices/experiments included
  time_range JSONB, -- {"start": "...", "end": "..."}
  metrics JSONB, -- Key metrics and KPIs
  status VARCHAR(50) DEFAULT 'generated', -- 'generating', 'generated', 'error'

  -- Generation info
  auto_generated BOOLEAN DEFAULT false,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generation_duration_ms INTEGER,

  -- File storage
  file_path TEXT, -- PDF/HTML file path
  file_size_kb INTEGER,

  -- Sharing & notifications
  shared_with UUID[], -- Array of user IDs
  notification_sent BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report insights (AI-powered discoveries)
CREATE TABLE IF NOT EXISTS report_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES generated_reports(id) ON DELETE CASCADE,
  insight_type VARCHAR(100) NOT NULL, -- 'anomaly', 'trend', 'correlation', 'prediction', 'recommendation'
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(50), -- 'critical', 'high', 'medium', 'low', 'info'
  confidence_score NUMERIC(5,2), -- 0.00 to 100.00
  supporting_data JSONB,
  actionable BOOLEAN DEFAULT false,
  action_items TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generated_reports_user ON generated_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(report_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_reports_auto ON generated_reports(auto_generated, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_insights_report ON report_insights(report_id);

-- RLS Policies
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_insights ENABLE ROW LEVEL SECURITY;

-- Everyone can view templates
CREATE POLICY "Anyone can view templates" ON report_templates FOR SELECT USING (true);

-- Users can manage their own preferences
CREATE POLICY "Users manage own preferences" ON report_preferences
FOR ALL USING (auth.uid() = user_id);

-- Users can view their own reports and shared reports
CREATE POLICY "Users view own reports" ON generated_reports
FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ANY(shared_with));

-- Users can insert their own reports
CREATE POLICY "Users insert own reports" ON generated_reports
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view insights from their reports
CREATE POLICY "Users view own insights" ON report_insights
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM generated_reports
    WHERE generated_reports.id = report_insights.report_id
    AND (generated_reports.user_id = auth.uid() OR auth.uid() = ANY(generated_reports.shared_with))
  )
);


-- ============================================================================
-- PART 2: INTELLIGENT TEMPLATE SELECTOR
-- ============================================================================

-- Function: Select best report template based on data and context
CREATE OR REPLACE FUNCTION select_best_report_template(
  p_user_id UUID,
  p_context VARCHAR, -- 'device_stream', 'dataset', 'experiment', 'workflow', 'daily_summary'
  p_data_sources JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  selected_template UUID;
  user_prefs RECORD;
BEGIN
  -- Get user preferences
  SELECT * INTO user_prefs
  FROM report_preferences
  WHERE user_id = p_user_id;

  -- Select template based on context and preferences
  SELECT id INTO selected_template
  FROM report_templates
  WHERE is_active = true
    AND category = p_context
    AND (user_prefs.preferred_templates IS NULL OR id = ANY(user_prefs.preferred_templates))
  ORDER BY priority DESC, created_at DESC
  LIMIT 1;

  RETURN selected_template;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PART 3: AUTO-GENERATE DEVICE STREAM REPORT
-- ============================================================================

-- Function: Generate comprehensive device stream report
CREATE OR REPLACE FUNCTION generate_device_stream_report(
  p_user_id UUID,
  p_stream_id UUID,
  p_time_range_hours INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
  stream_info RECORD;
  data_stats RECORD;
  insights_data JSONB := '[]'::jsonb;
  report_sections JSONB;
  visualizations JSONB;
BEGIN
  -- Get stream information
  SELECT * INTO stream_info
  FROM device_streams
  WHERE id = p_stream_id AND user_id = p_user_id;

  IF stream_info IS NULL THEN
    RAISE EXCEPTION 'Stream not found or access denied';
  END IF;

  -- Calculate statistics
  SELECT
    COUNT(*) as total_points,
    COUNT(*) FILTER (WHERE is_valid = true) as valid_points,
    COUNT(*) FILTER (WHERE is_valid = false) as invalid_points,
    MIN(created_at) as first_data_point,
    MAX(created_at) as last_data_point,
    EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 3600 as hours_active
  INTO data_stats
  FROM device_stream_data
  WHERE stream_id = p_stream_id
    AND created_at >= NOW() - INTERVAL '1 hour' * p_time_range_hours;

  -- Generate insights
  -- Insight 1: Data quality
  IF data_stats.invalid_points > 0 THEN
    insights_data := insights_data || jsonb_build_object(
      'type', 'quality',
      'title', 'Data Quality Issues Detected',
      'description', format('%s invalid data points out of %s total (%.1f%%)',
        data_stats.invalid_points,
        data_stats.total_points,
        (data_stats.invalid_points::numeric / NULLIF(data_stats.total_points, 0) * 100)),
      'severity', CASE
        WHEN (data_stats.invalid_points::numeric / NULLIF(data_stats.total_points, 0)) > 0.1 THEN 'high'
        WHEN (data_stats.invalid_points::numeric / NULLIF(data_stats.total_points, 0)) > 0.05 THEN 'medium'
        ELSE 'low'
      END,
      'actionable', true,
      'actions', ARRAY['Review validation rules', 'Check device calibration', 'Inspect data payload']
    );
  END IF;

  -- Insight 2: Data rate
  IF data_stats.hours_active > 0 THEN
    insights_data := insights_data || jsonb_build_object(
      'type', 'trend',
      'title', 'Data Collection Rate',
      'description', format('Receiving %.1f data points per hour on average',
        data_stats.total_points::numeric / NULLIF(data_stats.hours_active, 0)),
      'severity', 'info'
    );
  END IF;

  -- Build report sections
  report_sections := jsonb_build_array(
    jsonb_build_object(
      'type', 'summary',
      'title', 'Overview',
      'content', jsonb_build_object(
        'stream_name', stream_info.name,
        'stream_type', stream_info.stream_type,
        'status', stream_info.status,
        'total_data_points', data_stats.total_points,
        'valid_points', data_stats.valid_points,
        'invalid_points', data_stats.invalid_points,
        'quality_rate', (data_stats.valid_points::numeric / NULLIF(data_stats.total_points, 0) * 100)
      )
    ),
    jsonb_build_object(
      'type', 'metrics',
      'title', 'Key Metrics',
      'content', jsonb_build_object(
        'data_rate', (data_stats.total_points::numeric / NULLIF(data_stats.hours_active, 0)),
        'uptime_hours', data_stats.hours_active,
        'first_data', data_stats.first_data_point,
        'last_data', data_stats.last_data_point
      )
    ),
    jsonb_build_object(
      'type', 'insights',
      'title', 'AI-Powered Insights',
      'content', insights_data
    )
  );

  -- Build visualizations config
  visualizations := jsonb_build_array(
    jsonb_build_object(
      'type', 'line_chart',
      'title', 'Data Collection Over Time',
      'query', format('SELECT date_trunc(''hour'', created_at) as time, COUNT(*) as points FROM device_stream_data WHERE stream_id = ''%s'' AND created_at >= NOW() - INTERVAL ''%s hours'' GROUP BY time ORDER BY time', p_stream_id, p_time_range_hours)
    ),
    jsonb_build_object(
      'type', 'pie_chart',
      'title', 'Data Quality Distribution',
      'data', jsonb_build_object(
        'labels', ARRAY['Valid', 'Invalid'],
        'values', ARRAY[data_stats.valid_points, data_stats.invalid_points]
      )
    )
  );

  -- Create report
  INSERT INTO generated_reports (
    user_id,
    report_type,
    title,
    summary,
    sections,
    visualizations,
    insights,
    data_sources,
    time_range,
    auto_generated,
    generated_at
  ) VALUES (
    p_user_id,
    'device_stream_summary',
    format('%s - Performance Report', stream_info.name),
    format('Comprehensive analysis of %s device stream over the last %s hours', stream_info.name, p_time_range_hours),
    report_sections,
    visualizations,
    insights_data,
    jsonb_build_object('stream_id', p_stream_id, 'stream_name', stream_info.name),
    jsonb_build_object('hours', p_time_range_hours, 'start', NOW() - INTERVAL '1 hour' * p_time_range_hours, 'end', NOW()),
    true,
    NOW()
  ) RETURNING id INTO report_id;

  -- Create individual insights
  FOR i IN 0..jsonb_array_length(insights_data)-1 LOOP
    INSERT INTO report_insights (
      report_id,
      insight_type,
      title,
      description,
      severity,
      confidence_score,
      actionable
    ) VALUES (
      report_id,
      (insights_data->i->>'type')::VARCHAR,
      (insights_data->i->>'title')::VARCHAR,
      (insights_data->i->>'description')::TEXT,
      (insights_data->i->>'severity')::VARCHAR,
      85.0, -- High confidence for statistical insights
      (insights_data->i->>'actionable')::BOOLEAN
    );
  END LOOP;

  RETURN report_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PART 4: AUTO-GENERATE DATASET QUALITY REPORT
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_dataset_quality_report(
  p_user_id UUID,
  p_dataset_id UUID
)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
  dataset_info RECORD;
  metadata_info RECORD;
  insights_data JSONB := '[]'::jsonb;
  report_sections JSONB;
BEGIN
  -- Get dataset info
  SELECT * INTO dataset_info
  FROM datasets
  WHERE id = p_dataset_id AND user_id = p_user_id;

  IF dataset_info IS NULL THEN
    RAISE EXCEPTION 'Dataset not found or access denied';
  END IF;

  -- Get metadata
  SELECT * INTO metadata_info
  FROM dataset_metadata
  WHERE dataset_id = p_dataset_id;

  -- Generate insights based on quality scores
  IF metadata_info.quality_score < 0.7 THEN
    insights_data := insights_data || jsonb_build_object(
      'type', 'quality',
      'title', 'Low Data Quality Score',
      'description', format('Quality score is %.1f%% - consider data cleaning', metadata_info.quality_score * 100),
      'severity', 'high',
      'actionable', true,
      'actions', ARRAY['Remove duplicates', 'Handle missing values', 'Validate data types']
    );
  END IF;

  IF metadata_info.completeness_score < 0.9 THEN
    insights_data := insights_data || jsonb_build_object(
      'type', 'completeness',
      'title', 'Missing Data Detected',
      'description', format('Completeness is %.1f%% - some fields have missing values', metadata_info.completeness_score * 100),
      'severity', 'medium',
      'actionable', true,
      'actions', ARRAY['Identify columns with nulls', 'Consider imputation', 'Document missing data']
    );
  END IF;

  -- Build report
  report_sections := jsonb_build_array(
    jsonb_build_object(
      'type', 'summary',
      'title', 'Dataset Overview',
      'content', jsonb_build_object(
        'name', dataset_info.name,
        'rows', dataset_info.row_count,
        'columns', dataset_info.column_count,
        'size_mb', dataset_info.file_size_mb,
        'created', dataset_info.created_at
      )
    ),
    jsonb_build_object(
      'type', 'quality_metrics',
      'title', 'Quality Assessment',
      'content', jsonb_build_object(
        'quality_score', metadata_info.quality_score * 100,
        'completeness', metadata_info.completeness_score * 100,
        'consistency', metadata_info.consistency_score * 100
      )
    ),
    jsonb_build_object(
      'type', 'insights',
      'title', 'Key Findings',
      'content', insights_data
    )
  );

  -- Create report
  INSERT INTO generated_reports (
    user_id,
    report_type,
    title,
    summary,
    sections,
    insights,
    data_sources,
    auto_generated,
    generated_at
  ) VALUES (
    p_user_id,
    'dataset_quality',
    format('%s - Quality Report', dataset_info.name),
    format('Quality assessment for %s dataset (%s rows)', dataset_info.name, dataset_info.row_count),
    report_sections,
    insights_data,
    jsonb_build_object('dataset_id', p_dataset_id, 'dataset_name', dataset_info.name),
    true,
    NOW()
  ) RETURNING id INTO report_id;

  RETURN report_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PART 5: DAILY EXECUTIVE SUMMARY
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_daily_executive_summary(
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
  summary_data JSONB;
  insights_data JSONB := '[]'::jsonb;
  report_sections JSONB;
BEGIN
  -- Collect today's activity
  WITH today_stats AS (
    SELECT
      (SELECT COUNT(*) FROM device_streams WHERE user_id = p_user_id AND status = 'active') as active_streams,
      (SELECT COUNT(*) FROM device_stream_data dsd JOIN device_streams ds ON dsd.stream_id = ds.id WHERE ds.user_id = p_user_id AND dsd.created_at >= CURRENT_DATE) as data_points_today,
      (SELECT COUNT(*) FROM datasets WHERE user_id = p_user_id AND created_at >= CURRENT_DATE) as datasets_created,
      (SELECT COUNT(*) FROM experiments WHERE user_id = p_user_id AND created_at >= CURRENT_DATE) as experiments_created,
      (SELECT COUNT(*) FROM workflow_executions WHERE user_id = p_user_id AND created_at >= CURRENT_DATE) as workflows_run
  )
  SELECT jsonb_build_object(
    'active_streams', active_streams,
    'data_points_today', data_points_today,
    'datasets_created', datasets_created,
    'experiments_created', experiments_created,
    'workflows_run', workflows_run
  ) INTO summary_data
  FROM today_stats;

  -- Generate insights
  IF (summary_data->>'data_points_today')::integer > 1000 THEN
    insights_data := insights_data || jsonb_build_object(
      'type', 'achievement',
      'title', 'High Data Collection Activity',
      'description', format('Collected %s data points today - excellent progress!', summary_data->>'data_points_today'),
      'severity', 'info'
    );
  END IF;

  IF (summary_data->>'active_streams')::integer = 0 THEN
    insights_data := insights_data || jsonb_build_object(
      'type', 'recommendation',
      'title', 'No Active Device Streams',
      'description', 'Consider connecting your laboratory devices for automated data collection',
      'severity', 'medium',
      'actionable', true,
      'actions', ARRAY['Connect a device', 'Review device connection guide']
    );
  END IF;

  -- Build report
  report_sections := jsonb_build_array(
    jsonb_build_object(
      'type', 'executive_summary',
      'title', 'Daily Activity Summary',
      'content', summary_data
    ),
    jsonb_build_object(
      'type', 'insights',
      'title', 'Key Insights',
      'content', insights_data
    )
  );

  -- Create report
  INSERT INTO generated_reports (
    user_id,
    report_type,
    title,
    summary,
    sections,
    insights,
    auto_generated,
    generated_at
  ) VALUES (
    p_user_id,
    'daily_executive_summary',
    format('Daily Summary - %s', TO_CHAR(CURRENT_DATE, 'Month DD, YYYY')),
    'Your daily activity and insights from Lab-IQ',
    report_sections,
    insights_data,
    true,
    NOW()
  ) RETURNING id INTO report_id;

  RETURN report_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PART 6: AUTOMATED REPORT TRIGGERS
-- ============================================================================

-- Trigger: Auto-generate device report after significant data collection
CREATE OR REPLACE FUNCTION trigger_device_report()
RETURNS TRIGGER AS $$
DECLARE
  stream_owner UUID;
BEGIN
  -- Get stream owner
  SELECT user_id INTO stream_owner
  FROM device_streams
  WHERE id = NEW.stream_id;

  -- Generate report if 1000 points collected (every 1000 points)
  IF (SELECT data_points_count FROM device_streams WHERE id = NEW.stream_id) % 1000 = 0 THEN
    PERFORM generate_device_stream_report(stream_owner, NEW.stream_id, 168); -- Last 7 days
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_device_report_trigger ON device_stream_data;
CREATE TRIGGER auto_device_report_trigger
AFTER INSERT ON device_stream_data
FOR EACH ROW
EXECUTE FUNCTION trigger_device_report();


-- Trigger: Auto-generate dataset quality report on dataset creation
CREATE OR REPLACE FUNCTION trigger_dataset_quality_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate quality report for new datasets
  IF NEW.status = 'ready' AND OLD.status != 'ready' THEN
    PERFORM generate_dataset_quality_report(NEW.user_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_dataset_quality_report_trigger ON datasets;
CREATE TRIGGER auto_dataset_quality_report_trigger
AFTER UPDATE ON datasets
FOR EACH ROW
EXECUTE FUNCTION trigger_dataset_quality_report();


-- ============================================================================
-- PART 7: SCHEDULED REPORT GENERATION
-- ============================================================================

-- Function: Generate all scheduled reports for a user
CREATE OR REPLACE FUNCTION generate_scheduled_reports(
  p_user_id UUID,
  p_frequency VARCHAR DEFAULT 'daily'
)
RETURNS TABLE(report_id UUID, report_type VARCHAR, title VARCHAR) AS $$
BEGIN
  -- Generate daily executive summary
  IF p_frequency = 'daily' THEN
    RETURN QUERY
    SELECT
      generate_daily_executive_summary(p_user_id) as report_id,
      'daily_executive_summary'::VARCHAR as report_type,
      format('Daily Summary - %s', TO_CHAR(CURRENT_DATE, 'Month DD, YYYY'))::VARCHAR as title;
  END IF;

  -- Add more frequency types as needed (weekly, monthly, etc.)
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PART 8: REPORT HELPER FUNCTIONS
-- ============================================================================

-- Get latest reports for user
CREATE OR REPLACE FUNCTION get_user_reports(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  report_type VARCHAR,
  title VARCHAR,
  summary TEXT,
  generated_at TIMESTAMPTZ,
  auto_generated BOOLEAN,
  views_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gr.id,
    gr.report_type::VARCHAR,
    gr.title::VARCHAR,
    gr.summary,
    gr.generated_at,
    gr.auto_generated,
    gr.views_count
  FROM generated_reports gr
  WHERE gr.user_id = p_user_id
  ORDER BY gr.generated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- Get report with insights
CREATE OR REPLACE FUNCTION get_report_with_insights(
  p_report_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  report_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'report', to_jsonb(gr.*),
    'insights', (
      SELECT jsonb_agg(to_jsonb(ri.*))
      FROM report_insights ri
      WHERE ri.report_id = p_report_id
    )
  ) INTO report_data
  FROM generated_reports gr
  WHERE gr.id = p_report_id
    AND (gr.user_id = p_user_id OR p_user_id = ANY(gr.shared_with));

  -- Update view count
  UPDATE generated_reports
  SET views_count = views_count + 1,
      last_viewed_at = NOW()
  WHERE id = p_report_id;

  RETURN report_data;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PART 9: SEED DEFAULT TEMPLATES
-- ============================================================================

-- Insert default report templates
INSERT INTO report_templates (name, category, description, template_config, priority, is_active) VALUES
('Device Stream Performance', 'device', 'Comprehensive device stream analysis with quality metrics', '{"sections": ["overview", "metrics", "quality", "insights"], "charts": ["timeline", "quality_pie"]}', 10, true),
('Dataset Quality Assessment', 'dataset', 'Data quality evaluation with actionable recommendations', '{"sections": ["summary", "quality", "completeness", "insights"], "charts": ["quality_bars"]}', 9, true),
('Daily Executive Summary', 'executive', 'High-level overview of daily activities and key metrics', '{"sections": ["summary", "activity", "insights"]}', 8, true),
('Experiment Results Report', 'experiment', 'Detailed experiment outcomes and analysis', '{"sections": ["overview", "results", "analysis", "insights"]}', 7, true),
('Workflow Performance', 'workflow', 'Workflow execution statistics and optimization tips', '{"sections": ["summary", "performance", "insights"]}', 6, true)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- PART 10: GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON report_templates TO authenticated;
GRANT ALL ON report_preferences TO authenticated;
GRANT ALL ON generated_reports TO authenticated;
GRANT ALL ON report_insights TO authenticated;


-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Automated Reporting System installed successfully!';
  RAISE NOTICE '📊 Available functions:';
  RAISE NOTICE '  - generate_device_stream_report(user_id, stream_id, hours)';
  RAISE NOTICE '  - generate_dataset_quality_report(user_id, dataset_id)';
  RAISE NOTICE '  - generate_daily_executive_summary(user_id)';
  RAISE NOTICE '  - get_user_reports(user_id, limit)';
  RAISE NOTICE '  - get_report_with_insights(report_id, user_id)';
  RAISE NOTICE '🤖 Automatic triggers enabled for reports!';
END $$;
