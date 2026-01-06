import { SupabaseClient } from '@supabase/supabase-js';

// Define all possible event types in the system
export type EventType =
    | 'DATASET_UPLOADED'
    | 'DATASET_UPDATED'
    | 'EXPERIMENT_CREATED'
    | 'EXPERIMENT_RUNNING'
    | 'EXPERIMENT_COMPLETED'
    | 'EXPERIMENT_FAILED'
    | 'MODEL_TRAINING_STARTED'
    | 'MODEL_TRAINING_COMPLETED'
    | 'ANOMALY_DETECTED'
    | 'AI_INSIGHT_GENERATED'
    | 'REPORT_GENERATED'
    | 'THRESHOLD_EXCEEDED'
    | 'TASK_CREATED'
    | 'NOTIFICATION_SENT'
    | 'WORKFLOW_TRIGGERED'
    | 'WORKFLOW_COMPLETED'
    | 'WORKFLOW_FAILED';

export const EventTypes = {
    DATASET_UPLOADED: 'DATASET_UPLOADED',
    DATASET_UPDATED: 'DATASET_UPDATED',
    EXPERIMENT_CREATED: 'EXPERIMENT_CREATED',
    EXPERIMENT_RUNNING: 'EXPERIMENT_RUNNING',
    EXPERIMENT_COMPLETED: 'EXPERIMENT_COMPLETED',
    EXPERIMENT_FAILED: 'EXPERIMENT_FAILED',
    MODEL_TRAINING_STARTED: 'MODEL_TRAINING_STARTED',
    MODEL_TRAINING_COMPLETED: 'MODEL_TRAINING_COMPLETED',
    ANOMALY_DETECTED: 'ANOMALY_DETECTED',
    AI_INSIGHT_GENERATED: 'AI_INSIGHT_GENERATED',
    REPORT_GENERATED: 'REPORT_GENERATED',
    THRESHOLD_EXCEEDED: 'THRESHOLD_EXCEEDED',
    TASK_CREATED: 'TASK_CREATED',
    NOTIFICATION_SENT: 'NOTIFICATION_SENT',
    WORKFLOW_TRIGGERED: 'WORKFLOW_TRIGGERED',
    WORKFLOW_COMPLETED: 'WORKFLOW_COMPLETED',
    WORKFLOW_FAILED: 'WORKFLOW_FAILED',
} as const;

// Generic payload interface
export interface EventPayload {
    timestamp: string;
    source: string;
    data: any;
    userId?: string;
    projectId?: string;
}

// Specific payloads can be extended here
export interface DatasetUploadedPayload extends EventPayload {
    data: {
        datasetId: string;
        filename: string;
        domain?: string;
        rowCount: number;
        isTimeSeries: boolean;
    };
}

export interface ExperimentCompletedPayload extends EventPayload {
    data: {
        experimentId: string;
        status: string;
        metrics: Record<string, number>;
    };
}

export interface WorkflowPayload extends EventPayload {
    data: {
        workflowId: string;
        executionId?: string;
        name: string;
        trigger: string;
        stepCount?: number;
        stepsCompleted?: number;
        status?: string;
        duration?: number;
        error?: string;
        datasetId?: string;
    }
}

export interface AIInsightPayload extends EventPayload {
    data: {
        insightId: string;
        title: string;
        insightType: string;
        confidence: number;
        datasetId?: string;
        modelId?: string;
        summary: string;
        mode?: string;
        hasVisualization?: boolean;
    }
}

// Callback type
export type EventCallback = (payload: EventPayload) => void | Promise<void>;

/**
 * EventBus: The Central Nervous System of LabIQ
 * Implements a Singleton pattern to ensure one event bus across the app.
 */
class EventBus {
    private static instance: EventBus;
    private listeners: Map<EventType, EventCallback[]>;
    private history: { type: EventType; payload: EventPayload }[];
    private maxHistory: number = 100;

    private constructor() {
        this.listeners = new Map();
        this.history = [];
        console.log('✅ [EventBus] System initialized');
    }

    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    /**
     * Subscribe to an event
     */
    public on(event: EventType, callback: EventCallback): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }

    /**
     * Unsubscribe from an event
     */
    public off(event: EventType, callback: EventCallback): void {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            this.listeners.set(
                event,
                callbacks.filter((cb) => cb !== callback)
            );
        }
    }

    /**
     * Emit an event to all subscribers
     */
    public async emit(event: EventType, payload: EventPayload): Promise<void> {
        // 1. Add timestamp if missing
        if (!payload.timestamp) {
            payload.timestamp = new Date().toISOString();
        }

        // 2. Log to history
        this.addToHistory(event, payload);

        // 3. Log to console (debug)
        console.log(`📢 [EventBus] Emitting ${event}:`, payload);

        // 4. Notify listeners
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            if (callbacks) {
                // Execute all callbacks (async safe)
                await Promise.all(
                    callbacks.map(async (cb) => {
                        try {
                            await cb(payload);
                        } catch (error) {
                            console.error(`❌ [EventBus] Error in listener for ${event}:`, error);
                        }
                    })
                );
            }
        }
    }

    /**
     * Get recent event history
     */
    public getHistory(): { type: EventType; payload: EventPayload }[] {
        return this.history;
    }

    private addToHistory(type: EventType, payload: EventPayload) {
        this.history.unshift({ type, payload });
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
    }

    /**
     * Clear all listeners (useful for testing or reset)
     */
    public clear(): void {
        this.listeners.clear();
        this.history = [];
    }
}

export const eventBus = EventBus.getInstance();
