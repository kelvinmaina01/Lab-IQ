-- Fix RLS for dataset_rows to allow backend anon access
-- This allows the Python backend to fetch data using the anon key

-- Add policy for anon access (for backend AI agent)
DROP POLICY IF EXISTS "Allow anon read for AI agent" ON dataset_rows;
CREATE POLICY "Allow anon read for AI agent" ON dataset_rows 
FOR SELECT
USING (true);  -- Allow anon key to read all rows (backend needs this for chat)

-- Keep existing authenticated policy
DROP POLICY IF EXISTS "Users view rows for own datasets" ON dataset_rows;
CREATE POLICY "Users view rows for own datasets" ON dataset_rows 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM datasets 
  WHERE datasets.id = dataset_rows.dataset_id 
  AND datasets.user_id = auth.uid()
));
