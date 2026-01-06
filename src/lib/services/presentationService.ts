/**
 * Presentation Service - AI-Powered Data Insights Presentation Generator
 * Generates beautiful, editable presentations from dashboard data
 */

import { supabase } from '@/integrations/supabase/client';
import { PinnedDashboard } from './dashboardService';

// =============================================================================
// TYPES
// =============================================================================

export type PresentationTheme = 'professional' | 'modern' | 'minimal' | 'dark' | 'vibrant';
export type PresentationTemplate = 'executive' | 'technical' | 'progress' | 'comparative' | 'custom';
export type SlideLayout = 'title' | 'content' | 'two-column' | 'chart-full' | 'metrics' | 'insight';

export interface PresentationThemeConfig {
    id: PresentationTheme;
    name: string;
    description: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
        textMuted: string;
        headerBg: string;
        cardBg: string;
    };
    fonts: {
        heading: string;
        body: string;
    };
}

export interface SlideContent {
    layout: SlideLayout;
    title?: string;
    subtitle?: string;
    content?: string;
    bullets?: string[];
    chart?: {
        type: 'line' | 'bar' | 'pie' | 'area' | 'donut';
        data: {
            labels: string[];
            datasets: Array<{
                label: string;
                data: number[];
                color?: string;
            }>;
        };
    };
    metrics?: Array<{
        label: string;
        value: string | number;
        unit?: string;
        icon?: string;
    }>;
    insight?: {
        summary: string;
        keyPoints: string[];
    };
}

export interface Slide {
    id: string;
    order: number;
    layout: SlideLayout;
    content: SlideContent;
    notes?: string;
}

export interface Presentation {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    template_type: PresentationTemplate;
    theme: PresentationTheme;
    slides: Slide[];
    dashboard_ids: string[];
    metadata: {
        generated_at: string;
        dashboard_count: number;
        slide_count: number;
        ai_generated: boolean;
        auto_selected?: boolean;
        dataset_id?: string;
    };
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface GeneratePresentationOptions {
    dashboardIds?: string[]; // Now optional - AI can auto-select
    datasetId?: string; // For AI context analysis
    template?: PresentationTemplate;
    theme?: PresentationTheme;
    title?: string;
    includeInsights?: boolean;
    tone?: 'formal' | 'casual' | 'technical';
}

// =============================================================================
// THEME CONFIGURATIONS
// =============================================================================

export const PRESENTATION_THEMES: Record<PresentationTheme, PresentationThemeConfig> = {
    professional: {
        id: 'professional',
        name: 'Professional',
        description: 'Classic business presentation style',
        colors: {
            primary: '#1e40af',
            secondary: '#3b82f6',
            accent: '#60a5fa',
            background: '#ffffff',
            text: '#1f2937',
            textMuted: '#6b7280',
            headerBg: '#1e40af',
            cardBg: '#f9fafb'
        },
        fonts: {
            heading: 'Inter',
            body: 'Inter'
        }
    },
    modern: {
        id: 'modern',
        name: 'Modern',
        description: 'Vibrant gradients and bold colors - inspired by your vision',
        colors: {
            primary: '#10b981',
            secondary: '#34d399',
            accent: '#6ee7b7',
            background: '#ffffff',
            text: '#111827',
            textMuted: '#4b5563',
            headerBg: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
            cardBg: '#ecfdf5'
        },
        fonts: {
            heading: 'Inter',
            body: 'Inter'
        }
    },
    minimal: {
        id: 'minimal',
        name: 'Minimal',
        description: 'Clean and focused design',
        colors: {
            primary: '#000000',
            secondary: '#374151',
            accent: '#9ca3af',
            background: '#ffffff',
            text: '#111827',
            textMuted: '#6b7280',
            headerBg: '#f3f4f6',
            cardBg: '#fafafa'
        },
        fonts: {
            heading: 'Inter',
            body: 'Inter'
        }
    },
    dark: {
        id: 'dark',
        name: 'Dark',
        description: 'Elegant dark mode presentation',
        colors: {
            primary: '#3b82f6',
            secondary: '#60a5fa',
            accent: '#93c5fd',
            background: '#0f172a',
            text: '#f1f5f9',
            textMuted: '#cbd5e1',
            headerBg: '#1e293b',
            cardBg: '#1e293b'
        },
        fonts: {
            heading: 'Inter',
            body: 'Inter'
        }
    },
    vibrant: {
        id: 'vibrant',
        name: 'Vibrant',
        description: 'Bold and energetic colors',
        colors: {
            primary: '#8b5cf6',
            secondary: '#a78bfa',
            accent: '#c4b5fd',
            background: '#ffffff',
            text: '#1f2937',
            textMuted: '#6b7280',
            headerBg: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
            cardBg: '#faf5ff'
        },
        fonts: {
            heading: 'Inter',
            body: 'Inter'
        }
    }
};

// =============================================================================
// PRESENTATION SERVICE CLASS
// =============================================================================

class PresentationService {
    private static instance: PresentationService;

