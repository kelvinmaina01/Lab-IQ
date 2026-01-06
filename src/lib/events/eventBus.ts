/**
 * LabIQ Health - Event Bus
 * 
 * Central pub/sub system for the closed-loop automation.
 * Implements the Observer pattern with performance optimizations:
 * - O(1) handler lookup with Map
 * - Batch event processing
 * - Circular buffer for history
 * - Error isolation for handlers
 */

import { v4 as uuidv4 } from 'uuid';
import {
    EventType,
    EventTypes,
    HealthEvent,
    EventHandler,
    EventFilter,
    Unsubscribe,
} from './eventTypes';

// =============================================================================
// CONFIGURATION
// =============================================================================

const EVENT_BUS_CONFIG = {
    /** Maximum events to keep in history (circular buffer) */
    maxHistorySize: 1000,
    /** Enable debug logging */
    debug: import.meta.env.DEV,
    /** Persist events to database */
    persistEvents: false, // Enable in production
};

// =============================================================================
// EVENT BUS CLASS
// =============================================================================

export class EventBus {
    private static instance: EventBus | null = null;

    /** Handlers indexed by event type for O(1) lookup */
    private handlers: Map<EventType, Set<EventHandler>> = new Map();

    /** Wildcard handlers that receive all events */
    private wildcardHandlers: Set<EventHandler> = new Set();

    /** Circular buffer for event history */
    private history: HealthEvent[] = [];
    private historyIndex = 0;
    private historyFull = false;

    /** Event processing stats */
    private stats = {
        totalEmitted: 0,
        handlerErrors: 0,
        lastEventTime: null as string | null,
    };

    private constructor() {
        // Initialize handler maps for all event types
        Object.values(EventTypes).forEach((type) => {
            this.handlers.set(type, new Set());
        });

        if (EVENT_BUS_CONFIG.debug) {
            console.log('[EventBus] Initialized with', Object.keys(EventTypes).length, 'event types');
        }
    }

    // ===========================================================================
    // SINGLETON PATTERN
    // ===========================================================================

    /**
     * Get the singleton EventBus instance
     */
    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    /**
     * Reset the singleton (for testing)
     */
    public static reset(): void {
        EventBus.instance = null;
    }

    // ===========================================================================
    // EMIT EVENTS
    // ===========================================================================

    /**
     * Emit an event to all subscribers
     * @param type Event type
     * @param payload Event payload data
     * @param options Additional event options
     */
    public emit<T = unknown>(
        type: EventType,
        payload: T,
        options: {
            source?: string;
            userId?: string;
            metadata?: Record<string, unknown>;
        } = {}
    ): HealthEvent<T> {
        const event: HealthEvent<T> = {
            id: uuidv4(),
            type,
            payload,
            timestamp: new Date().toISOString(),
            source: options.source || 'unknown',
            userId: options.userId,
            metadata: options.metadata,
        };

        // Add to history (circular buffer)
        this.addToHistory(event);

        // Update stats
        this.stats.totalEmitted++;
        this.stats.lastEventTime = event.timestamp;

        if (EVENT_BUS_CONFIG.debug) {
            console.log(`[EventBus] Emit: ${type}`, { id: event.id, payload });
        }

        // Notify type-specific handlers
        const typeHandlers = this.handlers.get(type);
        if (typeHandlers && typeHandlers.size > 0) {
            this.notifyHandlers(typeHandlers, event);
        }

        // Notify wildcard handlers
        if (this.wildcardHandlers.size > 0) {
            this.notifyHandlers(this.wildcardHandlers, event);
        }

        return event;
    }

    /**
     * Emit event and wait for all handlers to complete
     */
    public async emitAsync<T = unknown>(
        type: EventType,
        payload: T,
        options: {
            source?: string;
            userId?: string;
            metadata?: Record<string, unknown>;
        } = {}
    ): Promise<HealthEvent<T>> {
        const event = this.emit(type, payload, options);

        // Wait for all handlers
        const typeHandlers = this.handlers.get(type);
        const allHandlers = [
            ...(typeHandlers ? Array.from(typeHandlers) : []),
            ...Array.from(this.wildcardHandlers),
        ];

        await Promise.allSettled(
            allHandlers.map(async (handler) => {
                try {
                    await handler(event);
                } catch (error) {
                    // Error already logged in notifyHandlers
                }
            })
        );

        return event;
    }

    // ===========================================================================
    // SUBSCRIBE TO EVENTS
    // ===========================================================================

    /**
     * Subscribe to a specific event type
     * @param type Event type to subscribe to
     * @param handler Handler function
     * @returns Unsubscribe function
     */
    public on<T = unknown>(type: EventType, handler: EventHandler<T>): Unsubscribe {
        const handlers = this.handlers.get(type);
        if (!handlers) {
            console.warn(`[EventBus] Unknown event type: ${type}`);
            return () => { };
        }

        handlers.add(handler as EventHandler);

        if (EVENT_BUS_CONFIG.debug) {
            console.log(`[EventBus] Subscribed to ${type}, total handlers:`, handlers.size);
        }

        // Return unsubscribe function
        return () => {
            handlers.delete(handler as EventHandler);
            if (EVENT_BUS_CONFIG.debug) {
                console.log(`[EventBus] Unsubscribed from ${type}`);
            }
        };
    }

