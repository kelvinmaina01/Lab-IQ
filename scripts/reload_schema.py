
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()

try:
    print("Reloading PostgREST schema cache...")
    cur.execute("NOTIFY pgrst, 'reload schema';")
    print("Signal sent.")
except Exception as e:
    print(f"Failed: {e}")

cur.close()
conn.close()
