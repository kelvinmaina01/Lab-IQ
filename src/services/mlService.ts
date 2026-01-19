import { IMLService } from "@/core/interfaces";
import { ML_API_URL } from "@/lib/config";

export class PythonMLService implements IMLService {
    // Environment variable for production
    private baseUrl = `${ML_API_URL}/api/ml`;

    async startAutoML(datasetId: string, options: any) {
        const response = await fetch(`${this.baseUrl}/automl`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataset_id: datasetId, ...options })
        });
        const data = await response.json();
        return { jobId: datasetId };
    }

    async getJobStatus(datasetId: string) {
        const response = await fetch(`${this.baseUrl}/pipeline-status/${datasetId}`);
        if (!response.ok) throw new Error("Failed to fetch status");
        return await response.json();
    }

    async generateInsights(datasetId: string, data: any[]) {
        const response = await fetch(`${this.baseUrl}/insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataset_id: datasetId, data })
        });
        return await response.json();
    }
}

export const mlService = new PythonMLService();
