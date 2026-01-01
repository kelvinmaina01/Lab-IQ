/**
 * LabIQ Health - Event Types
 * 
 * Defines all event types for the closed-loop automation system.
 * Events flow: DATA → EXPERIMENT → MODEL → SIGNAL → AI → WORKFLOW → (back to DATA)
 */

// =============================================================================
// EVENT TYPES - All possible events in the system
// =============================================================================

export const EventTypes = {
    // Dataset Events
    DATASET_UPLOADED: 'DATASET_UPLOADED',
    DATASET_UPDATED: 'DATASET_UPDATED',
    DATASET_DELETED: 'DATASET_DELETED',
    DATASET_ANALYZED: 'DATASET_ANALYZED',

    // Experiment Events
    EXPERIMENT_CREATED: 'EXPERIMENT_CREATED',
    EXPERIMENT_RUNNING: 'EXPERIMENT_RUNNING',
    EXPERIMENT_COMPLETED: 'EXPERIMENT_COMPLETED',
    EXPERIMENT_FAILED: 'EXPERIMENT_FAILED',

    // Model Events
    MODEL_TRAINING_STARTED: 'MODEL_TRAINING_STARTED',
    MODEL_TRAINING_COMPLETED: 'MODEL_TRAINING_COMPLETED',
    MODEL_TRAINING_FAILED: 'MODEL_TRAINING_FAILED',
    MODEL_DEPLOYED: 'MODEL_DEPLOYED',

    // AI/Signal Events
    ANOMALY_DETECTED: 'ANOMALY_DETECTED',
    AI_INSIGHT_GENERATED: 'AI_INSIGHT_GENERATED',
    THRESHOLD_EXCEEDED: 'THRESHOLD_EXCEEDED',
    TREND_DETECTED: 'TREND_DETECTED',

    // Workflow Events
    WORKFLOW_TRIGGERED: 'WORKFLOW_TRIGGERED',
    WORKFLOW_COMPLETED: 'WORKFLOW_COMPLETED',
    WORKFLOW_FAILED: 'WORKFLOW_FAILED',

    // Report Events
    REPORT_GENERATED: 'REPORT_GENERATED',
    REPORT_SCHEDULED: 'REPORT_SCHEDULED',

    // Collaboration Events
    TASK_CREATED: 'TASK_CREATED',
    TEAM_NOTIFIED: 'TEAM_NOTIFIED',
    MENTION_DETECTED: 'MENTION_DETECTED',

    // Device Stream Events (Real-time IoT)
    DEVICE_CONNECTED: 'DEVICE_CONNECTED',
    DEVICE_DISCONNECTED: 'DEVICE_DISCONNECTED',
    DEVICE_DATA_RECEIVED: 'DEVICE_DATA_RECEIVED',
    DEVICE_THRESHOLD_EXCEEDED: 'DEVICE_THRESHOLD_EXCEEDED',
    DEVICE_HEALTH_ALERT: 'DEVICE_HEALTH_ALERT',
    DEVICE_BATCH_COMPLETED: 'DEVICE_BATCH_COMPLETED',

    // Quality & Compliance Events
    QUALITY_CHECK_PASSED: 'QUALITY_CHECK_PASSED',
    QUALITY_CHECK_FAILED: 'QUALITY_CHECK_FAILED',
    COMPLIANCE_VIOLATION: 'COMPLIANCE_VIOLATION',

    // AutoML Events
    AUTOML_STARTED: 'AUTOML_STARTED',
    AUTOML_COMPLETED: 'AUTOML_COMPLETED',
    AUTOML_FAILED: 'AUTOML_FAILED',

    // Cloud Source & Data Ingestion Events
    CLOUD_SOURCE_CONNECTED: 'CLOUD_SOURCE_CONNECTED',
    CLOUD_SOURCE_DISCONNECTED: 'CLOUD_SOURCE_DISCONNECTED',
    CLOUD_SYNC_STARTED: 'CLOUD_SYNC_STARTED',
    CLOUD_SYNC_COMPLETED: 'CLOUD_SYNC_COMPLETED',
    CLOUD_SYNC_FAILED: 'CLOUD_SYNC_FAILED',
    DATA_INGESTION_STARTED: 'DATA_INGESTION_STARTED',
    DATA_INGESTION_COMPLETED: 'DATA_INGESTION_COMPLETED',
    DATA_INGESTION_FAILED: 'DATA_INGESTION_FAILED',
    DATA_VALIDATION_PASSED: 'DATA_VALIDATION_PASSED',
    DATA_VALIDATION_FAILED: 'DATA_VALIDATION_FAILED',

    // Anonymization Events
    ANONYMIZATION_STARTED: 'ANONYMIZATION_STARTED',
    ANONYMIZATION_COMPLETED: 'ANONYMIZATION_COMPLETED',
    PHI_DETECTED: 'PHI_DETECTED',
    PII_DETECTED: 'PII_DETECTED',

    // Scheduling Events
    SCHEDULE_TRIGGERED: 'SCHEDULE_TRIGGERED',
    SCHEDULE_COMPLETED: 'SCHEDULE_COMPLETED',
    SCHEDULE_FAILED: 'SCHEDULE_FAILED',

    // Version & Lineage Events
    DATASET_VERSION_CREATED: 'DATASET_VERSION_CREATED',
    DOMAIN_CLASSIFIED: 'DOMAIN_CLASSIFIED',
    LINEAGE_RECORDED: 'LINEAGE_RECORDED',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

// =============================================================================
// EVENT INTERFACES
// =============================================================================

/**
 * Base event interface - all events extend this
 */
export interface HealthEvent<T = Record<string, unknown>> {
    /** Unique event ID */
    id: string;
    /** Event type from EventTypes */
    type: EventType;
    /** Event payload data */
    payload: T;
    /** ISO timestamp */
    timestamp: string;
    /** Source service/component that emitted the event */
    source: string;
    /** User ID who triggered the event (if applicable) */
    userId?: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}

// =============================================================================
// PAYLOAD INTERFACES - Typed payloads for each event
// =============================================================================

/** Dataset uploaded event payload */
export interface DatasetUploadedPayload {
    datasetId: string;
    name: string;
    rowCount: number;
    columnCount: number;
    fileType: string;
    domain?: 'health' | 'clinical' | 'biopharma' | 'environmental' | 'population';
    domainConfidence?: number;
    isAnonymized?: boolean;
}

/** Dataset analyzed event payload */
export interface DatasetAnalyzedPayload {
    datasetId: string;
    qualityScore: number;
    insights: string[];
    recommendations: string[];
}

/** Experiment created event payload */
export interface ExperimentCreatedPayload {
    experimentId: string;
    datasetId: string;
    title: string;
    type: string;
    proposedBy?: 'user' | 'ai';
}

/** Experiment status change payload */
export interface ExperimentStatusPayload {
    experimentId: string;
    previousStatus?: string;
    newStatus: string;
    progress?: number;
}

/** Model training event payload */
export interface ModelTrainingPayload {
    modelId: string;
    datasetId: string;
    experimentId?: string;
    algorithm: string;
    problemType: 'classification' | 'regression' | 'clustering' | 'time_series';
}

/** Model training completed payload */
export interface ModelCompletedPayload extends ModelTrainingPayload {
    metrics: Record<string, number>;
    trainingDuration: number;
    featureImportance?: Record<string, number>;
}

/** AI insight generated payload */
export interface AIInsightPayload {
    insightId: string;
    title: string;
    insightType: string;
    confidence: number;
    datasetId?: string;
    experimentId?: string;
    modelId?: string;
    summary?: string;
    description?: string;
    isActionable?: boolean;
    suggestedActions?: string[];
}

/** Anomaly detected payload */
export interface AnomalyPayload {
    datasetId: string;
    modelId?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedColumns: string[];
    description: string;
    confidence: number;
}

/** Threshold exceeded payload */
export interface ThresholdPayload {
    metric: string;
    threshold: number;
    currentValue: number;
    direction: 'above' | 'below';
    datasetId?: string;
    modelId?: string;
}

/** Workflow event payload */
export interface WorkflowPayload {
    workflowId: string;
    name?: string;
    workflowName?: string;
    trigger?: string;
    triggerType?: string;
    executionId?: string;
    datasetId?: string;
    status?: string;
    duration?: number;
    stepsCompleted?: number;
    stepCount?: number;
    totalSteps?: number;
    error?: string;
}

/** Report generated payload */
export interface ReportPayload {
    reportId: string;
    title?: string;
    reportType: string;
    format?: string;
    status?: string;
    datasetId?: string;
    experimentId?: string;
}

/** Notification payload */
export interface NotificationPayload {
    recipientIds: string[];
    channel: 'in_app' | 'email' | 'webhook';
    urgency: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    actionUrl?: string;
}

// =============================================================================
// DEVICE STREAM PAYLOADS (Real-time IoT Monitoring)
// =============================================================================

/** Device connection event payload */
export interface DeviceConnectionPayload {
    streamId: string;
    deviceName: string;
    deviceType: string;
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    ipAddress?: string;
    lastHeartbeat?: string;
    metadata?: Record<string, unknown>;
}

/** Device data received payload - for real-time streaming */
export interface DeviceDataPayload {
    streamId: string;
    deviceName: string;
    dataPointId: string;
    payload: Record<string, unknown>;
    timestamp: string;
    isValid: boolean;
    validationErrors?: string[];
    metrics?: {
        value: number;
        unit: string;
        field: string;
    }[];
}

/** Device threshold exceeded payload */
export interface DeviceThresholdPayload {
    streamId: string;
    deviceName: string;
    metric: string;
    threshold: number;
    currentValue: number;
    direction: 'above' | 'below';
    duration?: string;
    severity: 'warning' | 'critical';
}

/** Device health alert payload */
export interface DeviceHealthPayload {
    streamId: string;
    deviceName: string;
    alertType: 'data_gap' | 'invalid_data' | 'connection_lost' | 'low_battery' | 'sensor_drift';
    severity: 'info' | 'warning' | 'critical';
    description: string;
    suggestedAction?: string;
}

/** Device batch completed payload */
export interface DeviceBatchPayload {
    streamId: string;
    deviceName: string;
    batchId: string;
    dataPointCount: number;
    validCount: number;
    invalidCount: number;
    processingTimeMs: number;
    datasetId?: string;
}

// =============================================================================
// QUALITY & COMPLIANCE PAYLOADS
// =============================================================================

/** Quality check payload */
export interface QualityCheckPayload {
    datasetId: string;
    checkType: 'completeness' | 'accuracy' | 'consistency' | 'validity' | 'full';
    passed: boolean;
    score: number;
    threshold: number;
    issues: {
        field: string;
        issue: string;
        severity: 'low' | 'medium' | 'high';
        count: number;
    }[];
    recommendations: string[];
}

/** Compliance violation payload */
export interface CompliancePayload {
    datasetId: string;
    standard: 'HIPAA' | 'GDPR' | 'FDA_21_CFR' | 'ISO_17025' | 'CLIA' | 'custom';
    violation: string;
    severity: 'warning' | 'critical';
    affectedFields: string[];
    remediation: string;
    reportRequired: boolean;
}

// =============================================================================
// AUTOML PAYLOADS
// =============================================================================

/** AutoML event payload */
export interface AutoMLPayload {
    jobId: string;
    datasetId: string;
    targetColumn: string;
    problemType: 'classification' | 'regression' | 'clustering' | 'time_series' | 'anomaly_detection';
    status: 'started' | 'running' | 'completed' | 'failed';
    progress?: number;
    modelsEvaluated?: number;
    bestModel?: {
        algorithm: string;
        score: number;
        metric: string;
    };
    estimatedTimeRemaining?: string;
    error?: string;
}

// =============================================================================
// CLOUD SOURCE & INGESTION PAYLOADS
// =============================================================================

/** Cloud source connection payload */
export interface CloudSourcePayload {
    sourceId: string;
    sourceType: 'google_drive' | 'dropbox' | 's3' | 'azure_blob' | 'snowflake' | 'bigquery' | 'api';
    sourceName: string;
    status: 'connected' | 'disconnected' | 'syncing' | 'error';
    lastSyncAt?: string;
    filesAvailable?: number;
    error?: string;
}

/** Cloud sync payload */
export interface CloudSyncPayload {
    syncId: string;
    sourceId: string;
    sourceType: string;
    status: 'started' | 'in_progress' | 'completed' | 'failed';
    filesProcessed: number;
    totalFiles: number;
    bytesTransferred: number;
    datasetsCreated?: string[];
    error?: string;
}

/** Data ingestion payload */
export interface DataIngestionPayload {
    ingestionId: string;
    sourceType: 'file_upload' | 'cloud_sync' | 'device_stream' | 'api' | 'database';
    fileName?: string;
    fileType?: string;
    status: 'started' | 'parsing' | 'validating' | 'saving' | 'completed' | 'failed';
    rowCount?: number;
    columnCount?: number;
    datasetId?: string;
    validationErrors?: string[];
    error?: string;
}

/** Data validation payload */
export interface DataValidationPayload {
    datasetId: string;
    validationType: 'schema' | 'format' | 'completeness' | 'range' | 'full';
    passed: boolean;
    errors: {
        field: string;
        error: string;
        rowNumbers?: number[];
    }[];
    warnings: string[];
}

// =============================================================================
// ANONYMIZATION PAYLOADS
// =============================================================================

/** Anonymization event payload */
export interface AnonymizationPayload {
    datasetId: string;
    method: 'masking' | 'hashing' | 'k_anonymity' | 'differential_privacy' | 'generalization' | 'suppression';
    fieldsProcessed: string[];
    recordsAffected: number;
    status: 'started' | 'in_progress' | 'completed' | 'failed';
    complianceStandards?: string[];
    error?: string;
}

/** PHI/PII detection payload */
export interface PHIDetectionPayload {
    datasetId: string;
    detectionType: 'phi' | 'pii';
    fieldsDetected: {
        fieldName: string;
        dataType: string;
        confidence: number;
        sampleCount: number;
    }[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    requiresAnonymization: boolean;
    suggestedMethod: string;
}

// =============================================================================
// SCHEDULING PAYLOADS
// =============================================================================

/** Schedule trigger payload */
export interface SchedulePayload {
    scheduleId: string;
    scheduleName: string;
    scheduleType: 'workflow' | 'report' | 'sync' | 'backup' | 'quality_check';
    cronExpression: string;
    targetId: string;
    status: 'triggered' | 'running' | 'completed' | 'failed';
    nextRunAt?: string;
    error?: string;
}

// =============================================================================
// VERSIONING & LINEAGE PAYLOADS
// =============================================================================

/** Dataset version payload */
export interface DatasetVersionPayload {
    datasetId: string;
    version: number;
    previousVersion?: number;
    changeType: 'initial' | 'update' | 'transform' | 'merge' | 'anonymize' | 'enrich';
    changeSummary: string;
    rowsAdded?: number;
    rowsRemoved?: number;
    columnsChanged?: string[];
}

/** Domain classification payload */
export interface DomainClassificationPayload {
    datasetId: string;
    domain: 'health' | 'clinical' | 'biopharma' | 'environmental' | 'population' | 'general';
    confidence: number;
    indicators: string[];
    previousDomain?: string;
    classifiedBy: 'system' | 'user';
}

/** Lineage record payload */
export interface LineagePayload {
    lineageId: string;
    sourceType: string;
    sourceId?: string;
    targetType: string;
    targetId: string;
    transformationType?: string;
    description: string;
}

// =============================================================================
// EVENT HANDLER TYPES
// =============================================================================

/** Handler function type for events */
export type EventHandler<T = unknown> = (event: HealthEvent<T>) => void | Promise<void>;

/** Async handler for events that need awaiting */
export type AsyncEventHandler<T = unknown> = (event: HealthEvent<T>) => Promise<void>;

/** Unsubscribe function returned when subscribing */
export type Unsubscribe = () => void;

// =============================================================================
// EVENT FILTER TYPES
// =============================================================================

/** Filter for querying event history */
export interface EventFilter {
    type?: EventType | EventType[];
    source?: string;
    userId?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
}
