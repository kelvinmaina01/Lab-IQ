-- Test query to check if datasets exist
SELECT 
  d.id,
  d.name,
  d.file_name,
  d.row_count,
  d.created_at,
  d.user_id,
  COUNT(dc.id) as column_count
FROM datasets d
LEFT JOIN dataset_columns dc ON d.id = dc.dataset_id
GROUP BY d.id, d.name, d.file_name, d.row_count, d.created_at, d.user_id
ORDER BY d.created_at DESC;

-- Check what user_id your auth user has
SELECT id, email FROM auth.users LIMIT 5;
