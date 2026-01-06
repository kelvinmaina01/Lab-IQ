-- ============================================================================
-- STEP-BY-STEP VERIFICATION QUERIES
-- Run these after uploading your dataset
-- ============================================================================

-- STEP 1: Check if dataset was created
-- Run this immediately after upload completes
SELECT 
  id,
  name,
  row_count,
  column_count,
  status,
  created_at
FROM datasets
ORDER BY created_at DESC
LIMIT 5;

-- STEP 2: Verify dataset_rows were populated
-- Replace 'YOUR_DATASET_ID' with the id from Step 1
SELECT 
  d.name,
  d.row_count as metadata_row_count,
  COUNT(dr.id) as actual_row_count,
  CASE 
    WHEN COUNT(dr.id) = d.row_count THEN '✅ MATCH'
    WHEN COUNT(dr.id) = 0 THEN '❌ NO DATA'
    ELSE '⚠️ PARTIAL'
  END as status
FROM datasets d
LEFT JOIN dataset_rows dr ON d.id = dr.dataset_id
WHERE d.id = 'YOUR_DATASET_ID'  -- Replace with your dataset ID
GROUP BY d.id, d.name, d.row_count;

-- STEP 3: Sample the actual data
-- Replace 'YOUR_DATASET_ID' with your dataset ID
SELECT 
  row_index,
  data
FROM dataset_rows
WHERE dataset_id = 'YOUR_DATASET_ID'
ORDER BY row_index
LIMIT 5;

-- STEP 4: Quick check - Latest uploaded dataset
SELECT 
  d.id,
  d.name,
  COUNT(dr.id) as rows_in_db
FROM datasets d
LEFT JOIN dataset_rows dr ON d.id = dr.dataset_id
WHERE d.created_at > NOW() - INTERVAL '5 minutes'
GROUP BY d.id, d.name
ORDER BY d.created_at DESC;
