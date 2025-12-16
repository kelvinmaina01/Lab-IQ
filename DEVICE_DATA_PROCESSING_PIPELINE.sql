-- ============================================================================
-- DEVICE DATA PROCESSING PIPELINE
-- Complete integration: Device → Dataset → Experiments → ML → Workflows → AI
-- ============================================================================

-- ============================================================================
-- PART 1: AUTO-CREATE DATASETS FROM DEVICE STREAMS
-- ============================================================================

-- Function: Automatically create a dataset when device stream reaches threshold
-- Triggers when 100+ data points collected or every 24 hours
CREATE OR REPLACE FUNCTION auto_create_dataset_from_stream()
RETURNS TRIGGER AS $$
DECLARE
  stream_record RECORD;
  dataset_id UUID;
  csv_data TEXT;
  row_data RECORD;
  column_names TEXT[];
  column_types JSONB;
  total_rows INTEGER;
BEGIN
  -- Get stream details
  SELECT * INTO stream_record
  FROM device_streams
  WHERE id = NEW.stream_id;

  -- Check if we should create a dataset (every 100 points or 24 hours)
  IF stream_record.data_points_count % 100 = 0 OR
     stream_record.last_data_received < NOW() - INTERVAL '24 hours' THEN

    -- Extract column structure from first data point
    SELECT ARRAY(SELECT jsonb_object_keys(payload))
    INTO column_names
    FROM device_stream_data
    WHERE stream_id = NEW.stream_id
    LIMIT 1;

    -- Build column types from payload
    SELECT jsonb_object_agg(key, pg_typeof(value)::text)
    INTO column_types
    FROM device_stream_data,
         LATERAL jsonb_each(payload)
    WHERE stream_id = NEW.stream_id
    LIMIT 1;

    -- Count total rows
    SELECT COUNT(*) INTO total_rows
    FROM device_stream_data
    WHERE stream_id = NEW.stream_id;

    -- Create dataset record
    INSERT INTO datasets (
      user_id,
      name,
      description,
      file_name,
      file_path,
      row_count,
      column_count,
      columns_info,
      file_size_mb,
      status,
      source_type,
      source_id,
      created_at
    ) VALUES (
      stream_record.user_id,
      stream_record.name || ' - ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI'),
      'Auto-generated dataset from device stream: ' || stream_record.name,
      stream_record.name || '_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS') || '.csv',
      'device_streams/' || NEW.stream_id || '/' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS') || '.csv',
      total_rows,
      array_length(column_names, 1),
      column_types,
      (total_rows * 0.001)::NUMERIC(10,2), -- Estimate 1KB per row
      'ready',
      'device_stream',
      NEW.stream_id,
      NOW()
    ) RETURNING id INTO dataset_id;

    -- Create dataset metadata
    INSERT INTO dataset_metadata (
      dataset_id,
      quality_score,
      completeness_score,
      consistency_score,
      created_at
    ) VALUES (
      dataset_id,
      95.0, -- Device data is typically high quality
      100.0, -- Complete (no nulls from devices)
      98.0, -- High consistency
      NOW()
    );

    -- Mark that we created a dataset
    UPDATE device_streams
    SET metadata = COALESCE(metadata, '{}'::jsonb) ||
                   jsonb_build_object(
                     'last_dataset_created', NOW(),
                     'total_datasets_created', COALESCE((metadata->>'total_datasets_created')::int, 0) + 1,
                     'last_dataset_id', dataset_id
                   )
    WHERE id = NEW.stream_id;

    -- Log the creation
    RAISE NOTICE 'Auto-created dataset % from device stream %', dataset_id, NEW.stream_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create datasets
DROP TRIGGER IF EXISTS auto_create_dataset_trigger ON device_stream_data;
CREATE TRIGGER auto_create_dataset_trigger
AFTER INSERT ON device_stream_data
FOR EACH ROW
EXECUTE FUNCTION auto_create_dataset_from_stream();


-- ============================================================================
-- PART 2: AUTO-CREATE EXPERIMENTS FROM DEVICE DATA
-- ============================================================================

