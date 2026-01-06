/**
 * Overview Service - AI-Powered Data Overview Generator
 * Creates comprehensive, narrative overviews from dashboard collections
 */

import { supabase } from '@/integrations/supabase/client';
import { PinnedDashboard } from './dashboardService';
import { labIQAI } from '@/lib/ai/LabIQAI';

// =============================================================================
// TYPES
// =============================================================================

export interface DataOverview {
    id: string;
    title: string;
    dataset_name: string;
    overview_text: string;
    overall_insights: string[];
    key_insights: string[];
    featured_charts: Array<{
        id: string;
        title: string;
        type: 'bar' | 'line' | 'pie' | 'area';
        data: any;
        description: string;
    }>;
    metrics_summary: Array<{
        label: string;
        value: string | number;
        trend?: 'up' | 'down' | 'stable';
    }>;
    theme_color: string;
    dashboard_ids: string[];
    created_at: string;
}

export interface GenerateOverviewOptions {
    dashboards: PinnedDashboard[];
    customTitle?: string;
}

// =============================================================================
// OVERVIEW SERVICE CLASS
// =============================================================================

class OverviewService {
    private static instance: OverviewService;

    private constructor() { }

    public static getInstance(): OverviewService {
        if (!OverviewService.instance) {
            OverviewService.instance = new OverviewService();
        }
        return OverviewService.instance;
    }

    /**
     * AI-Powered: Generate comprehensive data overview from dashboards
     */
    async generateOverview(options: GenerateOverviewOptions): Promise<DataOverview> {
        const { dashboards, customTitle } = options;

        if (dashboards.length === 0) {
            throw new Error('No dashboards provided for overview generation');
        }

        // Extract dataset information
        const datasetName = this.extractDatasetName(dashboards);

        // Analyze dashboards with AI
        const aiAnalysis = await this.analyzeWithAI(dashboards, datasetName);

        // Select best charts for visualization
        const featuredCharts = this.selectBestCharts(dashboards);

        // Extract key metrics
        const metricsSummary = this.extractMetrics(dashboards);

        // Generate title
        const title = customTitle || aiAnalysis.title || `${datasetName} Analysis Overview`;

        // Determine theme color based on dataset type
        const themeColor = this.selectThemeColor(dashboards);

        const overview: DataOverview = {
            id: crypto.randomUUID(),
            title,
            dataset_name: datasetName,
            overview_text: aiAnalysis.overview,
            overall_insights: aiAnalysis.insights,
            key_insights: aiAnalysis.keyTakeaways,
            featured_charts: featuredCharts,
            metrics_summary: metricsSummary,
            theme_color: themeColor,
            dashboard_ids: dashboards.map(d => d.id),
            created_at: new Date().toISOString()
        };

        return overview;
    }

