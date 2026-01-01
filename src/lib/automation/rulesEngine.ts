/**
 * LabIQ Health - Rules Engine
 * 
 * The brain of the automation system.
 * Subscribes to EventBus events and evaluates rules to trigger actions.
 * 
 * Flow: Event → Rules Engine → Condition Check → Action Execution
 */

import { eventBus, EventTypes, HealthEvent, EventType } from '../events';
import { evaluateAllConditions } from './conditions';
import { executeActions, ActionResult } from './actions';
import { Rule, DEFAULT_RULES, getRulesByTrigger, createRule } from './rules';

// =============================================================================
// CONFIGURATION
// =============================================================================

const RULES_ENGINE_CONFIG = {
    /** Enable debug logging */
    debug: import.meta.env.DEV,
    /** Maximum concurrent action executions per rule */
    maxConcurrentActions: 5,
    /** Enable dry run mode (log but don't execute actions) */
    dryRun: false,
};

// =============================================================================
// RULE EXECUTION RESULT
// =============================================================================

export interface RuleExecutionResult {
    ruleId: string;
    ruleName: string;
    triggered: boolean;
    conditionsMet: boolean;
    actionResults: ActionResult[];
    duration: number;
    error?: string;
}

export interface EngineStats {
    totalEventsProcessed: number;
    rulesEvaluated: number;
    rulesTriggered: number;
    actionsExecuted: number;
    errors: number;
    lastProcessedEvent: string | null;
}

// =============================================================================
// RULES ENGINE CLASS
// =============================================================================

export class RulesEngine {
    private static instance: RulesEngine | null = null;

    /** Custom rules added at runtime */
    private customRules: Rule[] = [];

    /** Subscribed event unsubscribe functions */
    private subscriptions: (() => void)[] = [];

    /** Whether the engine is running */
    private isRunning = false;

    /** Engine statistics */
    private stats: EngineStats = {
        totalEventsProcessed: 0,
        rulesEvaluated: 0,
        rulesTriggered: 0,
        actionsExecuted: 0,
        errors: 0,
        lastProcessedEvent: null,
    };

    private constructor() { }

    // ===========================================================================
    // SINGLETON PATTERN
    // ===========================================================================

    public static getInstance(): RulesEngine {
        if (!RulesEngine.instance) {
            RulesEngine.instance = new RulesEngine();
        }
        return RulesEngine.instance;
    }

    public static reset(): void {
        if (RulesEngine.instance) {
            RulesEngine.instance.stop();
        }
        RulesEngine.instance = null;
    }

    // ===========================================================================
    // ENGINE LIFECYCLE
    // ===========================================================================

    /**
     * Start the rules engine and subscribe to all event types
     */
    public start(): void {
        if (this.isRunning) {
            console.warn('[RulesEngine] Already running');
            return;
        }

        console.log('[RulesEngine] Starting...');

        // Subscribe to all event types that have rules
        const allRules = this.getAllRules();
        const triggerTypes = new Set(allRules.map((r) => r.trigger));

        triggerTypes.forEach((eventType) => {
            const unsubscribe = eventBus.on(eventType, (event: HealthEvent<Record<string, unknown>>) => {
                this.processEvent(event);
            });
            this.subscriptions.push(unsubscribe);
        });

        this.isRunning = true;
        console.log(`[RulesEngine] Started, listening to ${triggerTypes.size} event types`);
    }

    /**
     * Stop the rules engine and unsubscribe from all events
     */
    public stop(): void {
        if (!this.isRunning) return;

        console.log('[RulesEngine] Stopping...');

        // Unsubscribe from all events
        this.subscriptions.forEach((unsubscribe) => unsubscribe());
        this.subscriptions = [];

        this.isRunning = false;
        console.log('[RulesEngine] Stopped');
    }

    /**
     * Check if engine is running
     */
    public isActive(): boolean {
        return this.isRunning;
    }

    // ===========================================================================
    // RULE MANAGEMENT
    // ===========================================================================

    /**
     * Get all rules (system + custom)
     */
    public getAllRules(): Rule[] {
        return [...DEFAULT_RULES, ...this.customRules];
    }

    /**
     * Add a custom rule
     */
    public addRule(rule: Rule): void {
        // Check for duplicate ID
        if (this.getAllRules().some((r) => r.id === rule.id)) {
            throw new Error(`Rule with ID '${rule.id}' already exists`);
        }

        this.customRules.push(rule);

        // If engine is running, subscribe to this rule's trigger
        if (this.isRunning) {
            const hasSubscription = this.getAllRules()
                .filter((r) => r.id !== rule.id)
                .some((r) => r.trigger === rule.trigger);

            if (!hasSubscription) {
                const unsubscribe = eventBus.on(rule.trigger, (event: HealthEvent<Record<string, unknown>>) => {
                    this.processEvent(event);
                });
                this.subscriptions.push(unsubscribe);
            }
        }

        console.log(`[RulesEngine] Added rule: ${rule.name}`);
    }

    /**
     * Remove a custom rule (system rules cannot be removed)
     */
    public removeRule(ruleId: string): boolean {
        const index = this.customRules.findIndex((r) => r.id === ruleId);
        if (index === -1) {
            console.warn(`[RulesEngine] Rule '${ruleId}' not found or is a system rule`);
            return false;
        }

        this.customRules.splice(index, 1);
        console.log(`[RulesEngine] Removed rule: ${ruleId}`);
        return true;
    }

