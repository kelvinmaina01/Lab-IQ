/**
 * Dependency Injection Container
 * Enterprise-grade IoC container for managing service dependencies
 *
 * Features:
 * - Singleton and transient lifetimes
 * - Lazy initialization
 * - Factory functions support
 * - Hierarchical containers
 * - Automatic disposal
 */

import { IDisposable, IInitializable } from './types';

type ServiceIdentifier = symbol | string;
type ServiceFactory<T> = () => T;

interface ServiceDescriptor<T> {
  factory: ServiceFactory<T>;
  lifetime: 'singleton' | 'transient';
  instance?: T;
  initialized?: boolean;
}

export class Container {
  private static _root: Container | null = null;
  private services: Map<ServiceIdentifier, ServiceDescriptor<any>> = new Map();
  private parent: Container | null;
  private children: Set<Container> = new Set();
  private disposed = false;

  constructor(parent?: Container) {
    this.parent = parent || null;
    if (parent) {
      parent.children.add(this);
    }
  }

  /**
   * Get the root container instance (singleton pattern for the container itself)
   */
  static get root(): Container {
    if (!Container._root) {
      Container._root = new Container();
    }
    return Container._root;
  }

  /**
   * Create a child container with inherited services
   */
  createChild(): Container {
    this.checkDisposed();
    return new Container(this);
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(identifier: ServiceIdentifier, factory: ServiceFactory<T>): this {
    this.checkDisposed();
    this.services.set(identifier, {
      factory,
      lifetime: 'singleton',
    });
    return this;
  }

  /**
   * Register a transient service (new instance each time)
   */
  registerTransient<T>(identifier: ServiceIdentifier, factory: ServiceFactory<T>): this {
    this.checkDisposed();
    this.services.set(identifier, {
      factory,
      lifetime: 'transient',
    });
    return this;
  }

  /**
   * Register an existing instance
   */
  registerInstance<T>(identifier: ServiceIdentifier, instance: T): this {
    this.checkDisposed();
    this.services.set(identifier, {
      factory: () => instance,
      lifetime: 'singleton',
      instance,
      initialized: true,
    });
    return this;
  }

  /**
   * Resolve a service by identifier
   */
  resolve<T>(identifier: ServiceIdentifier): T {
    this.checkDisposed();

    // Check local services first
    const descriptor = this.services.get(identifier);
    if (descriptor) {
      return this.resolveDescriptor<T>(descriptor);
    }

    // Check parent container
    if (this.parent) {
      return this.parent.resolve<T>(identifier);
    }

    throw new Error(`Service not registered: ${String(identifier)}`);
  }

  /**
   * Try to resolve a service, returns undefined if not found
   */
  tryResolve<T>(identifier: ServiceIdentifier): T | undefined {
    try {
      return this.resolve<T>(identifier);
    } catch {
      return undefined;
    }
  }

  /**
   * Check if a service is registered
   */
  isRegistered(identifier: ServiceIdentifier): boolean {
    this.checkDisposed();
    if (this.services.has(identifier)) {
      return true;
    }
    return this.parent?.isRegistered(identifier) ?? false;
  }

  /**
   * Initialize all singleton services that implement IInitializable
   */
  async initializeAll(): Promise<void> {
    this.checkDisposed();

    for (const [identifier, descriptor] of this.services) {
      if (descriptor.lifetime === 'singleton' && !descriptor.initialized) {
        const instance = this.resolveDescriptor(descriptor);
        if (this.isInitializable(instance)) {
          await instance.initialize();
        }
        descriptor.initialized = true;
      }
    }
  }

  /**
   * Dispose all services that implement IDisposable
   */
  async dispose(): Promise<void> {
    if (this.disposed) return;

    // Dispose children first
    for (const child of this.children) {
      await child.dispose();
    }

    // Dispose local singleton instances
    for (const [, descriptor] of this.services) {
      if (descriptor.instance && this.isDisposable(descriptor.instance)) {
        await descriptor.instance.dispose();
      }
    }

    // Remove from parent
    if (this.parent) {
      this.parent.children.delete(this);
    }

    this.services.clear();
    this.disposed = true;
  }

  /**
   * Reset the container (useful for testing)
   */
  reset(): void {
    this.checkDisposed();
    this.services.clear();
  }

  private resolveDescriptor<T>(descriptor: ServiceDescriptor<T>): T {
    if (descriptor.lifetime === 'singleton') {
      if (!descriptor.instance) {
        descriptor.instance = descriptor.factory();
      }
      return descriptor.instance;
    }
    return descriptor.factory();
  }

  private isDisposable(obj: any): obj is IDisposable {
    return typeof obj?.dispose === 'function';
  }

  private isInitializable(obj: any): obj is IInitializable {
    return typeof obj?.initialize === 'function';
  }

  private checkDisposed(): void {
    if (this.disposed) {
      throw new Error('Container has been disposed');
    }
  }
}

// Export singleton root container
export const container = Container.root;