    /**
     * AI Analysis: Generate comprehensive narrative and insights
     */
    private async analyzeWithAI(
        dashboards: PinnedDashboard[],
        datasetName: string
    ): Promise<{
        title: string;
        overview: string;
        insights: string[];
        keyTakeaways: string[];
    }> {
        // Build rich context from actual dashboard insights - the REAL analysis content
        const dashboardInsights = dashboards.map((d, idx) => {
            let insightText = '';

            // Extract the actual AI-generated insight content
            if (d.type === 'insight' && d.data.summary) {
                insightText = d.data.summary;
                if (d.data.keyPoints && d.data.keyPoints.length > 0) {
                    insightText += '\n\nKey Findings:\n- ' + d.data.keyPoints.join('\n- ');
                }
                if (d.data.recommendations && d.data.recommendations.length > 0) {
                    insightText += '\n\nRecommendations:\n- ' + d.data.recommendations.join('\n- ');
                }
            } else if (d.type === 'metric') {
                insightText = `Metric Value: ${d.data.value}${d.data.unit || ''} (Trend: ${d.data.trend || 'stable'})`;
                if (d.data.summary) insightText += `\nContext: ${d.data.summary}`;
            } else if (d.type === 'chart') {
                insightText = `Data visualization with ${d.data.labels?.length || 0} data points`;
                if (d.description) insightText += `\nInsight: ${d.description}`;
            }

            return `## ${d.title}\n${insightText}\n`;
        }).join('\n---\n');

        const prompt = `You are a data analyst writing a comprehensive ANALYSIS REPORT for the "${datasetName}" dataset.

You previously conducted ${dashboards.length} different analyses on this dataset. Here are YOUR findings from that analysis:

${dashboardInsights}

Now write a professional data analysis report that consolidates YOUR findings into a presentation-ready format:

1. REPORT TITLE: Create a specific, compelling title for this data analysis report
   Example: "Patient Vital Signs Analysis: Risk Factors and Clinical Insights"

2. EXECUTIVE SUMMARY: Write 4-5 sentences that:
   - State what data YOU analyzed (${datasetName})
   - Summarize the MOST IMPORTANT discoveries YOU made
   - Explain WHY these findings matter
   - Mention YOUR analytical approach

3. KEY FINDINGS: List 6-8 specific discoveries from YOUR analysis above:
   - Reference ACTUAL patterns or correlations YOU found in the data
   - Use quantitative insights where YOU provided them
   - Explain what each finding reveals about the data
   - Connect related findings to show deeper patterns YOU discovered

4. RECOMMENDATIONS: Provide 4-6 actionable next steps based on YOUR findings:
   - Each should address something YOU discovered
   - Explain HOW it relates to YOUR analysis
   - Be specific and evidence-based

This is a DATA ANALYSIS REPORT about what YOU discovered IN THE DATASET, not a summary of dashboards.

Return JSON:
{
  "title": "...",
  "overview": "...",
  "insights": ["...", "..."],
  "keyTakeaways": ["...", "..."]
}`;

        try {
            // Call AI for comprehensive analysis
            const response = await labIQAI.dataAnalysis.process(
                undefined, // No specific dataset
                prompt,
                'analysis',
                [],
                true // Use reasoning for better insights
            );

            // Parse AI response
            const content = response.content || '{}';
            const jsonMatch = content.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    title: parsed.title || `${datasetName} Analysis`,
                    overview: parsed.overview || this.generateFallbackOverview(dashboards, datasetName),
                    insights: parsed.insights || this.generateFallbackInsights(dashboards),
                    keyTakeaways: parsed.keyTakeaways || this.generateFallbackTakeaways(dashboards)
                };
            }

