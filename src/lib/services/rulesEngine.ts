import { eventBus, EventType, EventPayload, EventTypes } from './eventBus';
import { experimentService } from './experimentService';
import { labAIService } from './labAIService';

// --- Type Definitions ---

export type ConditionOperator =
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'greaterThan'
    | 'lessThan'
    | 'in'
    | 'notIn';

export interface RuleCondition {
    field: string; // e.g., "data.domain", "data.metrics.accuracy"
    operator: ConditionOperator;
    value: any;
}

export type ActionType =
    | 'CREATE_EXPERIMENT'
    | 'TRIGGER_AUTOML'
    | 'REQUEST_AI_INTERPRETATION'
    | 'GENERATE_REPORT'
    | 'CREATE_TASK'
    | 'NOTIFY_TEAM';

export interface RuleAction {
    type: ActionType;
    config?: Record<string, any>;
}

export interface Rule {
    id: string;
    name: string;
    trigger: EventType;
    conditions: RuleCondition[];
    actions: RuleAction[];
    priority: number;
    isActive: boolean;
}

// --- Rules Engine Class ---

class RulesEngine {
    private static instance: RulesEngine;
    private rules: Rule[] = [];

    private constructor() {
        this.initializeDefaultRules();
        this.subscribeToEvents();
        console.log('⚖️ [RulesEngine] Initalized with ' + this.rules.length + ' rules');
    }

    public static getInstance(): RulesEngine {
        if (!RulesEngine.instance) {
            RulesEngine.instance = new RulesEngine();
        }
        return RulesEngine.instance;
    }

    /**
     * Load canonical rules from Blueprint
     */
    private initializeDefaultRules() {
        this.rules = [
            {
                id: 'dataset-to-experiment',
                name: 'Auto-create experiment for health datasets',
                trigger: 'DATASET_UPLOADED',
                conditions: [
                    { field: 'data.domain', operator: 'in', value: ['health', 'clinical'] }
                ],
                actions: [
                    { type: 'CREATE_EXPERIMENT' },
                    { type: 'REQUEST_AI_INTERPRETATION' }
                ],
                priority: 1,
                isActive: true
            },
            {
                id: 'experiment-to-model',
                name: 'Trigger AutoML for running experiments',
                trigger: 'EXPERIMENT_RUNNING',
                conditions: [
                    { field: 'data.dataset.isTimeSeries', operator: 'equals', value: true }
                ],
                actions: [
                    { type: 'TRIGGER_AUTOML' }
                ],
                priority: 2,
                isActive: true
            },
            {
                id: 'model-to-ai',
                name: 'Request AI interpretation after model training',
                trigger: 'MODEL_TRAINING_COMPLETED',
                conditions: [], // Always run
                actions: [
                    { type: 'REQUEST_AI_INTERPRETATION', config: { includeModelOutputs: true } }
                ],
                priority: 1,
                isActive: true
            },
            {
                id: 'ai-escalation',
                name: 'Escalate high-confidence anomalies',
                trigger: 'AI_INSIGHT_GENERATED',
                conditions: [
                    { field: 'data.confidence', operator: 'greaterThan', value: 0.8 },
                    { field: 'data.isAnomaly', operator: 'equals', value: true }
                ],
                actions: [
                    { type: 'CREATE_TASK', config: { assignTo: 'team_lead' } },
                    { type: 'NOTIFY_TEAM', config: { urgency: 'high' } }
                ],
                priority: 3,
                isActive: true
            },
            {
                id: 'experiment-to-report',
                name: 'Auto-generate report on experiment completion',
                trigger: 'EXPERIMENT_COMPLETED',
                conditions: [],
                actions: [
                    { type: 'GENERATE_REPORT', config: { template: 'auto' } }
                ],
                priority: 1,
                isActive: true
            }
        ];
    }

    /**
     * Subscribe to all relevant events triggered by rules
     */
    private subscribeToEvents() {
        const uniqueTriggers = new Set(this.rules.map(r => r.trigger));
        uniqueTriggers.forEach(trigger => {
            eventBus.on(trigger, (payload) => this.evaluate(trigger, payload));
        });
    }

