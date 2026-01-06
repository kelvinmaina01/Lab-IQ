// DuckDB-WASM execution engine for running SQL in the browser

import { ExecutionResult, IExecutionEngine } from './types';

// Dynamically import duckdb types
type DuckDB = any;

export class DuckDBExecutionEngine implements IExecutionEngine {
  private db: any = null;
  private conn: any = null;
  private loadingPromise: Promise<void> | null = null;
  private ready: boolean = false;

  async initialize(): Promise<void> {
    if (this.loadingPromise) return this.loadingPromise;
    if (this.ready) return;

    this.loadingPromise = (async () => {
      try {
        console.log('Initializing DuckDB-WASM...');

        // Dynamically import DuckDB to avoid bundling issues
        const duckdb = await import('@duckdb/duckdb-wasm');

        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

        // Select appropriate bundle
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

        if (!bundle.mainWorker) {
          throw new Error('No worker bundle available');
        }

        // Create worker
        const worker_url = URL.createObjectURL(
          new Blob([`importScripts("${bundle.mainWorker}");`], {
            type: 'text/javascript',
          })
        );

        const worker = new Worker(worker_url);
        const logger = new duckdb.ConsoleLogger();

        // Initialize DuckDB
        this.db = new duckdb.AsyncDuckDB(logger, worker);
        await this.db.instantiate(bundle.mainModule);

        // Create connection
        this.conn = await this.db.connect();

        this.ready = true;
        console.log('DuckDB-WASM ready');
      } catch (error) {
        console.error('Failed to initialize DuckDB:', error);
        this.loadingPromise = null;
        throw error;
      }
    })();

    return this.loadingPromise;
  }

  isReady(): boolean {
    return this.ready;
  }

  async executeCode(sql: string, datasetUrl?: string): Promise<ExecutionResult> {
    await this.initialize();

    if (!this.conn) {
      return {
        success: false,
        error: 'DuckDB connection not initialized',
      };
    }

    const startTime = performance.now();

    try {
      // Load dataset if provided
      if (datasetUrl) {
        try {
          // Drop table if it exists
          await this.conn.query('DROP TABLE IF EXISTS dataset');

          // Load CSV from URL
          await this.conn.query(`
            CREATE TABLE dataset AS
            SELECT * FROM read_csv_auto('${datasetUrl}', header=true)
          `);

          console.log('Dataset loaded into DuckDB');
        } catch (loadError) {
          console.error('Dataset loading error:', loadError);
          return {
            success: false,
            error: `Failed to load dataset: ${loadError instanceof Error ? loadError.message : String(loadError)}`,
          };
        }
      }

      // Execute SQL query
      const result = await this.conn.query(sql);

      // Convert result to JSON
      const rows = result.toArray().map((row) => {
        const obj: Record<string, any> = {};
        result.schema.fields.forEach((field, idx) => {
          obj[field.name] = row[idx];
        });
        return obj;
      });

      const columns = result.schema.fields.map((f) => f.name);
      const executionTime = performance.now() - startTime;

      return {
        success: true,
        output: rows,
        rowCount: rows.length,
        columns,
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

  async cleanup(): Promise<void> {
    try {
      if (this.conn) {
        await this.conn.close();
        this.conn = null;
      }
      if (this.db) {
        await this.db.terminate();
        this.db = null;
      }
      this.ready = false;
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Singleton instance
let duckdbEngine: DuckDBExecutionEngine | null = null;

export function getDuckDBEngine(): DuckDBExecutionEngine {
  if (!duckdbEngine) {
    duckdbEngine = new DuckDBExecutionEngine();
  }
  return duckdbEngine;
}