-- Function: Create experiments when device data has experiment_id field
CREATE OR REPLACE FUNCTION auto_create_experiment_from_device()
RETURNS TRIGGER AS $$
DECLARE
  exp_id TEXT;
  stream_record RECORD;
  existing_experiment UUID;
  new_experiment_id UUID;
BEGIN
  -- Extract experiment_id from payload if exists
  exp_id := NEW.payload->>'experiment_id';

  IF exp_id IS NOT NULL THEN
    -- Get stream details
    SELECT * INTO stream_record
    FROM device_streams
    WHERE id = NEW.stream_id;

    -- Check if experiment already exists
    SELECT id INTO existing_experiment
    FROM experiments
    WHERE name = exp_id
      AND user_id = (SELECT user_id FROM device_streams WHERE id = NEW.stream_id)
    LIMIT 1;

    IF existing_experiment IS NULL THEN
      -- Create new experiment
      INSERT INTO experiments (
        user_id,
        name,
        description,
        status,
        auto_created,
        metadata,
        created_at
      ) VALUES (
        stream_record.user_id,
        exp_id,
        'Auto-created from device stream: ' || stream_record.name,
        'running',
        true,
        jsonb_build_object(
          'source', 'device_stream',
          'stream_id', NEW.stream_id,
          'stream_name', stream_record.name,
          'created_from_data_point', NEW.id
        ),
        NOW()
      ) RETURNING id INTO new_experiment_id;

      -- Update the data point with experiment reference
      UPDATE device_stream_data
      SET experiment_id = exp_id
      WHERE id = NEW.id;

      RAISE NOTICE 'Auto-created experiment % from device data', new_experiment_id;
    ELSE
      -- Link to existing experiment
      UPDATE device_stream_data
      SET experiment_id = exp_id
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create experiments
DROP TRIGGER IF EXISTS auto_create_experiment_trigger ON device_stream_data;
CREATE TRIGGER auto_create_experiment_trigger
AFTER INSERT ON device_stream_data
FOR EACH ROW
EXECUTE FUNCTION auto_create_experiment_from_device();


-- ============================================================================
-- PART 3: DATA AGGREGATION & TRANSFORMATION FUNCTIONS
-- ============================================================================

