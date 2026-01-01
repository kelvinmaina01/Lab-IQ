/**
 * Insights AI Service
 * Production-grade AI-powered insight generation with thought process explanation
 *
 * This service:
 * - Analyzes challenge solutions and data exploration
 * - Generates insights with detailed thought process (Chain of Thought)
 * - Creates visualization configurations for each insight
 * - Supports sharing and dashboard aggregation
 * - Enables report generation
 */

import { supabase } from '@/integrations/supabase/client';
import { eventBus, EventTypes, AIInsightPayload } from '@/lib/events';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ThoughtStep {
  step_number: number;
  thought: string;
  reasoning: string;
  data_examined?: string;
  confidence: number; // 0-1
}

export interface VisualizationConfig {
  chart_type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'histogram' | 'box' | 'area' | 'treemap' | 'radar';
  title: string;
  x_axis?: { field: string; label: string };
  y_axis?: { field: string; label: string };
  color_field?: string;
  data: any[];
  config?: {
    colors?: string[];
    show_legend?: boolean;
    show_labels?: boolean;
    stacked?: boolean;
    animated?: boolean;
  };
}

export interface Insight {
  id: string;
  user_id: string;
  challenge_id?: string;
  dataset_id?: string;

  // Core insight data
  title: string;
  summary: string;
  detailed_explanation: string;

  // AI thought process
  thought_process: ThoughtStep[];
  methodology: string;
  assumptions: string[];
  limitations: string[];

  // Visualization
  visualization: VisualizationConfig;
  supporting_visualizations?: VisualizationConfig[];

  // Metrics
  confidence_score: number;
  impact_score: 'low' | 'medium' | 'high' | 'critical';
  data_quality_score: number;

  // Metadata
  tags: string[];
  category: 'trend' | 'anomaly' | 'correlation' | 'distribution' | 'comparison' | 'prediction' | 'recommendation';
  created_at: string;
  updated_at: string;

  // Sharing
  is_public: boolean;
  share_token?: string;
  views_count: number;
  likes_count: number;
}

export interface InsightGenerationRequest {
  dataset: any;
  challenge_context?: {
    mode: 'forensic' | 'reverse' | 'racer';
    challenge_id: string;
    user_solution: string;
    accuracy_score: number;
  };
  focus_areas?: string[]; // Specific columns or metrics to analyze
  depth: 'quick' | 'standard' | 'deep';
}

export interface InsightGenerationResult {
  insights: Insight[];
  summary: string;
  generation_time_ms: number;
  tokens_used?: number;
}

// ============================================================================
// INSIGHTS AI CLASS
// ============================================================================

