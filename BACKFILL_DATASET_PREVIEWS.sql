-- =====================================================================
-- BACKFILL DATASET PREVIEWS
-- =====================================================================
-- Run this AFTER MASTER_DATABASE_SETUP.sql
-- This backfills preview_data and schema for existing datasets
-- =====================================================================

DO $$
DECLARE
  dataset_record RECORD;
  v_preview_data JSONB;
  v_schema JSONB;
  v_columns JSONB;
  fixed_count INTEGER := 0;
  skipped_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔄 Starting dataset preview backfill...';
  RAISE NOTICE '';

  -- Loop through all datasets that are 'ready' but missing preview_data
  FOR dataset_record IN
    SELECT id, name, row_count, column_count
    FROM datasets
    WHERE status = 'ready'
    AND (preview_data IS NULL OR schema IS NULL)
    ORDER BY created_at DESC
  LOOP
    RAISE NOTICE '📝 Processing dataset: % (ID: %)', dataset_record.name, dataset_record.id;

    -- Get first 100 rows from dataset_rows
    SELECT jsonb_agg(data ORDER BY row_index)
    INTO v_preview_data
    FROM (
      SELECT data, row_index
      FROM dataset_rows
      WHERE dataset_id = dataset_record.id
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
    WHERE dataset_id = dataset_record.id;

    -- Check if we got data
    IF v_preview_data IS NOT NULL AND v_columns IS NOT NULL THEN
      -- Build schema object
      v_schema := jsonb_build_object('columns', v_columns);

      -- Update the dataset
      UPDATE datasets
      SET
        preview_data = v_preview_data,
        schema = v_schema
      WHERE id = dataset_record.id;

      fixed_count := fixed_count + 1;
      RAISE NOTICE '   ✅ Fixed: % rows, % columns',
        jsonb_array_length(v_preview_data),
        jsonb_array_length(v_columns);
    ELSE
      skipped_count := skipped_count + 1;
      RAISE NOTICE '   ⚠️  Skipped: No data found in dataset_rows or dataset_columns';
    END IF;

    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 Backfill Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Datasets fixed: %', fixed_count;
  RAISE NOTICE 'Datasets skipped: %', skipped_count;
  RAISE NOTICE '';

  IF fixed_count > 0 THEN
    RAISE NOTICE '✅ Success! % dataset(s) now have preview data', fixed_count;
  END IF;

  IF skipped_count > 0 THEN
    RAISE NOTICE '⚠️  Warning: % dataset(s) had no data to backfill', skipped_count;
    RAISE NOTICE '   These datasets may need to be re-uploaded';
  END IF;

  RAISE NOTICE '========================================';
END $$;
