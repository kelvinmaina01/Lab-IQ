/**
 * SignalEmitter Service - Model Signal Emission
 * 
 * Per Blueprint Phase 3: ML Models & Signal Emission
 * Models emit signals, not insights. The AI interprets signals.
 * 
 * Signal Flow: Model → Signal → EventBus → AI Interpretation → Workflow → Human
 */

import { eventBus, EventTypes } from '@/lib/events';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// TYPES
// =============================================================================

export type SignalType =
    | 'anomaly'
    | 'prediction'
    | 'threshold_breach'
    | 'trend_change'
    | 'correlation'
    | 'pattern_detected';

export interface ModelSignal {
    id: string;
    type: SignalType;
    modelId: string;
    datasetId: string;
    score: number;           // 0-1 score representing signal strength
    confidence: number;      // 0-1 confidence in the signal
    timestamp: string;
    metadata: SignalMetadata;
}

export interface SignalMetadata {
    featureInvolved?: string[];
    affectedRows?: number;
    timeRange?: { start: string; end: string };
    previousValue?: number;
    currentValue?: number;
    threshold?: number;
    direction?: 'up' | 'down' | 'stable';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    description?: string;
}

export interface EmitSignalInput {
    type: SignalType;
    modelId: string;
    datasetId: string;
    score: number;
    confidence: number;
    metadata?: Partial<SignalMetadata>;
}

// =============================================================================
// SIGNAL EMITTER CLASS
// =============================================================================

export class SignalEmitter {
    private static instance: SignalEmitter | null = null;
    private userId: string | null = null;

    private constructor() {
        this.initializeUser();
    }

    public static getInstance(): SignalEmitter {
        if (!SignalEmitter.instance) {
            SignalEmitter.instance = new SignalEmitter();
        }
        return SignalEmitter.instance;
    }

