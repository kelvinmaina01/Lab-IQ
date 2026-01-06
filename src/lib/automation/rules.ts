/**
 * LabIQ Health - Rule Definitions
 * 
 * Defines the 5 canonical rules from the V1 Blueprint plus additional rules.
 * Rules implement the closed-loop automation pattern.
 */

import { EventType, EventTypes } from '../events/eventTypes';
import { Condition, when } from './conditions';
import { Action, ActionTypes, actions } from './actions';

// =============================================================================
// RULE INTERFACE
// =============================================================================

export interface Rule {
    /** Unique rule identifier */
    id: string;
    /** Human-readable name */
    name: string;
    /** Description of what this rule does */
    description: string;
    /** Event type that triggers this rule */
    trigger: EventType;
    /** Conditions that must be met (AND logic) */
    conditions: Condition[];
    /** Actions to execute when conditions match */
    actions: Action[];
    /** Priority (higher = runs first) */
    priority: number;
    /** Whether the rule is active */
    isActive: boolean;
    /** Whether this is a system rule (cannot be deleted) */
    isSystem: boolean;
    /** Optional: user who created this rule */
    createdBy?: string;
}

// =============================================================================
// 5 CANONICAL RULES (from V1 Blueprint)
// =============================================================================

/**
 * Rule 1: Dataset → Experiment
 * When a health/clinical dataset is uploaded, automatically create an experiment
 */
export const RULE_DATASET_TO_EXPERIMENT: Rule = {
    id: 'dataset-to-experiment',
    name: 'Auto-Create Experiment from Dataset',
    description: 'When a health or clinical dataset is uploaded, automatically propose an experiment',
    trigger: EventTypes.DATASET_UPLOADED,
    conditions: [
        when.in('domain', ['health', 'clinical', 'biopharma', 'population']),
    ],
    actions: [
        actions.createExperiment({ proposedBy: 'ai' }),
        actions.requestAIInterpretation({ type: 'dataset_classification' }),
    ],
    priority: 100,
    isActive: true,
    isSystem: true,
};

/**
 * Rule 2: Experiment Running → Trigger AutoML
 * When an experiment starts running with time-series data, trigger AutoML
 */
export const RULE_EXPERIMENT_TO_MODEL: Rule = {
    id: 'experiment-to-model',
    name: 'Auto-Trigger AutoML for Experiments',
    description: 'When an experiment starts running, trigger the AutoML pipeline',
    trigger: EventTypes.EXPERIMENT_RUNNING,
    conditions: [
        // Run for all experiments (can add conditions later)
    ],
    actions: [
        actions.triggerAutoML(),
    ],
    priority: 90,
    isActive: true,
    isSystem: true,
};

/**
 * Rule 3: Model Training Complete → AI Interpretation
 * When model training completes, request AI interpretation of results
 */
export const RULE_MODEL_TO_AI: Rule = {
    id: 'model-to-ai',
    name: 'AI Interpretation of Model Results',
    description: 'When model training completes, request AI interpretation of the results',
    trigger: EventTypes.MODEL_TRAINING_COMPLETED,
    conditions: [], // Always run for completed models
    actions: [
        actions.requestAIInterpretation({ type: 'model_results' }),
    ],
    priority: 80,
    isActive: true,
    isSystem: true,
};

/**
 * Rule 4: AI Insight → Human Escalation
 * When AI generates a high-confidence anomaly insight, notify the team
 */
export const RULE_AI_ESCALATION: Rule = {
    id: 'ai-escalation',
    name: 'Escalate High-Confidence Anomalies',
    description: 'When AI detects a high-confidence anomaly, create a task and notify the team',
    trigger: EventTypes.AI_INSIGHT_GENERATED,
    conditions: [
        when.greaterThan('confidence', 0.8),
        when.equals('insightType', 'anomaly'),
    ],
    actions: [
        actions.createTask({
            title: 'Review AI-Detected Anomaly',
            priority: 'high',
        }),
        actions.notifyTeam({
            title: 'Anomaly Detected',
            urgency: 'high',
        }),
    ],
    priority: 95,
    isActive: true,
    isSystem: true,
};

/**
 * Rule 5: Experiment Complete → Generate Report
 * When an experiment completes, automatically generate a report
 */