    /**
     * Enable/disable a rule
     */
    public setRuleActive(ruleId: string, active: boolean): boolean {
        const rule = this.getAllRules().find((r) => r.id === ruleId);
        if (!rule) {
            console.warn(`[RulesEngine] Rule '${ruleId}' not found`);
            return false;
        }

        // For system rules, we can only modify the reference in DEFAULT_RULES
        // This is a limitation - in production, store active state separately
        rule.isActive = active;
        console.log(`[RulesEngine] Rule '${ruleId}' ${active ? 'enabled' : 'disabled'}`);
        return true;
    }

    // ===========================================================================
    // EVENT PROCESSING
    // ===========================================================================

    /**
     * Process an event through all applicable rules
     */
    public async processEvent(event: HealthEvent): Promise<RuleExecutionResult[]> {
        const startTime = Date.now();
        this.stats.totalEventsProcessed++;
        this.stats.lastProcessedEvent = event.timestamp;

        if (RULES_ENGINE_CONFIG.debug) {
            console.log(`[RulesEngine] Processing event: ${event.type}`, { id: event.id });
        }

        // Get all rules for this event type
        const applicableRules = getRulesByTrigger(event.type, this.getAllRules());

        if (applicableRules.length === 0) {
            if (RULES_ENGINE_CONFIG.debug) {
                console.log(`[RulesEngine] No rules for event type: ${event.type}`);
            }
            return [];
        }

        // Evaluate each rule
        const results: RuleExecutionResult[] = [];

        for (const rule of applicableRules) {
            const ruleResult = await this.evaluateRule(rule, event);
            results.push(ruleResult);
            this.stats.rulesEvaluated++;

            if (ruleResult.triggered) {
                this.stats.rulesTriggered++;
                this.stats.actionsExecuted += ruleResult.actionResults.length;
            }

            if (ruleResult.error) {
                this.stats.errors++;
            }
        }

        if (RULES_ENGINE_CONFIG.debug) {
            const triggered = results.filter((r) => r.triggered).length;
            console.log(
                `[RulesEngine] Processed ${applicableRules.length} rules, ${triggered} triggered`,
                { duration: Date.now() - startTime }
            );
        }

        return results;
    }

    /**
     * Evaluate a single rule against an event
     */
    private async evaluateRule(rule: Rule, event: HealthEvent): Promise<RuleExecutionResult> {
        const startTime = Date.now();

        try {
            // Check conditions
            const conditionsMet = evaluateAllConditions(rule.conditions, event.payload);

            if (!conditionsMet) {
                return {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    triggered: false,
                    conditionsMet: false,
                    actionResults: [],
                    duration: Date.now() - startTime,
                };
            }

            if (RULES_ENGINE_CONFIG.debug) {
                console.log(`[RulesEngine] Rule matched: ${rule.name}`);
            }

            // Check dry run mode
            if (RULES_ENGINE_CONFIG.dryRun) {
                console.log(`[RulesEngine] DRY RUN - Would execute ${rule.actions.length} actions`);
                return {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    triggered: true,
                    conditionsMet: true,
                    actionResults: [],
                    duration: Date.now() - startTime,
                };
            }

            // Execute actions
            const actionResults = await executeActions(rule.actions, event, {
                userId: event.userId,
                metadata: { ruleId: rule.id, ruleName: rule.name },
            });

            return {
                ruleId: rule.id,
                ruleName: rule.name,
                triggered: true,
                conditionsMet: true,
                actionResults,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            console.error(`[RulesEngine] Error evaluating rule '${rule.name}':`, error);
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                triggered: false,
                conditionsMet: false,
                actionResults: [],
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    // ===========================================================================
    // MANUAL TRIGGER
    // ===========================================================================

    /**
     * Manually trigger a specific rule with custom data
     */
    public async triggerRule(
        ruleId: string,
        payload: Record<string, unknown>,
        userId?: string
    ): Promise<RuleExecutionResult | null> {
        const rule = this.getAllRules().find((r) => r.id === ruleId);
        if (!rule) {
            console.warn(`[RulesEngine] Rule '${ruleId}' not found`);
            return null;
        }

        // Create a synthetic event
        const event: HealthEvent = {
            id: `manual-${Date.now()}`,
            type: rule.trigger,
            payload,
            timestamp: new Date().toISOString(),
            source: 'manual_trigger',
            userId,
            metadata: { manualTrigger: true },
        };

        return this.evaluateRule(rule, event);
    }

    // ===========================================================================
    // STATISTICS
    // ===========================================================================

    /**
     * Get engine statistics
     */
    public getStats(): EngineStats {
        return { ...this.stats };
    }

    /**
     * Reset statistics
     */
    public resetStats(): void {
        this.stats = {
            totalEventsProcessed: 0,
            rulesEvaluated: 0,
            rulesTriggered: 0,
            actionsExecuted: 0,
            errors: 0,
            lastProcessedEvent: null,
        };
    }

    // ===========================================================================
    // CONFIGURATION
    // ===========================================================================

    /**
     * Enable/disable debug mode
     */
    public setDebug(enabled: boolean): void {
        RULES_ENGINE_CONFIG.debug = enabled;
    }

    /**
     * Enable/disable dry run mode
     */
    public setDryRun(enabled: boolean): void {
        RULES_ENGINE_CONFIG.dryRun = enabled;
    }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const rulesEngine = RulesEngine.getInstance();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Start the rules engine
 */
export function startRulesEngine(): void {
    rulesEngine.start();
}

/**
 * Stop the rules engine
 */
export function stopRulesEngine(): void {
    rulesEngine.stop();
}

/**
 * Add a custom rule
 */
export function addRule(config: Parameters<typeof createRule>[0]): void {
    const rule = createRule(config);
    rulesEngine.addRule(rule);
}