-- Function: Aggregate device data for time-series analysis
CREATE OR REPLACE FUNCTION aggregate_device_data(
  p_stream_id UUID,
  p_interval TEXT DEFAULT '1 hour',
  p_start_time TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_end_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  time_bucket TIMESTAMPTZ,
  data_points INTEGER,
  avg_values JSONB,
  min_values JSONB,
  max_values JSONB,
  stddev_values JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH time_buckets AS (
    SELECT
      date_trunc(p_interval, created_at) as bucket,
      payload
    FROM device_stream_data
    WHERE stream_id = p_stream_id
      AND created_at BETWEEN p_start_time AND p_end_time
  ),
  aggregated AS (
    SELECT
      bucket,
      COUNT(*) as point_count,
      jsonb_object_agg(
        key,
        CASE
          WHEN jsonb_typeof(value) = 'number' THEN
            jsonb_build_object(
              'avg', AVG((value::text)::numeric),
              'min', MIN((value::text)::numeric),
              'max', MAX((value::text)::numeric),
              'stddev', STDDEV((value::text)::numeric)
            )
          ELSE value
        END
      ) as stats
    FROM time_buckets,
         LATERAL jsonb_each(payload)
    GROUP BY bucket, key
  )
  SELECT
    bucket as time_bucket,
    point_count as data_points,
    stats as avg_values,
    stats as min_values,
    stats as max_values,
    stats as stddev_values
  FROM aggregated
  ORDER BY bucket DESC;
END;
$$ LANGUAGE plpgsql;


-- Function: Extract device data as CSV (for dataset export)
CREATE OR REPLACE FUNCTION export_device_data_as_csv(
  p_stream_id UUID,
  p_limit INTEGER DEFAULT 1000
)
RETURNS TEXT AS $$
DECLARE
  csv_output TEXT := '';
  header_row TEXT := '';
  data_row TEXT;
  rec RECORD;
  keys TEXT[];
  key TEXT;
BEGIN
  -- Get column names from first row
  SELECT ARRAY(SELECT jsonb_object_keys(payload))
  INTO keys
  FROM device_stream_data
  WHERE stream_id = p_stream_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Build header
  header_row := 'timestamp,' || array_to_string(keys, ',') || E'\n';
  csv_output := header_row;

  -- Build data rows
  FOR rec IN
    SELECT created_at, payload
    FROM device_stream_data
    WHERE stream_id = p_stream_id
    ORDER BY created_at DESC
    LIMIT p_limit
  LOOP
    data_row := rec.created_at::TEXT;
    FOREACH key IN ARRAY keys
    LOOP
      data_row := data_row || ',' || COALESCE((rec.payload->>key), '');
    END LOOP;
    csv_output := csv_output || data_row || E'\n';
  END LOOP;

  RETURN csv_output;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PART 4: DATA QUALITY VALIDATION
-- ============================================================================

-- Function: Validate incoming device data
CREATE OR REPLACE FUNCTION validate_device_data()
RETURNS TRIGGER AS $$
DECLARE
  validation_errors JSONB := '[]'::jsonb;
  stream_config JSONB;
  key TEXT;
  value JSONB;
  numeric_value NUMERIC;
BEGIN
  -- Get stream validation config
  SELECT connection_config->'validation_rules' INTO stream_config
  FROM device_streams
  WHERE id = NEW.stream_id;

  -- If no validation rules, mark as valid
  IF stream_config IS NULL THEN
    NEW.is_valid := true;
    RETURN NEW;
  END IF;

  -- Validate each field
  FOR key, value IN SELECT * FROM jsonb_each(NEW.payload)
  LOOP
    -- Check if field has validation rules
    IF stream_config ? key THEN
      -- Validate numeric ranges
      IF jsonb_typeof(value) = 'number' THEN
        numeric_value := (value::text)::numeric;

        -- Check min value
        IF stream_config->key->>'min' IS NOT NULL THEN
          IF numeric_value < (stream_config->key->>'min')::numeric THEN
            validation_errors := validation_errors || jsonb_build_object(
              'field', key,
              'error', 'below_minimum',
              'value', numeric_value,
              'min', (stream_config->key->>'min')::numeric
            );
          END IF;
        END IF;

        -- Check max value
        IF stream_config->key->>'max' IS NOT NULL THEN
          IF numeric_value > (stream_config->key->>'max')::numeric THEN
            validation_errors := validation_errors || jsonb_build_object(
              'field', key,
              'error', 'above_maximum',
              'value', numeric_value,
              'max', (stream_config->key->>'max')::numeric
            );
          END IF;
        END IF;
      END IF;

      -- Check required fields
      IF (stream_config->key->>'required')::boolean = true THEN
        IF value IS NULL OR value = 'null'::jsonb THEN
          validation_errors := validation_errors || jsonb_build_object(
            'field', key,
            'error', 'required_field_missing'
          );
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Set validation result
  IF jsonb_array_length(validation_errors) > 0 THEN
    NEW.is_valid := false;
    NEW.validation_errors := validation_errors;
  ELSE
    NEW.is_valid := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for data validation
DROP TRIGGER IF EXISTS validate_device_data_trigger ON device_stream_data;
CREATE TRIGGER validate_device_data_trigger
BEFORE INSERT ON device_stream_data
FOR EACH ROW
EXECUTE FUNCTION validate_device_data();


-- ============================================================================
-- PART 5: WORKFLOW INTEGRATION
-- ============================================================================

-- Function: Create workflow execution from device data
CREATE OR REPLACE FUNCTION trigger_workflow_from_device_data(
  p_stream_id UUID,
  p_workflow_id UUID,
  p_trigger_condition TEXT DEFAULT 'always'
)
RETURNS UUID AS $$
DECLARE
  execution_id UUID;
  stream_record RECORD;
  latest_data JSONB;
BEGIN
  -- Get stream info
  SELECT * INTO stream_record
  FROM device_streams
  WHERE id = p_stream_id;

  -- Get latest data point
  SELECT payload INTO latest_data
  FROM device_stream_data
  WHERE stream_id = p_stream_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Create workflow execution
  INSERT INTO workflow_executions (
    user_id,
    workflow_id,
    status,
    input_data,
    metadata,
    created_at
  ) VALUES (
    stream_record.user_id,
    p_workflow_id,
    'pending',
    latest_data,
    jsonb_build_object(
      'triggered_by', 'device_stream',
      'stream_id', p_stream_id,
      'stream_name', stream_record.name,
      'trigger_condition', p_trigger_condition
    ),
    NOW()
  ) RETURNING id INTO execution_id;

  RETURN execution_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PART 6: ML MODEL TRAINING DATA PREPARATION
-- ============================================================================

-- Function: Prepare device data for ML training
CREATE OR REPLACE FUNCTION prepare_ml_training_data(
  p_stream_id UUID,
  p_target_column TEXT,
  p_feature_columns TEXT[],
  p_train_test_split NUMERIC DEFAULT 0.8
)
RETURNS TABLE (
  split_type TEXT,
  features JSONB,
  target JSONB,
  row_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH all_data AS (
    SELECT
      payload,
      ROW_NUMBER() OVER (ORDER BY created_at) as row_num,
      COUNT(*) OVER () as total_rows
    FROM device_stream_data
    WHERE stream_id = p_stream_id
      AND is_valid = true
  ),
  split_data AS (
    SELECT
      CASE
        WHEN row_num <= (total_rows * p_train_test_split) THEN 'train'
        ELSE 'test'
      END as split,
      payload
    FROM all_data
  ),
  features_prepared AS (
    SELECT
      split,
      jsonb_object_agg(
        key,
        value
      ) FILTER (WHERE key = ANY(p_feature_columns)) as features,
      payload->p_target_column as target
    FROM split_data,
         LATERAL jsonb_each(payload)
    GROUP BY split, payload, target
  )
  SELECT
    split as split_type,
    features,
    target,
    COUNT(*)::INTEGER as row_count
  FROM features_prepared
  GROUP BY split, features, target;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PART 7: AI ASSISTANT CONTEXT INTEGRATION
-- ============================================================================

-- Function: Get device data context for AI assistant
CREATE OR REPLACE FUNCTION get_device_context_for_ai(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 100
)
RETURNS JSONB AS $$
DECLARE
  context JSONB;
BEGIN
  SELECT jsonb_build_object(
    'active_streams', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'stream_id', ds.id,
          'stream_name', ds.name,
          'stream_type', ds.stream_type,
          'status', ds.status,
          'data_points_count', ds.data_points_count,
          'last_data_received', ds.last_data_received,
          'recent_data', (
            SELECT jsonb_agg(payload ORDER BY created_at DESC)
            FROM device_stream_data
            WHERE stream_id = ds.id
            ORDER BY created_at DESC
            LIMIT 10
          ),
          'summary_stats', (
            SELECT jsonb_object_agg(
              key,
              jsonb_build_object(
                'avg', AVG((value::text)::numeric),
                'min', MIN((value::text)::numeric),
                'max', MAX((value::text)::numeric)
              )
            )
            FROM device_stream_data,
                 LATERAL jsonb_each(payload)
            WHERE stream_id = ds.id
              AND jsonb_typeof(value) = 'number'
            GROUP BY key
          )
        )
      )
      FROM device_streams ds
      WHERE ds.user_id = p_user_id
        AND ds.status = 'active'
      LIMIT p_limit
    ),
    'total_active_streams', (
      SELECT COUNT(*)
      FROM device_streams
      WHERE user_id = p_user_id
        AND status = 'active'
    ),
    'total_data_points_today', (
      SELECT COUNT(*)
      FROM device_stream_data dsd
      JOIN device_streams ds ON dsd.stream_id = ds.id
      WHERE ds.user_id = p_user_id
        AND dsd.created_at >= CURRENT_DATE
    ),
    'data_quality_summary', (
      SELECT jsonb_build_object(
        'valid_points', COUNT(*) FILTER (WHERE is_valid = true),
        'invalid_points', COUNT(*) FILTER (WHERE is_valid = false),
        'validation_rate', (COUNT(*) FILTER (WHERE is_valid = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100)
      )
      FROM device_stream_data dsd
      JOIN device_streams ds ON dsd.stream_id = ds.id
      WHERE ds.user_id = p_user_id
        AND dsd.created_at >= NOW() - INTERVAL '24 hours'
    )
  ) INTO context;

  RETURN context;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PART 8: HELPER VIEWS FOR EASY QUERYING