    private async initializeUser(): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        this.userId = user?.id || null;
    }

    // =========================================================================
    // SIGNAL EMISSION
    // =========================================================================

    /**
     * Emit a signal from a model
     * This is the primary entry point for models to communicate findings
     */
    async emit(input: EmitSignalInput): Promise<ModelSignal> {
        const signal: ModelSignal = {
            id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: input.type,
            modelId: input.modelId,
            datasetId: input.datasetId,
            score: Math.max(0, Math.min(1, input.score)),
            confidence: Math.max(0, Math.min(1, input.confidence)),
            timestamp: new Date().toISOString(),
            metadata: {
                severity: this.calculateSeverity(input.score, input.confidence),
                ...input.metadata,
            },
        };

        console.log('[SignalEmitter] Emitting signal:', {
            type: signal.type,
            modelId: signal.modelId,
            score: signal.score.toFixed(2),
            confidence: signal.confidence.toFixed(2),
        });

        // Emit appropriate event based on signal type
        const eventType = this.getEventType(signal.type);
        eventBus.emit(eventType, {
            signalId: signal.id,
            signalType: signal.type,
            modelId: signal.modelId,
            datasetId: signal.datasetId,
            score: signal.score,
            confidence: signal.confidence,
            severity: signal.metadata.severity,
            description: signal.metadata.description,
        }, {
            source: 'signalEmitter',
            userId: this.userId || undefined,
            metadata: { signal },
        });

        // Store signal in database for history
        await this.storeSignal(signal);

        return signal;
    }

    /**
     * Emit an anomaly signal
     */
    async emitAnomaly(params: {
        modelId: string;
        datasetId: string;
        score: number;
        confidence: number;
        affectedRows?: number;
        features?: string[];
        description?: string;
    }): Promise<ModelSignal> {
        return this.emit({
            type: 'anomaly',
            modelId: params.modelId,
            datasetId: params.datasetId,
            score: params.score,
            confidence: params.confidence,
            metadata: {
                affectedRows: params.affectedRows,
                featureInvolved: params.features,
                description: params.description,
            },
        });
    }

    /**
     * Emit a prediction signal
     */
    async emitPrediction(params: {
        modelId: string;
        datasetId: string;
        score: number;
        confidence: number;
        targetValue?: number;
        description?: string;
    }): Promise<ModelSignal> {
        return this.emit({
            type: 'prediction',
            modelId: params.modelId,
            datasetId: params.datasetId,
            score: params.score,
            confidence: params.confidence,
            metadata: {
                currentValue: params.targetValue,
                description: params.description,
            },
        });
    }

    /**
     * Emit a threshold breach signal
     */
    async emitThresholdBreach(params: {
        modelId: string;
        datasetId: string;
        currentValue: number;
        threshold: number;
        direction: 'up' | 'down';
        feature: string;
    }): Promise<ModelSignal> {
        const score = Math.abs(params.currentValue - params.threshold) / params.threshold;

        return this.emit({
            type: 'threshold_breach',
            modelId: params.modelId,
            datasetId: params.datasetId,
            score: Math.min(1, score),
            confidence: 1.0, // Threshold breaches are deterministic
            metadata: {
                currentValue: params.currentValue,
                threshold: params.threshold,
                direction: params.direction,
                featureInvolved: [params.feature],
                description: `${params.feature} ${params.direction === 'up' ? 'exceeded' : 'fell below'} threshold of ${params.threshold}`,
            },
        });
    }

    /**
     * Emit a trend change signal
     */
    async emitTrendChange(params: {
        modelId: string;
        datasetId: string;
        direction: 'up' | 'down' | 'stable';
        magnitude: number;
        confidence: number;
        feature: string;
    }): Promise<ModelSignal> {
        return this.emit({
            type: 'trend_change',
            modelId: params.modelId,
            datasetId: params.datasetId,
            score: params.magnitude,
            confidence: params.confidence,
            metadata: {
                direction: params.direction,
                featureInvolved: [params.feature],
                description: `${params.feature} showing ${params.direction} trend`,
            },
        });
    }

    // =========================================================================
    // SIGNAL PROCESSING
    // =========================================================================

    /**
     * Process a signal through the AI → Workflow pipeline
     * This is called after emission to trigger interpretation
     */
    async processSignal(signal: ModelSignal): Promise<void> {
        console.log('[SignalEmitter] Processing signal:', signal.id);

        // High-confidence anomalies get immediate escalation
        if (signal.type === 'anomaly' && signal.confidence > 0.8) {
            eventBus.emit(EventTypes.ANOMALY_DETECTED, {
                signalId: signal.id,
                modelId: signal.modelId,
                datasetId: signal.datasetId,
                severity: signal.metadata.severity,
                confidence: signal.confidence,
            }, {
                source: 'signalEmitter',
                userId: this.userId || undefined,
            });
        }

        // Threshold breaches always trigger alerts
        if (signal.type === 'threshold_breach') {
            eventBus.emit(EventTypes.THRESHOLD_EXCEEDED, {
                signalId: signal.id,
                modelId: signal.modelId,
                datasetId: signal.datasetId,
                threshold: signal.metadata.threshold,
                currentValue: signal.metadata.currentValue,
                feature: signal.metadata.featureInvolved?.[0],
            }, {
                source: 'signalEmitter',
                userId: this.userId || undefined,
            });
        }
    }

    // =========================================================================
    // HISTORY & RETRIEVAL
    // =========================================================================

    /**
     * Get recent signals for a model
     */
    async getSignalsForModel(modelId: string, limit: number = 50): Promise<ModelSignal[]> {
        const { data, error } = await supabase
            .from('model_signals')
            .select('*')
            .eq('model_id', modelId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[SignalEmitter] Failed to get signals:', error);
            return [];
        }

        return (data || []).map(this.mapToSignal);
    }

    /**
     * Get signals for a dataset
     */
    async getSignalsForDataset(datasetId: string, limit: number = 50): Promise<ModelSignal[]> {
        const { data, error } = await supabase
            .from('model_signals')
            .select('*')
            .eq('dataset_id', datasetId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[SignalEmitter] Failed to get signals:', error);
            return [];
        }

        return (data || []).map(this.mapToSignal);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private async storeSignal(signal: ModelSignal): Promise<void> {
        try {
            await supabase.from('model_signals').insert({
                id: signal.id,
                type: signal.type,
                model_id: signal.modelId,
                dataset_id: signal.datasetId,
                score: signal.score,
                confidence: signal.confidence,
                metadata: signal.metadata,
            });
        } catch (error) {
            // Table might not exist yet, log but don't fail
            console.warn('[SignalEmitter] Could not store signal (table may not exist):', error);
        }
    }

    private calculateSeverity(score: number, confidence: number): 'low' | 'medium' | 'high' | 'critical' {
        const combined = score * confidence;
        if (combined >= 0.8) return 'critical';
        if (combined >= 0.6) return 'high';
        if (combined >= 0.3) return 'medium';
        return 'low';
    }

    private getEventType(signalType: SignalType): string {
        switch (signalType) {
            case 'anomaly':
                return EventTypes.ANOMALY_DETECTED;
            case 'threshold_breach':
                return EventTypes.THRESHOLD_EXCEEDED;
            default:
                return EventTypes.AI_INSIGHT_GENERATED;
        }
    }

    private mapToSignal(data: Record<string, unknown>): ModelSignal {
        return {
            id: data.id as string,
            type: data.type as SignalType,
            modelId: data.model_id as string,
            datasetId: data.dataset_id as string,
            score: data.score as number,
            confidence: data.confidence as number,
            timestamp: data.created_at as string,
            metadata: data.metadata as SignalMetadata,
        };
    }
}

// Singleton export
export const signalEmitter = SignalEmitter.getInstance();