export const RULE_EXPERIMENT_TO_REPORT: Rule = {
    id: 'experiment-to-report',
    name: 'Auto-Generate Experiment Report',
    description: 'When an experiment completes, automatically generate a summary report',
    trigger: EventTypes.EXPERIMENT_COMPLETED,
    conditions: [], // Always run for completed experiments
    actions: [
        actions.generateReport({ reportType: 'experiment_summary' }),
    ],
    priority: 70,
    isActive: true,
    isSystem: true,
};

// =============================================================================
// ADDITIONAL RULES
// =============================================================================

/**
 * Rule: Threshold Exceeded → Alert
 */
export const RULE_THRESHOLD_ALERT: Rule = {
    id: 'threshold-alert',
    name: 'Alert on Threshold Breach',
    description: 'When a metric exceeds a threshold, notify the team',
    trigger: EventTypes.THRESHOLD_EXCEEDED,
    conditions: [], // All threshold breaches trigger alert
    actions: [
        actions.notifyTeam({
            title: 'Threshold Exceeded',
            urgency: 'medium',
        }),
    ],
    priority: 85,
    isActive: true,
    isSystem: true,
};

/**
 * Rule: Anomaly Detected → Log and Notify
 */
export const RULE_ANOMALY_NOTIFICATION: Rule = {
    id: 'anomaly-notification',
    name: 'Notify on Anomaly Detection',
    description: 'When an anomaly is detected, notify the team based on severity',
    trigger: EventTypes.ANOMALY_DETECTED,
    conditions: [
        when.in('severity', ['high', 'critical']),
    ],
    actions: [
        actions.notifyTeam({
            title: 'Anomaly Alert',
            urgency: 'high',
        }),
        actions.createTask({
            title: 'Investigate Anomaly',
            priority: 'high',
        }),
    ],
    priority: 92,
    isActive: true,
    isSystem: true,
};

// =============================================================================
// DEVICE STREAM RULES (Real-time IoT Automation)
// =============================================================================

/**
 * Rule: Device Data Batch → Auto-Create Dataset
 * When a device stream accumulates enough data, create a dataset
 */
export const RULE_DEVICE_BATCH_TO_DATASET: Rule = {
    id: 'device-batch-to-dataset',
    name: 'Auto-Create Dataset from Device Batch',
    description: 'When a device stream batch is complete with sufficient data, create a dataset',
    trigger: EventTypes.DEVICE_BATCH_COMPLETED,
    conditions: [
        when.greaterThan('dataPointCount', 100),
        when.greaterThan('validCount', 50),
    ],
    actions: [
        actions.createExperiment({ proposedBy: 'ai', source: 'device_stream' }),
        actions.notifyTeam({
            title: 'Device Dataset Ready',
            urgency: 'low',
        }),
    ],
    priority: 75,
    isActive: true,
    isSystem: true,
};

/**
 * Rule: Device Threshold Exceeded → Immediate Alert
 */
export const RULE_DEVICE_THRESHOLD_ALERT: Rule = {
    id: 'device-threshold-alert',
    name: 'Device Threshold Alert',
    description: 'When a device metric exceeds thresholds, immediately alert',
    trigger: EventTypes.DEVICE_THRESHOLD_EXCEEDED,
    conditions: [
        when.equals('severity', 'critical'),
    ],
    actions: [
        actions.notifyTeam({
            title: 'Critical Device Alert',
            urgency: 'critical',
        }),
        actions.createTask({
            title: 'Investigate Device Alert',
            priority: 'critical',
        }),
    ],
    priority: 100,
    isActive: true,
    isSystem: true,
};

/**
 * Rule: Device Health Alert → Log and Notify
 */
export const RULE_DEVICE_HEALTH_ALERT: Rule = {
    id: 'device-health-alert',
    name: 'Device Health Monitoring',
    description: 'When device health issues are detected, take appropriate action',
    trigger: EventTypes.DEVICE_HEALTH_ALERT,
    conditions: [
        when.in('severity', ['warning', 'critical']),
    ],
    actions: [
        actions.notifyTeam({
            title: 'Device Health Issue',
            urgency: 'medium',
        }),
    ],
    priority: 88,
    isActive: true,
    isSystem: true,
};

/**
 * Rule: Device Disconnected → Alert if Critical
 */
