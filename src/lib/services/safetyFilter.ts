/**
 * LabIQ Health - Safety Filter Service
 * 
 * Production-grade safety guardrails for health AI responses.
 * Ensures all AI outputs are safe, ethical, and compliant.
 * 
 * Features:
 * - Clinical advice detection and blocking
 * - Definitive claims detection
 * - Confidence threshold enforcement
 * - Disclaimer injection
 * - Population-level language enforcement
 * - PII detection
 */

// =============================================================================
// TYPES
// =============================================================================

export interface SafetyCheckResult {
    safe: boolean;
    violations: SafetyViolation[];
    filteredContent: string;
    disclaimersAdded: string[];
    confidence: number;
}

export interface SafetyViolation {
    type: SafetyViolationType;
    severity: 'warning' | 'critical';
    description: string;
    originalText: string;
    suggestedFix?: string;
    lineNumber?: number;
}

export type SafetyViolationType =
    | 'clinical_advice'
    | 'definitive_claim'
    | 'individual_diagnosis'
    | 'treatment_recommendation'
    | 'pii_detected'
    | 'low_confidence'
    | 'unsubstantiated_claim'
    | 'prescription_suggestion'
    | 'emergency_content';

export interface SafetyConfig {
    /** Minimum confidence to allow response (0-1) */
    minConfidence: number;
    /** Block clinical advice completely */
    blockClinicalAdvice: boolean;
    /** Enforce population-level language */
    enforcePopulationLanguage: boolean;
    /** Add disclaimers automatically */
    autoAddDisclaimers: boolean;
    /** Detect and redact PII */
    detectPII: boolean;
    /** Strict mode - more aggressive filtering */
    strictMode: boolean;
}

// =============================================================================
// DETECTION PATTERNS
// =============================================================================

