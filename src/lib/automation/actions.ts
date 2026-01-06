/**
 * LabIQ Health - Action Handlers
 * 
 * Executes actions triggered by the Rules Engine.
 * Each action type has a dedicated handler that integrates with existing services.
 */

import { HealthEvent } from '../events/eventTypes';

// =============================================================================
// ACTION TYPES
// =============================================================================

export const ActionTypes = {
    // Experiment Actions
    CREATE_EXPERIMENT: 'CREATE_EXPERIMENT',
    UPDATE_EXPERIMENT_STATUS: 'UPDATE_EXPERIMENT_STATUS',

    // Model Actions
    TRIGGER_AUTOML: 'TRIGGER_AUTOML',
    DEPLOY_MODEL: 'DEPLOY_MODEL',

    // AI Actions
    REQUEST_AI_INTERPRETATION: 'REQUEST_AI_INTERPRETATION',
    CLASSIFY_DOMAIN: 'CLASSIFY_DOMAIN',

    // Notification Actions
    NOTIFY_TEAM: 'NOTIFY_TEAM',
    SEND_EMAIL: 'SEND_EMAIL',
    CREATE_TASK: 'CREATE_TASK',

    // Report Actions
    GENERATE_REPORT: 'GENERATE_REPORT',
    SCHEDULE_REPORT: 'SCHEDULE_REPORT',

    // Workflow Actions
    TRIGGER_WORKFLOW: 'TRIGGER_WORKFLOW',

    // Data Actions
    RUN_QUALITY_CHECK: 'RUN_QUALITY_CHECK',
    ANONYMIZE_DATA: 'ANONYMIZE_DATA',
} as const;

export type ActionType = typeof ActionTypes[keyof typeof ActionTypes];

// =============================================================================
// ACTION INTERFACE
// =============================================================================

export interface Action {
    /** Action type */
    type: ActionType;
    /** Action configuration */
    config: Record<string, unknown>;
    /** Whether to run async (non-blocking) */
    async?: boolean;
    /** Delay before execution (ms) */
    delay?: number;
}

export interface ActionResult {
    success: boolean;
    actionType: ActionType;
    result?: unknown;
    error?: string;
    duration: number;
}

export type ActionHandler = (
    action: Action,
    event: HealthEvent,
    context: ActionContext
) => Promise<ActionResult>;

export interface ActionContext {
    userId?: string;
    metadata?: Record<string, unknown>;
}

// =============================================================================
// ACTION HANDLERS
// =============================================================================

const actionHandlers: Map<ActionType, ActionHandler> = new Map();

/**
 * Register an action handler
 */
export function registerActionHandler(type: ActionType, handler: ActionHandler): void {
    actionHandlers.set(type, handler);
    console.log(`[Actions] Registered handler for ${type}`);
}

/**
 * Execute a single action
 */
export async function executeAction(
    action: Action,
    event: HealthEvent,
    context: ActionContext = {}
): Promise<ActionResult> {
    const startTime = Date.now();

    try {
        // Apply delay if specified
        if (action.delay && action.delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, action.delay));
        }

        const handler = actionHandlers.get(action.type);

        if (!handler) {
            console.warn(`[Actions] No handler registered for action type: ${action.type}`);
            return {
                success: false,
                actionType: action.type,
                error: `No handler for action type: ${action.type}`,
                duration: Date.now() - startTime,
            };
        }

        const result = await handler(action, event, context);
        return result;
    } catch (error) {
        console.error(`[Actions] Error executing ${action.type}:`, error);
        return {
            success: false,
            actionType: action.type,
            error: error instanceof Error ? error.message : String(error),
            duration: Date.now() - startTime,
        };
    }
}

/**
 * Execute multiple actions (with error isolation)
 */
export async function executeActions(
    actions: Action[],
    event: HealthEvent,
    context: ActionContext = {}
): Promise<ActionResult[]> {
    const results = await Promise.allSettled(
        actions.map((action) => executeAction(action, event, context))
    );

    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        return {
            success: false,
            actionType: actions[index].type,
            error: result.reason?.message || 'Unknown error',
            duration: 0,
        };
    });
}

// =============================================================================
// DEFAULT ACTION HANDLERS
// =============================================================================

