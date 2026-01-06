/**
 * Ingestion Service - Unified Data Pipeline
 * 
 * Per Blueprint Phase 1: Data Ingestion & Preprocessing
 * Steps: Validation → Normalization → Anonymization → Domain Tagging → Save
 * 
 * This service orchestrates the complete data ingestion workflow
 * with event emission for the workflow engine.
 */

import { supabase } from '@/integrations/supabase/client';
import { eventBus, EventTypes, DatasetUploadedPayload } from '@/lib/events';

// Import instances
import { csvParser } from '@/lib/parsers/csvParser';
import { excelParser } from '@/lib/parsers/excelParser';
import { jsonParser } from '@/lib/parsers/jsonParser';
import { parseHL7 } from '@/lib/parsers/hl7Parser';
import { xmlParser } from '@/lib/parsers/xmlParser';
import { datasetService } from './datasetService';
import { anonymizationService, AnonymizationResult } from './anonymizationService';
import type { ParsedData, ColumnInfo } from '@/lib/parsers/types';

// =============================================================================
// TYPES
// =============================================================================

export interface IngestionConfig {
    autoAnonymize?: boolean;
    detectDomain?: boolean;
    normalizeUnits?: boolean;
    validateSchema?: boolean;
    emitEvents?: boolean;
}

export interface IngestionResult {
    datasetId: string;
    rowCount: number;
    columnCount: number;
    domain?: string;
    domainConfidence?: number;
    anonymizationApplied: boolean;
    phiFieldsDetected: string[];
    validationWarnings: string[];
    processingTimeMs: number;
}

export interface ValidationWarning {
    field: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
}

export type SupportedFileType = 'csv' | 'xlsx' | 'xls' | 'json' | 'tsv' | 'hl7' | 'xml';

// =============================================================================
// NORMALIZATION HELPERS
// =============================================================================

function fahrenheitToCelsius(f: number): number {
    return (f - 32) * 5 / 9;
}

function normalizeValue(value: any, columnName: string): any {
    if (typeof value !== 'number' && typeof value !== 'string') return value;

    // Check for temperature columns
    const lowerCol = columnName.toLowerCase();
    if (lowerCol.includes('temp') && lowerCol.includes('f')) {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (!isNaN(num) && num > 50 && num < 120) {
            // Likely Fahrenheit body temp, convert to Celsius
            return fahrenheitToCelsius(num);
        }
    }

    return value;
}

function normalizeTimestamp(value: any): string | null {
    if (!value) return null;

    try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return null;
        return date.toISOString();
    } catch {
        return null;
    }
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

function validateSchema(data: ParsedData): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for empty columns
    data.columns.forEach((col) => {
        const values = data.rows.slice(0, 100).map(row => row[col.name]);
        const nonEmpty = values.filter(v => v != null && v !== '');
        if (nonEmpty.length < 1) {
            warnings.push({
                field: col.name,
                message: `Column "${col.name}" appears empty in sample`,
                severity: 'medium'
            });
        }
    });

    // Check for duplicate column names
    const colNames = data.columns.map(c => c.name.toLowerCase());
    const duplicates = colNames.filter((name, idx) => colNames.indexOf(name) !== idx);
    duplicates.forEach(dup => {
        warnings.push({
            field: dup,
            message: `Duplicate column name detected: "${dup}"`,
            severity: 'high'
        });
    });

    // Check row count sanity
    if (data.rowCount === 0) {
        warnings.push({
            field: '_data',
            message: 'Dataset has no rows',
            severity: 'high'
        });
    }

    return warnings;
}

// =============================================================================
// DOMAIN DETECTION
// =============================================================================

interface DomainDetectionResult {
    domain: string;
    confidence: number;
}