export class InsightsAI {
  private apiKey: string;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Gemini API key not configured for InsightsAI');
    }
  }

  /**
   * Generate insights from data with full thought process
   */
  async generateInsights(request: InsightGenerationRequest): Promise<InsightGenerationResult> {
    const startTime = performance.now();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Step 1: Analyze dataset structure
      const datasetAnalysis = this.analyzeDataset(request.dataset);

      // Step 2: Determine insight count based on depth
      const insightCount = request.depth === 'quick' ? 2 : request.depth === 'standard' ? 4 : 6;

      // Step 3: Generate insights with AI
      const insights = await this.generateInsightsWithAI(
        datasetAnalysis,
        request,
        insightCount,
        user.id
      );

      // Step 4: Generate visualizations for each insight
      const insightsWithViz = await this.generateVisualizations(insights, request.dataset.data);

      // Step 5: Save insights to database
      await this.saveInsights(insightsWithViz, user.id);

      const generationTime = performance.now() - startTime;

      // Emit AI_INSIGHT_GENERATED event for each insight
      insightsWithViz.forEach(insight => {
        eventBus.emit<AIInsightPayload>(
          EventTypes.AI_INSIGHT_GENERATED,
          {
            insightId: insight.id,
            title: insight.title,
            insightType: insight.category,
            confidence: insight.confidence_score,
            datasetId: request.dataset?.id,
            summary: insight.summary,
          },
          {
            source: 'insightsAI',
            userId: user.id,
            metadata: {
              generationTime: Math.round(generationTime),
              depth: request.depth,
            },
          }
        );
      });

      return {
        insights: insightsWithViz,
        summary: this.generateSummary(insightsWithViz),
        generation_time_ms: Math.round(generationTime),
      };
    } catch (error) {
      console.error('Error generating insights:', error);
      throw new Error(`Failed to generate insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze dataset structure
   */
  private analyzeDataset(dataset: any): any {
    const data = dataset.data || [];
    if (data.length === 0) return { empty: true };

    const columns = Object.keys(data[0]);
    const analysis: any = {
      row_count: data.length,
      columns: {},
      correlations: [],
      distributions: {},
    };

    for (const col of columns) {
      const values = data.map((row: any) => row[col]).filter((v: any) => v != null);
      const sample = values[0];

      if (typeof sample === 'number') {
        const numericValues = values.filter((v: any) => typeof v === 'number');
        const mean = numericValues.reduce((a: number, b: number) => a + b, 0) / numericValues.length;
        const sortedVals = [...numericValues].sort((a, b) => a - b);
        const median = sortedVals[Math.floor(sortedVals.length / 2)];
        const stdDev = Math.sqrt(
          numericValues.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) / numericValues.length
        );

        analysis.columns[col] = {
          type: 'numeric',
          mean,
          median,
          stdDev,
          min: sortedVals[0],
          max: sortedVals[sortedVals.length - 1],
          unique_count: new Set(values).size,
        };
      } else {
        const uniqueValues = [...new Set(values)];
        analysis.columns[col] = {
          type: 'categorical',
          unique_count: uniqueValues.length,
          top_values: this.getTopValues(values, 5),
        };
      }
    }

    return analysis;
  }

  /**
   * Get top N most frequent values
   */
  private getTopValues(values: any[], n: number): { value: any; count: number }[] {
    const counts = new Map<any, number>();
    values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([value, count]) => ({ value, count }));
  }

  /**
   * Generate insights using Gemini AI with Chain of Thought
   */
  private async generateInsightsWithAI(
    analysis: any,
    request: InsightGenerationRequest,
    count: number,
    userId: string
  ): Promise<Partial<Insight>[]> {
    const contextInfo = request.challenge_context
      ? `
CHALLENGE CONTEXT:
- Mode: ${request.challenge_context.mode}
- User's accuracy: ${(request.challenge_context.accuracy_score * 100).toFixed(1)}%
- User's solution approach: ${request.challenge_context.user_solution.substring(0, 500)}
`
      : '';

    const prompt = `You are a senior data analyst at Google. Generate ${count} deep, actionable insights from this dataset.

DATASET ANALYSIS:
${JSON.stringify(analysis, null, 2)}

${contextInfo}

FOCUS AREAS: ${request.focus_areas?.join(', ') || 'General analysis'}
ANALYSIS DEPTH: ${request.depth}

For EACH insight, you MUST provide:

1. **Chain of Thought Process**: Show your complete reasoning step-by-step
   - What data did you examine?
   - What patterns did you notice?
   - How did you validate this finding?
   - What could this mean for the business/research?

2. **Insight Details**:
   - Clear, actionable title
   - Executive summary (1-2 sentences)
   - Detailed explanation with evidence
   - Confidence score (0-1) with justification
   - Impact assessment
   - Assumptions and limitations

3. **Visualization Recommendation**:
   - Best chart type for this insight
   - Specific fields to use
   - Why this visualization tells the story

RETURN JSON:
{
  "insights": [
    {
      "title": "Clear, actionable insight title",
      "summary": "1-2 sentence executive summary",
      "detailed_explanation": "Comprehensive explanation with specific data points and evidence",
      "thought_process": [
        {
          "step_number": 1,
          "thought": "First, I examined the distribution of X...",
          "reasoning": "This is important because...",
          "data_examined": "Column X: mean=100, std=15",
          "confidence": 0.9
        },
        {
          "step_number": 2,
          "thought": "Then I noticed a pattern...",
          "reasoning": "This suggests that...",
          "data_examined": "Correlation between X and Y",
          "confidence": 0.85
        }
      ],
      "methodology": "Statistical analysis using mean comparison and trend detection",
      "assumptions": ["Data is representative", "No significant outliers skewing results"],
      "limitations": ["Sample size consideration", "Time period constraints"],
      "confidence_score": 0.87,
      "impact_score": "high",
      "data_quality_score": 0.92,
      "category": "trend|anomaly|correlation|distribution|comparison|prediction|recommendation",
      "tags": ["relevant", "tags"],
      "visualization_recommendation": {
        "chart_type": "bar|line|pie|scatter|heatmap|histogram|box|area",
        "title": "Chart title",
        "x_axis": {"field": "column_name", "label": "Display Label"},
        "y_axis": {"field": "column_name", "label": "Display Label"},
        "reasoning": "Why this visualization is best"
      }
    }
  ],
  "overall_data_story": "Brief narrative connecting all insights"
}

IMPORTANT:
- Each insight MUST have 3-5 thought process steps showing your reasoning
- Be specific with data points and evidence
- Explain WHY each finding matters
- Consider business/research implications
- Return ONLY valid JSON`;

    try {
      const response = await this.callGeminiAPI(prompt);
      const parsed = JSON.parse(this.cleanJSONResponse(response));

      // Transform AI response to Insight format
      return parsed.insights.map((insight: any) => ({
        id: crypto.randomUUID(),
        user_id: userId,
        challenge_id: request.challenge_context?.challenge_id,
        dataset_id: request.dataset?.id,
        title: insight.title,
        summary: insight.summary,
        detailed_explanation: insight.detailed_explanation,
        thought_process: insight.thought_process,
        methodology: insight.methodology,
        assumptions: insight.assumptions,
        limitations: insight.limitations,
        confidence_score: insight.confidence_score,
        impact_score: insight.impact_score,
        data_quality_score: insight.data_quality_score,
        category: insight.category,
        tags: insight.tags,
        visualization_recommendation: insight.visualization_recommendation,
        is_public: false,
        views_count: 0,
        likes_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('AI insight generation failed:', error);
      return this.generateFallbackInsights(analysis, count, userId);
    }
  }

  /**
   * Generate visualization data for each insight
   */
  private async generateVisualizations(
    insights: Partial<Insight>[],
    data: any[]
  ): Promise<Insight[]> {
    return insights.map(insight => {
      const vizRec = (insight as any).visualization_recommendation;

      // Generate actual visualization config based on recommendation
      const visualization = this.createVisualizationFromData(
        vizRec?.chart_type || 'bar',
        vizRec?.title || insight.title || 'Visualization',
        vizRec?.x_axis?.field,
        vizRec?.y_axis?.field,
        data
      );

      return {
        ...insight,
        visualization,
      } as Insight;
    });
  }

  /**
   * Create visualization configuration from actual data
   */
  private createVisualizationFromData(
    chartType: string,
    title: string,
    xField?: string,
    yField?: string,
    data?: any[]
  ): VisualizationConfig {
    if (!data || data.length === 0) {
      return {
        chart_type: chartType as any,
        title,
        data: [],
      };
    }

    const columns = Object.keys(data[0]);
    const actualXField = xField && columns.includes(xField) ? xField : columns[0];
    const numericColumns = columns.filter(col => typeof data[0][col] === 'number');
    const actualYField = yField && columns.includes(yField) ? yField : numericColumns[0] || columns[1];

    // Aggregate data for visualization
    let vizData: any[] = [];

    if (chartType === 'bar' || chartType === 'pie') {
      // Group and aggregate
      const groups = new Map<string, number>();
      data.forEach(row => {
        const key = String(row[actualXField]);
        const val = typeof row[actualYField] === 'number' ? row[actualYField] : 1;
        groups.set(key, (groups.get(key) || 0) + val);
      });
      vizData = Array.from(groups.entries())
        .slice(0, 10)
        .map(([label, value]) => ({ label, value }));
    } else if (chartType === 'line' || chartType === 'area') {
      // Time series or sequential
      vizData = data.slice(0, 50).map((row, idx) => ({
        x: row[actualXField] || idx,
        y: row[actualYField] || 0,
      }));
    } else if (chartType === 'scatter') {
      vizData = data.slice(0, 100).map(row => ({
        x: row[actualXField] || 0,
        y: row[actualYField] || 0,
      }));
    } else if (chartType === 'histogram') {
      // Create bins
      const values = data.map(row => row[actualYField]).filter(v => typeof v === 'number');
      const bins = this.createHistogramBins(values, 10);
      vizData = bins;
    } else {
      // Default to simple aggregation
      vizData = data.slice(0, 20).map(row => ({
        label: row[actualXField],
        value: row[actualYField],
      }));
    }

    return {
      chart_type: chartType as any,
      title,
      x_axis: { field: actualXField, label: this.formatLabel(actualXField) },
      y_axis: { field: actualYField, label: this.formatLabel(actualYField) },
      data: vizData,
      config: {
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
        show_legend: true,
        show_labels: true,
        animated: true,
      },
    };
  }

  /**
   * Create histogram bins
   */
  private createHistogramBins(values: number[], binCount: number): any[] {
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / binCount;

    const bins = Array(binCount).fill(0).map((_, i) => ({
      bin: `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`,
      count: 0,
    }));

    values.forEach(val => {
      const binIdx = Math.min(Math.floor((val - min) / binWidth), binCount - 1);
      bins[binIdx].count++;
    });

    return bins;
  }

  /**
   * Format column name to label
   */
  private formatLabel(field: string): string {
    return field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  /**
   * Save insights to database
   */
  private async saveInsights(insights: Insight[], userId: string): Promise<void> {
    try {
      const records = insights.map(insight => ({
        id: insight.id,
        user_id: userId,
        challenge_id: insight.challenge_id,
        dataset_id: insight.dataset_id,
        title: insight.title,
        summary: insight.summary,
        detailed_explanation: insight.detailed_explanation,
        thought_process: insight.thought_process,
        methodology: insight.methodology,
        assumptions: insight.assumptions,
        limitations: insight.limitations,
        visualization: insight.visualization,
        confidence_score: insight.confidence_score,
        impact_score: insight.impact_score,
        data_quality_score: insight.data_quality_score,
        category: insight.category,
        tags: insight.tags,
        is_public: insight.is_public,
        views_count: 0,
        likes_count: 0,
      }));

      const { error } = await supabase
        .from('analyst_insights')
        .insert(records);

      if (error) {
        console.warn('Failed to save insights to database:', error);
        // Don't throw - insights are still usable in memory
      }
    } catch (error) {
      console.warn('Error saving insights:', error);
    }
  }

  /**
   * Generate summary connecting all insights
   */
  private generateSummary(insights: Insight[]): string {
    if (insights.length === 0) return 'No insights generated.';

    const highImpact = insights.filter(i => i.impact_score === 'high' || i.impact_score === 'critical');
    const avgConfidence = insights.reduce((sum, i) => sum + i.confidence_score, 0) / insights.length;

    return `Generated ${insights.length} insights with ${(avgConfidence * 100).toFixed(0)}% average confidence. ` +
      `${highImpact.length} high-impact findings require attention. ` +
      `Key themes: ${[...new Set(insights.flatMap(i => i.tags))].slice(0, 5).join(', ')}.`;
  }

  /**
   * Get user's insights
   */
  async getUserInsights(userId: string, limit: number = 50): Promise<Insight[]> {
    const { data, error } = await supabase
      .from('analyst_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching insights:', error);
      return [];
    }

    return data as Insight[];
  }

  /**
   * Share an insight (make public and generate share link)
   */
  async shareInsight(insightId: string): Promise<{ share_url: string; share_token: string }> {
    const shareToken = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    const { error } = await supabase
      .from('analyst_insights')
      .update({
        is_public: true,
        share_token: shareToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', insightId);

    if (error) throw error;

    const shareUrl = `${window.location.origin}/insights/shared/${shareToken}`;
    return { share_url: shareUrl, share_token: shareToken };
  }

  /**
   * Get shared insight by token
   */
  async getSharedInsight(shareToken: string): Promise<Insight | null> {
    const { data, error } = await supabase
      .from('analyst_insights')
      .select('*')
      .eq('share_token', shareToken)
      .eq('is_public', true)
      .single();

    if (error || !data) return null;

    // Increment view count
    await supabase
      .from('analyst_insights')
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq('id', data.id);

    return data as Insight;
  }

  /**
   * Like an insight
   */
  async likeInsight(insightId: string): Promise<void> {
    const { data: insight } = await supabase
      .from('analyst_insights')
      .select('likes_count')
      .eq('id', insightId)
      .single();

    if (insight) {
      await supabase
        .from('analyst_insights')
        .update({ likes_count: (insight.likes_count || 0) + 1 })
        .eq('id', insightId);
    }
  }

  /**
   * Generate report from insights
   */
  async generateReport(
    insightIds: string[],
    format: 'pdf' | 'html' | 'markdown'
  ): Promise<{ content: string; filename: string }> {
    const { data: insights } = await supabase
      .from('analyst_insights')
      .select('*')
      .in('id', insightIds)
      .order('created_at', { ascending: true });

    if (!insights || insights.length === 0) {
      throw new Error('No insights found');
    }

    const content = this.formatReport(insights as Insight[], format);
    const filename = `insights_report_${new Date().toISOString().split('T')[0]}.${format === 'markdown' ? 'md' : format}`;

    return { content, filename };
  }

  /**
   * Format insights as report
   */
  private formatReport(insights: Insight[], format: 'pdf' | 'html' | 'markdown'): string {
    if (format === 'markdown') {
      return this.formatMarkdownReport(insights);
    } else if (format === 'html') {
      return this.formatHTMLReport(insights);
    }
    // PDF would require server-side generation
    return this.formatMarkdownReport(insights);
  }

  /**
   * Format as Markdown report
   */
  private formatMarkdownReport(insights: Insight[]): string {
    const now = new Date().toLocaleDateString();
    let md = `# Data Analysis Report\n\n`;
    md += `**Generated:** ${now}\n`;
    md += `**Total Insights:** ${insights.length}\n\n`;
    md += `---\n\n`;

    for (const insight of insights) {
      md += `## ${insight.title}\n\n`;
      md += `**Impact:** ${insight.impact_score} | **Confidence:** ${(insight.confidence_score * 100).toFixed(0)}%\n\n`;
      md += `### Summary\n${insight.summary}\n\n`;
      md += `### Detailed Analysis\n${insight.detailed_explanation}\n\n`;

      md += `### Thought Process\n`;
      for (const step of insight.thought_process) {
        md += `${step.step_number}. **${step.thought}**\n`;
        md += `   - Reasoning: ${step.reasoning}\n`;
        if (step.data_examined) md += `   - Data examined: ${step.data_examined}\n`;
        md += `\n`;
      }

      if (insight.assumptions.length > 0) {
        md += `### Assumptions\n`;
        insight.assumptions.forEach(a => md += `- ${a}\n`);
        md += `\n`;
      }

      if (insight.limitations.length > 0) {
        md += `### Limitations\n`;
        insight.limitations.forEach(l => md += `- ${l}\n`);
        md += `\n`;
      }

      md += `---\n\n`;
    }

    return md;
  }

  /**
   * Format as HTML report
   */
  private formatHTMLReport(insights: Insight[]): string {
    const now = new Date().toLocaleDateString();
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>Data Analysis Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #3B82F6; padding-bottom: 10px; }
    h2 { color: #3B82F6; margin-top: 30px; }
    .meta { color: #666; font-size: 0.9em; }
    .insight { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .impact-high, .impact-critical { color: #dc2626; font-weight: bold; }
    .impact-medium { color: #f59e0b; }
    .impact-low { color: #10b981; }
    .thought-step { background: white; padding: 10px; margin: 10px 0; border-left: 3px solid #3B82F6; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
<h1>Data Analysis Report</h1>
<p class="meta">Generated: ${now} | Insights: ${insights.length}</p>
`;

    for (const insight of insights) {
      html += `
<div class="insight">
  <h2>${insight.title}</h2>
  <p class="meta">
    Impact: <span class="impact-${insight.impact_score}">${insight.impact_score}</span> |
    Confidence: ${(insight.confidence_score * 100).toFixed(0)}%
  </p>
  <h3>Summary</h3>
  <p>${insight.summary}</p>
  <h3>Detailed Analysis</h3>
  <p>${insight.detailed_explanation}</p>
  <h3>Thought Process</h3>
`;
      for (const step of insight.thought_process) {
        html += `
  <div class="thought-step">
    <strong>${step.step_number}. ${step.thought}</strong>
    <p>${step.reasoning}</p>
    ${step.data_examined ? `<p><em>Data: ${step.data_examined}</em></p>` : ''}
  </div>`;
      }

      if (insight.assumptions.length > 0) {
        html += `<h3>Assumptions</h3><ul>${insight.assumptions.map(a => `<li>${a}</li>`).join('')}</ul>`;
      }
      if (insight.limitations.length > 0) {
        html += `<h3>Limitations</h3><ul>${insight.limitations.map(l => `<li>${l}</li>`).join('')}</ul>`;
      }

      html += `</div>`;
    }

    html += `</body></html>`;
    return html;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private cleanJSONResponse(response: string): string {
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/, '').replace(/```\n?$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/, '').replace(/```\n?$/, '');
    }
    return cleaned;
  }

  private generateFallbackInsights(analysis: any, count: number, userId: string): Partial<Insight>[] {
    const insights: Partial<Insight>[] = [];
    const columns = Object.keys(analysis.columns || {});

    for (let i = 0; i < Math.min(count, columns.length); i++) {
      const col = columns[i];
      const colData = analysis.columns[col];

      insights.push({
        id: crypto.randomUUID(),
        user_id: userId,
        title: `Analysis of ${this.formatLabel(col)}`,
        summary: colData.type === 'numeric'
          ? `The ${col} column has a mean of ${colData.mean?.toFixed(2)} with ${colData.unique_count} unique values.`
          : `The ${col} column has ${colData.unique_count} unique categories.`,
        detailed_explanation: `This column shows ${colData.type === 'numeric' ? 'numerical distribution' : 'categorical distribution'} patterns.`,
        thought_process: [
          {
            step_number: 1,
            thought: `Examined the ${col} column`,
            reasoning: 'Understanding data distribution is fundamental',
            data_examined: JSON.stringify(colData),
            confidence: 0.8,
          },
        ],
        methodology: 'Statistical analysis',
        assumptions: ['Data is representative'],
        limitations: ['Single column analysis'],
        confidence_score: 0.75,
        impact_score: 'medium',
        data_quality_score: 0.85,
        category: 'distribution',
        tags: [col, colData.type],
        is_public: false,
        views_count: 0,
        likes_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return insights;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let insightsAI: InsightsAI | null = null;

export function getInsightsAI(): InsightsAI {
  if (!insightsAI) {
    insightsAI = new InsightsAI();
  }
  return insightsAI;
}
