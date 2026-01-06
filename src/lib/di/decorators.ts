/**
 * Dependency Injection Decorators
 * TypeScript decorators for cleaner DI syntax
 *
 * Note: These are optional helpers - the container can be used directly
 */

import { container } from './Container';

// Metadata key for storing injection info
const INJECT_METADATA_KEY = Symbol('inject:dependencies');

/**
 * Decorator to mark a class as injectable
 * Usage: @Injectable()
 */
export function Injectable(): ClassDecorator {
  return function <T extends { new (...args: any[]): {} }>(target: T) {
    return target;
  };
}

/**
 * Decorator to mark a constructor parameter for injection
 * Usage: constructor(@Inject(SERVICE_IDENTIFIERS.Logger) private logger: ILogger)
 */
export function Inject(identifier: symbol | string): ParameterDecorator {
  return function (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingDependencies: Array<{ index: number; identifier: symbol | string }> =
      Reflect.getMetadata(INJECT_METADATA_KEY, target) || [];
    existingDependencies.push({ index: parameterIndex, identifier });
    Reflect.defineMetadata(INJECT_METADATA_KEY, existingDependencies, target);
  };
}

/**
 * Helper to create instance with injected dependencies
 * Reads metadata and resolves dependencies from container
 */
export function createInstance<T>(
  ctor: new (...args: any[]) => T,
  additionalArgs: any[] = []
): T {
  const dependencies: Array<{ index: number; identifier: symbol | string }> =
    Reflect.getMetadata(INJECT_METADATA_KEY, ctor) || [];

  // Sort by index to ensure correct order
  dependencies.sort((a, b) => a.index - b.index);

  // Resolve each dependency
  const args = dependencies.map((dep) => container.resolve(dep.identifier));

  // Append additional args
  args.push(...additionalArgs);

  return new ctor(...args);
}

/**
 * Property decorator for lazy injection
 * Usage: @LazyInject(SERVICE_IDENTIFIERS.Logger) private logger!: ILogger
 */
export function LazyInject(identifier: symbol | string): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    Object.defineProperty(target, propertyKey, {
      get() {
        const value = container.resolve(identifier);
        // Cache the resolved value
        Object.defineProperty(this, propertyKey, {
          value,
          writable: false,
          configurable: false,
        });
        return value;
      },
      configurable: true,
    });
  };
}

/**
 * Class decorator to auto-register as singleton
 * Usage: @Singleton(SERVICE_IDENTIFIERS.MyService)
 */
export function Singleton(identifier: symbol | string): ClassDecorator {
  return function <T extends { new (...args: any[]): {} }>(target: T) {
    container.registerSingleton(identifier, () => {
      return createInstance(target as any);
    });
    return target;
  };
}

/**
 * Class decorator to auto-register as transient
 * Usage: @Transient(SERVICE_IDENTIFIERS.MyService)
 */
export function Transient(identifier: symbol | string): ClassDecorator {
  return function <T extends { new (...args: any[]): {} }>(target: T) {
    container.registerTransient(identifier, () => {
      return createInstance(target as any);
    });
    return target;
  };
}