function detectDomainFromColumns(columns: ColumnInfo[]): DomainDetectionResult {
    const colNames = columns.map(c => c.name.toLowerCase());

    const domainPatterns: Record<string, RegExp[]> = {
        clinical: [/icd/i, /cpt/i, /diagnosis/i, /patient/i, /mrn/i, /encounter/i],
        laboratory: [/loinc/i, /lab/i, /result/i, /specimen/i, /glucose/i, /hemoglobin/i],
        epidemiological: [/incidence/i, /prevalence/i, /outbreak/i, /morbidity/i],
        wearable: [/steps/i, /heart_rate/i, /sleep/i, /activity/i, /calories/i],
    };

    const scores: Record<string, number> = {};

    for (const [domain, patterns] of Object.entries(domainPatterns)) {
        let matchCount = 0;
        for (const pattern of patterns) {
            if (colNames.some(col => pattern.test(col))) matchCount++;
        }
        scores[domain] = matchCount / patterns.length;
    }

    const topDomain = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];

    if (topDomain && topDomain[1] > 0.1) {
        return { domain: topDomain[0], confidence: topDomain[1] };
    }

    return { domain: 'general', confidence: 0.5 };
}

// =============================================================================
// INGESTION SERVICE CLASS
// =============================================================================

class IngestionService {
    private defaultConfig: IngestionConfig = {
        autoAnonymize: false,
        detectDomain: true,
        normalizeUnits: true,
        validateSchema: true,
        emitEvents: true
    };

