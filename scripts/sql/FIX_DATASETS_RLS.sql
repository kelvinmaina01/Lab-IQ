-- Fix RLS on datasets table so users can see their datasets
-- This allows the frontend to load datasets for selection

-- Allow users to read their own datasets
DROP POLICY IF EXISTS "Users can view own datasets" ON datasets;
CREATE POLICY "Users can view own datasets" ON datasets
FOR SELECT
USING (auth.uid() = user_id);

-- Also allow anon to read (for testing without auth)
DROP POLICY IF EXISTS "Allow anon read datasets" ON datasets;
CREATE POLICY "Allow anon read datasets" ON datasets
FOR SELECT
USING (true);
