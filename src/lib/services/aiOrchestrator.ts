import { labIQAI } from '@/lib/ai/LabIQAI';

export type AIProvider = 'groq' | 'gemini' | 'anthropic' | 'openai';

export interface OrchestrationResult {
    provider: AIProvider;
    model: string;
    reason: string;
}

/**
 * AI Orchestrator
 * Decides which AI model/provider to use based on the task type, complexity, and mode.
 * 
 * Strategy:
 * - GROQ (Llama 3): Fast responses, summaries, analyst mode (quick patterns), graph descriptions.
 * - Gemini (Flash/Pro): Deep reasoning, educational content (Learn mode), complex implementation plans.
 */
class AIOrchestrator {
    private static instance: AIOrchestrator;

    private constructor() { }

    public static getInstance(): AIOrchestrator {
        if (!AIOrchestrator.instance) {
            AIOrchestrator.instance = new AIOrchestrator();
        }
        return AIOrchestrator.instance;
    }

    /**
     * Determine the best provider and model for a given request
     */
    public route(
        mode: 'analyst' | 'ml' | 'learn',
        taskType: 'summary' | 'reasoning' | 'code' | 'visualization' | 'creative',
        queryLength: number
    ): OrchestrationResult {

        // Default to GROQ for speed
        let provider: AIProvider = 'groq';
        let model = 'llama3-8b-8192';
        let reason = 'Defaulting to GROQ for speed and efficiency.';

        // LEARN Mode -> Gemini (Better explanation capabilities)
        if (mode === 'learn') {
            provider = 'gemini';
            model = 'gemini-1.5-flash';
            reason = 'Learn mode requires deep reasoning and educational clarity.';
        }

        // ML Mode + Reasoning -> Gemini
        else if (mode === 'ml' && taskType === 'reasoning') {
            provider = 'gemini';
            model = 'gemini-1.5-flash';
            reason = 'Complex ML interpretation requires stronger reasoning capabilities.';
        }

        // Analyst Mode + Visualization -> GROQ (Fast structured output)
        else if (mode === 'analyst' && taskType === 'visualization') {
            provider = 'groq';
            model = 'llama3-70b-8192'; // Use larger Llama for complex JSON structures
            reason = 'Analyst visualization requires fast, structured generation.';
        }

        // Long Context -> Gemini (Larger context window)
        else if (queryLength > 5000) {
            provider = 'gemini';
            model = 'gemini-1.5-pro';
            reason = 'Input context prevents use of standard models; switching to high-context model.';
        }

        return { provider, model, reason };
    }

    /**
     * Execute a query through the orchestrated provider
     * (This is a simplified wrapper around LabIQAI's underlying calls, 
     * in a real scenario we passed the 'model' param to LabIQAI)
     */
    public async execute(
        query: string,
        mode: 'analyst' | 'ml' | 'learn',
        context?: any
    ) {
        // 1. Determine Intent/Task Type (Heuristic for V1)
        const taskType = this.inferTaskType(query);

        // 2. Get Route
        const route = this.route(mode, taskType, query.length);
        console.log(`🔀 [AI Orchestrator] Routing to ${route.provider} (${route.model}): ${route.reason}`);

        // 3. In V1, we might set a global config or pass params. 
        // Assuming LabIQAI can accept a preferred provider/model.
        // Since LabIQAI.ts is existing code, we might need to modify it or just use it as is 
        // if it doesn't support dynamic switching per call.
        // For now, we will perform the mental logic here and delegate.

        // TODO: Verify if LabIQAI supports per-request provider selection.
        // If not, we fall back to generic processing but logged usage.

        return route;
    }

    private inferTaskType(query: string): 'summary' | 'reasoning' | 'code' | 'visualization' | 'creative' {
        const q = query.toLowerCase();
        if (q.includes('express') || q.includes('explain') || q.includes('why') || q.includes('interpret')) return 'reasoning';
        if (q.includes('plot') || q.includes('chart') || q.includes('graph') || q.includes('visualize')) return 'visualization';
        if (q.includes('code') || q.includes('function') || q.includes('script')) return 'code';
        return 'summary';
    }
}

export const aiOrchestrator = AIOrchestrator.getInstance();
