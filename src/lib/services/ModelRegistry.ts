/**
 * Model Registry Service
 *
 * Enterprise-grade ML model management service with:
 * - Model versioning and lifecycle management
 * - Performance metrics tracking
 * - A/B testing support
 * - Deployment management
 * - Model caching and optimization
 *
 * Follows the Registry Pattern for centralized model management
 */

import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// TYPES
// =============================================================================

export interface ModelConfig {
  id?: string;
  name: string;
  description?: string;
  type: ModelType;
  algorithm: string;
  datasetId: string;
  targetColumn: string;
  features: string[];
  hyperparameters?: Record<string, any>;
}

export type ModelType = 'classification' | 'regression' | 'clustering' | 'timeseries';

export type ModelStatus = 'draft' | 'training' | 'validating' | 'completed' | 'deployed' | 'retired' | 'failed';

export interface ModelMetrics {
  // Classification metrics
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  auc?: number;
  confusionMatrix?: number[][];

  // Regression metrics
  r2?: number;
  rmse?: number;
  mae?: number;
  mape?: number;

  // Clustering metrics
  silhouetteScore?: number;
  daviesBouldinIndex?: number;
  calinksiHarabaszIndex?: number;

  // General metrics
  trainingTime?: number;
  inferenceTime?: number;
  modelSize?: number;
}

export interface ModelVersion {
  version: string;
  status: ModelStatus;
  metrics: ModelMetrics;
  createdAt: Date;
  deployedAt?: Date;
  retiredAt?: Date;
}

export interface RegisteredModel {
  id: string;
  userId: string;
  config: ModelConfig;
  currentVersion: string;
  versions: ModelVersion[];
  status: ModelStatus;
  metrics: ModelMetrics;
  predictions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingJob {
  id: string;
  modelId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  logs: string[];
}

// =============================================================================
// MODEL REGISTRY CLASS
// =============================================================================

export class ModelRegistry {
  private static instance: ModelRegistry;
  private models: Map<string, RegisteredModel> = new Map();
  private trainingJobs: Map<string, TrainingJob> = new Map();
  private listeners: Map<string, Set<(model: RegisteredModel) => void>> = new Map();
  private initialized: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }

  /**
   * Initialize the registry with existing models from database
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        data.forEach((model) => {
          const registered = this.mapDatabaseModel(model);
          this.models.set(registered.id, registered);
        });
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize model registry:', error);
    }
  }

  /**
   * Register a new model
   */
  public async register(config: ModelConfig): Promise<RegisteredModel> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const version = '1.0.0';
    const now = new Date();

    const modelData = {
      user_id: user.id,
      name: config.name,
      description: config.description || '',
      type: config.type,
      algorithm: config.algorithm,
      dataset_id: config.datasetId,
      target_column: config.targetColumn,
      features: config.features,
      hyperparameters: config.hyperparameters || this.getDefaultHyperparameters(config.algorithm),
      status: 'draft',
      version,
      metrics: {},
      predictions_count: 0,
    };

    const { data, error } = await supabase
      .from('models')
      .insert(modelData)
      .select()
      .single();

    if (error) throw error;

    const registered = this.mapDatabaseModel(data);
    this.models.set(registered.id, registered);
    this.notifyListeners(registered.id, registered);

