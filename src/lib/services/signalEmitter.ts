import { eventBus, EventTypes, EventPayload } from './eventBus';

export type SignalType = 'heartbeat' | 'progress' | 'alert' | 'status_change';
export type SignalPriority = 'low' | 'normal' | 'high' | 'critical';

export interface SignalPayload {
    source: string;
    signalType: SignalType;
    priority: SignalPriority;
    message: string;
    metadata?: Record<string, any>;
}

class SignalEmitter {
    private static instance: SignalEmitter;

    private constructor() { }

    public static getInstance(): SignalEmitter {
        if (!SignalEmitter.instance) {
            SignalEmitter.instance = new SignalEmitter();
        }
        return SignalEmitter.instance;
    }

    /**
     * Emit a standardized signal
     */
    public emit(
        source: string,
        signalType: SignalType,
        message: string,
        priority: SignalPriority = 'normal',
        metadata: Record<string, any> = {}
    ) {
        // Emit standardized event
        // We use a generic TASK_CREATED or NOTIFICATION_SENT if it maps, 
        // or we could add a new specific SIGNAL event.
        // For now, let's map 'alert' and 'critical' to NOTIFICATION_SENT
        // and others to console/debug or a generic 'SIGNAL_EMITTED' if we added it.
        // But we didn't add SIGNAL_EMITTED to EventTypes.
        // Let's us ANOMALY_DETECTED for alerts, or just generic usage.

        // Actually, let's just use the EventBus strictly.
        // This service is a helper to standardize *how* signals are emitted.

        const payload: EventPayload = {
            timestamp: new Date().toISOString(),
            source: source,
            data: {
                signalType,
                priority,
                message,
                ...metadata
            }
        };

        if (signalType === 'alert' || priority === 'critical') {
            eventBus.emit(EventTypes.NOTIFICATION_SENT, payload);
        } else {
            // Internal signal, maybe just log or specific monitoring event
            // Using a custom event string is allowed by EventBus emit type?
            // EventType is a specific union.
            // Let's use 'TASK_CREATED' as a placeholder for "Internal Task/Signal" if generic
            // OR we should have added 'SIGNAL' to EventTypes.

            // For V1, let's just log it if it doesn't map to a critical event
            console.log(`📡 [SignalEmitter] ${source}: ${message} (${priority})`);
        }
    }
}

export const signalEmitter = SignalEmitter.getInstance();