export const RULE_DEVICE_DISCONNECT_ALERT: Rule = {
    id: 'device-disconnect-alert',
    name: 'Device Disconnection Alert',
    description: 'When a device disconnects, alert the team',
    trigger: EventTypes.DEVICE_DISCONNECTED,
    conditions: [],
    actions: [
        actions.notifyTeam({
            title: 'Device Disconnected',
            urgency: 'medium',
        }),
    ],
    priority: 85,
    isActive: true,
    isSystem: true,
};

// =============================================================================
// QUALITY & COMPLIANCE RULES
// =============================================================================

/**
 * Rule: Quality Check Failed → Remediation Workflow
 */
export const RULE_QUALITY_CHECK_FAILED: Rule = {
    id: 'quality-check-failed',
    name: 'Quality Check Failure Handler',
    description: 'When a quality check fails, trigger remediation and notification',
    trigger: EventTypes.QUALITY_CHECK_FAILED,
    conditions: [],
    actions: [
        actions.notifyTeam({
            title: 'Quality Check Failed',
            urgency: 'high',
        }),
        actions.createTask({
            title: 'Review Data Quality Issues',
            priority: 'high',
        }),
    ],
    priority: 93,
    isActive: true,
    isSystem: true,
};

/**
 * Rule: Compliance Violation → Immediate Escalation
 */
export const RULE_COMPLIANCE_VIOLATION: Rule = {
    id: 'compliance-violation',
    name: 'Compliance Violation Handler',
    description: 'When a compliance violation is detected, immediate escalation',
    trigger: EventTypes.COMPLIANCE_VIOLATION,
    conditions: [],
    actions: [
        actions.notifyTeam({
            title: 'Compliance Violation Detected',
            urgency: 'critical',
        }),
        actions.createTask({
            title: 'Address Compliance Violation',
            priority: 'critical',
        }),
        actions.generateReport({ reportType: 'compliance_violation' }),
    ],
    priority: 99,
    isActive: true,
    isSystem: true,
};

// =============================================================================
// AUTOML RULES
// =============================================================================

/**
 * Rule: AutoML Completed → Generate Report + AI Interpretation
 */
export const RULE_AUTOML_COMPLETED: Rule = {
    id: 'automl-completed',
    name: 'AutoML Completion Handler',
    description: 'When AutoML completes, generate report and request AI interpretation',
    trigger: EventTypes.AUTOML_COMPLETED,
    conditions: [],
    actions: [
        actions.requestAIInterpretation({ type: 'automl_results' }),
        actions.generateReport({ reportType: 'automl_summary' }),
        actions.notifyTeam({
            title: 'AutoML Training Complete',
            urgency: 'low',
        }),
    ],
    priority: 80,
    isActive: true,
    isSystem: true,
};

/**
 * Rule: AutoML Failed → Alert + Create Investigation Task
 */
export const RULE_AUTOML_FAILED: Rule = {
    id: 'automl-failed',
    name: 'AutoML Failure Handler',
    description: 'When AutoML fails, alert team and create investigation task',
    trigger: EventTypes.AUTOML_FAILED,
    conditions: [],
    actions: [
        actions.notifyTeam({
            title: 'AutoML Training Failed',
            urgency: 'high',
        }),
        actions.createTask({
            title: 'Investigate AutoML Failure',
            priority: 'high',
        }),
    ],
    priority: 91,
    isActive: true,
    isSystem: true,
};

/**
 * Rule: Workflow Completed → Chain Next Workflow (if configured)
 */
export const RULE_WORKFLOW_CHAIN: Rule = {
    id: 'workflow-chain',
    name: 'Workflow Chaining',
    description: 'When a workflow completes, check for follow-up workflows',
    trigger: EventTypes.WORKFLOW_COMPLETED,
    conditions: [],
    actions: [
        actions.notifyTeam({
            title: 'Workflow Completed',
            urgency: 'low',
        }),
    ],
    priority: 60,
    isActive: true,
    isSystem: true,
};

/**
 * Rule: Report Generated → Notify Stakeholders
 */
export const RULE_REPORT_NOTIFICATION: Rule = {
    id: 'report-notification',
    name: 'Report Notification',
    description: 'When a report is generated, notify relevant stakeholders',
    trigger: EventTypes.REPORT_GENERATED,
    conditions: [],
    actions: [
        actions.notifyTeam({
            title: 'New Report Available',
            urgency: 'low',
        }),
    ],
    priority: 50,
    isActive: true,
    isSystem: true,
};

// =============================================================================
// CLOUD SOURCE & INGESTION RULES
// =============================================================================

