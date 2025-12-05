/**
 * AutoML Service Client
 * Handles communication with the Multi-Agent AutoML backend
 */

export interface AutoMLRequest {
    dataset_id: string;
    data: Array<Record<string, any>>;
    target_column?: string;
    problem_type?: 'classification' | 'regression' | 'clustering';
    options?: Record<string, any>;
}

export interface AutoMLSummary {
    pipeline_duration_seconds: number;
    problem_type: string;
    dataset_id: string;
    data_summary: {
        rows: number;
        columns: number;
        quality_score: number;
        quality_rating: string;
    };
    feature_engineering_summary: {
        original_features: number;
        final_features: number;
        features_generated: number;
        features_selected: number;
    };
    model_training_summary: {
        models_trained: number;
        best_model: string;
        best_score: number;
        model_path?: string;
    };
    key_findings: string[];
    recommendations: string[];
}

export interface AutoMLResponse {
    success: boolean;
    summary: AutoMLSummary;
    detailed_results?: any;
    error?: string;
}

export interface ProgressUpdate {
    type: 'status' | 'progress' | 'complete' | 'error';
    progress?: number;
    message?: string;
    status?: any;
    result?: AutoMLResponse;
    error?: string;
}

const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:8002';

/**
 * Run complete AutoML pipeline via HTTP
 */
export async function runAutoML(request: AutoMLRequest): Promise<AutoMLResponse> {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/api/ml/automl`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'AutoML pipeline failed');
        }

        return await response.json();
    } catch (error) {
        console.error('AutoML API Error:', error);
        throw error;
    }
}

/**
 * Run AutoML with real-time progress updates via WebSocket
 */
export function runAutoMLWithProgress(
    request: AutoMLRequest,
    onProgress: (update: ProgressUpdate) => void
): () => void {
    const ws = new WebSocket(`${ML_SERVICE_URL.replace('http', 'ws')}/ws/automl/${request.dataset_id}`);

    ws.onopen = () => {
        console.log('🤖 AutoML WebSocket connected');
        // Send request
        ws.send(JSON.stringify({
            data: request.data,
            target_column: request.target_column,
            problem_type: request.problem_type,
            options: request.options,
        }));
    };

    ws.onmessage = (event) => {
        try {
            const update: ProgressUpdate = JSON.parse(event.data);
            onProgress(update);

            // Close connection when complete or error
            if (update.type === 'complete' || update.type === 'error') {
                ws.close();
            }
        } catch (error) {
            console.error('WebSocket message parse error:', error);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onProgress({
            type: 'error',
            error: 'WebSocket connection failed. Using HTTP fallback...'
        });
    };

    ws.onclose = () => {
        console.log('🤖 AutoML WebSocket disconnected');
    };

    // Return cleanup function
    return () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
        }
    };
}

/**
 * Quick data analysis (no training)
 */
export async function quickAnalysis(dataset_id: string, data: Array<Record<string, any>>) {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/api/ml/quick-analysis`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dataset_id, data }),
        });

        if (!response.ok) {
            throw new Error('Quick analysis failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Quick analysis error:', error);
        throw error;
    }
}

/**
 * Check ML service health
 */
export async function checkMLServiceHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/health`, {
            method: 'GET',
        });
        return response.ok;
    } catch (error) {
        console.error('ML service health check failed:', error);
        return false;
    }
}

/**
 * Get pipeline status
 */
export async function getPipelineStatus(dataset_id: string) {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/api/ml/pipeline-status/${dataset_id}`);

        if (!response.ok) {
            throw new Error('Failed to get pipeline status');
        }

        return await response.json();
    } catch (error) {
        console.error('Pipeline status error:', error);
        throw error;
    }
}
