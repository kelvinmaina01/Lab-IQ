// WebR execution engine for running R code in the browser

import { ExecutionResult, IExecutionEngine } from './types';

// Dynamically import webr types
type WebR = any;
type RObject = any;

export class WebRExecutionEngine implements IExecutionEngine {
  private webR: WebR | null = null;
  private loadingPromise: Promise<void> | null = null;
  private ready: boolean = false;

  async initialize(): Promise<void> {
    if (this.loadingPromise) return this.loadingPromise;
    if (this.ready) return;

    this.loadingPromise = (async () => {
      try {
        console.log('Initializing WebR...');

        // Dynamically import WebR to avoid bundling issues
        const { WebR } = await import('webr');

        this.webR = new WebR({
          baseUrl: 'https://webr.r-wasm.org/latest/',
          serviceWorkerUrl: '/webr-serviceworker.js',
        });

        await this.webR.init();

        console.log('WebR loaded, installing packages...');

        // Install common R packages (this may take time on first load)
        try {
          await this.webR.evalR(`
            if (!require("dplyr")) install.packages("dplyr", repos = "https://cran.r-project.org")
            if (!require("ggplot2")) install.packages("ggplot2", repos = "https://cran.r-project.org")
            library(dplyr)
            library(ggplot2)
          `);
        } catch (pkgError) {
          console.warn('Some R packages failed to install:', pkgError);
          // Continue anyway - user might not need them
        }

        this.ready = true;
        console.log('WebR ready');
      } catch (error) {
        console.error('Failed to initialize WebR:', error);
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

    if (!this.webR) {
      return {
        success: false,
        error: 'WebR not initialized',
      };
    }

    const startTime = performance.now();

    try {
      // Capture output
      await this.webR.evalR('output_buffer <- character(0)');

      // Load dataset if provided
      if (datasetUrl) {
        try {
          await this.webR.evalR(`
            df <- read.csv("${datasetUrl}")
            output_buffer <- c(output_buffer, paste("Dataset loaded:", nrow(df), "rows,", ncol(df), "columns"))
          `);
        } catch (loadError) {
          console.error('Dataset loading error:', loadError);
          return {
            success: false,
            error: `Failed to load dataset: ${loadError instanceof Error ? loadError.message : String(loadError)}`,
          };
        }
      }

      // Wrap user code to capture output
      const wrappedCode = `
tryCatch({
  ${code}
}, error = function(e) {
  stop(paste("Error:", e$message))
})
      `;

      // Execute user code
      const result = await this.webR.evalR(wrappedCode);

      // Get output
      let output: any;
      try {
        output = await result.toJs();
      } catch {
        output = await result.toString();
      }

      // Get any printed output
      const stdout = await this.webR.evalR('paste(output_buffer, collapse = "\\n")');
      const stdoutStr = await stdout.toString();

      // Capture plots (if any)
      const plots = await this.capturePlots();

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        output,
        stdout: stdoutStr,
        plots,
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: performance.now() - startTime,
      };
    }
  }

  private async capturePlots(): Promise<string[]> {
    if (!this.webR) return [];

    try {
      // Check if there are any plots to capture
      const hasPlots = await this.webR.evalR('length(dev.list()) > 0');
      const hasPlotsValue = await hasPlots.toBoolean();

      if (!hasPlotsValue) {
        return [];
      }

      // Capture plot as PNG
      const plotCode = `
tmpfile <- tempfile(fileext = ".png")
png(tmpfile, width = 800, height = 600)
dev.copy()
dev.off()
base64enc::base64encode(tmpfile)
      `;

      const plotResult = await this.webR.evalR(plotCode);
      const base64Plot = await plotResult.toString();

      return [base64Plot];
    } catch (error) {
      console.error('Failed to capture plots:', error);
      return [];
    }
  }

  async cleanup(): Promise<void> {
    if (this.webR) {
      try {
        // Clear workspace and close graphics devices
        await this.webR.evalR(`
          graphics.off()
          rm(list = ls())
        `);
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  }
}

// Singleton instance
let webrEngine: WebRExecutionEngine | null = null;

export function getWebREngine(): WebRExecutionEngine {
  if (!webrEngine) {
    webrEngine = new WebRExecutionEngine();
  }
  return webrEngine;
}
