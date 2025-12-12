/**
 * Dependency Injection Types
 * Enterprise-grade service interfaces for scalable architecture
 */

// Service identifiers for DI container
export const SERVICE_IDENTIFIERS = {
  // Core Services
  DatabaseClient: Symbol.for('DatabaseClient'),
  AuthService: Symbol.for('AuthService'),
  StorageService: Symbol.for('StorageService'),

  // AI Services
  AIProvider: Symbol.for('AIProvider'),
  ForensicAI: Symbol.for('ForensicAI'),
  ReverseAI: Symbol.for('ReverseAI'),
  RacerAI: Symbol.for('RacerAI'),
  InsightsAI: Symbol.for('InsightsAI'),

  // Domain Services
  AnalystIQService: Symbol.for('AnalystIQService'),
  DatasetService: Symbol.for('DatasetService'),
  DatasetChallengeService: Symbol.for('DatasetChallengeService'),
  ReportingService: Symbol.for('ReportingService'),
  WorkflowService: Symbol.for('WorkflowService'),
  MLService: Symbol.for('MLService'),
  DeviceDataService: Symbol.for('DeviceDataService'),

  // Execution Engines
  PythonExecutor: Symbol.for('PythonExecutor'),
  SQLExecutor: Symbol.for('SQLExecutor'),

  // Utilities
  Logger: Symbol.for('Logger'),
  EventBus: Symbol.for('EventBus'),
  Cache: Symbol.for('Cache'),
} as const;

// Base interfaces
export interface IDisposable {
  dispose(): Promise<void>;
}

export interface IInitializable {
  initialize(): Promise<void>;
}

// Logger interface
export interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error, ...args: any[]): void;
}

// Event bus interface
export interface IEventBus {
  emit<T>(event: string, payload: T): void;
  on<T>(event: string, handler: (payload: T) => void): () => void;
  off(event: string, handler: Function): void;
}

// Cache interface
export interface ICache<T = any> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttlMs?: number): void;
  delete(key: string): boolean;
  clear(): void;
  has(key: string): boolean;
}

// Database client interface
export interface IDatabaseClient {
  from(table: string): IQueryBuilder;
  rpc<T>(fn: string, params?: Record<string, any>): Promise<{ data: T | null; error: Error | null }>;
  auth: IAuthClient;
  storage: IStorageClient;
}

export interface IQueryBuilder {
  select(columns?: string): IQueryBuilder;
  insert(values: Record<string, any> | Record<string, any>[]): IQueryBuilder;
  update(values: Record<string, any>): IQueryBuilder;
  delete(): IQueryBuilder;
  eq(column: string, value: any): IQueryBuilder;
  neq(column: string, value: any): IQueryBuilder;
  gt(column: string, value: any): IQueryBuilder;
  lt(column: string, value: any): IQueryBuilder;
  gte(column: string, value: any): IQueryBuilder;
  lte(column: string, value: any): IQueryBuilder;
  like(column: string, pattern: string): IQueryBuilder;
  ilike(column: string, pattern: string): IQueryBuilder;
  is(column: string, value: any): IQueryBuilder;
  in(column: string, values: any[]): IQueryBuilder;
  order(column: string, options?: { ascending?: boolean }): IQueryBuilder;
  limit(count: number): IQueryBuilder;
  offset(count: number): IQueryBuilder;
  single(): IQueryBuilder;
  maybeSingle(): IQueryBuilder;
  not(column: string, operator: string, value: any): IQueryBuilder;
  then<T>(resolve: (result: { data: T | null; error: Error | null }) => void): Promise<void>;
}

export interface IAuthClient {
  getUser(): Promise<{ data: { user: IUser | null }; error: Error | null }>;
  getSession(): Promise<{ data: { session: ISession | null }; error: Error | null }>;
  signIn(credentials: { email: string; password: string }): Promise<{ data: any; error: Error | null }>;
  signOut(): Promise<{ error: Error | null }>;
  onAuthStateChange(callback: (event: string, session: ISession | null) => void): { data: { subscription: { unsubscribe: () => void } } };
}

export interface IStorageClient {
  from(bucket: string): IStorageBucket;
  createBucket(name: string, options?: Record<string, any>): Promise<{ data: any; error: Error | null }>;
  getBucket(name: string): Promise<{ data: any; error: Error | null }>;
}

export interface IStorageBucket {
  upload(path: string, file: File | Blob, options?: Record<string, any>): Promise<{ data: any; error: Error | null }>;
  download(path: string): Promise<{ data: Blob | null; error: Error | null }>;
  remove(paths: string[]): Promise<{ data: any; error: Error | null }>;
  list(path?: string): Promise<{ data: any[]; error: Error | null }>;
  getPublicUrl(path: string): { data: { publicUrl: string } };
}

export interface IUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

export interface ISession {
  access_token: string;
  refresh_token: string;
  user: IUser;
}

// AI Provider interface
export interface IAIProvider {
  generateContent(prompt: string, options?: AIGenerationOptions): Promise<string>;
  generateJSON<T>(prompt: string, options?: AIGenerationOptions): Promise<T>;
  streamContent(prompt: string, options?: AIGenerationOptions): AsyncIterable<string>;
}

export interface AIGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  model?: string;
}

