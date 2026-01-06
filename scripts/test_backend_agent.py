
import requests
import json

url = "http://127.0.0.1:5000/api/v1/generate-notebook"

# Mock Dataset: Simple Medical Data
data_rows = [
    {"age": 25, "glucose": 80, "insulin": 12},
    {"age": 30, "glucose": 100, "insulin": 15},
    {"age": 35, "glucose": 120, "insulin": 20},
    {"age": 40, "glucose": 140, "insulin": 25},
    {"age": 45, "glucose": 160, "insulin": 30},
    {"age": 50, "glucose": 180, "insulin": 35}, # High
]

dataset_context = {
    "columns": ["age", "glucose", "insulin"],
    "preview": data_rows[:2]
}

payload = {
    "user_prompt": "Analyze the relationship between glucose and insulin. Are there any trends?",
    "dataset_context": dataset_context,
    "data_rows": data_rows
}

print("Sending request to Backend Agent...")
try:
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        print("\nSUCCESS! Notebook Generated:")
        result = response.json()
        print(json.dumps(result, indent=2))
        
        # Validation
        cells = result.get("cells", [])
        has_reasoning = any(c['cell_type'] == 'reasoning' for c in cells)
        has_code = any(c['cell_type'] == 'code' for c in cells)
        has_chart = any(c['cell_type'] == 'visualization' for c in cells)
        
        print("\n--- Validation Checks ---")
        print(f"Has Reasoning Cell: {has_reasoning}")
        
        # Verify Suggestions
        suggestions_cell = next((c for c in result['cells'] if c['cell_type'] == 'suggestion'), None)
        if suggestions_cell:
            print("\n--- Verified Suggestions ---")
            for idx, s in enumerate(suggestions_cell['content']['suggestions']):
                print(f"{idx+1}. {s['prompt']} ({s['rationale']})")
        else:
            print("\nWARNING: No suggestions cell found.")
            
    else:
        print(f"Error {response.status_code}: {response.text}")

except Exception as e:
    print(f"\nERROR: {e}")
