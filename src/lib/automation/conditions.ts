/**
 * LabIQ Health - Condition Evaluator
 * 
 * Evaluates rule conditions against event payloads.
 * Supports nested field access, multiple operators, and type coercion.
 */

// =============================================================================
// CONDITION TYPES
// =============================================================================

export type ConditionOperator =
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'notContains'
    | 'greaterThan'
    | 'lessThan'
    | 'greaterOrEqual'
    | 'lessOrEqual'
    | 'in'
    | 'notIn'
    | 'matches'
    | 'exists'
    | 'notExists';

export interface Condition {
    /** Field path (supports dot notation: "dataset.domain") */
    field: string;
    /** Comparison operator */
    operator: ConditionOperator;
    /** Value to compare against */
    value: unknown;
}

// =============================================================================
// CONDITION EVALUATOR
// =============================================================================

/**
 * Get a nested field value from an object using dot notation
 * @example getNestedValue({ dataset: { domain: 'health' } }, 'dataset.domain') => 'health'
 */
export function getNestedValue(obj: unknown, path: string): unknown {
    if (obj === null || obj === undefined) return undefined;

    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
        if (current === null || current === undefined) return undefined;
        if (typeof current !== 'object') return undefined;
        current = (current as Record<string, unknown>)[key];
    }

    return current;
}

/**
 * Evaluate a single condition against data
 */
export function evaluateCondition(condition: Condition, data: unknown): boolean {
    const { field, operator, value } = condition;
    const fieldValue = getNestedValue(data, field);

    switch (operator) {
        case 'equals':
            return fieldValue === value;

        case 'notEquals':
            return fieldValue !== value;

        case 'contains':
            if (typeof fieldValue === 'string' && typeof value === 'string') {
                return fieldValue.toLowerCase().includes(value.toLowerCase());
            }
            if (Array.isArray(fieldValue)) {
                return fieldValue.includes(value);
            }
            return false;

        case 'notContains':
            if (typeof fieldValue === 'string' && typeof value === 'string') {
                return !fieldValue.toLowerCase().includes(value.toLowerCase());
            }
            if (Array.isArray(fieldValue)) {
                return !fieldValue.includes(value);
            }
            return true;

        case 'greaterThan':
            return typeof fieldValue === 'number' && typeof value === 'number'
                ? fieldValue > value
                : false;

        case 'lessThan':
            return typeof fieldValue === 'number' && typeof value === 'number'
                ? fieldValue < value
                : false;

        case 'greaterOrEqual':
            return typeof fieldValue === 'number' && typeof value === 'number'
                ? fieldValue >= value
                : false;

        case 'lessOrEqual':
            return typeof fieldValue === 'number' && typeof value === 'number'
                ? fieldValue <= value
                : false;

        case 'in':
            if (Array.isArray(value)) {
                return value.includes(fieldValue);
            }
            return false;

        case 'notIn':
            if (Array.isArray(value)) {
                return !value.includes(fieldValue);
            }
            return true;

        case 'matches':
            if (typeof fieldValue === 'string' && typeof value === 'string') {
                try {
                    const regex = new RegExp(value);
                    return regex.test(fieldValue);
                } catch {
                    return false;
                }
            }
            return false;

        case 'exists':
            return fieldValue !== null && fieldValue !== undefined;

        case 'notExists':
            return fieldValue === null || fieldValue === undefined;

        default:
            console.warn(`[Conditions] Unknown operator: ${operator}`);
            return false;
    }
}

/**
 * Evaluate all conditions (AND logic)
 * All conditions must pass for the result to be true
 */
export function evaluateAllConditions(conditions: Condition[], data: unknown): boolean {
    if (conditions.length === 0) return true;
    return conditions.every((condition) => evaluateCondition(condition, data));
}

/**
 * Evaluate any conditions (OR logic)
 * At least one condition must pass for the result to be true
 */
export function evaluateAnyConditions(conditions: Condition[], data: unknown): boolean {
    if (conditions.length === 0) return true;
    return conditions.some((condition) => evaluateCondition(condition, data));
}

/**
 * Create a condition builder for cleaner rule definitions
 */
export function condition(
    field: string,
    operator: ConditionOperator,
    value: unknown
): Condition {
    return { field, operator, value };
}

// =============================================================================
// CONVENIENCE BUILDERS
// =============================================================================

export const when = {
    equals: (field: string, value: unknown): Condition => condition(field, 'equals', value),
    notEquals: (field: string, value: unknown): Condition => condition(field, 'notEquals', value),
    contains: (field: string, value: string): Condition => condition(field, 'contains', value),
    greaterThan: (field: string, value: number): Condition => condition(field, 'greaterThan', value),
    lessThan: (field: string, value: number): Condition => condition(field, 'lessThan', value),
    in: (field: string, values: unknown[]): Condition => condition(field, 'in', values),
    notIn: (field: string, values: unknown[]): Condition => condition(field, 'notIn', values),
    exists: (field: string): Condition => condition(field, 'exists', true),
    notExists: (field: string): Condition => condition(field, 'notExists', true),
    matches: (field: string, pattern: string): Condition => condition(field, 'matches', pattern),
};
