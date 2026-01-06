/**
 * LabIQ Health - Events Module
 * 
 * Central export for the event system.
 * Import everything from here for clean access.
 * 
 * @example
 * import { eventBus, EventTypes, emit, on } from '@/lib/events';
 */

// Event Types and Interfaces
export {
    EventTypes,
    type EventType,
    type HealthEvent,
    type EventHandler,
    type AsyncEventHandler,
    type EventFilter,
    type Unsubscribe,
    // Core payload types
    type DatasetUploadedPayload,
    type DatasetAnalyzedPayload,
    type ExperimentCreatedPayload,
    type ExperimentStatusPayload,
    type ModelTrainingPayload,
    type ModelCompletedPayload,
    type AIInsightPayload,
    type AnomalyPayload,
    type ThresholdPayload,
    type WorkflowPayload,
    type ReportPayload,
    type NotificationPayload,
    // Device stream payloads
    type DeviceConnectionPayload,
    type DeviceDataPayload,
    type DeviceThresholdPayload,
    type DeviceHealthPayload,
    type DeviceBatchPayload,
    // Quality & Compliance payloads
    type QualityCheckPayload,
    type CompliancePayload,
    // AutoML payloads
    type AutoMLPayload,
    // Cloud source & ingestion payloads
    type CloudSourcePayload,
    type CloudSyncPayload,
    type DataIngestionPayload,
    type DataValidationPayload,
    // Anonymization payloads
    type AnonymizationPayload,
    type PHIDetectionPayload,
    // Scheduling payloads
    type SchedulePayload,
    // Versioning & lineage payloads
    type DatasetVersionPayload,
    type DomainClassificationPayload,
    type LineagePayload,
} from './eventTypes';

// Event Bus
export {
    EventBus,
    eventBus,
    emit,
    on,
    once,
} from './eventBus';

// Event History
export {
    EventHistoryService,
    eventHistory,
} from './eventHistory';
