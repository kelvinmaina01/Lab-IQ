// Unified execution engine exports

export * from './types';
export * from './pyodideEngine';
export * from './duckdbEngine';
export * from './webrEngine';

import { getPyodideEngine } from './pyodideEngine';
import { getDuckDBEngine } from './duckdbEngine';
import { getWebREngine } from './webrEngine';
import type { IExecutionEngine, ExecutionLanguage } from './types';

export function getExecutionEngine(language: ExecutionLanguage): IExecutionEngine {
  switch (language) {
    case 'python':
      return getPyodideEngine();
    case 'sql':
      return getDuckDBEngine();
    case 'r':
      return getWebREngine();
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}
