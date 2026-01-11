import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_RUN_KEY") or os.environ.get("SUPABASE_KEY") or os.environ.get("VITE_SUPABASE_KEY") or os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_KEY/VITE_SUPABASE_KEY in .env")
    exit(1)

try:
    supabase: Client = create_client(url, key)
    # Perform a simple query to list tables (or just check health by querying a known table like 'profiles')
    print("Attempting to connect to Supabase...")
    
    # Try to select from 'profiles' (common table) or just getting user
    # Note: Service role key might be needed for some ops, but let's try anon/service key present
    
    # Check if 'profiles' exists
    response = supabase.table("profiles").select("*", count="exact").limit(1).execute()
    print(f"Connection Successful! profiles table count query executed.")
    # print(f"Data: {response.data}") # Don't print sensitive data
    print("Supabase DB is accessible.")
    
except Exception as e:
    print(f"Connection Failed: {e}")
