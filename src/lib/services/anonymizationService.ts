import { eventBus, EventTypes } from '@/lib/events';

export interface AnonymizationConfig {
    hashSalt?: string;
    maskChar: string;
    piiPatterns: {
        email: RegExp;
        phone: RegExp;
        ssn: RegExp;
        mrn: RegExp;
    };
}

const DEFAULT_CONFIG: AnonymizationConfig = {
    maskChar: '*',
    piiPatterns: {
        email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        phone: /(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
        ssn: /\d{3}-\d{2}-\d{4}/g,
        mrn: /MRN-\d+/g,
    }
};

export interface PHIDetectionResult {
    hasPHI: boolean;
    phiFields: string[];
    confidence: number;
}

export interface AnonymizationResult {
    anonymizedRows: Record<string, any>[];
    fieldsAnonymized: string[];
}

class AnonymizationService {
    private static instance: AnonymizationService;
    private config: AnonymizationConfig;

    private constructor() {
        this.config = DEFAULT_CONFIG;
    }

    public static getInstance(): AnonymizationService {
        if (!AnonymizationService.instance) {
            AnonymizationService.instance = new AnonymizationService();
        }
        return AnonymizationService.instance;
    }

    /**
     * Detect PHI in columns and sample rows
     */
    public detectPHI(columns: string[], sampleRows: Record<string, any>[]): PHIDetectionResult {
        const phiFields: string[] = [];
        const phiPatterns = [
            /patient/i, /name/i, /email/i, /phone/i, /ssn/i, /address/i,
            /dob/i, /birth/i, /mrn/i, /physician/i, /doctor/i
        ];

        columns.forEach(col => {
            if (phiPatterns.some(pattern => pattern.test(col))) {
                phiFields.push(col);
            }
        });

        return {
            hasPHI: phiFields.length > 0,
            phiFields,
            confidence: phiFields.length > 0 ? 0.9 : 0.1
        };
    }

    /**
     * Anonymize a batch of data
     */
    public anonymizeData(rows: Record<string, any>[], phiFields: string[]): AnonymizationResult {
        const anonymizedRows = rows.map(row => {
            const newRow = { ...row };
            phiFields.forEach(field => {
                if (newRow[field]) {
                    newRow[field] = this.hashValue(String(newRow[field]));
                }
            });
            return newRow;
        });

        return {
            anonymizedRows,
            fieldsAnonymized: phiFields
        };
    }

    public anonymizeText(text: string): string {
        let processed = text;
        processed = processed.replace(this.config.piiPatterns.email, '********@***.***');
        processed = processed.replace(this.config.piiPatterns.phone, '(***) ***-****');
        processed = processed.replace(this.config.piiPatterns.ssn, '***-**-****');
        processed = processed.replace(this.config.piiPatterns.mrn, 'MRN-*****');
        return processed;
    }

    private hashValue(value: string): string {
        let hash = 5381;
        for (let i = 0; i < value.length; i++) {
            hash = ((hash << 5) + hash) + value.charCodeAt(i);
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }
}

export const anonymizationService = AnonymizationService.getInstance();
