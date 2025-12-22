/**
 * Event Bus Service Implementation
 * Pub/Sub pattern for decoupled component communication
 */

import { IEventBus, IDisposable } from '../types';

type EventHandler<T = any> = (payload: T) => void;

export class EventBus implements IEventBus, IDisposable {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private onceHandlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Emit an event with payload
   */
  emit<T>(event: string, payload: T): void {
    // Call regular handlers
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      });
    }

    // Call and remove once handlers
    const onceHandlers = this.onceHandlers.get(event);
    if (onceHandlers) {
      onceHandlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in once handler for "${event}":`, error);
        }
      });
      this.onceHandlers.delete(event);
    }
  }

  /**
   * Subscribe to an event
   * Returns unsubscribe function
   */
  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event (fires only once)
   */
  once<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.onceHandlers.has(event)) {
      this.onceHandlers.set(event, new Set());
    }
    this.onceHandlers.get(event)!.add(handler);

    return () => {
      const handlers = this.onceHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Remove all handlers for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.handlers.delete(event);
      this.onceHandlers.delete(event);
    } else {
      this.handlers.clear();
      this.onceHandlers.clear();
    }
  }

  /**
   * Get count of listeners for an event
   */
  listenerCount(event: string): number {
    const regularCount = this.handlers.get(event)?.size || 0;
    const onceCount = this.onceHandlers.get(event)?.size || 0;
    return regularCount + onceCount;
  }

  /**
   * Create a typed event channel
   */
  channel<T>(event: string): TypedChannel<T> {
    return new TypedChannel<T>(this, event);
  }

  async dispose(): Promise<void> {
    this.handlers.clear();
    this.onceHandlers.clear();
  }
}

/**
 * Typed channel for type-safe events
 */
export class TypedChannel<T> {
  constructor(
    private bus: EventBus,
    private event: string
  ) {}

  emit(payload: T): void {
    this.bus.emit(this.event, payload);
  }

  on(handler: EventHandler<T>): () => void {
    return this.bus.on(this.event, handler);
  }

  once(handler: EventHandler<T>): () => void {
    return this.bus.once(this.event, handler);
  }
}

// Predefined event types for LabIQ Health
export const LabIQEvents = {
  // Challenge events
  CHALLENGE_STARTED: 'challenge:started',
  CHALLENGE_COMPLETED: 'challenge:completed',
  CHALLENGE_FAILED: 'challenge:failed',

  // User events
  USER_SIGNED_IN: 'user:signedIn',
  USER_SIGNED_OUT: 'user:signedOut',
  USER_PROFILE_UPDATED: 'user:profileUpdated',

  // IQ events
  IQ_UPDATED: 'iq:updated',
  LEVEL_UP: 'iq:levelUp',

  // Dataset events
  DATASET_UPLOADED: 'dataset:uploaded',
  DATASET_DELETED: 'dataset:deleted',
  DATASET_PROCESSED: 'dataset:processed',

  // AI events
  AI_GENERATION_STARTED: 'ai:generationStarted',
  AI_GENERATION_COMPLETED: 'ai:generationCompleted',
  AI_GENERATION_FAILED: 'ai:generationFailed',

  // Code execution events
  CODE_EXECUTION_STARTED: 'code:executionStarted',
  CODE_EXECUTION_COMPLETED: 'code:executionCompleted',
  CODE_EXECUTION_FAILED: 'code:executionFailed',
} as const;

// Default event bus instance
export const eventBus = new EventBus();