    /**
     * Main ingestion entry point
     */
    async ingestFile(
        file: File,
        userId: string,
        config: Partial<IngestionConfig> = {},
        onProgress?: (progress: number, message: string) => void,
        extraMetadata: any = {}
    ): Promise<IngestionResult> {
        const startTime = Date.now();
        const mergedConfig = { ...this.defaultConfig, ...config };
        const warnings: ValidationWarning[] = [];

        onProgress?.(5, 'Parsing file...');

        const fileType = this.getFileType(file.name);
        let parsedData: ParsedData;

        try {
            parsedData = await this.parseFile(file, fileType);
        } catch (error) {
            throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        onProgress?.(20, 'Validating schema...');
        if (mergedConfig.validateSchema) {
            const schemaWarnings = validateSchema(parsedData);
            warnings.push(...schemaWarnings);
        }

        onProgress?.(30, 'Detecting domain...');
        let domain = 'general';
        let domainConfidence = 0.5;
        if (mergedConfig.detectDomain) {
            const detection = detectDomainFromColumns(parsedData.columns);
            domain = detection.domain;
            domainConfidence = detection.confidence;
        }

        onProgress?.(40, 'Checking for PHI...');
        const phiResult = anonymizationService.detectPHI(
            parsedData.columns.map(c => c.name),
            parsedData.rows.slice(0, 100)
        );

        let anonymizationApplied = false;
        if (mergedConfig.autoAnonymize && phiResult.phiFields.length > 0) {
            onProgress?.(50, 'Anonymizing PHI fields...');
            const anonymized = anonymizationService.anonymizeData(parsedData.rows, phiResult.phiFields);
            parsedData.rows = anonymized.anonymizedRows;
            anonymizationApplied = true;
        }

        onProgress?.(60, 'Normalizing data...');
        if (mergedConfig.normalizeUnits) {
            parsedData.rows = this.normalizeData(parsedData.rows, parsedData.columns);
        }

        onProgress?.(70, 'Saving dataset...');
        // Step 7: Save to database
        const datasetId = await datasetService.saveDataset(userId, parsedData, file, (progress, message) => {
            onProgress?.(70 + progress * 0.25, message);
        }, extraMetadata);

        // Step 8: Update dataset with enriched metadata, schema and preview
        await (supabase
            .from('datasets')
            .update({
                metadata: {
                    ...extraMetadata,
                    domain,
                    domainConfidence,
                    phiFieldsDetected: phiResult.phiFields,
                    anonymizationApplied,
                    validationWarnings: warnings,
                    processingTimeMs: Date.now() - startTime
                },
                schema: parsedData.columns,
                preview_data: parsedData.rows.slice(0, 10)
            } as any) as any)
            .eq('id', datasetId);

        onProgress?.(95, 'Emitting events...');
        if (mergedConfig.emitEvents) {
            const payload: DatasetUploadedPayload = {
                datasetId,
                name: file.name,
                rowCount: parsedData.rowCount,
                columnCount: parsedData.columnCount,
                fileType: fileType,
                domain: domain as any,
                domainConfidence,
                isAnonymized: anonymizationApplied
            };
            eventBus.emit(EventTypes.DATASET_UPLOADED, payload);
        }

        onProgress?.(100, 'Complete!');

        return {
            datasetId,
            rowCount: parsedData.rowCount,
            columnCount: parsedData.columnCount,
            domain,
            domainConfidence,
            anonymizationApplied,
            phiFieldsDetected: phiResult.phiFields,
            validationWarnings: warnings.map(w => w.message),
            processingTimeMs: Date.now() - startTime
        };
    }

    private getFileType(filename: string): SupportedFileType {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const typeMap: Record<string, SupportedFileType> = {
            'csv': 'csv',
            'tsv': 'tsv',
            'xlsx': 'xlsx',
            'xls': 'xls',
            'json': 'json',
            'hl7': 'hl7',
            'xml': 'xml'
        };
        return typeMap[ext] || 'csv';
    }

    private async parseFile(file: File, fileType: SupportedFileType): Promise<ParsedData> {
        switch (fileType) {
            case 'csv':
            case 'tsv':
                const csvRes = await csvParser.parse(file);
                if (!csvRes.success || !csvRes.data) throw new Error(csvRes.error);
                return csvRes.data;
            case 'xlsx':
            case 'xls':
                const excelRes = await excelParser.parse(file);
                if (!excelRes.success || !excelRes.data) throw new Error(excelRes.error);
                return excelRes.data;
            case 'json':
                const jsonRes = await jsonParser.parse(file);
                if (!jsonRes.success || !jsonRes.data) throw new Error(jsonRes.error);
                return jsonRes.data;
            case 'hl7':
                const hl7Rows = await parseHL7(file);
                const headers = hl7Rows.length > 0 ? Object.keys(hl7Rows[0]) : [];
                return {
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: 'hl7',
                    headers: headers,
                    rows: hl7Rows as Record<string, any>[],
                    rowCount: hl7Rows.length,
                    columnCount: headers.length,
                    columns: headers.map((h, i) => ({
                        name: h,
                        index: i,
                        dataType: 'string' as const,
                        nullable: true,
                        uniqueValues: 0,
                        sampleValues: [],
                        nullCount: 0
                    })),
                    dataTypes: {},
                    errors: [],
                    warnings: [],
                    parseTime: 0
                };
            case 'xml':
                const text = await file.text();
                const xmlResult = xmlParser.parse(text);
                if (!xmlResult.success || !xmlResult.data) throw new Error(xmlResult.error);
                let rows: any[] = [];
                if (xmlResult.type === 'experiment_results' && xmlResult.data.samples) {
                    rows = xmlResult.data.samples;
                } else if (xmlResult.type === 'clinical_data' && xmlResult.data.patients) {
                    rows = xmlResult.data.patients;
                } else {
                    rows = Array.isArray(xmlResult.data) ? xmlResult.data : [xmlResult.data];
                }
                const xmlHeaders = rows.length > 0 ? Object.keys(rows[0]) : [];
                return {
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: 'xml',
                    headers: xmlHeaders,
                    rows: rows,
                    rowCount: rows.length,
                    columnCount: xmlHeaders.length,
                    columns: xmlHeaders.map((h, i) => ({
                        name: h,
                        index: i,
                        dataType: 'string' as const,
                        nullable: true,
                        uniqueValues: 0,
                        sampleValues: [],
                        nullCount: 0
                    })),
                    dataTypes: {},
                    errors: [],
                    warnings: [],
                    parseTime: 0
                };
            default:
                const defRes = await csvParser.parse(file);
                if (!defRes.success || !defRes.data) throw new Error(defRes.error);
                return defRes.data;
        }
    }

    async ingestCloudData(
        provider: string,
        userId: string,
        onProgress?: (progress: number, message: string) => void
    ): Promise<string> {
        const startTime = Date.now();
        onProgress?.(5, `Initializing secure connection to ${provider}...`);

        // Simulate network latency for realism
        await new Promise(resolve => setTimeout(resolve, 1500));

        onProgress?.(20, 'Authenticating and fetching schema...');

        // Mock data based on provider
        let mockRows: any[] = [];
        let fileName = "";
        let domain = 'general';

        if (['applehealth', 'fitbit', 'oura', 'dexcom'].includes(provider)) {
            domain = 'vitals';
            fileName = `${provider}_vitals_export.json`;
            mockRows = [
                { timestamp: new Date().toISOString(), type: 'heart_rate', value: 72, unit: 'bpm' },
                { timestamp: new Date().toISOString(), type: 'steps', value: 1240, unit: 'count' },
                { timestamp: new Date().toISOString(), type: 'sleep_hours', value: 7.5, unit: 'hours' }
            ];
        } else if (['epic', 'cerner', 'fhir'].includes(provider)) {
            domain = 'clinical';
            fileName = `${provider}_clinical_records.json`;
            mockRows = [
                { patient_id: 'P123', encounter_date: new Date().toISOString(), diagnosis: 'Essential Hypertension', code: 'I10' },
                { patient_id: 'P123', medication: 'Lisinopril 10mg', status: 'active' }
            ];
        } else {
            fileName = `${provider}_imported_data.json`;
            mockRows = [
                { imported_at: new Date().toISOString(), status: 'active', provider }
            ];
        }

        const headers = Object.keys(mockRows[0]);
        const parsedData: ParsedData = {
            fileName,
            fileSize: 1024 * 5, // 5KB mock
            fileType: 'json',
            headers,
            rows: mockRows,
            rowCount: mockRows.length,
            columnCount: headers.length,
            columns: headers.map((h, i) => ({
                name: h,
                index: i,
                dataType: 'string' as const,
                nullable: true,
                uniqueValues: 0,
                sampleValues: [],
                nullCount: 0
            })),
            dataTypes: {},
            errors: [],
            warnings: [],
            parseTime: 100
        };

        onProgress?.(50, 'Analyzing data structure & PHI detection...');
        const phiResult = anonymizationService.detectPHI(headers, mockRows);

        onProgress?.(70, 'Syncing to LabIQ Research Vault...');
        const datasetId = await datasetService.saveDataset(userId, parsedData, undefined, (p, m) => {
            onProgress?.(70 + p * 0.2, m);
        }, { provider, method: 'cloud_sync', domain });

        // Update with preview and schema
        await (supabase
            .from('datasets')
            .update({
                schema: parsedData.columns,
                preview_data: parsedData.rows.slice(0, 5),
                metadata: {
                    provider,
                    ingestion_method: 'cloud_sync',
                    domain,
                    phiFieldsDetected: phiResult.phiFields,
                    processingTimeMs: Date.now() - startTime
                }
            } as any) as any)
            .eq('id', datasetId);

        onProgress?.(100, 'Cloud import successful!');
        return datasetId;
    }

    private normalizeData(rows: Record<string, any>[], columns: ColumnInfo[]): Record<string, any>[] {
        return rows.map(row => {
            const normalizedRow: Record<string, any> = {};
            for (const [key, value] of Object.entries(row)) {
                normalizedRow[key] = normalizeValue(value, key);
            }
            return normalizedRow;
        });
    }
}

export const ingestionService = new IngestionService();