// CREATE_EXPERIMENT Handler
registerActionHandler(ActionTypes.CREATE_EXPERIMENT, async (action, event, context) => {
    const startTime = Date.now();

    try {
        // Dynamically import to avoid circular dependencies
        const { experimentService } = await import('@/lib/services/experimentService');

        const payload = event.payload as Record<string, unknown>;

        const experiment = await experimentService.createFromDataset({
            datasetId: payload.datasetId as string,
            datasetName: payload.name as string,
            domain: payload.domain as string,
            proposedBy: (action.config.proposedBy as 'user' | 'ai') || 'ai',
        });

        console.log('[Actions] CREATE_EXPERIMENT completed', {
            experimentId: experiment.id,
            title: experiment.title,
        });

        return {
            success: true,
            actionType: ActionTypes.CREATE_EXPERIMENT,
            result: { experimentId: experiment.id, title: experiment.title },
            duration: Date.now() - startTime,
        };
    } catch (error) {
        console.error('[Actions] CREATE_EXPERIMENT failed:', error);
        return {
            success: false,
            actionType: ActionTypes.CREATE_EXPERIMENT,
            error: String(error),
            duration: Date.now() - startTime,
        };
    }
});

// TRIGGER_AUTOML Handler
registerActionHandler(ActionTypes.TRIGGER_AUTOML, async (action, event, context) => {
    const startTime = Date.now();

    try {
        console.log('[Actions] TRIGGER_AUTOML triggered', {
            payload: event.payload,
            config: action.config,
        });

        // TODO: Call ML service endpoint
        // const result = await fetch('http://localhost:8002/api/ml/automl', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     dataset_id: (event.payload as any).datasetId,
        //     ...action.config,
        //   }),
        // });

        return {
            success: true,
            actionType: ActionTypes.TRIGGER_AUTOML,
            result: { status: 'triggered' },
            duration: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            actionType: ActionTypes.TRIGGER_AUTOML,
            error: String(error),
            duration: Date.now() - startTime,
        };
    }
});

// REQUEST_AI_INTERPRETATION Handler
registerActionHandler(ActionTypes.REQUEST_AI_INTERPRETATION, async (action, event, context) => {
    const startTime = Date.now();

    try {
        // Dynamically import to avoid circular dependencies
        const { default: labAIService } = await import('@/lib/services/labAIService');

        const payload = event.payload as Record<string, unknown>;
        const config = action.config as Record<string, unknown>;

        // Process through LabAI service
        const response = await labAIService.process({
            type: (config.analysisType as string) || 'analysis',
            context: {
                eventType: event.type,
                datasetId: payload.datasetId as string,
                modelId: payload.modelId as string,
                ...payload,
            },
            prompt: (config.prompt as string) || `Analyze: ${JSON.stringify(payload)}`,
        });

        console.log('[Actions] REQUEST_AI_INTERPRETATION completed', {
            success: response.success,
        });

        return {
            success: true,
            actionType: ActionTypes.REQUEST_AI_INTERPRETATION,
            result: {
                interpretation: response.content,
                confidence: response.confidence,
                sections: response.sections,
            },
            duration: Date.now() - startTime,
        };
    } catch (error) {
        console.error('[Actions] REQUEST_AI_INTERPRETATION failed:', error);
        return {
            success: false,
            actionType: ActionTypes.REQUEST_AI_INTERPRETATION,
            error: String(error),
            duration: Date.now() - startTime,
        };
    }
});

// NOTIFY_TEAM Handler
registerActionHandler(ActionTypes.NOTIFY_TEAM, async (action, event, context) => {
    const startTime = Date.now();

    try {
        // Dynamically import to avoid circular dependencies
        const { notificationService } = await import('@/lib/services/notificationService');

        const payload = event.payload as Record<string, unknown>;
        const config = action.config as Record<string, unknown>;

        await notificationService.send({
            type: (config.notificationType as string) || 'general',
            title: (config.title as string) || `Alert: ${event.type}`,
            message: (config.message as string) || `Event triggered: ${JSON.stringify(payload)}`,
            urgency: (config.urgency as 'low' | 'medium' | 'high' | 'critical') || 'medium',
            metadata: {
                eventType: event.type,
                eventId: event.id,
                ...payload,
            },
        });

        console.log('[Actions] NOTIFY_TEAM completed');

        return {
            success: true,
            actionType: ActionTypes.NOTIFY_TEAM,
            result: { notified: true },
            duration: Date.now() - startTime,
        };
    } catch (error) {
        console.error('[Actions] NOTIFY_TEAM failed:', error);
        return {
            success: false,
            actionType: ActionTypes.NOTIFY_TEAM,
            error: String(error),
            duration: Date.now() - startTime,
        };
    }
});