            // Fallback if parsing fails
            return this.generateFallbackAnalysis(dashboards, datasetName);
        } catch (error) {
            console.error('AI analysis error:', error);
            return this.generateFallbackAnalysis(dashboards, datasetName);
        }
    }

    /**
     * Select best charts for featured display
     */
    private selectBestCharts(dashboards: PinnedDashboard[]): DataOverview['featured_charts'] {
        const charts = dashboards.filter(d => d.type === 'chart');

        // Prioritize diverse chart types
        const selectedCharts: DataOverview['featured_charts'] = [];
        const chartTypesSeen = new Set<string>();

        // First pass: one of each type
        for (const chart of charts) {
            const chartType = chart.config?.chartType || 'bar';
            if (!chartTypesSeen.has(chartType) && selectedCharts.length < 4) {
                selectedCharts.push({
                    id: chart.id,
                    title: chart.title,
                    type: chartType as any,
                    data: chart.data,
                    description: chart.description || ''
                });
                chartTypesSeen.add(chartType);
            }
        }

        // Second pass: fill remaining slots with most interesting charts
        for (const chart of charts) {
            if (selectedCharts.length >= 4) break;
            if (!selectedCharts.find(c => c.id === chart.id)) {
                selectedCharts.push({
                    id: chart.id,
                    title: chart.title,
                    type: (chart.config?.chartType as any) || 'bar',
                    data: chart.data,
                    description: chart.description || ''
                });
            }
        }

        return selectedCharts;
    }

    /**
     * Extract key metrics for summary
     */
    private extractMetrics(dashboards: PinnedDashboard[]): DataOverview['metrics_summary'] {
        const metrics = dashboards
            .filter(d => d.type === 'metric')
            .slice(0, 4)
            .map(m => ({
                label: m.title,
                value: m.data.value || 0,
                trend: m.data.trend
            }));

        return metrics;
    }

    /**
     * Extract dataset name from dashboards
     */
    private extractDatasetName(dashboards: PinnedDashboard[]): string {
        // Try to get from metadata
        for (const dashboard of dashboards) {
            if (dashboard.data.metadata?.dataset_name) {
                return dashboard.data.metadata.dataset_name;
            }
        }

        // Try from tags
        const datasetTags = dashboards
            .flatMap(d => d.tags)
            .filter(tag => !['ai-generated', 'auto-pinned'].includes(tag));

        if (datasetTags.length > 0) {
            return datasetTags[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }

        return 'Health Data';
    }

    /**
     * Select theme color based on data type
     */
    private selectThemeColor(dashboards: PinnedDashboard[]): string {
        const categories = dashboards.map(d => d.category);

        if (categories.includes('ai_insights')) return '#10b981'; // Green
        if (categories.includes('experiments')) return '#8b5cf6'; // Purple
        if (categories.includes('models')) return '#3b82f6'; // Blue
        if (categories.includes('quality')) return '#f59e0b'; // Orange

        return '#10b981'; // Default green
    }

    /**
     * Summarize dashboard data for AI
     */
    private summarizeDashboardData(dashboard: PinnedDashboard): string {
        const { data, type } = dashboard;

        if (type === 'metric') {
            return `Value: ${data.value}${data.unit || ''}, Trend: ${data.trend || 'stable'}`;
        }

        if (type === 'chart') {
            const pointCount = data.labels?.length || 0;
            return `${pointCount} data points, Type: ${dashboard.config?.chartType || 'unknown'}`;
        }

        if (type === 'insight') {
            const keyPointsCount = data.keyPoints?.length || 0;
            return `${keyPointsCount} key findings, ${data.recommendations?.length || 0} recommendations`;
        }

        if (type === 'table') {
            return `${data.rows?.length || 0} rows, ${data.columns?.length || 0} columns`;
        }

        return 'Data available';
    }

    /**
     * Fallback analysis when AI fails
     */
    private generateFallbackAnalysis(dashboards: PinnedDashboard[], datasetName: string) {
        return {
            title: `${datasetName} Comprehensive Analysis`,
            overview: this.generateFallbackOverview(dashboards, datasetName),
            insights: this.generateFallbackInsights(dashboards),
            keyTakeaways: this.generateFallbackTakeaways(dashboards)
        };
    }

    private generateFallbackOverview(dashboards: PinnedDashboard[], datasetName: string): string {
        const types = new Set(dashboards.map(d => d.type));
        const sources = new Set(dashboards.map(d => d.source));

        return `This comprehensive analysis of ${datasetName} includes ${dashboards.length} insights across ${types.size} visualization types. The data has been analyzed using ${sources.has('ai_assistant') ? 'AI-powered analytics' : 'multiple analytical methods'}, revealing patterns and trends that inform data-driven decision making. Key findings span ${Array.from(types).join(', ')} visualizations, providing a holistic view of the dataset.`;
    }

    private generateFallbackInsights(dashboards: PinnedDashboard[]): string[] {
        const insights: string[] = [];

        const charts = dashboards.filter(d => d.type === 'chart');
        if (charts.length > 0) {
            insights.push(`${charts.length} visual representations highlight key data trends and distributions`);
        }

        const metrics = dashboards.filter(d => d.type === 'metric');
        if (metrics.length > 0) {
            insights.push(`${metrics.length} critical metrics tracked for performance monitoring`);
        }

        const aiInsights = dashboards.filter(d => d.source === 'ai_assistant');
        if (aiInsights.length > 0) {
            insights.push(`${aiInsights.length} AI-generated insights provide advanced pattern recognition`);
        }

        insights.push(`Data analysis completed on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
        insights.push(`Multiple data dimensions analyzed for comprehensive understanding`);

        return insights;
    }

    private generateFallbackTakeaways(dashboards: PinnedDashboard[]): string[] {
        const takeaways: string[] = [];

        // Try to extract recommendations from insights
        dashboards.forEach(d => {
            if (d.type === 'insight' && d.data.recommendations && d.data.recommendations.length > 0) {
                takeaways.push(...d.data.recommendations.slice(0, 2));
            }
        });

        if (takeaways.length >= 3) {
            return takeaways.slice(0, 5);
        }

        // Generic but actionable fallbacks
        return [
            `Implement continuous monitoring based on the ${dashboards.length} identified data points`,
            'Prioritize interventions targeting the highest-impact findings revealed in this analysis',
            'Establish baseline metrics from current findings to track future improvements',
            'Consider deeper investigation into correlations identified during this analysis'
        ];
    }
}

export const overviewService = OverviewService.getInstance();