    /**
     * Evaluate an event against all matching rules
     */
    private async evaluate(eventType: EventType, payload: EventPayload) {
        const matchingRules = this.rules.filter(r => r.trigger === eventType && r.isActive);

        for (const rule of matchingRules) {
            if (this.checkConditions(rule.conditions, payload)) {
                console.log(`✨ [RulesEngine] Rule Matched: "${rule.name}"`);
                await this.executeActions(rule.actions, payload);
            }
        }
    }

    /**
     * Verify if all conditions match the payload
     */
    private checkConditions(conditions: RuleCondition[], payload: EventPayload): boolean {
        if (!conditions || conditions.length === 0) return true;

        return conditions.every(condition => {
            const payloadValue = this.getValueFromPath(payload, condition.field);
            return this.evaluateCondition(payloadValue, condition.operator, condition.value);
        });
    }

    /**
     * Helper to evaluate a single condition
     */
    private evaluateCondition(actual: any, operator: ConditionOperator, expected: any): boolean {
        switch (operator) {
            case 'equals': return actual === expected;
            case 'notEquals': return actual !== expected;
            case 'greaterThan': return actual > expected;
            case 'lessThan': return actual < expected;
            case 'contains':
                return Array.isArray(actual) ? actual.includes(expected) : String(actual).includes(String(expected));
            case 'in':
                return Array.isArray(expected) ? expected.includes(actual) : false;
            case 'notIn':
                return Array.isArray(expected) ? !expected.includes(actual) : true;
            default: return false;
        }
    }

    /**
     * Execute associated actions
     * Note: logic for detailed action execution (e.g. calling other services) 
     * would be expanded here or delegated.
     */
    private async executeActions(actions: RuleAction[], context: EventPayload) {
        for (const action of actions) {
            console.log(`🚀 [RulesEngine] Executing Action: ${action.type}`, { config: action.config, context });

            try {
                switch (action.type) {
                    case 'CREATE_EXPERIMENT':
                        // Auto-create experiment from dataset
                        if (context.data && context.data.datasetId) {
                            const datasetId = context.data.datasetId;
                            const name = context.data.filename ? `Auto-Analysis: ${context.data.filename}` : 'Auto-Experiment';
                            await experimentService.createExperiment(
                                datasetId,
                                name,
                                'classification', // Default, should inference
                                { targetColumn: 'target', features: [], modelType: 'auto' }
                            );
                        }
                        break;

                    case 'TRIGGER_AUTOML':
                        // Trigger training if experiment exists
                        if (context.data && context.data.experimentId) {
                            await experimentService.startExperiment(context.data.experimentId);
                        }
                        break;

                    case 'REQUEST_AI_INTERPRETATION':
                        // Call LabAI for insight
                        if (context.data) {
                            // Determine what to interpret based on context
                            const query = "Analyze this data and provide initial insights.";
                            // In a real system, we'd construct a more specific query based on the event
                            // For V1, we simulate this call or rely on the UI to trigger it
                            console.log('[RulesEngine] AI Interpretation Requested');
                        }
                        break;

                    case 'NOTIFY_TEAM':
                    case 'CREATE_TASK':
                    case 'GENERATE_REPORT':
                        console.log(`[RulesEngine] Action ${action.type} simulated`);
                        break;
                }
            } catch (error) {
                console.error(`❌ [RulesEngine] Action ${action.type} failed:`, error);
            }
        }
    }

    /**
     * Utility to get nested object value by string path "data.metrics.accuracy"
     */
    private getValueFromPath(obj: any, path: string): any {
        return path.split('.').reduce((o, key) => (o && o[key] !== 'undefined') ? o[key] : undefined, obj);
    }

    // --- Public API to add/remove rules ---

    public addRule(rule: Rule) {
        this.rules.push(rule);
        // Re-subscribe if it's a new trigger type we weren't listening to
        eventBus.on(rule.trigger, (payload) => this.evaluate(rule.trigger, payload));
    }

    public getRules(): Rule[] {
        return this.rules;
    }
}

export const rulesEngine = RulesEngine.getInstance();