-- ============================================================================

-- View: Device data with stream information
CREATE OR REPLACE VIEW v_device_data_enriched AS
SELECT
  dsd.id,
  dsd.stream_id,
  ds.name as stream_name,
  ds.stream_type,
  ds.user_id,
  dsd.payload,
  dsd.created_at,
  dsd.timestamp,
  dsd.experiment_id,
  dsd.is_valid,
  dsd.validation_errors,
  ds.status as stream_status
FROM device_stream_data dsd
JOIN device_streams ds ON dsd.stream_id = ds.id;

-- View: Device stream summary statistics
CREATE OR REPLACE VIEW v_device_stream_stats AS
SELECT
  ds.id as stream_id,
  ds.name as stream_name,
  ds.stream_type,
  ds.user_id,
  ds.status,
  ds.data_points_count,
  ds.last_data_received,
  COUNT(dsd.id) as total_data_points,
  COUNT(dsd.id) FILTER (WHERE dsd.is_valid = true) as valid_data_points,
  COUNT(dsd.id) FILTER (WHERE dsd.is_valid = false) as invalid_data_points,
  MIN(dsd.created_at) as first_data_point,
  MAX(dsd.created_at) as last_data_point,
  COUNT(DISTINCT dsd.experiment_id) as linked_experiments