/**
 * Rule: Cloud Sync Completed → Classify Domain & Quality Check
 */
export const RULE_CLOUD_SYNC_TO_PROCESS: Rule = {
    id: 'cloud-sync-to-process',
    name: 'Process Cloud Synced Data',
    description: 'When cloud sync completes, run domain classification and quality check',
    trigger: EventTypes.CLOUD_SYNC_COMPLETED,
    conditions: [],
    actions: [
        actions.notifyTeam({
            title: 'Cloud Sync Complete',
            urgency: 'low',
        }),
    ],
    priority: 75,
    isActive: true,
    isSystem: true,
};

/**
 * Rule: Cloud Sync Failed → Alert
 */
export const RULE_CLOUD_SYNC_FAILED: Rule = {
    id: 'cloud-sync-failed',
    name: 'Cloud Sync Failure Alert',
    description: 'When cloud sync fails, alert the team',
    trigger: EventTypes.CLOUD_SYNC_FAILED,
    conditions: [],
    actions: [
        actions.notifyTeam({
            title: 'Cloud Sync Failed',
            urgency: 'high',
        }),
        actions.createTask({
            title: 'Investigate Cloud Sync Failure',
            priority: 'high',
        }),
    ],
    priority: 90,
    isActive: true,
    isSystem: true,
};

/**
 * Rule: Data Ingestion Completed → Auto-Classify Domain
 */
export const RULE_INGESTION_TO_CLASSIFY: Rule = {
    id: 'ingestion-to-classify',
    name: 'Auto-Classify Ingested Data',
    description: 'When data ingestion completes, automatically classify domain',
    trigger: EventTypes.DATA_INGESTION_COMPLETED,
    conditions: [],
    actions: [
        actions.requestAIInterpretation({ type: 'domain_classification' }),
    ],
    priority: 70,
    isActive: true,
    isSystem: true,
};

/**
 * Rule: Data Validation Failed → Alert & Task
 */
export const RULE_VALIDATION_FAILED: Rule = {
    id: 'validation-failed',
    name: 'Data Validation Failure Handler',
    description: 'When data validation fails, alert and create investigation task',
    trigger: EventTypes.DATA_VALIDATION_FAILED,
    conditions: [],
    actions: [
        actions.notifyTeam({
            title: 'Data Validation Failed',
            urgency: 'medium',
        }),
        actions.createTask({
            title: 'Review Data Validation Errors',
            priority: 'medium',
        }),
    ],
    priority: 85,
    isActive: true,
    isSystem: true,
};

// =============================================================================
// ANONYMIZATION RULES
// =============================================================================

/**
 * Rule: PHI Detected → Require Anonymization
 */
export const RULE_PHI_DETECTED: Rule = {
    id: 'phi-detected',
    name: 'PHI Detection Handler',
    description: 'When PHI is detected, require anonymization before processing',
    trigger: EventTypes.PHI_DETECTED,
    conditions: [],
    actions: [
        actions.notifyTeam({
            title: 'PHI Detected - Anonymization Required',
            urgency: 'critical',
        }),
        actions.createTask({
            title: 'Review and Anonymize PHI Data',
            priority: 'critical',
        }),
    ],
    priority: 99,
    isActive: true,
    isSystem: true,
};

/**
 * Rule: PII Detected → Require Review
 */
export const RULE_PII_DETECTED: Rule = {
    id: 'pii-detected',
    name: 'PII Detection Handler',
    description: 'When PII is detected, require review',
    trigger: EventTypes.PII_DETECTED,
    conditions: [],
    actions: [
        actions.notifyTeam({
            title: 'PII Detected',
            urgency: 'high',
        }),
        actions.createTask({
            title: 'Review PII Data',
            priority: 'high',
        }),
    ],
    priority: 95,
    isActive: true,
    isSystem: true,
};

/**
 * Rule: Anonymization Completed → Proceed with Analysis
 */
export const RULE_ANONYMIZATION_COMPLETE: Rule = {
    id: 'anonymization-complete',
    name: 'Anonymization Completion Handler',
    description: 'When anonymization completes, proceed with data analysis',
    trigger: EventTypes.ANONYMIZATION_COMPLETED,
    conditions: [],
    actions: [
        actions.notifyTeam({
            title: 'Data Anonymized Successfully',
            urgency: 'low',
        }),
        actions.generateReport({ reportType: 'anonymization_summary' }),
    ],
    priority: 70,
    isActive: true,
    isSystem: true,
};

