-- =====================================================================
-- Fix Existing Dataset - Add Preview Data
-- =====================================================================
-- This script backfills preview_data for datasets that don't have it
-- Run this in Supabase SQL Editor
-- =====================================================================

-- For dataset ID: 060b1179-604c-46ff-99ad-e7bdb7eda8a3
-- We'll build preview_data from the dataset_rows table

DO $$
DECLARE
  v_dataset_id UUID := '060b1179-604c-46ff-99ad-e7bdb7eda8a3';
  v_preview_data JSONB;
  v_schema JSONB;
  v_columns JSONB;
BEGIN
  -- Get first 100 rows from dataset_rows
  SELECT jsonb_agg(data ORDER BY row_index)
  INTO v_preview_data
  FROM (
    SELECT data, row_index
    FROM dataset_rows
    WHERE dataset_id = v_dataset_id
    ORDER BY row_index
    LIMIT 100
  ) sub;

  -- Get columns from dataset_columns
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', 'col_' || column_index::text,
      'column_name', column_name,
      'name', column_name,
      'data_type', data_type,
      'type', data_type,
      'nullable', nullable,
      'unique_values_count', unique_values_count
    ) ORDER BY column_index
  )
  INTO v_columns
  FROM dataset_columns
  WHERE dataset_id = v_dataset_id;

  -- Build schema object
  v_schema := jsonb_build_object('columns', v_columns);

  -- Update the dataset with preview_data and schema
  UPDATE datasets
  SET
    preview_data = v_preview_data,
    schema = v_schema
  WHERE id = v_dataset_id;

  RAISE NOTICE '✅ Updated dataset % with preview_data (% rows) and schema (% columns)',
    v_dataset_id,
    jsonb_array_length(v_preview_data),
    jsonb_array_length(v_columns);
END $$;

-- =====================================================================
-- Optionally: Fix ALL datasets that are missing preview_data
-- =====================================================================
-- Uncomment the code below to fix all datasets at once

/*
DO $$
DECLARE
  dataset_record RECORD;
  v_preview_data JSONB;
  v_schema JSONB;
  v_columns JSONB;
  fixed_count INTEGER := 0;
BEGIN
  -- Loop through all datasets that are 'ready' but missing preview_data
  FOR dataset_record IN
    SELECT id FROM datasets
    WHERE status = 'ready'
    AND (preview_data IS NULL OR schema IS NULL)
  LOOP
    -- Get first 100 rows
    SELECT jsonb_agg(data ORDER BY row_index)
    INTO v_preview_data
    FROM (
      SELECT data, row_index
      FROM dataset_rows
      WHERE dataset_id = dataset_record.id
      ORDER BY row_index
      LIMIT 100
    ) sub;

    -- Get columns
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', 'col_' || column_index::text,
        'column_name', column_name,
        'name', column_name,
        'data_type', data_type,
        'type', data_type,
        'nullable', nullable,
        'unique_values_count', unique_values_count
      ) ORDER BY column_index
    )
    INTO v_columns
    FROM dataset_columns
    WHERE dataset_id = dataset_record.id;

    -- Build schema
    v_schema := jsonb_build_object('columns', v_columns);

    -- Update dataset
    UPDATE datasets
    SET
      preview_data = v_preview_data,
      schema = v_schema
    WHERE id = dataset_record.id;

    fixed_count := fixed_count + 1;
  END LOOP;

  RAISE NOTICE '✅ Fixed % datasets with missing preview_data', fixed_count;
END $$;
*/