// Challenge interfaces
export interface IForensicChallenge {
  challenge_id: string;
  dataset_snapshot: {
    original_data: any[];
    corrupted_data: any[];
    schema: DatasetAnalysis;
  };
  injected_errors: ErrorInjection[];
  hints: ChallengeHint[];
  difficulty_actual: number;
  estimated_time_minutes: number;
  validation_criteria: ValidationCriteria;
}

export interface IReverseChallenge {
  challenge_id: string;
  target: {
    type: 'visualization' | 'metrics' | 'table';
    description: string;
    target_output: any;
  };
  dataset_snapshot: any;
  hints: ChallengeHint[];
  difficulty_actual: number;
}

export interface IRacerChallenge {
  challenge_id: string;
  slow_code: {
    code: string;
    language: 'python' | 'sql';
    estimated_time_ms: number;
  };
  target_time_ms: number;
  optimal_time_ms: number;
  dataset_snapshot: any;
  hints: ChallengeHint[];
  difficulty_actual: number;
}

export interface DatasetAnalysis {
  numeric_columns: string[];
  text_columns: string[];
  date_columns: string[];
  categorical_columns: string[];
  row_count: number;
  null_percentages: Record<string, number>;
  data_types: Record<string, string>;
}

export interface ErrorInjection {
  error_id: string;
  error_type: string;
  column: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affected_rows: number[];
  original_values: any[];
  corrupted_values: any[];
}

export interface ChallengeHint {
  level: 1 | 2 | 3;
  hint: string;
  reveals?: string;
  cost: number;
}

export interface ValidationCriteria {
  error_detection_rate: number;
  cleaning_accuracy: number;
}

export interface ValidationResult {
  detected_errors: string[];
  missed_errors: string[];
  false_positives: string[];
  cleaning_accuracy: number;
  score: number;
  feedback: string[];
}

// Service interfaces
export interface IForensicAI {
  generateChallenge(dataset: any, userIQ: number, userId: string): Promise<IForensicChallenge>;
  validateCleaning(challenge: IForensicChallenge, userCleanedData: any[]): Promise<ValidationResult>;
}

export interface IReverseAI {
  generateChallenge(dataset: any, userIQ: number, userId: string): Promise<IReverseChallenge>;
  validateSolution(challenge: IReverseChallenge, userOutput: any): Promise<ValidationResult>;
}

export interface IRacerAI {
  generateChallenge(dataset: any, userIQ: number, userId: string, language: 'python' | 'sql'): Promise<IRacerChallenge>;
  validateSolution(challenge: IRacerChallenge, userCode: string, executionTime: number): Promise<ValidationResult>;
}

export interface IAnalystIQProfile {
  id: string;
  user_id: string;
  overall_iq: number;
  data_integrity_score: number;
  logic_reasoning_score: number;
  optimization_score: number;
  learning_velocity: number;
  consistency_score: number;
  challenge_completion_rate: number;
  strength_areas: string[];
  weakness_areas: string[];
  current_level: string;
  total_challenges_completed: number;
  total_time_spent_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface IAnalystIQService {
  getOrCreateProfile(userId: string): Promise<IAnalystIQProfile | null>;
  calculateNextDifficulty(userId: string, mode: ChallengeMode): Promise<number>;
  getSkillRadarData(userId: string): Promise<SkillRadarData | null>;
  analyzeSkillProfile(userId: string): Promise<SkillAnalysis | null>;
  getLeaderboard(mode: ChallengeMode, limit?: number): Promise<any[]>;
  getPerformanceHistory(userId: string, mode?: ChallengeMode): Promise<any[]>;
  trackEvent(userId: string, matchId: string, eventType: string, eventData: any, skillIndicator?: string, performanceMetric?: number): Promise<void>;
}

export type ChallengeMode = 'forensic' | 'reverse' | 'racer';

export interface SkillRadarData {
  data_integrity: number;
  logic_reasoning: number;
  optimization: number;
  overall_iq: number;
}

export interface SkillAnalysis {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface IDatasetChallengeService {
  startChallenge(userId: string, mode: ChallengeMode, datasetId?: string): Promise<ChallengeSession | null>;
  submitSolution(matchId: string, sqlCode?: string, pythonCode?: string, executionTime?: number): Promise<SolutionResult | null>;
  getAvailableDatasets(limit?: number): Promise<any[]>;
  markDatasetForChallenges(datasetId: string): Promise<boolean>;
}

export interface ChallengeSession {
  match_id: string;
  dataset_challenge: DatasetChallenge;
  start_time: Date;
  user_code_sql?: string;
  user_code_python?: string;
}

export interface DatasetChallenge {
  id: string;
  dataset_id: string;
  dataset_name: string;
  dataset_description: string;
  mode: ChallengeMode;
  difficulty: number;
  forensic_data?: any;
  reverse_data?: any;
  racer_data?: any;
}

export interface SolutionResult {
  success: boolean;
  accuracy_score: number;
  feedback: string[];
  iq_change: number;
}

// Code execution interfaces
export interface ICodeExecutor {
  execute(code: string, context?: ExecutionContext): Promise<ExecutionResult>;
  validate(code: string): Promise<ValidationError[]>;
  getLanguage(): string;
}

export interface ExecutionContext {
  data?: any[];
  variables?: Record<string, any>;
  timeout?: number;
}

export interface ExecutionResult {
  success: boolean;
  output: any;
  executionTime: number;
  error?: string;
  logs?: string[];
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}