// CREATE_TASK Handler
registerActionHandler(ActionTypes.CREATE_TASK, async (action, event, context) => {
    const startTime = Date.now();

    try {
        console.log('[Actions] CREATE_TASK triggered', {
            payload: event.payload,
            config: action.config,
        });

        // TODO: Create task in collaboration system
        // await collaborationService.createTask({
        //   title: action.config.title,
        //   description: action.config.description,
        //   assignee: action.config.assignee,
        //   priority: action.config.priority,
        //   linkedEvent: event.id,
        // });

        return {
            success: true,
            actionType: ActionTypes.CREATE_TASK,
            result: { taskId: 'placeholder' },
            duration: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            actionType: ActionTypes.CREATE_TASK,
            error: String(error),
            duration: Date.now() - startTime,
        };
    }
});

// GENERATE_REPORT Handler
registerActionHandler(ActionTypes.GENERATE_REPORT, async (action, event, context) => {
    const startTime = Date.now();

    try {
        // Dynamically import to avoid circular dependencies
        const { reportTemplateService } = await import('@/lib/services/reportTemplateService');

        const payload = event.payload as Record<string, unknown>;
        const config = action.config as Record<string, unknown>;

        const report = await reportTemplateService.generateReport({
            title: (config.title as string) || 'Auto-Generated Report',
            templateId: (config.template as string) || 'GENERAL',
            datasetId: payload.datasetId as string,
            experimentId: payload.experimentId as string,
            content: {
                summary: `Report generated for event ${event.type}`,
                sections: [],
            },
        });

        console.log('[Actions] GENERATE_REPORT completed', { reportId: report.id });

        return {
            success: true,
            actionType: ActionTypes.GENERATE_REPORT,
            result: { reportId: report.id },
            duration: Date.now() - startTime,
        };
    } catch (error) {
        console.error('[Actions] GENERATE_REPORT failed:', error);
        return {
            success: false,
            actionType: ActionTypes.GENERATE_REPORT,
            error: String(error),
            duration: Date.now() - startTime,
        };
    }
});

// TRIGGER_WORKFLOW Handler
registerActionHandler(ActionTypes.TRIGGER_WORKFLOW, async (action, event, context) => {
    const startTime = Date.now();

    try {
        console.log('[Actions] TRIGGER_WORKFLOW triggered', {
            payload: event.payload,
            config: action.config,
        });

        // TODO: Use workflow service
        // const execution = await workflowService.executeWorkflow(
        //   action.config.workflowId,
        //   (event.payload as any).datasetId
        // );

        return {
            success: true,
            actionType: ActionTypes.TRIGGER_WORKFLOW,
            result: { executionId: 'placeholder' },
            duration: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            actionType: ActionTypes.TRIGGER_WORKFLOW,
            error: String(error),
            duration: Date.now() - startTime,
        };
    }
});

// RUN_QUALITY_CHECK Handler
registerActionHandler(ActionTypes.RUN_QUALITY_CHECK, async (action, event, context) => {
    const startTime = Date.now();

    try {
        console.log('[Actions] RUN_QUALITY_CHECK triggered', {
            payload: event.payload,
            config: action.config,
        });

        return {
            success: true,
            actionType: ActionTypes.RUN_QUALITY_CHECK,
            result: { qualityScore: 0 },
            duration: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            actionType: ActionTypes.RUN_QUALITY_CHECK,
            error: String(error),
            duration: Date.now() - startTime,
        };
    }
});

// =============================================================================
// ACTION BUILDER
// =============================================================================

/**
 * Create an action with fluent API
 */
export function action(type: ActionType, config: Record<string, unknown> = {}): Action {
    return { type, config };
}

/**
 * Action builder helpers
 */
export const actions = {
    createExperiment: (config?: Record<string, unknown>): Action =>
        action(ActionTypes.CREATE_EXPERIMENT, config || {}),

    triggerAutoML: (config?: Record<string, unknown>): Action =>
        action(ActionTypes.TRIGGER_AUTOML, config || {}),

    requestAIInterpretation: (config?: Record<string, unknown>): Action =>
        action(ActionTypes.REQUEST_AI_INTERPRETATION, config || {}),

    notifyTeam: (config: { title?: string; message?: string; urgency?: string }): Action =>
        action(ActionTypes.NOTIFY_TEAM, config),

    createTask: (config: { title: string; description?: string; priority?: string }): Action =>
        action(ActionTypes.CREATE_TASK, config),

    generateReport: (config?: { reportType?: string; format?: string }): Action =>
        action(ActionTypes.GENERATE_REPORT, config || {}),

    triggerWorkflow: (workflowId: string): Action =>
        action(ActionTypes.TRIGGER_WORKFLOW, { workflowId }),
};
