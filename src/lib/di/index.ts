/**
 * Dependency Injection Module
 * Enterprise-grade IoC for LabIQ Health
 *
 * Usage:
 * ```typescript
 * // At app startup (main.tsx)
 * import { registerServices } from '@/lib/di';
 * registerServices();
 *
 * // In components/services
 * import { container, SERVICE_IDENTIFIERS, getLogger } from '@/lib/di';
 *
 * const logger = getLogger();
 * logger.info('Hello from DI!');
 *
 * // Or resolve directly
 * const myService = container.resolve<IMyService>(SERVICE_IDENTIFIERS.MyService);
 * ```
 */

// Container
export { Container, container } from './Container';

// Types and interfaces
export {
  SERVICE_IDENTIFIERS,
  type ILogger,
  type IEventBus,
  type ICache,
  type IAIProvider,
  type IDatabaseClient,
  type AIGenerationOptions,
} from './types';

// Service registration
export {
  registerServices,
  resolve,
  getLogger,
  getAIProvider,
  getEventBus,
  getCache,
} from './registration';

// Decorators (optional)
export {
  Injectable,
  Inject,
  LazyInject,
  Singleton,
  Transient,
  createInstance,
} from './decorators';

// Services
export { Logger } from './services/Logger';
export { EventBus, LabIQEvents, TypedChannel } from './services/EventBus';
export { Cache, LRUCache } from './services/Cache';
export { GeminiAIProvider, createGeminiProvider } from './services/GeminiAIProvider';
