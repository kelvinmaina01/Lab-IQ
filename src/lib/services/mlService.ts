/**
 * ML Service Client
 * TypeScript client for communicating with Python ML service
 */

const ML_SERVICE_URL = 'http://localhost:8002';

export interface DetectProblemRequest {
    data: Record<string, any>[];
    columns: string[];
}

export interface DetectProblemResponse {
    success: boolean;
    problem_type: 'regression' | 'classification' | 'clustering' | null;
    suggested_target: string | null;
    numeric_columns: string[];
    categorical_columns: string[];
    recommended_algorithms: Algorithm[];
}

export interface Algorithm {
    id: string;
    name: string;
    description: string;
}

export interface TrainModelRequest {
    dataset_id: string;
    data: Record<string, any>[];
    target_column?: string;
    feature_columns?: string[];
    model_type?: 'regression' | 'classification' | 'clustering';
    algorithm?: string;
    hyperparameters?: Record<string, any>;
}

export interface TrainModelResponse {
    success: boolean;
    model_id: string;
    problem_type: string;
    algorithm: string;
    metrics: Record<string, number>;
    feature_importance?: Array<{ feature: string; importance: number }>;
    model_path: string;
    training_samples: number;
    test_samples: number;
}

export interface PredictRequest {
    model_id: string;
    model_path?: string;
    input_data: Record<string, any>[];
}

export interface PredictResponse {
    success: boolean;
    predictions: number[];
    probabilities?: number[][];
}

export class MLService {
    private baseUrl: string;

    constructor(baseUrl: string = ML_SERVICE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Auto-detect problem type from dataset
     */
    async detectProblem(request: DetectProblemRequest): Promise<DetectProblemResponse> {
        const response = await fetch(`${this.baseUrl}/api/ml/detect-problem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to detect problem type');
        }

        return response.json();
    }

    /**
     * Train ML model
     */
    async trainModel(request: TrainModelRequest): Promise<TrainModelResponse> {
        const response = await fetch(`${this.baseUrl}/api/ml/train`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to train model');
        }

        return response.json();
    }

    /**
     * Make predictions
     */
    async predict(request: PredictRequest): Promise<PredictResponse> {
        const response = await fetch(`${this.baseUrl}/api/ml/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to make predictions');
        }

        return response.json();
    }

    /**
     * Check if ML service is running
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/`);
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Connect to AutoML WebSocket
     */
    connectToAutoML(
        datasetId: string,
        handlers: {
            onOpen?: () => void;
            onProgress: (data: { progress: number; status: any }) => void;
            onComplete: (result: any) => void;
            onError: (error: any) => void;
        }
    ): WebSocket {
        const wsUrl = this.baseUrl.replace('http', 'ws');
        const ws = new WebSocket(`${wsUrl}/ws/automl/${datasetId}`);

        ws.onopen = () => {
            console.log(`Connected to AutoML WS for ${datasetId}`);
            if (handlers.onOpen) handlers.onOpen();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'status' || data.type === 'progress') {
                    handlers.onProgress({
                        progress: data.progress,
                        status: data.status
                    });
                } else if (data.type === 'complete') {
                    handlers.onComplete(data.result);
                } else if (data.type === 'error') {
                    console.error('AutoML WS Error:', data.error);
                    handlers.onError(data.error);
                }
            } catch (error) {
                console.error('Failed to parse WS message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('AutoML WS connection error:', error);
            handlers.onError(error);
        };

        ws.onclose = () => {
            console.log(`AutoML WS closed for ${datasetId}`);
        };

        return ws;
    }
}

export const mlService = new MLService();
