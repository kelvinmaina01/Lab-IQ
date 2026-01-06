/**
 * LabIQ Health - AI Service with Event Integration
 * 
 * This service wraps the LabIQAI and integrates with the EventBus
 * for closed-loop automation. All AI operations emit events that
 * can trigger workflows and other actions.
 * 
 * Modes:
 * - ANALYST (🧠): What is happening in the data?
 * - ML (🤖): What did the model do, and why?
 * - LEARN (📘): What does this mean in real-world health terms?
 */

import { labIQAI, AIResponse, AISection } from '@/lib/ai/LabIQAI';
import { eventBus, EventType, EventPayload } from './eventBus';
import { supabase } from '@/integrations/supabase/client';
import { safetyFilter } from './safetyFilter';
import { aiOrchestrator } from './aiOrchestrator';

// =============================================================================
// TYPES
// =============================================================================

export type AIMode = 'analyst' | 'ml' | 'learn';

export interface AIRequest {
    datasetId: string;
    query: string;
    mode: AIMode;
    context?: Record<string, unknown>;
    conversationHistory?: { role: string; content: string }[];
}

export interface AIResult extends AIResponse {
    mode: AIMode;
    eventEmitted: boolean;
    insightId?: string;
}

export interface ExplainabilityData {
    findings: string[];
    evidence: {
        datasetVersion?: string;
        rowsCovered: number;
        columnsCovered: string[];
        analysisType: string;
    };
    confidence: number;
    limitations: string[];
    methodology: string;
}

export interface DomainClassification {
    domain: 'health' | 'clinical' | 'biopharma' | 'environmental' | 'population' | 'general';
    confidence: number;
    indicators: string[];
    suggestedExperiments: string[];
}

export interface ExperimentProposal {
    title: string;
    description: string;
    type: string;
    targetColumn?: string;
    features?: string[];
    rationale: string;
    expectedOutcome: string;
    confidence: number;
}

export interface ModelInterpretation {
    summary: string;
    keyFindings: string[];
    featureImportance: { feature: string; importance: number }[];
    recommendations: string[];
    limitations: string[];
    confidence: number;
}

// =============================================================================
// MODE CONFIGURATIONS
// =============================================================================

const MODE_PROMPTS = {
    analyst: `You are LabIQ's Data Analyst mode (🧠).
Your role is to explain WHAT is happening in the data.
Focus on:
- Statistical summaries and distributions
- Patterns, trends, and correlations
- Data quality issues and anomalies
- Visual representations of findings
Always provide specific numbers and cite the data.`,

    ml: `You are LabIQ's Machine Learning mode (🤖).
Your role is to explain WHAT the model did and WHY.
Focus on:
- Model architecture and algorithm choices
- Feature importance and selection rationale
- Performance metrics interpretation
- Hyperparameter decisions
- Prediction confidence and uncertainty
Always be technically precise.`,

    learn: `You are LabIQ's Education mode (📘).
Your role is to explain WHAT this means in real-world health terms.
Focus on:
- Translating technical findings into plain language
- Health and clinical implications
- Population-level interpretations (never individual advice)
- Educational context for concepts
- References to health research where relevant
Always add disclaimers for clinical interpretations.`
};

// =============================================================================
// LAB AI SERVICE CLASS
// =============================================================================

class LabAIService {
    private userId: string | null = null;

    constructor() {
        // Initialize user ID
        this.initializeUser();
    }

