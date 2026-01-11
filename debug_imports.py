import sys
import os

print(f"Executable: {sys.executable}")
print("Sys Path:")
for p in sys.path:
    print(f"  {p}")

try:
    import jsonpointer
    print(f"\nSUCCESS: jsonpointer imported from {jsonpointer.__file__}")
except ImportError as e:
    print(f"\nFAILURE: jsonpointer import failed: {e}")

try:
    from ml_service.agent_graph import run_agent
    print("SUCCESS: agent_graph imported")
except Exception as e:
    print(f"FAILURE: agent_graph import failed: {e}")
