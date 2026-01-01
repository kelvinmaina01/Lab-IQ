/**
 * ExperimentService - Experiment Management with State Machine
 * 
 * Per Blueprint Phase 4: Experiments System
 * Handles experiment lifecycle: PLANNED → RUNNING → COMPLETED → FAILED
 * 
 * Key capabilities:
 * - Auto-create experiments from datasets (via automation rules)
 * - State machine transitions with validation
 * - Link datasets and models to experiments
 * - Track results and proposals
 */

import { supabase } from '@/integrations/supabase/client';
import { eventBus, EventTypes } from '@/lib/events';

// =============================================================================
// TYPES
// =============================================================================

export type ExperimentStatus = 'PLANNED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface Experiment {
    id: string;
    title: string;
    description: string;
    status: ExperimentStatus;
    objective?: string;
    hypothesis?: string;
    successMetrics?: Record<string, unknown>;
    protocolSteps?: string[];
    allowedModels?: string[];
    results?: Record<string, unknown>;
    datasetIds: string[];
    modelIds: string[];
    createdBy: string;
    proposedBy?: 'user' | 'ai';
    startedAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateExperimentInput {
    title: string;
    description?: string;
    objective?: string;
    hypothesis?: string;
    datasetId?: string;
    proposedBy?: 'user' | 'ai';
}

export interface ExperimentProposal {
    id: string;
    experimentId?: string;
    datasetId: string;
    title: string;
    description: string;
    type: string;
    rationale: string;
    expectedOutcome: string;
    confidence: number;
    createdAt: string;
    status: 'pending' | 'accepted' | 'rejected';
}

// State machine valid transitions
const VALID_TRANSITIONS: Record<ExperimentStatus, ExperimentStatus[]> = {
    'PLANNED': ['RUNNING', 'FAILED'],
    'RUNNING': ['COMPLETED', 'FAILED'],
    'COMPLETED': [], // Terminal state
    'FAILED': ['PLANNED'], // Can retry
};

// =============================================================================
// EXPERIMENT SERVICE CLASS
// =============================================================================

export class ExperimentService {
    private userId: string | null = null;

    constructor() {
        this.initializeUser();
    }

