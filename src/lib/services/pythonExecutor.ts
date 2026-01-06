/**
 * Python Executor Service
 * Production-grade Python code execution using Pyodide
 *
 * Features:
 * - Browser-based Python execution (zero server cost)
 * - Pandas, NumPy, Matplotlib support
 * - Secure sandbox execution
 * - Timeout handling
 * - Memory management
 */

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  plots?: string[]; // Base64 encoded plot images
  dataframes?: any[];
  execution_time_ms: number;
  memory_used_mb?: number;
}

interface PyodideInstance {
  pyodide: any;
  isReady: boolean;
  lastUsed: number;
}

class PythonExecutor {
  private static instance: PythonExecutor;
  private pyodideInstance: PyodideInstance | null = null;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;
  private readonly TIMEOUT_MS = 30000; // 30 second timeout
  private readonly PYODIDE_VERSION = '0.25.0';

  private constructor() {}

  static getInstance(): PythonExecutor {
    if (!PythonExecutor.instance) {
      PythonExecutor.instance = new PythonExecutor();
    }
    return PythonExecutor.instance;
  }

  /**
   * Initialize Pyodide (lazy loading)
   */
  async initialize(): Promise<void> {
    if (this.pyodideInstance?.isReady) {
      return;
    }

    if (this.isLoading && this.loadPromise) {
      await this.loadPromise;
      return;
    }

    this.isLoading = true;

    this.loadPromise = new Promise(async (resolve, reject) => {
      try {
        // Load Pyodide from CDN
        const script = document.createElement('script');
        script.src = `https://cdn.jsdelivr.net/pyodide/v${this.PYODIDE_VERSION}/full/pyodide.js`;

        script.onload = async () => {
          try {
            // @ts-ignore - Pyodide is loaded globally
            const pyodide = await window.loadPyodide({
              indexURL: `https://cdn.jsdelivr.net/pyodide/v${this.PYODIDE_VERSION}/full/`,
            });

            // Load essential packages
            await pyodide.loadPackage(['pandas', 'numpy', 'micropip']);

            // Setup matplotlib for browser
            await pyodide.runPythonAsync(`
import micropip
await micropip.install('matplotlib')
import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
import io
import base64

def get_plot_as_base64():
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
    buf.seek(0)
    img_str = base64.b64encode(buf.getvalue()).decode('utf-8')
    plt.close()
    return img_str

import pandas as pd
import numpy as np
print("Python environment ready with pandas, numpy, matplotlib")
            `);

            this.pyodideInstance = {
              pyodide,
              isReady: true,
              lastUsed: Date.now(),
            };

            console.log('Pyodide initialized successfully');
            resolve();
          } catch (error) {
            console.error('Error initializing Pyodide:', error);
            reject(error);
          }
        };

        script.onerror = (error) => {
          console.error('Failed to load Pyodide script:', error);
          reject(new Error('Failed to load Pyodide'));
        };

        // Check if script already exists
        if (!document.querySelector(`script[src*="pyodide.js"]`)) {
          document.head.appendChild(script);
        } else {
          // Already loading
          setTimeout(() => {
            if (this.pyodideInstance?.isReady) {
              resolve();
            } else {
              // Wait for loading
              const checkInterval = setInterval(() => {
                if (this.pyodideInstance?.isReady) {
                  clearInterval(checkInterval);
                  resolve();
                }
              }, 100);
            }
          }, 100);
        }
      } catch (error) {
        reject(error);
      }
    });

    try {
      await this.loadPromise;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Check if Pyodide is ready
   */
  isReady(): boolean {
    return this.pyodideInstance?.isReady || false;
  }

  /**
   * Execute Python code
   */
  async execute(
    code: string,
    dataset?: any,
    timeout: number = this.TIMEOUT_MS
  ): Promise<ExecutionResult> {
    const startTime = performance.now();

    try {
      // Ensure Pyodide is initialized
      await this.initialize();

      if (!this.pyodideInstance?.pyodide) {
        throw new Error('Pyodide not initialized');
      }

      const pyodide = this.pyodideInstance.pyodide;

      // Inject dataset if provided
      if (dataset?.data && Array.isArray(dataset.data)) {
        const dataJson = JSON.stringify(dataset.data);
        await pyodide.runPythonAsync(`
import json
_dataset_json = '''${dataJson.replace(/'/g, "\\'")}'''
df = pd.DataFrame(json.loads(_dataset_json))
print(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        `);
      }

      // Execute with timeout
      const result = await this.executeWithTimeout(pyodide, code, timeout);

      // Capture any plots
      const plots = await this.capturePlots(pyodide);

      // Get output
      const executionTime = performance.now() - startTime;

      return {
        success: true,
        output: result,
        plots,
        execution_time_ms: Math.round(executionTime),
      };
    } catch (error: any) {
      const executionTime = performance.now() - startTime;
      return {
        success: false,
        output: '',
        error: this.formatError(error),
        execution_time_ms: Math.round(executionTime),
      };
    }
  }

  /**
   * Execute code with timeout
   */
  private async executeWithTimeout(
    pyodide: any,
    code: string,
    timeout: number
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Execution timed out after ${timeout}ms`));
      }, timeout);

      try {
        // Capture stdout
        await pyodide.runPythonAsync(`
import sys
from io import StringIO
_stdout_capture = StringIO()
sys.stdout = _stdout_capture
        `);

        // Execute user code
        await pyodide.runPythonAsync(code);

        // Get captured output
        const output = await pyodide.runPythonAsync(`
sys.stdout = sys.__stdout__
_stdout_capture.getvalue()
        `);

        clearTimeout(timeoutId);
        resolve(output);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Capture any matplotlib plots
   */
  private async capturePlots(pyodide: any): Promise<string[]> {
    try {
      const hasPlots = await pyodide.runPythonAsync(`
import matplotlib.pyplot as plt
len(plt.get_fignums()) > 0
      `);

      if (!hasPlots) return [];

      const plotBase64 = await pyodide.runPythonAsync(`
get_plot_as_base64()
      `);

      return plotBase64 ? [plotBase64] : [];
    } catch (error) {
      console.warn('Failed to capture plots:', error);
      return [];
    }
  }

  /**
   * Format Python error messages
   */
  private formatError(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'An unknown error occurred';
  }

  /**
   * Run specific benchmark tests
   */
  async benchmark(code: string, iterations: number = 5): Promise<{
    average_ms: number;
    min_ms: number;
    max_ms: number;
    times: number[];
  }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const result = await this.execute(code);
      times.push(result.execution_time_ms);
    }

    return {
      average_ms: times.reduce((a, b) => a + b, 0) / times.length,
      min_ms: Math.min(...times),
      max_ms: Math.max(...times),
      times,
    };
  }

  /**
   * Clean up and reset the Python environment
   */
  async reset(): Promise<void> {
    if (this.pyodideInstance?.pyodide) {
      try {
        await this.pyodideInstance.pyodide.runPythonAsync(`
# Clear all user-defined variables
for name in list(dir()):
    if not name.startswith('_'):
        del globals()[name]

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
plt.close('all')
        `);
      } catch (error) {
        console.warn('Error resetting Python environment:', error);
      }
    }
  }
}

// Export singleton getter
export function getPythonExecutor(): PythonExecutor {
  return PythonExecutor.getInstance();
}

export type { ExecutionResult };
