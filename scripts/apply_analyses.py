
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

fpath = "supabase/migrations/20251025051545_98bde6f5-d490-4683-8543-532926ec7f89.sql"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

try:
    print(f"Applying analyses creation...")
    sql = """
    CREATE TABLE IF NOT EXISTS public.analyses (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      response TEXT NOT NULL,
      result_type TEXT, -- 'chart', 'table', 'kpi', 'text'
      result_data JSONB, -- structured data for visualizations
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    """
    cur.execute(sql)
    conn.commit()
    print("Success.")
except Exception as e:
    conn.rollback()
    print(f"Failed: {e}")

cur.close()
conn.close()
