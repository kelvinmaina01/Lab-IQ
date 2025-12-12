// Type definitions for WASM execution engines

export interface ExecutionResult {
  success: boolean;
  output?: any;
  stdout?: string;
  stderr?: string;
  plots?: string[]; // Base64 encoded images
  error?: string;
  traceback?: string;
  executionTime?: number;
  rowCount?: number;
  columns?: string[];
}

export interface TestCase {
  description: string;
  validation_type: 'exact_match' | 'numeric_tolerance' | 'shape_match' | 'regex_match';
  expected_output?: any;
  expected_shape?: { rows?: number; cols?: number };
  tolerance?: number;
  regex_pattern?: string;
}

export interface TestResult {
  passed: boolean;
  test: string;
  expected?: any;
  actual?: any;
  message?: string;
}

export interface ChallengeResult {
  passed: boolean;
  testResults: TestResult[];
  output?: any;
  plots?: string[];
  score: number;
  feedback: string;
  error?: string;
}

export interface IExecutionEngine {
  initialize(): Promise<void>;
  executeCode(code: string, datasetUrl: string): Promise<ExecutionResult>;
  isReady(): boolean;
  cleanup(): Promise<void>;
}

export type ExecutionLanguage = 'python' | 'sql' | 'r';

export interface ExecutionEngineOptions {
  timeout?: number;
  memoryLimit?: number;
}