const CLINICAL_ADVICE_PATTERNS = [
    /you should (take|stop taking|increase|decrease|change)\s+(your\s+)?(medication|dose|dosage|treatment)/gi,
    /I recommend (taking|stopping|starting|changing)\s+/gi,
    /you (need|must|have)\s+to\s+(see|consult|visit)\s+(a\s+)?(doctor|physician|specialist)/gi,
    /this indicates (you have|a diagnosis of|that you're suffering from)/gi,
    /based on (your|these) symptoms, you (have|likely have|probably have)/gi,
    /you are (suffering from|diagnosed with|showing signs of)/gi,
    /take\s+\d+\s*(mg|ml|tablets?|capsules?|doses?)/gi,
    /your (blood pressure|glucose|cholesterol) (is|should be|needs to be)/gi,
    /you (definitely|certainly|surely)\s+(have|don't have)/gi,
];

const DEFINITIVE_CLAIM_PATTERNS = [
    /this (proves|confirms|definitely shows|certainly indicates)/gi,
    /(definitely|certainly|surely|absolutely)\s+(shows?|means?|indicates?)/gi,
    /there is no doubt (that|about)/gi,
    /it is (certain|definite|absolute) that/gi,
    /100%\s+(accurate|certain|sure|confident)/gi,
    /guaranteed\s+to\s+(work|help|cure|treat)/gi,
    /will\s+(cure|fix|solve|eliminate)\s+your/gi,
];

const INDIVIDUAL_LANGUAGE_PATTERNS = [
    /your\s+(specific|individual|personal)\s+(case|situation|condition)/gi,
    /for you specifically/gi,
    /in your case/gi,
    /your individual health/gi,
    /based on your personal/gi,
];

const PII_PATTERNS = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Email addresses
    /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, // SSN patterns
    /\b\d{9}\b/g, // 9-digit numbers
    /\b(DOB|date of birth|born on)[\s:]*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi,
];

const EMERGENCY_PATTERNS = [
    /call\s+911/gi,
    /emergency\s+(room|department|services)/gi,
    /seek\s+immediate\s+(medical\s+)?(attention|help|care)/gi,
    /life[\s-]threatening/gi,
    /medical\s+emergency/gi,
];

const PRESCRIPTION_PATTERNS = [
    /\b(metformin|lisinopril|atorvastatin|amlodipine|omeprazole|losartan|simvastatin|gabapentin|hydrochlorothiazide|sertraline)\b/gi,
    /prescri(be|ption)/gi,
    /\d+\s*(mg|mcg|ml)\s+(daily|twice|three times)/gi,
];

// =============================================================================
// DISCLAIMER TEMPLATES
// =============================================================================

const DISCLAIMERS = {
    general: '**Note:** This analysis provides population-level insights only and is not intended as medical advice. Consult a healthcare professional for personalized guidance.',

    clinical: '⚠️ **Clinical Disclaimer:** The information presented is for educational and research purposes only. It should not be used for diagnosis or treatment decisions without consulting qualified healthcare providers.',

    model: '📊 **Model Disclaimer:** These predictions are based on statistical patterns and may not reflect all factors affecting individual outcomes. Results should be validated by domain experts.',

    confidence: '⚡ **Confidence Note:** This analysis has moderate confidence levels. Results should be interpreted with caution and verified against additional data sources.',

    experimental: '🧪 **Experimental Feature:** This analysis uses experimental methods and should be treated as preliminary findings only.',
};

// =============================================================================
// SAFETY FILTER CLASS
// =============================================================================

class SafetyFilterService {
    private config: SafetyConfig;

    constructor(config?: Partial<SafetyConfig>) {
        this.config = {
            minConfidence: 0.6,
            blockClinicalAdvice: true,
            enforcePopulationLanguage: true,
            autoAddDisclaimers: true,
            detectPII: true,
            strictMode: false,
            ...config,
        };
    }

    /**
     * Check content for safety violations and filter if necessary
     */
    check(content: string, confidence: number = 0.75): SafetyCheckResult {
        const violations: SafetyViolation[] = [];
        let filteredContent = content;
        const disclaimersAdded: string[] = [];

        // Check clinical advice
        if (this.config.blockClinicalAdvice) {
            const clinicalViolations = this.detectClinicalAdvice(content);
            violations.push(...clinicalViolations);
        }

        // Check definitive claims
        const claimViolations = this.detectDefinitiveClaims(content);
        violations.push(...claimViolations);

        // Check individual language
        if (this.config.enforcePopulationLanguage) {
            const languageViolations = this.detectIndividualLanguage(content);
            violations.push(...languageViolations);
        }

        // Check for PII
        if (this.config.detectPII) {
            const piiViolations = this.detectPII(content);
            violations.push(...piiViolations);
            // Redact PII
            filteredContent = this.redactPII(filteredContent);
        }

        // Check confidence threshold
        if (confidence < this.config.minConfidence) {
            violations.push({
                type: 'low_confidence',
                severity: 'warning',
                description: `Response confidence (${(confidence * 100).toFixed(0)}%) is below threshold (${(this.config.minConfidence * 100).toFixed(0)}%)`,
                originalText: '',
            });
        }

        // Check for emergency content
        const emergencyViolations = this.detectEmergencyContent(content);
        violations.push(...emergencyViolations);

        // Apply filters for critical violations
        filteredContent = this.applyFilters(filteredContent, violations);

        // Add disclaimers
        if (this.config.autoAddDisclaimers) {
            const { content: withDisclaimers, added } = this.addDisclaimers(
                filteredContent,
                violations,
                confidence
            );
            filteredContent = withDisclaimers;
            disclaimersAdded.push(...added);
        }

        const safe = !violations.some(v => v.severity === 'critical');

        return {
            safe,
            violations,
            filteredContent,
            disclaimersAdded,
            confidence: safe ? confidence : confidence * 0.7,
        };
    }

    /**
     * Quick check if content is safe (no detailed report)
     */
    isSafe(content: string, confidence: number = 0.75): boolean {
        const result = this.check(content, confidence);
        return result.safe;
    }

    /**
     * Filter and sanitize response
     */
    sanitize(content: string, confidence: number = 0.75): string {
        const result = this.check(content, confidence);
        return result.filteredContent;
    }

    // ===========================================================================
    // DETECTION METHODS
    // ===========================================================================

    private detectClinicalAdvice(content: string): SafetyViolation[] {
        const violations: SafetyViolation[] = [];

        for (const pattern of CLINICAL_ADVICE_PATTERNS) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                violations.push({
                    type: 'clinical_advice',
                    severity: 'critical',
                    description: 'Detected potential clinical advice that could be harmful',
                    originalText: match[0],
                    suggestedFix: 'Remove or rephrase as population-level observation',
                });
            }
        }

        for (const pattern of PRESCRIPTION_PATTERNS) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                violations.push({
                    type: 'prescription_suggestion',
                    severity: 'critical',
                    description: 'Detected medication or prescription-related content',
                    originalText: match[0],
                    suggestedFix: 'Remove specific medication references',
                });
            }
        }

        return violations;
    }

    private detectDefinitiveClaims(content: string): SafetyViolation[] {
        const violations: SafetyViolation[] = [];

        for (const pattern of DEFINITIVE_CLAIM_PATTERNS) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                violations.push({
                    type: 'definitive_claim',
                    severity: this.config.strictMode ? 'critical' : 'warning',
                    description: 'Detected definitive claim without proper hedging',
                    originalText: match[0],
                    suggestedFix: 'Add uncertainty language ("may", "suggests", "potentially")',
                });
            }
        }

        return violations;
    }

    private detectIndividualLanguage(content: string): SafetyViolation[] {
        const violations: SafetyViolation[] = [];

        for (const pattern of INDIVIDUAL_LANGUAGE_PATTERNS) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                violations.push({
                    type: 'individual_diagnosis',
                    severity: 'warning',
                    description: 'Detected individual-level language instead of population-level',
                    originalText: match[0],
                    suggestedFix: 'Rephrase using population-level terms',
                });
            }
        }

        return violations;
    }

    private detectPII(content: string): SafetyViolation[] {
        const violations: SafetyViolation[] = [];

        for (const pattern of PII_PATTERNS) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                violations.push({
                    type: 'pii_detected',
                    severity: 'critical',
                    description: 'Detected potential personally identifiable information',
                    originalText: '[REDACTED]',
                    suggestedFix: 'Remove or redact PII',
                });
            }
        }

        return violations;
    }

    private detectEmergencyContent(content: string): SafetyViolation[] {
        const violations: SafetyViolation[] = [];

        for (const pattern of EMERGENCY_PATTERNS) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                violations.push({
                    type: 'emergency_content',
                    severity: 'warning',
                    description: 'Contains emergency-related language',
                    originalText: match[0],
                });
            }
        }

        return violations;
    }

    // ===========================================================================
    // FILTERING METHODS
    // ===========================================================================

    private applyFilters(content: string, violations: SafetyViolation[]): string {
        let filtered = content;

        for (const violation of violations) {
            if (violation.severity === 'critical' && violation.originalText) {
                // Replace critical violations with safer alternatives
                switch (violation.type) {
                    case 'clinical_advice':
                        filtered = filtered.replace(
                            violation.originalText,
                            '[Content filtered: consult a healthcare provider for medical advice]'
                        );
                        break;
                    case 'prescription_suggestion':
                        filtered = filtered.replace(
                            violation.originalText,
                            '[Medication information removed for safety]'
                        );
                        break;
                    case 'pii_detected':
                        // Already handled by redactPII
                        break;
                    default:
                        // Keep mild violations but flag them
                        break;
                }
            }
        }

        return filtered;
    }

    private redactPII(content: string): string {
        let redacted = content;

        for (const pattern of PII_PATTERNS) {
            redacted = redacted.replace(pattern, '[REDACTED]');
        }

        return redacted;
    }

    private addDisclaimers(
        content: string,
        violations: SafetyViolation[],
        confidence: number
    ): { content: string; added: string[] } {
        const added: string[] = [];

        // Always add general disclaimer for health content
        if (!content.includes('**Note:**') && !content.includes('**Disclaimer:**')) {
            added.push('general');
        }

        // Add clinical disclaimer if any clinical-related violations
        if (violations.some(v =>
            v.type === 'clinical_advice' ||
            v.type === 'prescription_suggestion' ||
            v.type === 'emergency_content'
        )) {
            added.push('clinical');
        }

        // Add confidence disclaimer for low confidence
        if (confidence < 0.7) {
            added.push('confidence');
        }

        // Build disclaimer text
        const disclaimerText = added.map(key => DISCLAIMERS[key as keyof typeof DISCLAIMERS]).join('\n\n');

        return {
            content: disclaimerText ? `${content}\n\n---\n\n${disclaimerText}` : content,
            added,
        };
    }

    // ===========================================================================
    // UTILITY METHODS
    // ===========================================================================

    /**
     * Convert individual language to population-level
     */
    toPopulationLanguage(content: string): string {
        return content
            .replace(/your (health|condition|symptoms?)/gi, 'population health patterns')
            .replace(/you (have|are|should|need|must)/gi, 'populations may')
            .replace(/in your case/gi, 'in similar cases')
            .replace(/for you specifically/gi, 'for similar populations')
            .replace(/your individual/gi, 'group-level');
    }

    /**
     * Add hedging language to definitive claims
     */
    addHedging(content: string): string {
        return content
            .replace(/this (proves|confirms)/gi, 'this suggests')
            .replace(/(definitely|certainly) shows/gi, 'may indicate')
            .replace(/there is no doubt/gi, 'evidence suggests')
            .replace(/it is (certain|definite)/gi, 'it appears')
            .replace(/100% (accurate|certain)/gi, 'statistically significant');
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<SafetyConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): SafetyConfig {
        return { ...this.config };
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const safetyFilter = new SafetyFilterService();
export { SafetyFilterService };
export default safetyFilter;
