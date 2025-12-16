/**
 * Services Index
 *
 * Unified exports for all Lab-IQ services.
 * Import services from this module for clean, centralized access.
 *
 * @example
 * import { labIQAI, modelRegistry, initializeServices } from '@/lib/services';
 */

// =============================================================================
// SERVICE EXPORTS
// =============================================================================

// AI Service
export { labIQAI, LabIQAI, analyzeData, suggestExperiment, detectBottlenecks, predictMetric, generateDescription } from '../ai/LabIQAI';
export type { AIResponse, AISection, ChartData, ComputedData, DataStatistics, ColumnStats } from '../ai/LabIQAI';

// Model Registry
export { modelRegistry, ModelRegistry } from './ModelRegistry';
export type { ModelConfig, ModelType, ModelStatus, ModelMetrics, RegisteredModel, TrainingJob, ModelVersion } from './ModelRegistry';

// Core Container
export { container, getService, SERVICE_NAMES } from '../core';

// =============================================================================
// SERVICE INITIALIZATION
// =============================================================================

import { container, SERVICE_NAMES } from '../core';
import { labIQAI } from '../ai/LabIQAI';
import { modelRegistry } from './ModelRegistry';

let initialized = false;

/**
 * Initialize all services and register them in the container
 * Call this once at application startup
 */
export async function initializeServices(): Promise<void> {
  if (initialized) {
    console.warn('Services already initialized');
    return;
  }

  console.log('[Lab-IQ] Initializing services...');
  const startTime = Date.now();

  try {
    // Register singleton services
    container.registerInstance(SERVICE_NAMES.AI, labIQAI);
    container.registerInstance(SERVICE_NAMES.MODEL_REGISTRY, modelRegistry);

    // Initialize services that require async setup
    await modelRegistry.initialize();

    initialized = true;
    console.log(`[Lab-IQ] Services initialized in ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error('[Lab-IQ] Service initialization failed:', error);
    throw error;
  }
}

/**
 * Check if services have been initialized
 */
export function areServicesInitialized(): boolean {
  return initialized;
}

/**
 * Get service health status
 */
export async function getServicesHealth(): Promise<{
  ai: { available: boolean; latency: number | null };
  modelRegistry: { initialized: boolean; modelCount: number };
  cache: { hitRate: number; entries: number };
}> {
  const aiHealth = await labIQAI.healthCheck();
  const cacheStats = labIQAI.getCacheStats();

  return {
    ai: {
      available: aiHealth.available,
      latency: aiHealth.latency,
    },
    modelRegistry: {
      initialized: true,
      modelCount: modelRegistry.getAll().length,
    },
    cache: {
      hitRate: cacheStats.hitRate,
      entries: cacheStats.entries,
    },
  };
}

// =============================================================================
// HOOKS FOR REACT COMPONENTS
// =============================================================================

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to access the AI service
 */
export function useAI() {
  const [isAvailable, setIsAvailable] = useState(labIQAI.isAvailable());

  useEffect(() => {
    setIsAvailable(labIQAI.isAvailable());
  }, []);

  return {
    ai: labIQAI,
    isAvailable,
    clearCache: useCallback(() => labIQAI.clearCache(), []),
    getCacheStats: useCallback(() => labIQAI.getCacheStats(), []),
    getPerformanceMetrics: useCallback(() => labIQAI.getPerformanceMetrics(), []),
  };
}

/**
 * Hook to access the model registry
 */
export function useModelRegistry() {
  const [models, setModels] = useState(modelRegistry.getAll());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await modelRegistry.initialize();
      setModels(modelRegistry.getAll());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    registry: modelRegistry,
    models,
    loading,
    refresh,
    getByStatus: useCallback((status: ModelStatus) => modelRegistry.getByStatus(status), []),
    getByType: useCallback((type: ModelType) => modelRegistry.getByType(type), []),
  };
}

// Re-export types for convenience
import type { ModelStatus, ModelType } from './ModelRegistry';
