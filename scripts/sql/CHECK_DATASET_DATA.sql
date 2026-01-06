-- Check if dataset_rows has ANY data
SELECT COUNT(*) as total_rows FROM dataset_rows;

-- Check which datasets have data
SELECT 
  d.id,
  d.name,
  d.user_id,
  COUNT(dr.id) as row_count
FROM datasets d
LEFT JOIN dataset_rows dr ON d.id = dr.dataset_id
GROUP BY d.id, d.name, d.user_id
ORDER BY row_count DESC
LIMIT 10;

-- Check the specific dataset you're using
SELECT 
  d.name,
  d.row_count as metadata_row_count,
  COUNT(dr.id) as actual_row_count
FROM datasets d
LEFT JOIN dataset_rows dr ON d.id = dr.dataset_id
WHERE d.id = 'ca1c7938-7ebe-4d94-adca-76d8aa77cfd5'
GROUP BY d.id, d.name, d.row_count;
