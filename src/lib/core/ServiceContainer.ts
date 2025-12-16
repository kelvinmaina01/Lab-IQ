/**
 * Service Container - Enterprise Dependency Injection Pattern
 *
 * Implements the Service Locator / IoC Container pattern for:
 * - Centralized service management
 * - Lazy initialization
 * - Singleton management
 * - Service lifecycle control
 * - Testability through dependency injection
 *
 * Following Microsoft patterns for enterprise applications
 */

// =============================================================================
// SERVICE TYPES & INTERFACES
// =============================================================================

export type ServiceFactory<T> = () => T;
export type ServiceLifetime = 'singleton' | 'transient' | 'scoped';

interface ServiceDescriptor<T = any> {
  factory: ServiceFactory<T>;
  lifetime: ServiceLifetime;
  instance?: T;
  initialized: boolean;
}

interface ServiceMetadata {
  name: string;
  lifetime: ServiceLifetime;
  dependencies: string[];
  initialized: boolean;
  createdAt?: number;
}

// =============================================================================
// SERVICE CONTAINER CLASS
// =============================================================================

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, ServiceDescriptor> = new Map();
  private scopedInstances: Map<string, Map<string, any>> = new Map();
  private currentScope: string | null = null;
  private initializationOrder: string[] = [];
  private isInitializing: boolean = false;

  private constructor() {}

  /**
   * Get the singleton instance of the container
   */
  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Register a singleton service (one instance shared across app)
   */
  public registerSingleton<T>(name: string, factory: ServiceFactory<T>): this {
    this.services.set(name, {
      factory,
      lifetime: 'singleton',
      initialized: false,
    });
    return this;
  }

  /**
   * Register a transient service (new instance each time)
   */
  public registerTransient<T>(name: string, factory: ServiceFactory<T>): this {
    this.services.set(name, {
      factory,
      lifetime: 'transient',
      initialized: true, // Transients are always "ready"
    });
    return this;
  }

  /**
   * Register a scoped service (one instance per scope)
   */
  public registerScoped<T>(name: string, factory: ServiceFactory<T>): this {
    this.services.set(name, {
      factory,
      lifetime: 'scoped',
      initialized: false,
    });
    return this;
  }

  /**
   * Register an existing instance as a singleton
   */
  public registerInstance<T>(name: string, instance: T): this {
    this.services.set(name, {
      factory: () => instance,
      lifetime: 'singleton',
      instance,
      initialized: true,
    });
    return this;
  }

  /**
   * Get a service by name
   */
  public get<T>(name: string): T {
    const descriptor = this.services.get(name);

    if (!descriptor) {
      throw new Error(`Service '${name}' is not registered in the container`);
    }

    switch (descriptor.lifetime) {
      case 'singleton':
        return this.getSingleton<T>(name, descriptor);
      case 'transient':
        return descriptor.factory() as T;
      case 'scoped':
        return this.getScoped<T>(name, descriptor);
      default:
        throw new Error(`Unknown service lifetime: ${descriptor.lifetime}`);
    }
  }

  /**
   * Try to get a service, returns null if not found
   */
  public tryGet<T>(name: string): T | null {
    try {
      return this.get<T>(name);
    } catch {
      return null;
    }
  }

  /**
   * Check if a service is registered
   */
  public has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Create a new scope for scoped services
   */
  public createScope(): string {
    const scopeId = `scope_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.scopedInstances.set(scopeId, new Map());
    return scopeId;
  }

  /**
   * Set the current scope
   */
  public setScope(scopeId: string): void {
    if (!this.scopedInstances.has(scopeId)) {
      throw new Error(`Scope '${scopeId}' does not exist`);
    }
    this.currentScope = scopeId;
  }

  /**
   * Dispose a scope and all its instances
   */
  public disposeScope(scopeId: string): void {
    const scope = this.scopedInstances.get(scopeId);
    if (scope) {
      // Call dispose on any disposable instances
      scope.forEach((instance) => {
        if (instance && typeof instance.dispose === 'function') {
          instance.dispose();
        }
      });
      scope.clear();
      this.scopedInstances.delete(scopeId);
    }
    if (this.currentScope === scopeId) {
      this.currentScope = null;
    }
  }

  /**
   * Initialize all singleton services
   */
  public async initializeAsync(): Promise<void> {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      for (const [name, descriptor] of this.services) {
        if (descriptor.lifetime === 'singleton' && !descriptor.initialized) {
          this.getSingleton(name, descriptor);
          this.initializationOrder.push(name);
        }
      }
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Get service metadata for debugging/monitoring
   */
  public getMetadata(): ServiceMetadata[] {
    const metadata: ServiceMetadata[] = [];

    this.services.forEach((descriptor, name) => {
      metadata.push({
        name,
        lifetime: descriptor.lifetime,
        dependencies: [], // Could be extended to track dependencies
        initialized: descriptor.initialized,
        createdAt: descriptor.instance ? Date.now() : undefined,
      });
    });

    return metadata;
  }

  /**
   * Reset the container (useful for testing)
   */
  public reset(): void {
    // Dispose all scopes
    this.scopedInstances.forEach((_, scopeId) => {
      this.disposeScope(scopeId);
    });

    // Dispose singleton instances
    this.services.forEach((descriptor) => {
      if (descriptor.instance && typeof descriptor.instance.dispose === 'function') {
        descriptor.instance.dispose();
      }
    });

    this.services.clear();
    this.initializationOrder = [];
    this.currentScope = null;
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private getSingleton<T>(name: string, descriptor: ServiceDescriptor): T {
    if (!descriptor.initialized || !descriptor.instance) {
      descriptor.instance = descriptor.factory();
      descriptor.initialized = true;
    }
    return descriptor.instance as T;
  }

  private getScoped<T>(name: string, descriptor: ServiceDescriptor): T {
    if (!this.currentScope) {
      // Fall back to singleton behavior if no scope is set
      return this.getSingleton<T>(name, descriptor);
    }

    const scope = this.scopedInstances.get(this.currentScope);
    if (!scope) {
      throw new Error(`Current scope '${this.currentScope}' does not exist`);
    }

    if (!scope.has(name)) {
      scope.set(name, descriptor.factory());
    }

    return scope.get(name) as T;
  }
}

// =============================================================================
// DECORATOR SUPPORT (for class-based services)
// =============================================================================

/**
 * Service decorator for automatic registration
 * Usage: @Service('myService', 'singleton')
 */
export function Service(name: string, lifetime: ServiceLifetime = 'singleton') {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    const container = ServiceContainer.getInstance();

    switch (lifetime) {
      case 'singleton':
        container.registerSingleton(name, () => new constructor());
        break;
      case 'transient':
        container.registerTransient(name, () => new constructor());
        break;
      case 'scoped':
        container.registerScoped(name, () => new constructor());
        break;
    }

    return constructor;
  };
}

/**
 * Inject decorator for property injection
 * Usage: @Inject('myService') private myService: MyServiceType;
 */
export function Inject(serviceName: string) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: () => ServiceContainer.getInstance().get(serviceName),
      enumerable: true,
      configurable: true,
    });
  };
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get the global service container instance
 */
export const container = ServiceContainer.getInstance();

/**
 * Quick registration helper
 */
export function registerServices(
  registrations: Array<{
    name: string;
    factory: ServiceFactory<any>;
    lifetime?: ServiceLifetime;
  }>
): void {
  const instance = ServiceContainer.getInstance();

  registrations.forEach(({ name, factory, lifetime = 'singleton' }) => {
    switch (lifetime) {
      case 'singleton':
        instance.registerSingleton(name, factory);
        break;
      case 'transient':
        instance.registerTransient(name, factory);
        break;
      case 'scoped':
        instance.registerScoped(name, factory);
        break;
    }
  });
}

/**
 * Quick service getter with type inference
 */
export function getService<T>(name: string): T {
  return ServiceContainer.getInstance().get<T>(name);
}
