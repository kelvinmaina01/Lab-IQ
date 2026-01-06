/**
 * React Hooks for Dependency Injection
 * Provides easy access to DI services in React components
 */

import { useMemo } from 'react';
import {
  container,
  SERVICE_IDENTIFIERS,
  ILogger,
  IEventBus,
  ICache,
  IAIProvider,
} from '@/lib/di';

/**
 * Hook to resolve a service from the DI container
 */
export function useService<T>(identifier: symbol): T {
  return useMemo(() => container.resolve<T>(identifier), [identifier]);
}

/**
 * Hook to get the logger service
 */
export function useLogger(): ILogger {
  return useService<ILogger>(SERVICE_IDENTIFIERS.Logger);
}

/**
 * Hook to get the event bus
 */
export function useEventBus(): IEventBus {
  return useService<IEventBus>(SERVICE_IDENTIFIERS.EventBus);
}

/**
 * Hook to get the cache service
 */
export function useCache<T = any>(): ICache<T> {
  return useService<ICache<T>>(SERVICE_IDENTIFIERS.Cache);
}

/**
 * Hook to get the AI provider
 */
export function useAIProvider(): IAIProvider {
  return useService<IAIProvider>(SERVICE_IDENTIFIERS.AIProvider);
}

/**
 * Hook to create a child logger with a component-specific prefix
 */
export function useComponentLogger(componentName: string): ILogger {
  const logger = useLogger();
  return useMemo(() => {
    // Create a wrapper that adds component context
    return {
      debug: (msg: string, ...args: any[]) => logger.debug(`[${componentName}] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => logger.info(`[${componentName}] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => logger.warn(`[${componentName}] ${msg}`, ...args),
      error: (msg: string, err?: Error, ...args: any[]) =>
        logger.error(`[${componentName}] ${msg}`, err, ...args),
    };
  }, [logger, componentName]);
}
