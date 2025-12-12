/**
 * SQL Executor Service
 * Production-grade SQL execution using DuckDB-WASM
 *
 * Features:
 * - Browser-based SQL execution (zero server cost)
 * - Dataset auto-loading
 * - Query result formatting
 * - Error handling
 */

interface SQLResult {
  success: boolean;
  columns: string[];
  rows: any[];
  row_count: number;
  error?: string;
  execution_time_ms: number;
}

class SQLExecutor {
  private static instance: SQLExecutor;
  private db: any = null;
  private connection: any = null;
  private isReady = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): SQLExecutor {
    if (!SQLExecutor.instance) {
      SQLExecutor.instance = new SQLExecutor();
    }
    return SQLExecutor.instance;
  }

  /**
   * Initialize DuckDB
   */
  async initialize(): Promise<void> {
    if (this.isReady) return;

    if (this.isLoading && this.loadPromise) {
      await this.loadPromise;
      return;
    }

    this.isLoading = true;

    this.loadPromise = new Promise(async (resolve, reject) => {
      try {
        // Dynamic import DuckDB
        const duckdb = await import('@duckdb/duckdb-wasm');

        // Select bundle based on browser capabilities
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

        // Select best bundle
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

        // Create worker and logger
        const worker_url = URL.createObjectURL(
          new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
        );

        const worker = new Worker(worker_url);
        const logger = new duckdb.ConsoleLogger();

        // Instantiate DuckDB
        this.db = new duckdb.AsyncDuckDB(logger, worker);
        await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);

        URL.revokeObjectURL(worker_url);

        // Create connection
        this.connection = await this.db.connect();

        this.isReady = true;
        console.log('DuckDB-WASM initialized successfully');
        resolve();
      } catch (error) {
        console.error('Error initializing DuckDB:', error);
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
   * Check if DuckDB is ready
   */
  getIsReady(): boolean {
    return this.isReady;
  }

  /**
   * Load dataset into DuckDB
   */
  async loadDataset(tableName: string, data: any[]): Promise<void> {
    await this.initialize();

    if (!data || data.length === 0) {
      throw new Error('Dataset is empty');
    }

    try {
      // Drop existing table if exists
      await this.connection.query(`DROP TABLE IF EXISTS ${tableName}`);

      // Get columns from first row
      const columns = Object.keys(data[0]);

      // Infer types from data
      const columnDefs = columns.map((col) => {
        const sampleValue = data[0][col];
        let type = 'VARCHAR';

        if (typeof sampleValue === 'number') {
          type = Number.isInteger(sampleValue) ? 'INTEGER' : 'DOUBLE';
        } else if (typeof sampleValue === 'boolean') {
          type = 'BOOLEAN';
        }

        return `"${col}" ${type}`;
      }).join(', ');

      // Create table
      await this.connection.query(`CREATE TABLE ${tableName} (${columnDefs})`);

      // Insert data in batches
      const batchSize = 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        const values = batch.map((row) => {
          const vals = columns.map((col) => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            return val;
          });
          return `(${vals.join(', ')})`;
        }).join(', ');

        await this.connection.query(`INSERT INTO ${tableName} VALUES ${values}`);
      }

      console.log(`Loaded ${data.length} rows into table ${tableName}`);
    } catch (error) {
      console.error('Error loading dataset into DuckDB:', error);
      throw error;
    }
  }

  /**
   * Execute SQL query
   */
  async execute(query: string, dataset?: any): Promise<SQLResult> {
    const startTime = performance.now();

    try {
      await this.initialize();

      // Load dataset if provided
      if (dataset?.data && Array.isArray(dataset.data)) {
        await this.loadDataset('dataset', dataset.data);
      }

      // Execute query
      const result = await this.connection.query(query);

      // Format results
      const columns = result.schema.fields.map((f: any) => f.name);
      const rows: any[] = [];

      // Convert Arrow table to JS objects
      for (let i = 0; i < result.numRows; i++) {
        const row: any = {};
        for (const col of columns) {
          const colData = result.getChild(col);
          row[col] = colData ? colData.get(i) : null;
        }
        rows.push(row);
      }

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        columns,
        rows,
        row_count: rows.length,
        execution_time_ms: Math.round(executionTime),
      };
    } catch (error: any) {
      const executionTime = performance.now() - startTime;
      return {
        success: false,
        columns: [],
        rows: [],
        row_count: 0,
        error: this.formatError(error),
        execution_time_ms: Math.round(executionTime),
      };
    }
  }

  /**
   * Get table schema
   */
  async getSchema(tableName: string): Promise<{ name: string; type: string }[]> {
    await this.initialize();

    try {
      const result = await this.connection.query(
        `DESCRIBE ${tableName}`
      );

      const schema: { name: string; type: string }[] = [];
      for (let i = 0; i < result.numRows; i++) {
        schema.push({
          name: result.getChild('column_name')?.get(i) || '',
          type: result.getChild('column_type')?.get(i) || 'VARCHAR',
        });
      }

      return schema;
    } catch (error) {
      console.error('Error getting schema:', error);
      return [];
    }
  }

  /**
   * Get list of tables
   */
  async getTables(): Promise<string[]> {
    await this.initialize();

    try {
      const result = await this.connection.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'`
      );

      const tables: string[] = [];
      const tableCol = result.getChild('table_name');
      if (tableCol) {
        for (let i = 0; i < result.numRows; i++) {
          tables.push(tableCol.get(i));
        }
      }

      return tables;
    } catch (error) {
      console.error('Error getting tables:', error);
      return [];
    }
  }

  /**
   * Format SQL error messages
   */
  private formatError(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'An unknown SQL error occurred';
  }

  /**
   * Clean up and reset
   */
  async reset(): Promise<void> {
    if (this.connection) {
      try {
        // Drop all user tables
        const tables = await this.getTables();
        for (const table of tables) {
          await this.connection.query(`DROP TABLE IF EXISTS ${table}`);
        }
      } catch (error) {
        console.warn('Error resetting SQL environment:', error);
      }
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
    if (this.db) {
      await this.db.terminate();
      this.db = null;
    }
    this.isReady = false;
  }
}

// Export singleton getter
export function getSQLExecutor(): SQLExecutor {
  return SQLExecutor.getInstance();
}

export type { SQLResult };
