import { labIQAI } from '@/lib/ai/LabIQAI';

export interface ChartConfig {
    type: 'bar' | 'line' | 'scatter' | 'pie' | 'area';
    title: string;
    xAxis: string;
    yAxis: string[];
    colors?: string[];
    description?: string;
    data?: any[]; // Optional embedded data
}

export interface BIRequest {
    datasetId: string;
    prompt: string;
    context?: any;
}

export interface BIResponse {
    config: ChartConfig;
    explanation: string;
    sqlQuery?: string; // If we were doing real SQL generation
}

class PromptBIService {
    private static instance: PromptBIService;

    private constructor() { }

    public static getInstance(): PromptBIService {
        if (!PromptBIService.instance) {
            PromptBIService.instance = new PromptBIService();
        }
        return PromptBIService.instance;
    }

    /**
     * Generate a chart configuration from a natural language prompt
     */
    public async generateChartConfig(request: BIRequest): Promise<BIResponse> {
        try {
            // In V1, we simulate the AI generation or call the general LabIQAI
            // Ideally LabIQAI would have a specialized method, but we can use directQuery

            const systemPrompt = `You are an expert Data Visualization Architect. 
            User will provide a dataset context and a request. 
            You must output a JSON object representing a chart configuration using Recharts-friendly structure.
            
            Format:
            {
                "type": "bar" | "line" | "scatter" | "pie" | "area",
                "title": "Chart Title",
                "xAxis": "column_name_for_x",
                "yAxis": ["column_name_for_y1", ...],
                "explanation": "Why this chart was chosen"
            }`;

            const userPrompt = `Context: Dataset ${request.datasetId}. Request: ${request.prompt}`;

            // Allow simulated response if LabIQAI is offline or for speed in this demo
            if (!labIQAI.isAvailable()) {
                return this.mockResponse(request.prompt);
            }

            const response = await labIQAI.directQuery(userPrompt, systemPrompt);

            // Attempt to parse JSON from AI response
            // This is fragile in a real app without strict structured outputs, 
            // but for V1 we assume the model follows instructions or we use a parser helper.
            try {
                const jsonMatch = response.content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return {
                        config: {
                            type: parsed.type || 'bar',
                            title: parsed.title || 'Generated Chart',
                            xAxis: parsed.xAxis || 'x',
                            yAxis: parsed.yAxis || ['y'],
                            description: parsed.explanation
                        },
                        explanation: parsed.explanation || 'Generated based on your request.'
                    };
                }
            } catch (e) {
                console.warn('Failed to parse AI BI response', e);
            }

            // Fallback
            return this.mockResponse(request.prompt);

        } catch (error) {
            console.error('Error in PromptBI:', error);
            throw error;
        }
    }

    private mockResponse(prompt: string): BIResponse {
        const lower = prompt.toLowerCase();

        if (lower.includes('trend') || lower.includes('over time')) {
            return {
                config: {
                    type: 'line',
                    title: 'Trend Analysis',
                    xAxis: 'date',
                    yAxis: ['value'],
                    description: 'Showing trends over time as requested.'
                },
                explanation: 'A line chart is best for showing continuous data comparisons over time.'
            };
        }

        if (lower.includes('distribution') || lower.includes('breakdown')) {
            return {
                config: {
                    type: 'pie',
                    title: 'Distribution Analysis',
                    xAxis: 'category',
                    yAxis: ['count'],
                    description: 'Showing distribution across categories.'
                },
                explanation: 'A pie chart helps visualize part-to-whole relationships.'
            };
        }

        return {
            config: {
                type: 'bar',
                title: 'Data Comparison',
                xAxis: 'category',
                yAxis: ['value'],
                description: 'Comparing values across categories.'
            },
            explanation: 'A bar chart is effective for comparing categorical data.'
        };
    }
}

export const promptBIService = PromptBIService.getInstance();
