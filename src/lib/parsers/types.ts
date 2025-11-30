/**
 * Data Parser Types
 * Core type definitions for data parsing and analysis
 */

export type DataType = 'string' | 'number' | 'boolean' | 'date' | 'null' | 'mixed';

export interface ParseError {
    row: number;
    column: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface ColumnInfo {
    name: string;
    index: number;
    dataType: DataType;
    nullable: boolean;
    uniqueValues: number;
    sampleValues: any[];
    nullCount: number;
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
}

export interface ParsedData {
    // Metadata
    fileName: string;
    fileSize: number;
    fileType: string;

    // Structure
    headers: string[];
    rows: Record<string, any>[];
    rowCount: number;
    columnCount: number;

    // Schema information
    columns: ColumnInfo[];
    dataTypes: Record<string, DataType>;

    // Quality
    errors: ParseError[];
    warnings: ParseError[];

    // Statistics
    parseTime: number; // milliseconds
    memoryUsage?: number; // bytes
}

export interface ParserOptions {
    maxRows?: number;
    skipEmptyLines?: boolean;
    trimValues?: boolean;
    detectTypes?: boolean;
    dateFormats?: string[];
    encoding?: string;
}

export interface ParserResult {
    success: boolean;
    data?: ParsedData;
    error?: string;
}

// Statistical summary for a column
export interface ColumnStatistics {
    column: string;
    dataType: DataType;
    count: number;
    nullCount: number;
    uniqueCount: number;

    // Numeric statistics
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    mode?: number;
    stdDev?: number;
    variance?: number;
    q1?: number;
    q3?: number;
    iqr?: number;

    // Categorical statistics
    topValues?: Array<{ value: any; count: number; percentage: number }>;

    // Distribution
    distribution?: Array<{ value: any; count: number }>;

    // Quality metrics
    completeness: number; // percentage
    outliers?: number[];
}

// Data quality metrics
export interface QualityMetrics {
    overallScore: number; // 0-100
    completenessScore: number;
    consistencyScore: number;
    accuracyScore: number;

    missingValuesCount: number;
    duplicateRowsCount: number;
    outliersCount: number;

    issues: QualityIssue[];
}

export interface QualityIssue {
    type: 'missing' | 'duplicate' | 'outlier' | 'inconsistent' | 'invalid';
    severity: 'low' | 'medium' | 'high' | 'critical';
    column?: string;
    row?: number;
    value?: any;
    description: string;
    suggestion?: string;
}

// Schema detection result
export interface DetectedSchema {
    columns: ColumnInfo[];
    primaryKeyCandidate?: string;
    relationships?: SchemaRelationship[];
    recommendations: string[];
}

export interface SchemaRelationship {
    fromColumn: string;
    toColumn: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    confidence: number; // 0-1
}
