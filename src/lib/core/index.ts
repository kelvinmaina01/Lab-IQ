/**
 * Core Services Index
 *
 * Unified exports for all core services following enterprise patterns.
 * This module provides:
 * - Service Container for dependency injection
 * - Centralized service registration
 * - Type-safe service access
 */

// Re-export Service Container
export {
  ServiceContainer,
  container,
  getService,
  registerServices,
  Service,
  Inject,
  type ServiceFactory,
  type ServiceLifetime,
} from './ServiceContainer';

// Service names as constants (prevents typos)
export const SERVICE_NAMES = {
  AI: 'labIQ.ai',
  MODEL_REGISTRY: 'labIQ.modelRegistry',
  CACHE: 'labIQ.cache',
  ANALYTICS: 'labIQ.analytics',
  AUTH: 'labIQ.auth',
  STORAGE: 'labIQ.storage',
} as const;

export type ServiceName = typeof SERVICE_NAMES[keyof typeof SERVICE_NAMES];
