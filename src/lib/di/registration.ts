/**
 * Service Registration Module
 * Configures and registers all services in the DI container
 */

import { container } from './Container';
import { SERVICE_IDENTIFIERS, ILogger, IAIProvider, IDatabaseClient } from './types';
import { Logger } from './services/Logger';
import { EventBus } from './services/EventBus';
import { Cache } from './services/Cache';
import { GeminiAIProvider } from './services/GeminiAIProvider';
import { supabase } from '@/integrations/supabase/client';

/**
 * Register all services in the container
 * Call this at application startup
 */
export function registerServices(): void {
  // Register utility services
  registerUtilityServices();

  // Register database client
  registerDatabaseClient();

  // Register AI provider
  registerAIProvider();

  // Register domain services
  registerDomainServices();
}

function registerUtilityServices(): void {
  // Logger - singleton
  container.registerSingleton<ILogger>(SERVICE_IDENTIFIERS.Logger, () => {
    const isDev = import.meta.env.DEV;
    return new Logger({
      level: isDev ? 'debug' : 'info',
      prefix: '[LabIQ Health]',
      enableTimestamp: true,
    });
  });

  // Event Bus - singleton
  container.registerSingleton(SERVICE_IDENTIFIERS.EventBus, () => {
    return new EventBus();
  });

  // Cache - singleton
  container.registerSingleton(SERVICE_IDENTIFIERS.Cache, () => {
    return new Cache({
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      cleanupIntervalMs: 60 * 1000, // 1 minute
    });
  });
}

function registerDatabaseClient(): void {
  // Database Client - wraps Supabase
  container.registerSingleton<IDatabaseClient>(
    SERVICE_IDENTIFIERS.DatabaseClient,
    () => supabase as unknown as IDatabaseClient
  );
}

function registerAIProvider(): void {
  // AI Provider - singleton
  container.registerSingleton<IAIProvider>(SERVICE_IDENTIFIERS.AIProvider, () => {
    const logger = container.resolve<ILogger>(SERVICE_IDENTIFIERS.Logger);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    return new GeminiAIProvider(apiKey, logger);
  });
}

function registerDomainServices(): void {
  // Domain-specific services can be registered here as needed
  // Example: CollaborationService, WorkflowService, etc.
}

/**
 * Helper to resolve services with proper typing
 */
export function resolve<T>(identifier: symbol): T {
  return container.resolve<T>(identifier);
}

/**
 * Get logger instance
 */
export function getLogger(): ILogger {
  return container.resolve<ILogger>(SERVICE_IDENTIFIERS.Logger);
}

/**
 * Get AI provider instance
 */
export function getAIProvider(): IAIProvider {
  return container.resolve<IAIProvider>(SERVICE_IDENTIFIERS.AIProvider);
}

/**
 * Get event bus instance
 */
export function getEventBus(): EventBus {
  return container.resolve<EventBus>(SERVICE_IDENTIFIERS.EventBus);
}

/**
 * Get cache instance
 */
export function getCache(): Cache {
  return container.resolve<Cache>(SERVICE_IDENTIFIERS.Cache);
}
