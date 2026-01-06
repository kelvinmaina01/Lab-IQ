
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()

data = [
    "GRANT ALL ON analyses TO anon, authenticated, service_role;",
    "GRANT ALL ON ml_models TO anon, authenticated, service_role;",
    "GRANT ALL ON team_members TO anon, authenticated, service_role;",
    "GRANT ALL ON shared_projects TO anon, authenticated, service_role;",
    "GRANT ALL ON chat_channels TO anon, authenticated, service_role;",
    "GRANT ALL ON chat_messages TO anon, authenticated, service_role;",
    "GRANT ALL ON notifications TO anon, authenticated, service_role;",
    "NOTIFY pgrst, 'reload schema';"
]

for stmt in data:
    try:
        print(f"Executing: {stmt}")
        cur.execute(stmt)
    except Exception as e:
        print(f"Failed: {e}")

cur.close()
conn.close()