    private constructor() { }

    public static getInstance(): PresentationService {
        if (!PresentationService.instance) {
            PresentationService.instance = new PresentationService();
        }
        return PresentationService.instance;
    }

    /**
     * AI-Driven: Automatically select dashboards based on context
     */
    async selectDashboardsFromContext(
        datasetId?: string,
        userId?: string,
        options?: {
            limit?: number;
            minScore?: number;
        }
    ): Promise<string[]> {
        try {
            // Get all user's dashboards
            const query = supabase
                .from('pinned_dashboards')
                .select('*')
                .order('created_at', { ascending: false });

            if (userId) {
                query.eq('user_id', userId);
            }

            const { data, error } = await query;

            if (error || !data) {
                console.error('Error fetching dashboards for context selection:', error);
                return [];
            }

            const dashboards = data as PinnedDashboard[];

            // Score each dashboard based on relevance
            const scoredDashboards = dashboards.map(dashboard => ({
                id: dashboard.id,
                score: this.calculateRelevanceScore(dashboard, datasetId)
            }));

            // Filter by minimum score and limit
            const minScore = options?.minScore || 0.3;
            const limit = options?.limit || 10;

            const selectedIds = scoredDashboards
                .filter(d => d.score >= minScore)
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map(d => d.id);

            console.log(`AI selected ${selectedIds.length} dashboards with relevance > ${minScore}`);
            return selectedIds;
        } catch (error) {
            console.error('Error in AI dashboard selection:', error);
            return [];
        }
    }

    /**
     * Calculate relevance score for a dashboard based on context
     */
    private calculateRelevanceScore(dashboard: PinnedDashboard, datasetId?: string): number {
        let score = 0;

        // 1. Dataset match (40% weight)
        if (datasetId && dashboard.metadata?.dataset_id === datasetId) {
            score += 0.4;
        }

        // 2. Source priority (25% weight)
        const sourceWeights: Record<string, number> = {
            'ai_insights': 0.25,
            'dataset_analysis': 0.20,
            'experiments': 0.15,
            'workflows': 0.10,
            'models': 0.10,
            'manual': 0.05
        };
        score += sourceWeights[dashboard.source] || 0.05;

        // 3. Recency (20% weight) - dashboards from last 7 days get full points
        const daysSinceCreation = (Date.now() - new Date(dashboard.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(0, 1 - (daysSinceCreation / 7));
        score += recencyScore * 0.2;

        // 4. Category relevance (10% weight) - prioritize insights and analysis
        const categoryWeights: Record<string, number> = {
            'ai_insights': 0.10,
            'analysis': 0.08,
            'quality': 0.06,
            'experiments': 0.05,
            'general': 0.03
        };
        score += categoryWeights[dashboard.category] || 0.02;

        // 5. Favorite bonus (5% weight)
        if (dashboard.is_favorite) {
            score += 0.05;
        }

        return Math.min(1, score);
    }

    /**
     * Generate a presentation from selected dashboards (with AI auto-selection support)
     */
    async generatePresentation(options: GeneratePresentationOptions): Promise<Presentation | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('User not authenticated');
                return null;
            }

            // AI-Driven: Auto-select dashboards if not provided
            let dashboardIds = options.dashboardIds;
            if (!dashboardIds || dashboardIds.length === 0) {
                console.log('Auto-selecting dashboards from context...');
                dashboardIds = await this.selectDashboardsFromContext(
                    options.datasetId,
                    user.id,
                    { limit: 12, minScore: 0.3 }
                );
            }

            if (dashboardIds.length === 0) {
                console.error('No dashboards found or selected');
                return null;
            }

            // Fetch dashboard data
            const dashboards = await this.fetchDashboards(dashboardIds);
            if (dashboards.length === 0) {
                console.error('No dashboards found');
                return null;
            }

            // Generate slides based on template
            const slides = await this.generateSlides(
                dashboards,
                options.template || 'executive',
                options.includeInsights !== false
            );

            // Create presentation object
            const presentation: Omit<Presentation, 'id' | 'created_at' | 'updated_at'> = {
                user_id: user.id,
                title: options.title || this.generateTitle(dashboards),
                description: `AI-generated presentation from ${dashboards.length} dashboard${dashboards.length > 1 ? 's' : ''}`,
                template_type: options.template || 'executive',
                theme: options.theme || 'modern',
                slides,
                dashboard_ids: dashboardIds,
                metadata: {
                    generated_at: new Date().toISOString(),
                    dashboard_count: dashboards.length,
                    slide_count: slides.length,
                    ai_generated: true,
                    auto_selected: !options.dashboardIds || options.dashboardIds.length === 0,
                    dataset_id: options.datasetId
                },
                is_public: false
            };

            // Save to database
            const { data, error } = await supabase
                .from('presentations')
                .insert(presentation)
                .select()
                .single();

            if (error) {
                console.error('Error saving presentation:', error);
                return null;
            }

            return data as Presentation;
        } catch (error) {
            console.error('Error generating presentation:', error);
            return null;
        }
    }

