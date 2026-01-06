import os
from supabase import create_client, Client

# Read credentials from .env
env_path = r'c:\Users\dell\Desktop\Lab-IQ\.env'
url = None
key = None

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
            elif key_name in ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY']:
                key = value
except Exception as e:
    print(f"Error reading .env: {e}")
    exit(1)

if not url or not key:
    print("CRITICAL: Could not find Supabase credentials")
    exit(1)

supabase: Client = create_client(url, key)

print("=== Verifying ML Models Database Structure ===\n")

# Test 1: Check if ml_models table exists
try:
    result = supabase.table("ml_models").select("id").limit(1).execute()
    print("[OK] ml_models table exists")
    print(f"    Current model count: {len(result.data)}")
except Exception as e:
    print(f"[ERROR] ml_models table check failed: {e}")

# Test 2: Check if model_predictions table exists
try:
    result = supabase.table("model_predictions").select("id").limit(1).execute()
    print("[OK] model_predictions table exists")
except Exception as e:
    print(f"[ERROR] model_predictions table check failed: {e}")

# Test 3: Check if model_evaluations table exists
try:
    result = supabase.table("model_evaluations").select("id").limit(1).execute()
    print("[OK] model_evaluations table exists")
except Exception as e:
    print(f"[ERROR] model_evaluations table check failed: {e}")

# Test 4: Check datasets table (required for foreign key)
try:
    result = supabase.table("datasets").select("id").limit(1).execute()
    print("[OK] datasets table exists")
    print(f"    Current dataset count: {len(result.data)}")
except Exception as e:
    print(f"[ERROR] datasets table check failed: {e}")

print("\n=== Database Migration Verification Complete ===")
