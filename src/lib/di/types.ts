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
  InsightsAI: Symbol.for('InsightsAI'),

  // Domain Services
  DatasetService: Symbol.for('DatasetService'),
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

// Removed all AnalystIQ/Hackathon related interfaces