    /**
     * Fetch dashboards by IDs
     */
    private async fetchDashboards(ids: string[]): Promise<PinnedDashboard[]> {
        const { data, error } = await supabase
            .from('pinned_dashboards')
            .select('*')
            .in('id', ids);

        if (error) {
            console.error('Error fetching dashboards:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Generate slides from dashboard data
     */
    private async generateSlides(
        dashboards: PinnedDashboard[],
        template: PresentationTemplate,
        includeInsights: boolean
    ): Promise<Slide[]> {
        const slides: Slide[] = [];
        let order = 0;

        // Title Slide
        slides.push({
            id: `slide-${order}`,
            order: order++,
            layout: 'title',
            content: {
                layout: 'title',
                title: this.generateTitle(dashboards),
                subtitle: `Data Insights Report • ${new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}`
            }
        });

        // Overview Slide with Key Metrics
        const metrics = this.extractMetrics(dashboards);
        if (metrics.length > 0) {
            slides.push({
                id: `slide-${order}`,
                order: order++,
                layout: 'metrics',
                content: {
                    layout: 'metrics',
                    title: 'Key Metrics Overview',
                    metrics
                }
            });
        }

        // Generate slides for each dashboard
        for (const dashboard of dashboards) {
            const dashboardSlides = this.createDashboardSlides(dashboard, order);
            slides.push(...dashboardSlides);
            order += dashboardSlides.length;
        }

        // AI-Generated Insights Slide (if enabled)
        if (includeInsights) {
            const insights = await this.generateAIInsights(dashboards);
            slides.push({
                id: `slide-${order}`,
                order: order++,
                layout: 'insight',
                content: {
                    layout: 'insight',
                    title: 'Key Insights',
                    insight: insights
                }
            });
        }

        // Summary/Conclusion Slide
        slides.push({
            id: `slide-${order}`,
            order: order++,
            layout: 'content',
            content: {
                layout: 'content',
                title: 'Summary',
                bullets: this.generateSummaryPoints(dashboards)
            }
        });

        return slides;
    }

    /**
     * Create slides for a single dashboard
     */
    private createDashboardSlides(dashboard: PinnedDashboard, startOrder: number): Slide[] {
        const slides: Slide[] = [];

        switch (dashboard.type) {
            case 'chart':
                slides.push({
                    id: `slide-${startOrder}`,
                    order: startOrder,
                    layout: 'chart-full',
                    content: {
                        layout: 'chart-full',
                        title: dashboard.title,
                        subtitle: dashboard.description,
                        chart: {
                            type: dashboard.config?.chartType || 'bar',
                            data: {
                                labels: dashboard.data.labels || [],
                                datasets: dashboard.data.datasets || []
                            }
                        }
                    }
                });
                break;

            case 'metric':
                // Metrics are included in overview, no separate slide
                break;

            case 'table':
                slides.push({
                    id: `slide-${startOrder}`,
                    order: startOrder,
                    layout: 'content',
                    content: {
                        layout: 'content',
                        title: dashboard.title,
                        subtitle: dashboard.description,
                        content: this.tableToText(dashboard.data)
                    }
                });
                break;

            case 'insight':
                slides.push({
                    id: `slide-${startOrder}`,
                    order: startOrder,
                    layout: 'insight',
                    content: {
                        layout: 'insight',
                        title: dashboard.title,
                        insight: {
                            summary: dashboard.data.summary || '',
                            keyPoints: dashboard.data.keyPoints || []
                        }
                    }
                });
                break;
        }

        return slides;
    }

    /**
     * Extract metrics from dashboards
     */
    private extractMetrics(dashboards: PinnedDashboard[]): SlideContent['metrics'] {
        const metrics: SlideContent['metrics'] = [];

        dashboards
            .filter(d => d.type === 'metric')
            .forEach(d => {
                metrics.push({
                    label: d.title,
                    value: d.data.value || 0,
                    unit: d.data.unit,
                    icon: this.getMetricIcon(d.category)
                });
            });

        return metrics.slice(0, 4); // Max 4 metrics per slide
    }

    /**
     * Get icon for metric category
     */
    private getMetricIcon(category: string): string {
        const iconMap: Record<string, string> = {
            experiments: '🧪',
            models: '🤖',
            workflows: '⚡',
            quality: '✨',
            general: '📊'
        };
        return iconMap[category] || '📊';
    }

    /**
     * Generate AI insights from dashboard data
     */
    private async generateAIInsights(dashboards: PinnedDashboard[]): Promise<{ summary: string; keyPoints: string[] }> {
        // TODO: Integrate with LabIQAI service for real AI analysis
        // For now, generate basic insights

        const insights: string[] = [];

        // Analyze trends
        const chartDashboards = dashboards.filter(d => d.type === 'chart');
        if (chartDashboards.length > 0) {
            insights.push(`Analysis includes ${chartDashboards.length} visualizations across different data dimensions`);
        }

        // Analyze sources
        const sources = [...new Set(dashboards.map(d => d.source))];
        insights.push(`Data aggregated from ${sources.length} source${sources.length > 1 ? 's' : ''}: ${sources.join(', ').replace(/_/g, ' ')}`);

        // Analyze categories
        const categories = [...new Set(dashboards.map(d => d.category))];
        insights.push(`Covers ${categories.length} key area${categories.length > 1 ? 's' : ''} of analysis`);

        return {
            summary: `This report provides a comprehensive analysis of ${dashboards.length} key insights from your health data analysis.`,
            keyPoints: insights
        };
    }

    /**
     * Generate summary points
     */
    private generateSummaryPoints(dashboards: PinnedDashboard[]): string[] {
        return [
            `Analyzed ${dashboards.length} dashboard${dashboards.length > 1 ? 's' : ''} across multiple data sources`,
            `Identified key trends and patterns in health data`,
            `Generated actionable insights for decision-making`,
            `Ready for stakeholder presentation and discussion`
        ];
    }

    /**
     * Generate title from dashboards
     */
    private generateTitle(dashboards: PinnedDashboard[]): string {
        const categories = [...new Set(dashboards.map(d => d.category))];
        if (categories.length === 1) {
            return `${categories[0].replace(/_/g, ' ')} Analysis Report`.replace(/\b\w/g, l => l.toUpperCase());
        }
        return 'Health Data Insights Report';
    }

    /**
     * Convert table data to text
     */
    private tableToText(data: any): string {
        if (!data.rows || data.rows.length === 0) return 'No data available';
        return `Table with ${data.rows.length} rows and ${data.columns?.length || 0} columns`;
    }

    /**
     * Get user presentations
     */
    async getPresentations(): Promise<Presentation[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('presentations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching presentations:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Get single presentation
     */
    async getPresentation(id: string): Promise<Presentation | null> {
        const { data, error } = await supabase
            .from('presentations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching presentation:', error);
            return null;
        }

        return data;
    }

    /**
       * Update presentation
       */
    async updatePresentation(id: string, updates: Partial<Presentation>): Promise<Presentation | null> {
        const { data, error } = await supabase
            .from('presentations')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating presentation:', error);
            return null;
        }

        return data;
    }

    /**
     * Delete presentation
     */
    async deletePresentation(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('presentations')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting presentation:', error);
            return false;
        }

        return true;
    }
}

export const presentationService = PresentationService.getInstance();
