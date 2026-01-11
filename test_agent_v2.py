
import asyncio
import json
import os
from dotenv import load_dotenv

# Load env vars
load_dotenv()

async def test():
    try:
        from agent_graph import run_agent
        
        print("Running Agent Test...")
        # Simple query that should trigger planner -> coder -> executor -> answer
        query = "Generate a sample dataframe with columns Age and Income, and calculate the correlation."
        
        result = await run_agent(query)
        
        print("\n--- Result JSON ---")
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Fix python path to allow imports
    import sys
    sys.path.append(os.path.join(os.getcwd(), 'ml-service'))
    sys.path.append(os.getcwd())
    
    asyncio.run(test())
