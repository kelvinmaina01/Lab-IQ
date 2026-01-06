
import os
import psycopg2
from dotenv import load_dotenv
import glob

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def run_migrations():
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env")
        return

    print(f"Connecting to database...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Get all .sql files in supabase/migrations
        migration_files = sorted(glob.glob("supabase/migrations/*.sql"))
        
        if not migration_files:
            print("No migration files found in supabase/migrations/")
            return

        print(f"Found {len(migration_files)} migration files.")

        # Create a table to track migrations if it doesn't exist
        cur.execute("""
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        conn.commit()

        for sql_file in migration_files:
            file_name = os.path.basename(sql_file)
            
            # Check if already applied
            cur.execute("SELECT id FROM _migrations WHERE name = %s", (file_name,))
            if cur.fetchone():
                print(f"Skipping {file_name} (already applied)")
                continue

            print(f"Applying {file_name}...")
            with open(sql_file, 'r', encoding='utf-8') as f:
                sql = f.read()
                
            try:
                cur.execute(sql)
                cur.execute("INSERT INTO _migrations (name) VALUES (%s)", (file_name,))
                conn.commit()
                print(f"Successfully applied {file_name}")
            except Exception as e:
                conn.rollback()
                print(f"Failed to apply {file_name}: {e}")
                print("Continuing to next migration...")
                continue

        cur.close()
        conn.close()
        print("Migration process completed.")

    except Exception as e:
        print(f"Database connection failed: {e}")

if __name__ == "__main__":
    run_migrations()
