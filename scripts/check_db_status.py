
import os
from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

# Force read env file
env_path = r'c:\Users\dell\Desktop\Lab-IQ\.env'
print(f"Reading credentials from {env_path}")
try:
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'): continue
            if '=' not in line: continue
            
            key_name, value = line.split('=', 1)
            key_name = key_name.strip()
            value = value.strip().strip('"').strip("'")
            
            if key_name == 'VITE_SUPABASE_URL':
                url = value
            elif key_name == 'SUPABASE_ANON_KEY' or key_name == 'VITE_SUPABASE_ANON_KEY':
                key = value
except Exception as e:
    print(f"Error reading .env: {e}")

if not url or not key:
    print("CRITICAL: Still could not find Supabase credentials (URL/ANON_KEY) in .env")
    exit(1)

supabase: Client = create_client(url, key)

print("--- Checking latest Notebooks ---")
try:
    response = supabase.table("notebooks").select("*").order("created_at", desc=True).limit(5).execute()
    notebooks = response.data
    for nb in notebooks:
        print(f"ID: {nb.get('id')}")
        print(f"Title: {nb.get('title')}")
        print(f"Created At: {nb.get('created_at')}")
        print(f"Dataset ID: {nb.get('dataset_id')}")
        print("-" * 20)
except Exception as e:
    print(f"Error fetching notebooks: {e}")

print("\n--- Checking latest Pinned Insights ---")
try:
    response = supabase.table("pinned_insights").select("*").order("created_at", desc=True).limit(5).execute()
    insights = response.data
    if not insights:
        print("No pinned insights found.")
    for ins in insights:
        print(f"ID: {ins.get('id')}")
        print(f"Title: {ins.get('title')}")
        print(f"Notebook ID: {ins.get('notebook_id')}")
        print("-" * 20)
except Exception as e:
    print(f"Error fetching pinned insights: {e}")
