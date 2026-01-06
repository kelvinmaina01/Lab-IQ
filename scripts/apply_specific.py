
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

files = [
    "supabase/migrations/20251101041013_1487f63f-0af4-4238-b5e5-5fa394f84229.sql", # Likely Analyses
    "supabase/migrations/20251216_collaboration_system.sql" # Collaborations
]

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

for fpath in files:
    try:
        print(f"Applying {fpath}...")
        with open(fpath, 'r', encoding='utf-8') as f:
            sql = f.read()
        cur.execute(sql)
        conn.commit()
        print("Success.")
    except Exception as e:
        conn.rollback()
        print(f"Failed: {e}")

cur.close()
conn.close()
