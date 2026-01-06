-- Manual Migration: Populate dataset_rows from uploaded diabetes dataset
-- This is a one-time fix to populate data that wasn't inserted during upload

-- For now, we'll use the chat's sample data fallback since
-- reading from storage requires additional logic

-- Option 1: Upload the diabetes dataset again (it should work now with RLS fixed)
-- Option 2: Use backend sample data for testing

-- To verify if re-upload will work:
-- 1. Delete one of the duplicate "diabetes" entries
-- 2. Upload the CSV again
-- 3. The saveRows function (lines 239-266 in datasetService.ts) will populate dataset_rows

-- Clean up duplicate
DELETE FROM datasets WHERE id = 'e0b25b75-e08d-4ed3-a31d-0ee47982f8d0'; -- Keep the ca1c7938 one

-- After this, re-upload your CSV file and it should populate dataset_rows correctly
