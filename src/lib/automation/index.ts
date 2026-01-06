/**
 * LabIQ Health - Automation Module
 * 
 * Central export for the automation/rules engine system.
 * Import everything from here for clean access.
 * 
 * @example
 * import { rulesEngine, startRulesEngine, when, actions } from '@/lib/automation';
 */

// Conditions
export {
    type Condition,
    type ConditionOperator,
    evaluateCondition,
    evaluateAllConditions,
    evaluateAnyConditions,
    condition,
    when,
    getNestedValue,
} from './conditions';

// Actions
export {
    ActionTypes,
    type ActionType,
    type Action,
    type ActionResult,
    type ActionHandler,
    type ActionContext,
    registerActionHandler,
    executeAction,
    executeActions,
    action,
    actions,
} from './actions';

// Rules
export {
    type Rule,
    DEFAULT_RULES,
    RULE_DATASET_TO_EXPERIMENT,
    RULE_EXPERIMENT_TO_MODEL,
    RULE_MODEL_TO_AI,
    RULE_AI_ESCALATION,
    RULE_EXPERIMENT_TO_REPORT,
    RULE_THRESHOLD_ALERT,
    RULE_ANOMALY_NOTIFICATION,
    getRulesByTrigger,
    getActiveRules,
    getRuleById,
    createRule,
} from './rules';

// Rules Engine
export {
    RulesEngine,
    rulesEngine,
    startRulesEngine,
    stopRulesEngine,
    addRule,
    type RuleExecutionResult,
    type EngineStats,
} from './rulesEngine';