    private async initializeUser(): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        this.userId = user?.id || null;
    }

    // =========================================================================
    // CRUD OPERATIONS
    // =========================================================================

    /**
     * Create a new experiment
     */
    async create(input: CreateExperimentInput): Promise<Experiment> {
        if (!this.userId) {
            await this.initializeUser();
        }

        const { data, error } = await supabase
            .from('experiments')
            .insert({
                title: input.title,
                description: input.description || '',
                objective: input.objective,
                hypothesis: input.hypothesis,
                status: 'PLANNED',
                proposed_by: input.proposedBy || 'user',
                dataset_id: input.datasetId,
                user_id: this.userId,
            })
            .select()
            .single();

        if (error) {
            console.error('[ExperimentService] Create error:', error);
            throw new Error(`Failed to create experiment: ${error.message}`);
        }

        const experiment = this.mapToExperiment(data);

        // Emit event
        eventBus.emit(EventTypes.EXPERIMENT_CREATED, {
            experimentId: experiment.id,
            title: experiment.title,
            datasetId: input.datasetId,
            proposedBy: input.proposedBy,
        }, {
            source: 'experimentService',
            userId: this.userId || undefined,
        });

        console.log('[ExperimentService] Created experiment:', experiment.id);
        return experiment;
    }

    /**
     * Get experiment by ID
     */
    async getById(id: string): Promise<Experiment | null> {
        const { data, error } = await supabase
            .from('experiments')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('[ExperimentService] Get error:', error);
            return null;
        }

        return this.mapToExperiment(data);
    }

    /**
     * Get all experiments for current user
     */
    async getAll(): Promise<Experiment[]> {
        const { data, error } = await supabase
            .from('experiments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[ExperimentService] GetAll error:', error);
            return [];
        }

        return data.map(this.mapToExperiment);
    }

    /**
     * Get experiments by status
     */
    async getByStatus(status: ExperimentStatus): Promise<Experiment[]> {
        const { data, error } = await supabase
            .from('experiments')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[ExperimentService] GetByStatus error:', error);
            return [];
        }

        return data.map(this.mapToExperiment);
    }

    // =========================================================================
    // STATE MACHINE
    // =========================================================================

    /**
     * Update experiment status with state machine validation
     */
    async updateStatus(id: string, newStatus: ExperimentStatus): Promise<Experiment> {
        const experiment = await this.getById(id);
        if (!experiment) {
            throw new Error(`Experiment ${id} not found`);
        }

        const currentStatus = experiment.status;
        const allowedTransitions = VALID_TRANSITIONS[currentStatus];

        if (!allowedTransitions.includes(newStatus)) {
            throw new Error(
                `Invalid transition from ${currentStatus} to ${newStatus}. ` +
                `Allowed: ${allowedTransitions.join(', ') || 'none'}`
            );
        }

        const updates: Record<string, unknown> = {
            status: newStatus,
            updated_at: new Date().toISOString(),
        };

        // Set timestamps based on transition
        if (newStatus === 'RUNNING' && currentStatus === 'PLANNED') {
            updates.started_at = new Date().toISOString();
        } else if (newStatus === 'COMPLETED' || newStatus === 'FAILED') {
            updates.completed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('experiments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update status: ${error.message}`);
        }

        const updated = this.mapToExperiment(data);

        // Emit appropriate event
        const eventType = this.getStatusEventType(newStatus);
        if (eventType) {
            eventBus.emit(eventType, {
                experimentId: id,
                previousStatus: currentStatus,
                newStatus,
                title: updated.title,
            }, {
                source: 'experimentService',
                userId: this.userId || undefined,
            });
        }

        console.log(`[ExperimentService] Status updated: ${id} ${currentStatus} → ${newStatus}`);
        return updated;
    }

    /**
     * Start an experiment (PLANNED → RUNNING)
     */
    async start(id: string): Promise<Experiment> {
        return this.updateStatus(id, 'RUNNING');
    }

    /**
     * Complete an experiment (RUNNING → COMPLETED)
     */
    async complete(id: string, results?: Record<string, unknown>): Promise<Experiment> {
        if (results) {
            await supabase
                .from('experiments')
                .update({ results })
                .eq('id', id);
        }
        return this.updateStatus(id, 'COMPLETED');
    }

    /**
     * Fail an experiment (any → FAILED)
     */
    async fail(id: string, reason?: string): Promise<Experiment> {
        if (reason) {
            await supabase
                .from('experiments')
                .update({
                    results: { failureReason: reason }
                })
                .eq('id', id);
        }
        return this.updateStatus(id, 'FAILED');
    }

    // =========================================================================
    // AUTO-CREATION FROM DATASETS
    // =========================================================================

    /**
     * Create an experiment from a dataset (called by automation rules)
     */
    async createFromDataset(params: {
        datasetId: string;
        datasetName?: string;
        domain?: string;
        proposedBy?: 'user' | 'ai';
    }): Promise<Experiment> {
        const title = params.datasetName
            ? `Analysis: ${params.datasetName}`
            : `Dataset Analysis - ${new Date().toLocaleDateString()}`;

        const description = params.domain
            ? `Auto-created experiment for ${params.domain} domain analysis`
            : 'Auto-created experiment from uploaded dataset';

        return this.create({
            title,
            description,
            datasetId: params.datasetId,
            proposedBy: params.proposedBy || 'ai',
            objective: 'Analyze dataset and discover insights',
        });
    }

    // =========================================================================
    // LINKING
    // =========================================================================

    /**
     * Link a dataset to an experiment
     */
    async attachDataset(experimentId: string, datasetId: string): Promise<void> {
        const experiment = await this.getById(experimentId);
        if (!experiment) {
            throw new Error(`Experiment ${experimentId} not found`);
        }

        // Update the dataset_id field (simple FK relationship)
        const { error } = await supabase
            .from('experiments')
            .update({ dataset_id: datasetId })
            .eq('id', experimentId);

        if (error) {
            throw new Error(`Failed to attach dataset: ${error.message}`);
        }

        console.log(`[ExperimentService] Attached dataset ${datasetId} to experiment ${experimentId}`);
    }

    /**
     * Link a model to an experiment
     */
    async linkModel(experimentId: string, modelId: string): Promise<void> {
        // For now, store in a JSON field or separate table
        // This can be enhanced with a proper junction table
        console.log(`[ExperimentService] Linking model ${modelId} to experiment ${experimentId}`);

        // TODO: Implement proper model linking when ml_models table has experiment_id FK
    }

    /**
     * Record experiment results
     */
    async recordResults(experimentId: string, results: Record<string, unknown>): Promise<Experiment> {
        const { data, error } = await supabase
            .from('experiments')
            .update({
                results,
                updated_at: new Date().toISOString(),
            })
            .eq('id', experimentId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to record results: ${error.message}`);
        }

        console.log(`[ExperimentService] Recorded results for experiment ${experimentId}`);
        return this.mapToExperiment(data);
    }

    // =========================================================================
    // AI PROPOSALS
    // =========================================================================

    /**
     * Get AI-proposed experiments for a dataset
     */
    async getProposedExperiments(datasetId: string): Promise<ExperimentProposal[]> {
        // TODO: Query from experiment_proposals table when created
        // For now, return empty array
        console.log(`[ExperimentService] Getting proposals for dataset ${datasetId}`);
        return [];
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private mapToExperiment(data: Record<string, unknown>): Experiment {
        return {
            id: data.id as string,
            title: data.title as string,
            description: data.description as string || '',
            status: (data.status as ExperimentStatus) || 'PLANNED',
            objective: data.objective as string,
            hypothesis: data.hypothesis as string,
            successMetrics: data.success_metrics as Record<string, unknown>,
            protocolSteps: data.protocol_steps as string[],
            allowedModels: data.allowed_models as string[],
            results: data.results as Record<string, unknown>,
            datasetIds: data.dataset_id ? [data.dataset_id as string] : [],
            modelIds: [],
            createdBy: data.user_id as string,
            proposedBy: data.proposed_by as 'user' | 'ai',
            startedAt: data.started_at as string,
            completedAt: data.completed_at as string,
            createdAt: data.created_at as string,
            updatedAt: data.updated_at as string,
        };
    }

    private getStatusEventType(status: ExperimentStatus): string | null {
        switch (status) {
            case 'RUNNING':
                return EventTypes.EXPERIMENT_RUNNING;
            case 'COMPLETED':
                return EventTypes.EXPERIMENT_COMPLETED;
            default:
                return null;
        }
    }
}

// Singleton export
export const experimentService = new ExperimentService();