    return registered;
  }

  /**
   * Get a model by ID
   */
  public get(modelId: string): RegisteredModel | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get all registered models
   */
  public getAll(): RegisteredModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Get models by status
   */
  public getByStatus(status: ModelStatus): RegisteredModel[] {
    return this.getAll().filter((m) => m.status === status);
  }

  /**
   * Get models by type
   */
  public getByType(type: ModelType): RegisteredModel[] {
    return this.getAll().filter((m) => m.config.type === type);
  }

  /**
   * Start training a model
   */
  public async train(modelId: string): Promise<TrainingJob> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    // Create training job
    const job: TrainingJob = {
      id: `job_${Date.now()}`,
      modelId,
      status: 'queued',
      progress: 0,
      logs: [],
    };

    this.trainingJobs.set(job.id, job);

    // Update model status
    await this.updateStatus(modelId, 'training');

    // Simulate training (in production, this would call ML backend)
    this.simulateTraining(job, model);

    return job;
  }

  /**
   * Deploy a trained model
   */
  public async deploy(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    if (model.status !== 'completed') {
      throw new Error('Only completed models can be deployed');
    }

    await this.updateStatus(modelId, 'deployed');

    // Record deployment in version history
    const currentVersion = model.versions.find((v) => v.version === model.currentVersion);
    if (currentVersion) {
      currentVersion.deployedAt = new Date();
    }
  }

  /**
   * Retire a deployed model
   */
  public async retire(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    await this.updateStatus(modelId, 'retired');

    const currentVersion = model.versions.find((v) => v.version === model.currentVersion);
    if (currentVersion) {
      currentVersion.retiredAt = new Date();
    }
  }

  /**
   * Delete a model
   */
  public async delete(modelId: string): Promise<void> {
    const { error } = await supabase
      .from('models')
      .delete()
      .eq('id', modelId);

    if (error) throw error;

    this.models.delete(modelId);
    this.listeners.delete(modelId);
  }

  /**
   * Update model metrics
   */
  public async updateMetrics(modelId: string, metrics: ModelMetrics): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    const { error } = await supabase
      .from('models')
      .update({ metrics })
      .eq('id', modelId);

    if (error) throw error;

    model.metrics = metrics;
    this.notifyListeners(modelId, model);
  }

  /**
   * Increment prediction count
   */
  public async recordPrediction(modelId: string, count: number = 1): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) return;

    const newCount = model.predictions + count;

    const { error } = await supabase
      .from('models')
      .update({ predictions_count: newCount })
      .eq('id', modelId);

    if (error) throw error;

    model.predictions = newCount;
  }

  /**
   * Subscribe to model changes
   */
  public subscribe(modelId: string, callback: (model: RegisteredModel) => void): () => void {
    if (!this.listeners.has(modelId)) {
      this.listeners.set(modelId, new Set());
    }
    this.listeners.get(modelId)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(modelId)?.delete(callback);
    };
  }

  /**
   * Get training job status
   */
  public getTrainingJob(jobId: string): TrainingJob | undefined {
    return this.trainingJobs.get(jobId);
  }

  /**
   * Get all active training jobs
   */
  public getActiveJobs(): TrainingJob[] {
    return Array.from(this.trainingJobs.values()).filter(
      (job) => job.status === 'queued' || job.status === 'running'
    );
  }

  /**
   * Cancel a training job
   */
  public async cancelTraining(jobId: string): Promise<void> {
    const job = this.trainingJobs.get(jobId);
    if (!job) return;

    job.status = 'cancelled';

    const model = this.models.get(job.modelId);
    if (model) {
      await this.updateStatus(job.modelId, 'draft');
    }
  }

  /**
   * Create a new version of an existing model
   */
  public async createVersion(modelId: string, config?: Partial<ModelConfig>): Promise<string> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    // Parse and increment version
    const [major, minor, patch] = model.currentVersion.split('.').map(Number);
    const newVersion = `${major}.${minor + 1}.0`;

    // Add new version to history
    model.versions.push({
      version: newVersion,
      status: 'draft',
      metrics: {},
      createdAt: new Date(),
    });

    // Update config if provided
    if (config) {
      Object.assign(model.config, config);
    }

    model.currentVersion = newVersion;
    model.status = 'draft';

    const { error } = await supabase
      .from('models')
      .update({
        version: newVersion,
        status: 'draft',
        ...config,
      })
      .eq('id', modelId);

    if (error) throw error;

    this.notifyListeners(modelId, model);
    return newVersion;
  }

  /**
   * Compare metrics between two model versions
   */
  public compareVersions(
    modelId: string,
    versionA: string,
    versionB: string
  ): { improvement: Record<string, number>; winner: string } | null {
    const model = this.models.get(modelId);
    if (!model) return null;

    const verA = model.versions.find((v) => v.version === versionA);
    const verB = model.versions.find((v) => v.version === versionB);

    if (!verA || !verB) return null;

    const improvement: Record<string, number> = {};
    let aScore = 0;
    let bScore = 0;

    // Compare common metrics
    const metricsToCompare = ['accuracy', 'precision', 'recall', 'f1Score', 'r2'] as const;

    metricsToCompare.forEach((metric) => {
      const valA = verA.metrics[metric];
      const valB = verB.metrics[metric];

      if (valA !== undefined && valB !== undefined) {
        improvement[metric] = ((valB - valA) / valA) * 100;
        if (valB > valA) bScore++;
        else if (valA > valB) aScore++;
      }
    });

    // Compare error metrics (lower is better)
    const errorMetrics = ['rmse', 'mae'] as const;

    errorMetrics.forEach((metric) => {
      const valA = verA.metrics[metric];
      const valB = verB.metrics[metric];

      if (valA !== undefined && valB !== undefined) {
        improvement[metric] = ((valA - valB) / valA) * 100; // Positive if B is better
        if (valB < valA) bScore++;
        else if (valA < valB) aScore++;
      }
    });

    return {
      improvement,
      winner: aScore > bScore ? versionA : versionB,
    };
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private async updateStatus(modelId: string, status: ModelStatus): Promise<void> {
    const { error } = await supabase
      .from('models')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', modelId);

    if (error) throw error;

    const model = this.models.get(modelId);
    if (model) {
      model.status = status;
      model.updatedAt = new Date();
      this.notifyListeners(modelId, model);
    }
  }

  private notifyListeners(modelId: string, model: RegisteredModel): void {
    this.listeners.get(modelId)?.forEach((callback) => callback(model));
  }

  private mapDatabaseModel(data: any): RegisteredModel {
    return {
      id: data.id,
      userId: data.user_id,
      config: {
        id: data.id,
        name: data.name,
        description: data.description,
        type: data.type,
        algorithm: data.algorithm,
        datasetId: data.dataset_id,
        targetColumn: data.target_column,
        features: data.features || [],
        hyperparameters: data.hyperparameters,
      },
      currentVersion: data.version || '1.0.0',
      versions: [{
        version: data.version || '1.0.0',
        status: data.status,
        metrics: data.metrics || {},
        createdAt: new Date(data.created_at),
      }],
      status: data.status,
      metrics: data.metrics || {},
      predictions: data.predictions_count || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at || data.created_at),
    };
  }

  private getDefaultHyperparameters(algorithm: string): Record<string, any> {
    const defaults: Record<string, Record<string, any>> = {
      random_forest_clf: { n_estimators: 100, max_depth: 10, min_samples_split: 2, random_state: 42 },
      random_forest_reg: { n_estimators: 100, max_depth: 10, min_samples_split: 2, random_state: 42 },
      xgboost_clf: { learning_rate: 0.1, max_depth: 6, n_estimators: 100, objective: 'binary:logistic' },
      xgboost_reg: { learning_rate: 0.1, max_depth: 6, n_estimators: 100, objective: 'reg:squarederror' },
      logistic_regression: { C: 1.0, max_iter: 100, solver: 'lbfgs' },
      linear_regression: { fit_intercept: true, normalize: false },
      svm_clf: { C: 1.0, kernel: 'rbf', gamma: 'scale' },
      neural_network_clf: { hidden_layers: [64, 32], activation: 'relu', learning_rate: 0.001, epochs: 50 },
      neural_network_reg: { hidden_layers: [64, 32], activation: 'relu', learning_rate: 0.001, epochs: 50 },
      kmeans: { n_clusters: 5, max_iter: 300, init: 'k-means++' },
      dbscan: { eps: 0.5, min_samples: 5, metric: 'euclidean' },
      hierarchical: { n_clusters: 5, linkage: 'ward' },
      arima: { p: 1, d: 1, q: 1 },
      prophet: { yearly_seasonality: true, weekly_seasonality: true },
      lstm: { units: 50, epochs: 100, batch_size: 32 },
    };
    return defaults[algorithm] || {};
  }

  private async simulateTraining(job: TrainingJob, model: RegisteredModel): Promise<void> {
    job.status = 'running';
    job.startedAt = new Date();
    job.logs.push(`[${new Date().toISOString()}] Training started for ${model.config.name}`);

    // Update database status
    await supabase
      .from('models')
      .update({ status: 'training', training_progress: 0 })
      .eq('id', model.id);

    // Simulate training progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      job.progress = progress;
      job.logs.push(`[${new Date().toISOString()}] Progress: ${progress}%`);

      await supabase
        .from('models')
        .update({ training_progress: progress })
        .eq('id', model.id);

      model.updatedAt = new Date();
      this.notifyListeners(model.id, model);
    }

    // Generate metrics based on model type
    const metrics = this.generateMockMetrics(model.config.type);

    // Update completion
    job.status = 'completed';
    job.completedAt = new Date();
    job.logs.push(`[${new Date().toISOString()}] Training completed successfully`);

    await supabase
      .from('models')
      .update({
        status: 'completed',
        training_progress: 100,
        training_duration: Math.floor(Math.random() * 120) + 30,
        metrics,
      })
      .eq('id', model.id);

    model.status = 'completed';
    model.metrics = metrics;
    this.notifyListeners(model.id, model);
  }

  private generateMockMetrics(type: ModelType): ModelMetrics {
    switch (type) {
      case 'classification':
        return {
          accuracy: 0.85 + Math.random() * 0.12,
          precision: 0.82 + Math.random() * 0.15,
          recall: 0.79 + Math.random() * 0.18,
          f1Score: 0.83 + Math.random() * 0.14,
          auc: 0.88 + Math.random() * 0.1,
        };
      case 'regression':
        return {
          r2: 0.75 + Math.random() * 0.2,
          rmse: 2.5 + Math.random() * 3,
          mae: 1.8 + Math.random() * 2,
          mape: 5 + Math.random() * 10,
        };
      case 'clustering':
        return {
          silhouetteScore: 0.5 + Math.random() * 0.4,
          daviesBouldinIndex: 0.5 + Math.random() * 0.5,
          calinksiHarabaszIndex: 100 + Math.random() * 200,
        };
      case 'timeseries':
        return {
          rmse: 1.5 + Math.random() * 2,
          mae: 1.2 + Math.random() * 1.5,
          mape: 3 + Math.random() * 5,
        };
      default:
        return {};
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const modelRegistry = ModelRegistry.getInstance();
