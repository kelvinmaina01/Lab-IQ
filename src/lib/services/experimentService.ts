import { supabase } from '@/integrations/supabase/client';
import { eventBus, EventTypes, EventPayload } from './eventBus';
import { labAIService } from './labAIService';

export type ExperimentStatus = 'planned' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ExperimentType = 'classification' | 'regression' | 'clustering' | 'anomaly_detection' | 'forecasting';

export interface ExperimentConfig {
    targetColumn: string;
    features: string[];
    modelType: 'auto' | 'random_forest' | 'xgboost' | 'linear' | 'neural_network';
    hyperparameters?: Record<string, any>;
    validationSplit?: number;
}

export interface Experiment {
    id: string;
    dataset_id: string;
    name: string;
    description?: string;
    type: ExperimentType;
    status: ExperimentStatus;
    config: ExperimentConfig;
    metrics?: Record<string, number>;
    created_at: string;
    updated_at: string;
    started_at?: string;
    completed_at?: string;
    error_message?: string;
    created_by: string;
}

class ExperimentService {
    private static instance: ExperimentService;

    private constructor() { }

    public static getInstance(): ExperimentService {
        if (!ExperimentService.instance) {
            ExperimentService.instance = new ExperimentService();
        }
        return ExperimentService.instance;
    }

    /**
     * Create a new experiment (PLANNED state)
     */
    async createExperiment(
        datasetId: string,
        name: string,
        type: ExperimentType,
        config: ExperimentConfig
    ): Promise<Experiment> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            const newExperiment = {
                dataset_id: datasetId,
                name,
                type,
                status: 'planned',
                config,
                created_by: user.id
            };

            const { data, error } = await supabase
                .from('experiments')
                .insert(newExperiment)
                .select()
                .single();

            if (error) throw error;

            eventBus.emit(EventTypes.EXPERIMENT_CREATED, {
                timestamp: new Date().toISOString(),
                source: 'experimentService',
                userId: user.id,
                data: {
                    experimentId: data.id,
                    name: data.name,
                    type: data.type
                }
            });

            return data as Experiment;
        } catch (error) {
            console.error('Error creating experiment:', error);
            throw error;
        }
    }

    /**
     * Start an experiment (PLANNED -> RUNNING)
     */
    async startExperiment(experimentId: string): Promise<void> {
        try {
            // Update status to running
            const { error } = await supabase
                .from('experiments')
                .update({
                    status: 'running',
                    started_at: new Date().toISOString()
                })
                .eq('id', experimentId);

            if (error) throw error;

            eventBus.emit(EventTypes.EXPERIMENT_RUNNING, {
                timestamp: new Date().toISOString(),
                source: 'experimentService',
                data: { experimentId }
            });

            // Trigger actual execution (mocked for V1, would call ML service)
            this.executeExperimentMock(experimentId);

        } catch (error) {
            console.error('Error starting experiment:', error);
            throw error;
        }
    }

    /**
     * Execute experiment logic (Mock implementation for V1)
     */
    private async executeExperimentMock(experimentId: string): Promise<void> {
        console.log(`🧪 [ExperimentService] Executing experiment ${experimentId}...`);

        // Simulate training time
        setTimeout(async () => {
            try {
                // Mock metrics
                const metrics = {
                    accuracy: 0.85 + Math.random() * 0.1,
                    precision: 0.80 + Math.random() * 0.1,
                    recall: 0.82 + Math.random() * 0.1,
                    f1_score: 0.81 + Math.random() * 0.1
                };

                // Update to completed
                const { error } = await supabase
                    .from('experiments')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        metrics: metrics
                    })
                    .eq('id', experimentId);

                if (error) throw new Error(error.message);

                eventBus.emit(EventTypes.EXPERIMENT_COMPLETED, {
                    timestamp: new Date().toISOString(),
                    source: 'experimentService',
                    data: {
                        experimentId,
                        status: 'completed',
                        metrics
                    }
                });

                // Auto-trigger AI Interpretation (Rule: experiment-to-report)
                // In a real system the RulesEngine picks this up.
                // For V1, we can also explicitly call LabAI if needed, 
                // but the RulesEngine should handle it if listening.

            } catch (error) {
                console.error('Experiment execution failed:', error);
                await this.failExperiment(experimentId, error instanceof Error ? error.message : 'Unknown error');
            }
        }, 5000); // 5 seconds simulation
    }

    /**
     * Mark experiment as failed
     */
    private async failExperiment(experimentId: string, errorMessage: string): Promise<void> {
        await supabase
            .from('experiments')
            .update({
                status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: errorMessage
            })
            .eq('id', experimentId);

        eventBus.emit(EventTypes.EXPERIMENT_FAILED, {
            timestamp: new Date().toISOString(),
            source: 'experimentService',
            data: { experimentId, error: errorMessage }
        });
    }

    /**
     * Get experiment details
     */
    async getExperiment(experimentId: string): Promise<Experiment> {
        const { data, error } = await supabase
            .from('experiments')
            .select('*')
            .eq('id', experimentId)
            .single();

        if (error) throw error;
        return data as Experiment;
    }

    /**
     * List experiments for a dataset
     */
    async listExperiments(datasetId: string): Promise<Experiment[]> {
        const { data, error } = await supabase
            .from('experiments')
            .select('*')
            .eq('dataset_id', datasetId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Experiment[];
    }
}

export const experimentService = ExperimentService.getInstance();
