import { auditService } from './auditService';

export interface DataExportRequest {
    userId: string;
    dataType: 'all' | 'clinical' | 'activity';
    reason: string;
}

export interface ComplianceCheck {
    passed: boolean;
    issues: string[];
}

class ComplianceService {
    private static instance: ComplianceService;

    private constructor() { }

    public static getInstance(): ComplianceService {
        if (!ComplianceService.instance) {
            ComplianceService.instance = new ComplianceService();
        }
        return ComplianceService.instance;
    }

    /**
     * Handle GDPR "Right to be Forgotten" or Export
     */
    public async requestDataExport(request: DataExportRequest): Promise<string> {
        // Log the request
        await auditService.logAction('data_export_request', 'user_data', request.userId, { reason: request.reason });

        // Mock processing
        return "export_job_id_123";
    }

    /**
     * Check compliance of a dataset (e.g., PII check)
     * (Simulated)
     */
    public async checkDatasetCompliance(datasetId: string): Promise<ComplianceCheck> {
        // In real app, check for unmasked PII
        await auditService.logAction('compliance_scan', 'dataset', datasetId);

        return {
            passed: true,
            issues: []
        };
    }
}

export const complianceService = ComplianceService.getInstance();
