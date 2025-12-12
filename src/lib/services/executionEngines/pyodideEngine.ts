// Pyodide execution engine for running Python code in the browser

import { ExecutionResult, IExecutionEngine } from './types';

// Dynamically import pyodide types
type PyodideInterface = any;

export class PyodideExecutionEngine implements IExecutionEngine {
  private pyodide: PyodideInterface | null = null;
  private loadingPromise: Promise<void> | null = null;
  private ready: boolean = false;

  async initialize(): Promise<void> {
    if (this.loadingPromise) return this.loadingPromise;
    if (this.ready) return;

    this.loadingPromise = (async () => {
      try {
        console.log('Initializing Pyodide...');

        // Dynamically import Pyodide to avoid bundling issues
        const { loadPyodide } = await import('pyodide');

        // Load Pyodide from CDN
        this.pyodide = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
        });

        console.log('Pyodide loaded, installing packages...');

        // Pre-load common scientific packages
        await this.pyodide.loadPackage([
          'numpy',
          'pandas',
          'matplotlib',
          'scipy',
        ]);

        // Set up matplotlib to work in browser
        await this.pyodide.runPythonAsync(`
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import sys
from io import StringIO

# Redirect stdout
sys.stdout = StringIO()
        `);

        this.ready = true;
        console.log('Pyodide ready with packages loaded');
      } catch (error) {
        console.error('Failed to initialize Pyodide:', error);
        this.loadingPromise = null;
        throw error;
      }
    })();

    return this.loadingPromise;
  }

  isReady(): boolean {
    return this.ready;
  }

  async executeCode(code: string, datasetUrl?: string): Promise<ExecutionResult> {
    await this.initialize();

    if (!this.pyodide) {
      return {
        success: false,
        error: 'Pyodide not initialized',
      };
    }

    const startTime = performance.now();

    try {
      // Clear previous stdout
      await this.pyodide.runPythonAsync(`
sys.stdout = StringIO()
plt.close('all')
      `);

      // Load dataset if provided
      if (datasetUrl) {
        try {
          const datasetLoadCode = `
import pandas as pd
import pyodide.http
import io

# Fetch dataset
response = await pyodide.http.pyfetch("${datasetUrl}")
content = await response.bytes()
df = pd.read_csv(io.BytesIO(content))
print(f"Dataset loaded: {len(df)} rows, {len(df.columns)} columns")
`;
          await this.pyodide.runPythonAsync(datasetLoadCode);
        } catch (loadError) {
          console.error('Dataset loading error:', loadError);
          return {
            success: false,
            error: `Failed to load dataset: ${loadError instanceof Error ? loadError.message : String(loadError)}`,
          };
        }
      }

      // Execute user code
      let result;
      try {
        result = await this.pyodide.runPythonAsync(code);
      } catch (execError) {
        const traceback = this.formatTraceback(execError);
        return {
          success: false,
          error: execError instanceof Error ? execError.message : String(execError),
          traceback,
        };
      }

      // Capture stdout
      const stdout = await this.pyodide.runPythonAsync('sys.stdout.getvalue()');

      // Capture plots
      const plots = await this.capturePlots();

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        output: result,
        stdout: String(stdout),
        plots,
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        traceback: this.formatTraceback(error),
        executionTime: performance.now() - startTime,
      };
    }
  }

  private async capturePlots(): Promise<string[]> {
    if (!this.pyodide) return [];

    try {
      const plotCode = `
import matplotlib.pyplot as plt
import base64
from io import BytesIO

plots = []
for fig_num in plt.get_fignums():
    fig = plt.figure(fig_num)
    buf = BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=100)
    buf.seek(0)
    plots.append(base64.b64encode(buf.read()).decode())
    plt.close(fig)
plots
`;
      const plots = await this.pyodide.runPythonAsync(plotCode);
      return plots ? plots.toJs() : [];
    } catch (error) {
      console.error('Failed to capture plots:', error);
      return [];
    }
  }

  private formatTraceback(error: any): string {
    if (!this.pyodide) return String(error);

    try {
      // Try to get Python traceback
      const traceback = this.pyodide.runPython(`
import traceback
import sys
''.join(traceback.format_exception(*sys.exc_info()))
      `);
      return String(traceback);
    } catch {
      return String(error);
    }
  }

  async cleanup(): Promise<void> {
    if (this.pyodide) {
      try {
        await this.pyodide.runPythonAsync('plt.close("all")');
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  }
}

// Singleton instance
let pyodideEngine: PyodideExecutionEngine | null = null;

export function getPyodideEngine(): PyodideExecutionEngine {
  if (!pyodideEngine) {
    pyodideEngine = new PyodideExecutionEngine();
  }
  return pyodideEngine;
}
