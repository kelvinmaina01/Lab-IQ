import time
import pandas as pd
import sys
import os

# Ensure lab_iq is in path
sys.path.append(os.getcwd())

from lab_iq.sandbox import LocalSandbox

def test_sandbox_speed():
    print("--- Testing LocalSandbox Performance ---")
    
    # 1. Init
    start_init = time.time()
    sandbox = LocalSandbox()
    print(f"Init Time: {time.time() - start_init:.4f}s")
    
    # 2. Data
    df = pd.DataFrame({
        'A': range(1000),
        'B': [x**2 for x in range(1000)]
    })
    
    # 3. Code Verification
    code = """
import matplotlib.pyplot as plt
metrics = {'mean_a': df['A'].mean()}
plt.figure()
plt.plot(df['A'], df['B'])
plt.title("Speed Test")
# plt.show() # Sandbox handles this
"""
    
    print("\nExecuting Code...")
    start_exec = time.time()
    result = sandbox.execute(code, df)
    duration = time.time() - start_exec
    
    print(f"Execution Time: {duration:.4f}s")
    print(f"Success: {result.success}")
    print(f"Artifacts: {list(result.artifacts.keys())}")
    
    if result.error:
        print(f"Error: {result.error}")
        
    if duration > 2.0:
        print("WARNING: Sandbox valid but Slow (>2s)")
    else:
        print("SPEED: OK")

if __name__ == "__main__":
    test_sandbox_speed()