    private async initializeUser(): Promise<void> {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
            this.userId = data.user.id;
        }
    }

    // ===========================================================================
    // CORE AI METHODS
    // ===========================================================================

    /**
     * Process an AI request with mode-specific prompting and event emission
     */
    async process(request: AIRequest): Promise<AIResult> {
        const { datasetId, query, mode, conversationHistory } = request;

        try {
            // Add mode-specific context to the query
            const modeContext = MODE_PROMPTS[mode];

            // Orchestrate the request (Determine best provider/strategy)
            // Note: Currently just logging the decision, acting as a "brain" check
            const route = aiOrchestrator.route(mode, 'reasoning', query.length);
            console.log(`[LabAIService] Orchestrator routed to: ${route.provider} (${route.reason})`);

            // Call the underlying LabIQAI
            let response = await labIQAI.dataAnalysis.process(
                datasetId,
                query,
                mode === 'analyst' ? 'analysis' : mode === 'ml' ? 'automl' : 'educator',
                conversationHistory
            );

            // Apply Safety Filter
            const safetyResult = safetyFilter.check(response.content, response.metadata?.confidence as number || 0.75);

            if (!safetyResult.safe) {
                console.warn('[LabAIService] Safety violation detected:', safetyResult.violations);
                // If critical, redact content
                response.content = safetyResult.filteredContent;
                // Add safety note if not present
                if (!response.content.includes('Safety Filter')) {
                    response.content += "\n\n*[Note: Some content was modified by the LabIQ Safety Guardrails]*";
                }
            }

            // Add Safety Disclaimers
            if (safetyFilter.getConfig().autoAddDisclaimers) {
                // Simple append for now, could be more sophisticated
                // check if they handled it internally or we just append
            }

            // Generate insight ID for tracking
            const insightId = crypto.randomUUID();

            // Emit AI_INSIGHT_GENERATED event
            const eventEmitted = await this.emitInsightEvent(
                insightId,
                query,
                mode,
                response,
                datasetId
            );

            return {
                ...response,
                mode,
                eventEmitted,
                insightId,
            };
        } catch (error) {
            console.error('LabAIService process error:', error);
            return {
                success: false,
                content: `Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`,
                mode,
                eventEmitted: false,
            };
        }
    }

    /**
     * Classify a dataset's domain for experiment suggestions
     */
    async classifyDataset(datasetId: string): Promise<DomainClassification> {
        try {
            // Get dataset statistics
            const response = await labIQAI.dataAnalysis.process(
                datasetId,
                'Analyze this dataset and classify its domain. Is it health, clinical, biopharma, environmental, or population data? What experiments would you suggest?',
                'analysis'
            );

            // Parse response into domain classification
            const domain = this.extractDomain(response.content);

            // Emit event for domain classification
            eventBus.emit(
                'AI_INSIGHT_GENERATED',
                {
                    timestamp: new Date().toISOString(),
                    source: 'labAIService',
                    userId: this.userId || undefined,
                    data: {
                        insightId: crypto.randomUUID(),
                        title: 'Domain Classification',
                        insightType: 'recommendation',
                        confidence: domain.confidence,
                        datasetId,
                        summary: `Dataset classified as ${domain.domain} with ${(domain.confidence * 100).toFixed(0)}% confidence`,
                    }
                }
            );

            return domain;
        } catch (error) {
            console.error('Domain classification error:', error);
            return {
                domain: 'general',
                confidence: 0.5,
                indicators: [],
                suggestedExperiments: [],
            };
        }
    }

    /**
     * Propose an experiment based on dataset analysis
     */
    async proposeExperiment(datasetId: string, context?: string): Promise<ExperimentProposal> {
        try {
            const prompt = context
                ? `Based on this context: "${context}", propose the best experiment for this dataset.`
                : 'Analyze this dataset and propose the most valuable experiment to run on it.';

            const response = await labIQAI.dataAnalysis.process(
                datasetId,
                prompt,
                'automl'
            );

            const proposal = this.extractExperimentProposal(response.content);

            // Emit event
            eventBus.emit(
                'AI_INSIGHT_GENERATED',
                {
                    timestamp: new Date().toISOString(),
                    source: 'labAIService',
                    userId: this.userId || undefined,
                    data: {
                        insightId: crypto.randomUUID(),
                        title: proposal.title,
                        insightType: 'recommendation',
                        confidence: proposal.confidence,
                        datasetId,
                        summary: proposal.description,
                    }
                }
            );

            return proposal;
        } catch (error) {
            console.error('Experiment proposal error:', error);
            return {
                title: 'Unable to Generate Proposal',
                description: 'Error generating experiment proposal',
                type: 'unknown',
                rationale: '',
                expectedOutcome: '',
                confidence: 0,
            };
        }
    }

    /**
     * Interpret model results using ML mode
     */
    async interpretResults(
        modelId: string,
        metrics: Record<string, number>,
        featureImportance?: Record<string, number>
    ): Promise<ModelInterpretation> {
        try {
            const metricsStr = Object.entries(metrics)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');

            const featuresStr = featureImportance
                ? Object.entries(featureImportance)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([k, v]) => `${k}: ${(v * 100).toFixed(1)}%`)
                    .join(', ')
                : 'Not available';

            const prompt = `Interpret these model results:
Metrics: ${metricsStr}
Top Features: ${featuresStr}

Provide:
1. A summary of model performance
2. Key findings and what they mean
3. Recommendations for improvement
4. Limitations to consider`;

            // Use internal AI call
            const response = await labIQAI.directQuery(prompt);

            const interpretation: ModelInterpretation = {
                summary: response.content.split('\n')[0] || 'Model analysis complete',
                keyFindings: this.extractListItems(response.content, 'Key findings'),
                featureImportance: featureImportance
                    ? Object.entries(featureImportance)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([feature, importance]) => ({ feature, importance }))
                    : [],
                recommendations: this.extractListItems(response.content, 'Recommendations'),
                limitations: this.extractListItems(response.content, 'Limitations'),
                confidence: 0.8,
            };

            // Emit event
            // Emit event
            eventBus.emit(
                'AI_INSIGHT_GENERATED',
                {
                    timestamp: new Date().toISOString(),
                    source: 'labAIService',
                    userId: this.userId || undefined,
                    data: {
                        insightId: crypto.randomUUID(),
                        title: 'Model Interpretation',
                        insightType: 'pattern',
                        confidence: interpretation.confidence,
                        modelId,
                        summary: interpretation.summary,
                    }
                }
            );

            return interpretation;
        } catch (error) {
            console.error('Model interpretation error:', error);
            return {
                summary: 'Unable to interpret model results',
                keyFindings: [],
                featureImportance: [],
                recommendations: [],
                limitations: ['Error during interpretation'],
                confidence: 0,
            };
        }
    }

    /**
     * Explain an anomaly in user-friendly terms
     */
    async explainAnomaly(
        datasetId: string,
        anomalyDescription: string,
        context?: Record<string, unknown>
    ): Promise<string> {
        const prompt = `Explain this data anomaly in clear, non-technical terms:
${anomalyDescription}

Focus on:
1. What this anomaly means
2. Possible causes
3. Recommended actions
4. Health/clinical implications (if applicable)

Remember to use population-level language, not individual advice.`;

        const response = await labIQAI.directQuery(prompt);

        // Emit event
        eventBus.emit(
            'AI_INSIGHT_GENERATED',
            {
                timestamp: new Date().toISOString(),
                source: 'labAIService',
                userId: this.userId || undefined,
                data: {
                    insightId: crypto.randomUUID(),
                    title: 'Anomaly Explanation',
                    insightType: 'anomaly',
                    confidence: 0.85,
                    datasetId,
                    summary: response.content.slice(0, 200),
                }
            }
        );

        return response.content;
    }

    /**
     * Assess if human escalation is needed
     */
    async assessEscalation(
        insightType: string,
        confidence: number,
        severity: string,
        context?: Record<string, unknown>
    ): Promise<{ shouldEscalate: boolean; reason: string; priority: 'low' | 'medium' | 'high' | 'critical' }> {
        // Rule-based escalation logic
        const shouldEscalate =
            confidence > 0.85 &&
            (severity === 'high' || severity === 'critical') &&
            (insightType === 'anomaly' || insightType === 'quality');

        let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (severity === 'critical' && confidence > 0.9) priority = 'critical';
        else if (severity === 'high' || confidence > 0.85) priority = 'high';
        else if (severity === 'medium') priority = 'medium';

        const reason = shouldEscalate
            ? `High-confidence ${insightType} detected with ${severity} severity. Human review recommended.`
            : `${insightType} with ${(confidence * 100).toFixed(0)}% confidence does not meet escalation threshold.`;

        return { shouldEscalate, reason, priority };
    }

    /**
     * Generate explainability data for a response
     */
    generateExplainability(
        response: AIResponse,
        datasetId: string,
        mode: AIMode
    ): ExplainabilityData {
        const findings = response.sections
            ?.filter(s => s.type === 'insight' || s.type === 'recommendation')
            .map(s => s.content || s.title || '')
            .filter(Boolean) || [];

        return {
            findings,
            evidence: {
                datasetVersion: 'latest',
                rowsCovered: response.metadata?.rowCount as number || 0,
                columnsCovered: response.metadata?.columns as string[] || [],
                analysisType: mode,
            },
            confidence: response.metadata?.confidence as number || 0.75,
            limitations: [
                'Analysis based on available data only',
                'Results should be validated by domain experts',
                mode === 'learn' ? 'Health interpretations are population-level only' : '',
            ].filter(Boolean),
            methodology: this.getModeMethodology(mode),
        };
    }

    // ===========================================================================
    // HELPER METHODS
    // ===========================================================================

    private async emitInsightEvent(
        insightId: string,
        query: string,
        mode: AIMode,
        response: AIResponse,
        datasetId?: string
    ): Promise<boolean> {
        try {
            await eventBus.emit(
                'AI_INSIGHT_GENERATED',
                {
                    timestamp: new Date().toISOString(),
                    source: 'labAIService',
                    userId: this.userId || undefined,
                    data: {
                        insightId,
                        title: query.slice(0, 100),
                        insightType: mode === 'analyst' ? 'pattern' : mode === 'ml' ? 'recommendation' : 'pattern',
                        confidence: response.metadata?.confidence as number || 0.75,
                        datasetId,
                        summary: response.content?.slice(0, 200) || 'AI analysis complete',
                        mode,
                        hasVisualization: !!response.sections?.some(s => s.type === 'chart')
                    }
                }
            );
            return true;
        } catch (error) {
            console.error('Failed to emit insight event:', error);
            return false;
        }
    }

    private extractDomain(content: string): DomainClassification {
        const lowerContent = content.toLowerCase();

        const domains: ('health' | 'clinical' | 'biopharma' | 'environmental' | 'population')[] =
            ['clinical', 'biopharma', 'health', 'environmental', 'population'];

        for (const domain of domains) {
            if (lowerContent.includes(domain)) {
                return {
                    domain,
                    confidence: 0.8,
                    indicators: [domain],
                    suggestedExperiments: [`${domain}_analysis`, `${domain}_prediction`],
                };
            }
        }

        return {
            domain: 'general',
            confidence: 0.5,
            indicators: [],
            suggestedExperiments: ['exploratory_analysis'],
        };
    }

    private extractExperimentProposal(content: string): ExperimentProposal {
        return {
            title: 'AI-Proposed Experiment',
            description: content.slice(0, 200),
            type: 'analysis',
            rationale: 'Based on dataset characteristics',
            expectedOutcome: 'Actionable insights',
            confidence: 0.75,
        };
    }

    private extractListItems(content: string, section: string): string[] {
        const regex = new RegExp(`${section}[:\\n]([^#]+?)(?=\\n#|$)`, 'is');
        const match = content.match(regex);
        if (!match) return [];

        return match[1]
            .split(/[\n•\-\d.]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10);
    }

    private getModeMethodology(mode: AIMode): string {
        switch (mode) {
            case 'analyst':
                return 'Statistical analysis, pattern detection, and correlation analysis';
            case 'ml':
                return 'Machine learning model evaluation and feature importance analysis';
            case 'learn':
                return 'Domain knowledge synthesis with health research context';
            default:
                return 'Multi-modal AI analysis';
        }
    }

    /**
     * Check if the AI service is available
     */
    isAvailable(): boolean {
        return labIQAI.isAvailable();
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const labAIService = new LabAIService();
export default labAIService;