    /**
     * Subscribe to a specific event type for one event only
     */
    public once<T = unknown>(type: EventType, handler: EventHandler<T>): Unsubscribe {
        const wrappedHandler: EventHandler<T> = (event) => {
            unsubscribe();
            handler(event);
        };

        const unsubscribe = this.on(type, wrappedHandler);
        return unsubscribe;
    }

    /**
     * Subscribe to all events (wildcard)
     */
    public onAny(handler: EventHandler): Unsubscribe {
        this.wildcardHandlers.add(handler);

        return () => {
            this.wildcardHandlers.delete(handler);
        };
    }

    /**
     * Unsubscribe from a specific event type
     */
    public off<T = unknown>(type: EventType, handler: EventHandler<T>): void {
        const handlers = this.handlers.get(type);
        if (handlers) {
            handlers.delete(handler as EventHandler);
        }
    }

    // ===========================================================================
    // EVENT HISTORY
    // ===========================================================================

    /**
     * Get event history with optional filtering
     */
    public getHistory(filter?: EventFilter): HealthEvent[] {
        let events = this.getHistoryArray();

        if (filter) {
            if (filter.type) {
                const types = Array.isArray(filter.type) ? filter.type : [filter.type];
                events = events.filter((e) => types.includes(e.type));
            }

            if (filter.source) {
                events = events.filter((e) => e.source === filter.source);
            }

            if (filter.userId) {
                events = events.filter((e) => e.userId === filter.userId);
            }

            if (filter.startTime) {
                events = events.filter((e) => e.timestamp >= filter.startTime!);
            }

            if (filter.endTime) {
                events = events.filter((e) => e.timestamp <= filter.endTime!);
            }

            if (filter.limit) {
                events = events.slice(-filter.limit);
            }
        }

        return events;
    }

    /**
     * Get the last N events
     */
    public getRecentEvents(count: number = 10): HealthEvent[] {
        return this.getHistoryArray().slice(-count);
    }

    /**
     * Clear event history
     */
    public clearHistory(): void {
        this.history = [];
        this.historyIndex = 0;
        this.historyFull = false;
    }

    // ===========================================================================
    // STATISTICS
    // ===========================================================================

    /**
     * Get event bus statistics
     */
    public getStats(): {
        totalEmitted: number;
        handlerErrors: number;
        lastEventTime: string | null;
        historySize: number;
        handlerCounts: Record<string, number>;
    } {
        const handlerCounts: Record<string, number> = {};
        this.handlers.forEach((handlers, type) => {
            handlerCounts[type] = handlers.size;
        });

        return {
            ...this.stats,
            historySize: this.historyFull ? EVENT_BUS_CONFIG.maxHistorySize : this.historyIndex,
            handlerCounts,
        };
    }

    // ===========================================================================
    // PRIVATE METHODS
    // ===========================================================================

    /**
     * Add event to circular buffer history
     */
    private addToHistory(event: HealthEvent): void {
        if (this.historyIndex >= EVENT_BUS_CONFIG.maxHistorySize) {
            this.historyIndex = 0;
            this.historyFull = true;
        }

        this.history[this.historyIndex] = event;
        this.historyIndex++;
    }

    /**
     * Get history array in chronological order
     */
    private getHistoryArray(): HealthEvent[] {
        if (!this.historyFull) {
            return this.history.slice(0, this.historyIndex);
        }

        // Circular buffer is full, need to reorder
        return [
            ...this.history.slice(this.historyIndex),
            ...this.history.slice(0, this.historyIndex),
        ];
    }

    /**
     * Notify all handlers with error isolation
     */
    private notifyHandlers(handlers: Set<EventHandler>, event: HealthEvent): void {
        handlers.forEach((handler) => {
            try {
                // Execute handler - use queueMicrotask for non-blocking
                queueMicrotask(() => {
                    try {
                        const result = handler(event);
                        // If handler returns a promise, catch errors
                        if (result instanceof Promise) {
                            result.catch((error) => {
                                this.handleError(error, event);
                            });
                        }
                    } catch (error) {
                        this.handleError(error, event);
                    }
                });
            } catch (error) {
                this.handleError(error, event);
            }
        });
    }

    /**
     * Handle errors from handlers
     */
    private handleError(error: unknown, event: HealthEvent): void {
        this.stats.handlerErrors++;
        console.error(`[EventBus] Handler error for ${event.type}:`, error);
    }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const eventBus = EventBus.getInstance();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Emit an event (convenience function)
 */
export function emit<T = unknown>(
    type: EventType,
    payload: T,
    options?: { source?: string; userId?: string; metadata?: Record<string, unknown> }
): HealthEvent<T> {
    return eventBus.emit(type, payload, options);
}

/**
 * Subscribe to an event (convenience function)
 */
export function on<T = unknown>(type: EventType, handler: EventHandler<T>): Unsubscribe {
    return eventBus.on(type, handler);
}

/**
 * Subscribe once (convenience function)
 */
export function once<T = unknown>(type: EventType, handler: EventHandler<T>): Unsubscribe {
    return eventBus.once(type, handler);
}