/**
 * Rule: Dataset Version Created → Log Lineage
 */
export const RULE_VERSION_CREATED: Rule = {
    id: 'version-created',
    name: 'Dataset Version Handler',
    description: 'When a new dataset version is created, log lineage',
    trigger: EventTypes.DATASET_VERSION_CREATED,
    conditions: [],
    actions: [
        actions.notifyTeam({
            title: 'New Dataset Version',
            urgency: 'low',
        }),
    ],
    priority: 40,
    isActive: true,
    isSystem: true,
};

/**
 * Rule: Domain Classified → Suggest Experiments
 */
export const RULE_DOMAIN_TO_EXPERIMENT: Rule = {
    id: 'domain-to-experiment',
    name: 'Domain Classification Handler',
    description: 'When domain is classified, suggest relevant experiments',
    trigger: EventTypes.DOMAIN_CLASSIFIED,
    conditions: [
        when.greaterThan('confidence', 0.7),
    ],
    actions: [
        actions.createExperiment({ proposedBy: 'ai' }),
    ],
    priority: 65,
    isActive: true,
    isSystem: true,
};

// =============================================================================
// RULE REGISTRY
// =============================================================================

/** All default system rules */
export const DEFAULT_RULES: Rule[] = [
    // Core 5 Blueprint Rules
    RULE_DATASET_TO_EXPERIMENT,
    RULE_EXPERIMENT_TO_MODEL,
    RULE_MODEL_TO_AI,
    RULE_AI_ESCALATION,
    RULE_EXPERIMENT_TO_REPORT,
    // Alert Rules
    RULE_THRESHOLD_ALERT,
    RULE_ANOMALY_NOTIFICATION,
    // Device Stream Rules
    RULE_DEVICE_BATCH_TO_DATASET,
    RULE_DEVICE_THRESHOLD_ALERT,
    RULE_DEVICE_HEALTH_ALERT,
    RULE_DEVICE_DISCONNECT_ALERT,
    // Quality & Compliance Rules
    RULE_QUALITY_CHECK_FAILED,
    RULE_COMPLIANCE_VIOLATION,
    // AutoML Rules
    RULE_AUTOML_COMPLETED,
    RULE_AUTOML_FAILED,
    // Workflow & Report Rules
    RULE_WORKFLOW_CHAIN,
    RULE_REPORT_NOTIFICATION,
    // Cloud Source & Ingestion Rules
    RULE_CLOUD_SYNC_TO_PROCESS,
    RULE_CLOUD_SYNC_FAILED,
    RULE_INGESTION_TO_CLASSIFY,
    RULE_VALIDATION_FAILED,
    // Anonymization Rules
    RULE_PHI_DETECTED,
    RULE_PII_DETECTED,
    RULE_ANONYMIZATION_COMPLETE,
    // Versioning Rules
    RULE_VERSION_CREATED,
    RULE_DOMAIN_TO_EXPERIMENT,
];

/**
 * Get rules filtered by trigger event type
 */
export function getRulesByTrigger(trigger: EventType, rules: Rule[] = DEFAULT_RULES): Rule[] {
    return rules
        .filter((rule) => rule.trigger === trigger && rule.isActive)
        .sort((a, b) => b.priority - a.priority);
}

/**
 * Get all active rules
 */
export function getActiveRules(rules: Rule[] = DEFAULT_RULES): Rule[] {
    return rules.filter((rule) => rule.isActive);
}

/**
 * Get rule by ID
 */
export function getRuleById(ruleId: string, rules: Rule[] = DEFAULT_RULES): Rule | undefined {
    return rules.find((rule) => rule.id === ruleId);
}

// =============================================================================
// RULE BUILDER
// =============================================================================

/**
 * Create a custom rule
 */
export function createRule(config: {
    id: string;
    name: string;
    description: string;
    trigger: EventType;
    conditions?: Condition[];
    actions: Action[];
    priority?: number;
    createdBy?: string;
}): Rule {
    return {
        id: config.id,
        name: config.name,
        description: config.description,
        trigger: config.trigger,
        conditions: config.conditions || [],
        actions: config.actions,
        priority: config.priority || 50,
        isActive: true,
        isSystem: false,
        createdBy: config.createdBy,
    };
}
