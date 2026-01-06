
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()

sql = """
-- 1. Create helper function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION get_user_lab_ids(lookup_uid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT lab_id FROM team_members WHERE user_id = lookup_uid
$$;

-- 2. Drop recursion-prone policy
DROP POLICY IF EXISTS "Users can view team members in their lab" ON team_members;

-- 3. Re-create using the function
CREATE POLICY "Users can view team members in their lab" ON team_members FOR SELECT USING (
  lab_id IN (SELECT get_user_lab_ids(auth.uid()))
);

GRANT EXECUTE ON FUNCTION get_user_lab_ids TO anon, authenticated, service_role;
"""

try:
    print("Applying RLS recursion fix...")
    cur.execute(sql)
    print("Success.")
except Exception as e:
    print(f"Failed: {e}")

cur.close()
conn.close()