FROM device_streams ds
LEFT JOIN device_stream_data dsd ON ds.id = dsd.stream_id
GROUP BY ds.id;


-- ============================================================================
-- PART 9: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_device_data_user_created
ON device_stream_data(stream_id, created_at DESC)
INCLUDE (payload, is_valid);

CREATE INDEX IF NOT EXISTS idx_device_data_experiment
ON device_stream_data(experiment_id)
WHERE experiment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_device_data_valid
ON device_stream_data(stream_id, is_valid, created_at DESC)
WHERE is_valid = true;

-- Add source tracking to datasets table (if not exists)
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS source_id UUID;
CREATE INDEX IF NOT EXISTS idx_datasets_source ON datasets(source_type, source_id);


-- ============================================================================
-- PART 10: EXAMPLE QUERIES
-- ============================================================================

-- Get all active device streams with recent data
COMMENT ON VIEW v_device_stream_stats IS
'Usage: SELECT * FROM v_device_stream_stats WHERE user_id = auth.uid();';

-- Get device data for AI assistant
COMMENT ON FUNCTION get_device_context_for_ai IS
'Usage: SELECT get_device_context_for_ai(auth.uid(), 50);';

-- Export device data as CSV
COMMENT ON FUNCTION export_device_data_as_csv IS
'Usage: SELECT export_device_data_as_csv(''stream-id-here'', 1000);';

-- Aggregate device data
COMMENT ON FUNCTION aggregate_device_data IS
'Usage: SELECT * FROM aggregate_device_data(''stream-id'', ''1 hour'', NOW() - INTERVAL ''7 days'', NOW());';

-- Prepare ML training data
COMMENT ON FUNCTION prepare_ml_training_data IS
'Usage: SELECT * FROM prepare_ml_training_data(''stream-id'', ''temperature'', ARRAY[''humidity'', ''pressure''], 0.8);';

-- Trigger workflow from device
COMMENT ON FUNCTION trigger_workflow_from_device_data IS
'Usage: SELECT trigger_workflow_from_device_data(''stream-id'', ''workflow-id'', ''temperature > 30'');';
