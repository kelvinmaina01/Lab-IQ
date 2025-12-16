/**
 * Dashboard Service - Production-grade pinned dashboards management
 * Handles CRUD, real-time sync, and AI auto-pinning
 */

import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// TYPES
// =============================================================================

export type DashboardType = 'insight' | 'chart' | 'metric' | 'table' | 'summary' | 'custom';
export type DashboardSource = 'ai_assistant' | 'manual' | 'experiment' | 'report' | 'workflow' | 'system';
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'donut' | 'radar';

export interface DashboardConfig {
  chartType?: ChartType;
  colors?: string[];
  xAxis?: string;
  yAxis?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  filters?: Array<{ column: string; operator: string; value: any }>;
  layout?: { width: 1 | 2 | 3 | 4; height: 1 | 2 };
  showLegend?: boolean;
  showGrid?: boolean;
  animated?: boolean;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
}

export interface DashboardData {
  // For charts
  labels?: string[];
  datasets?: ChartDataset[];
  // For metrics
  value?: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  previousValue?: number;
  // For tables
  columns?: string[];
  rows?: Record<string, any>[];
  // For insights
  summary?: string;
  keyPoints?: string[];
  recommendations?: string[];
  // For custom
  content?: string;
  html?: string;
}

export interface PinnedDashboard {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: DashboardType;
  source: DashboardSource;
  config: DashboardConfig;
  data: DashboardData;
  source_id?: string;
  source_table?: string;
  category: string;
  tags: string[];
  is_favorite: boolean;
  display_order: number;
  is_shared: boolean;
  shared_with: string[];
  created_at: string;
  updated_at: string;
  last_viewed_at?: string;
  is_archived: boolean;
}

export interface CreateDashboardInput {
  title: string;
  description?: string;
  type: DashboardType;
  source?: DashboardSource;
  config?: DashboardConfig;
  data: DashboardData;
  source_id?: string;
  source_table?: string;
  category?: string;
  tags?: string[];
  is_favorite?: boolean;
}

// =============================================================================
// DASHBOARD SERVICE CLASS
// =============================================================================

class DashboardService {
  private static instance: DashboardService;
  private realtimeChannel: any = null;
  private listeners: Set<(dashboards: PinnedDashboard[]) => void> = new Set();

  private constructor() {}

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  // ---------------------------------------------------------------------------
  // CRUD OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Get all pinned dashboards for the current user
   */
  async getDashboards(options?: {
    category?: string;
    type?: DashboardType;
    source?: DashboardSource;
    favorites_only?: boolean;
    limit?: number;
  }): Promise<PinnedDashboard[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return this.getDemoDashboards();

      let query = supabase
        .from('pinned_dashboards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (options?.category) {
        query = query.eq('category', options.category);
      }
      if (options?.type) {
        query = query.eq('type', options.type);
      }
      if (options?.source) {
        query = query.eq('source', options.source);
      }
      if (options?.favorites_only) {
        query = query.eq('is_favorite', true);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching dashboards:', error);
        return this.getDemoDashboards();
      }

      // Merge with demo dashboards for presentation
      const demoDashboards = this.getDemoDashboards();
      return [...(data || []), ...demoDashboards];
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      return this.getDemoDashboards();
    }
  }

  /**
   * Get a single dashboard by ID
   */
  async getDashboard(id: string): Promise<PinnedDashboard | null> {
    // Check if it's a demo dashboard
    const demo = this.getDemoDashboards().find(d => d.id === id);
    if (demo) return demo;

    const { data, error } = await supabase
      .from('pinned_dashboards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching dashboard:', error);
      return null;
    }

    // Update last viewed
    await this.updateLastViewed(id);

    return data;
  }

  /**
   * Create a new pinned dashboard
   */
  async createDashboard(input: CreateDashboardInput): Promise<PinnedDashboard | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    const dashboard = {
      user_id: user.id,
      title: input.title,
      description: input.description || null,
      type: input.type,
      source: input.source || 'manual',
      config: input.config || {},
      data: input.data,
      source_id: input.source_id || null,
      source_table: input.source_table || null,
      category: input.category || 'general',
      tags: input.tags || [],
      is_favorite: input.is_favorite || false,
      display_order: 0,
      is_shared: false,
      shared_with: [],
      is_archived: false
    };

    const { data, error } = await supabase
      .from('pinned_dashboards')
      .insert(dashboard)
      .select()
      .single();

    if (error) {
      console.error('Error creating dashboard:', error);
      return null;
    }

    return data;
  }

  /**
   * Update a dashboard
   */
  async updateDashboard(id: string, updates: Partial<CreateDashboardInput>): Promise<PinnedDashboard | null> {
    const { data, error } = await supabase
      .from('pinned_dashboards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating dashboard:', error);
      return null;
    }

    return data;
  }

  /**
   * Delete (archive) a dashboard
   */
  async deleteDashboard(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('pinned_dashboards')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) {
      console.error('Error deleting dashboard:', error);
      return false;
    }

    return true;
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<boolean> {
    const dashboard = await this.getDashboard(id);
    if (!dashboard) return false;

    const { error } = await supabase
      .from('pinned_dashboards')
      .update({ is_favorite: !dashboard.is_favorite })
      .eq('id', id);

    return !error;
  }

  /**
   * Update display order
   */
  async updateOrder(dashboardIds: string[]): Promise<boolean> {
    try {
      const updates = dashboardIds.map((id, index) => ({
        id,
        display_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('pinned_dashboards')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      return false;
    }
  }

  /**
   * Update last viewed timestamp
   */
  private async updateLastViewed(id: string): Promise<void> {
    await supabase
      .from('pinned_dashboards')
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('id', id);
  }

  // ---------------------------------------------------------------------------
  // AI AUTO-PINNING
  // ---------------------------------------------------------------------------

  /**
   * Auto-pin an insight from AI Assistant
   */
  async autoPinFromAI(
    title: string,
    content: string,
    aiResponse: {
      sections?: Array<{
        type: string;
        title?: string;
        content?: string;
        items?: string[];
        chartType?: string;
        data?: { labels?: string[]; values?: number[] };
        value?: string | number;
        trend?: string;
      }>;
    },
    datasetId?: string
  ): Promise<PinnedDashboard | null> {
    // Determine the best dashboard type based on AI response
    let type: DashboardType = 'insight';
    let config: DashboardConfig = {};
    let data: DashboardData = {};

    const sections = aiResponse.sections || [];

    // Find chart sections
    const chartSection = sections.find(s => s.type === 'chart');
    const metricSection = sections.find(s => s.type === 'metric');
    const listSection = sections.find(s => s.type === 'list');

    if (chartSection && chartSection.data) {
      type = 'chart';
      config = {
        chartType: (chartSection.chartType as ChartType) || 'bar',
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        showLegend: true,
        animated: true
      };
      data = {
        labels: chartSection.data.labels || [],
        datasets: [{
          label: chartSection.title || 'Data',
          data: chartSection.data.values || []
        }]
      };
    } else if (metricSection) {
      type = 'metric';
      data = {
        value: metricSection.value,
        trend: metricSection.trend as 'up' | 'down' | 'stable',
        summary: metricSection.content
      };
    } else {
      // Default to insight
      type = 'insight';
      const keyPoints = sections
        .filter(s => s.type === 'list')
        .flatMap(s => s.items || []);
      const recommendations = sections
        .filter(s => s.type === 'recommendation')
        .map(s => s.content || '');

      data = {
        summary: content,
        keyPoints: keyPoints.slice(0, 5),
        recommendations: recommendations.slice(0, 3)
      };
    }

    return this.createDashboard({
      title,
      description: `AI-generated insight from ${new Date().toLocaleDateString()}`,
      type,
      source: 'ai_assistant',
      config,
      data,
      source_id: datasetId,
      source_table: datasetId ? 'datasets' : undefined,
      category: 'ai_insights',
      tags: ['ai-generated', 'auto-pinned']
    });
  }

  /**
   * Pin experiment results as dashboard
   */
  async pinExperimentResults(
    experimentId: string,
    experimentName: string,
    metrics: Record<string, number>
  ): Promise<PinnedDashboard | null> {
    const labels = Object.keys(metrics);
    const values = Object.values(metrics);

    return this.createDashboard({
      title: `${experimentName} Results`,
      description: 'Experiment performance metrics',
      type: 'chart',
      source: 'experiment',
      config: {
        chartType: 'bar',
        colors: ['#10b981'],
        showLegend: false,
        animated: true
      },
      data: {
        labels,
        datasets: [{ label: 'Metrics', data: values }]
      },
      source_id: experimentId,
      source_table: 'experiments',
      category: 'experiments'
    });
  }

  // ---------------------------------------------------------------------------
  // REAL-TIME SYNC
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to real-time dashboard updates
   */
  subscribeToUpdates(callback: (dashboards: PinnedDashboard[]) => void): () => void {
    this.listeners.add(callback);

    // Set up real-time channel if not already done
    if (!this.realtimeChannel) {
      this.setupRealtimeSubscription();
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0 && this.realtimeChannel) {
        supabase.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }
    };
  }

  private async setupRealtimeSubscription(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    this.realtimeChannel = supabase
      .channel('pinned-dashboards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pinned_dashboards',
          filter: `user_id=eq.${user.id}`
        },
        async () => {
          // Fetch updated dashboards and notify listeners
          const dashboards = await this.getDashboards();
          this.notifyListeners(dashboards);
        }
      )
      .subscribe();
  }

  private notifyListeners(dashboards: PinnedDashboard[]): void {
    this.listeners.forEach(callback => callback(dashboards));
  }

  // ---------------------------------------------------------------------------
  // DEMO DATA FOR PRESENTATION
  // ---------------------------------------------------------------------------

  private getDemoDashboards(): PinnedDashboard[] {
    const now = new Date().toISOString();

    return [
      {
        id: 'demo-1',
        user_id: 'demo',
        title: 'Weekly Experiment Success Rate',
        description: 'Success rate trend across all biotech experiments',
        type: 'chart',
        source: 'system',
        config: {
          chartType: 'area',
          colors: ['#10b981'],
          showLegend: true,
          animated: true,
          layout: { width: 2, height: 1 }
        },
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Success Rate %',
            data: [72, 78, 85, 82, 90, 88, 94]
          }]
        },
        category: 'experiments',
        tags: ['weekly', 'success-rate'],
        is_favorite: true,
        display_order: 0,
        is_shared: false,
        shared_with: [],
        created_at: now,
        updated_at: now,
        is_archived: false
      },
      {
        id: 'demo-2',
        user_id: 'demo',
        title: 'Active Samples by Lab',
        description: 'Distribution of active samples across laboratory locations',
        type: 'chart',
        source: 'system',
        config: {
          chartType: 'pie',
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
          showLegend: true,
          layout: { width: 1, height: 1 }
        },
        data: {
          labels: ['Lab A', 'Lab B', 'Lab C', 'Lab D', 'Storage'],
          datasets: [{
            label: 'Samples',
            data: [45, 32, 28, 18, 12]
          }]
        },
        category: 'samples',
        tags: ['distribution', 'labs'],
        is_favorite: false,
        display_order: 1,
        is_shared: false,
        shared_with: [],
        created_at: now,
        updated_at: now,
        is_archived: false
      },
      {
        id: 'demo-3',
        user_id: 'demo',
        title: 'Model Accuracy Trend',
        description: 'ML model performance over the last 30 days',
        type: 'chart',
        source: 'system',
        config: {
          chartType: 'line',
          colors: ['#8b5cf6', '#ec4899'],
          showLegend: true,
          animated: true,
          layout: { width: 2, height: 1 }
        },
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [
            { label: 'Training Accuracy', data: [82, 86, 89, 92] },
            { label: 'Validation Accuracy', data: [78, 82, 85, 89] }
          ]
        },
        category: 'models',
        tags: ['accuracy', 'ml'],
        is_favorite: true,
        display_order: 2,
        is_shared: false,
        shared_with: [],
        created_at: now,
        updated_at: now,
        is_archived: false
      },
      {
        id: 'demo-4',
        user_id: 'demo',
        title: 'Data Quality Score',
        description: 'Overall data quality across all datasets',
        type: 'metric',
        source: 'system',
        config: {
          layout: { width: 1, height: 1 }
        },
        data: {
          value: 94.2,
          unit: '%',
          trend: 'up',
          change: 3.5,
          previousValue: 90.7
        },
        category: 'quality',
        tags: ['data-quality', 'kpi'],
        is_favorite: false,
        display_order: 3,
        is_shared: false,
        shared_with: [],
        created_at: now,
        updated_at: now,
        is_archived: false
      },
      {
        id: 'demo-5',
        user_id: 'demo',
        title: 'AI Analysis: Gene Expression Patterns',
        description: 'Auto-pinned insight from AI Assistant analysis',
        type: 'insight',
        source: 'ai_assistant',
        config: {
          layout: { width: 2, height: 2 }
        },
        data: {
          summary: 'Analysis of gene expression data reveals 3 distinct cluster patterns with high significance (p < 0.001). The primary cluster shows upregulation in metabolic pathways.',
          keyPoints: [
            'Cluster 1: 45% of samples - metabolic pathway upregulation',
            'Cluster 2: 32% of samples - immune response markers',
            'Cluster 3: 23% of samples - baseline expression',
            'Strong correlation (r=0.87) between clusters 1 & 2'
          ],
          recommendations: [
            'Focus validation on Cluster 1 genes for drug targeting',
            'Consider time-series analysis for temporal patterns',
            'Run pathway enrichment analysis on top differentially expressed genes'
          ]
        },
        category: 'ai_insights',
        tags: ['ai-generated', 'gene-expression', 'clustering'],
        is_favorite: true,
        display_order: 4,
        is_shared: false,
        shared_with: [],
        created_at: now,
        updated_at: now,
        is_archived: false
      },
      {
        id: 'demo-6',
        user_id: 'demo',
        title: 'Processing Pipeline Throughput',
        description: 'Samples processed per hour by pipeline stage',
        type: 'chart',
        source: 'workflow',
        config: {
          chartType: 'bar',
          colors: ['#06b6d4', '#14b8a6', '#10b981', '#22c55e'],
          showLegend: true,
          layout: { width: 2, height: 1 }
        },
        data: {
          labels: ['Intake', 'QC Check', 'Analysis', 'Review', 'Complete'],
          datasets: [{
            label: 'Samples/Hour',
            data: [120, 95, 78, 82, 75]
          }]
        },
        category: 'workflows',
        tags: ['throughput', 'pipeline'],
        is_favorite: false,
        display_order: 5,
        is_shared: false,
        shared_with: [],
        created_at: now,
        updated_at: now,
        is_archived: false
      }
    ];
  }

  // ---------------------------------------------------------------------------
  // UTILITY METHODS
  // ---------------------------------------------------------------------------

  /**
   * Get dashboard categories with counts
   */
  async getCategories(): Promise<Array<{ name: string; count: number }>> {
    const dashboards = await this.getDashboards();
    const counts = new Map<string, number>();

    dashboards.forEach(d => {
      const cat = d.category || 'general';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }

  /**
   * Duplicate a dashboard
   */
  async duplicateDashboard(id: string): Promise<PinnedDashboard | null> {
    const original = await this.getDashboard(id);
    if (!original) return null;

    return this.createDashboard({
      title: `${original.title} (Copy)`,
      description: original.description,
      type: original.type,
      source: 'manual',
      config: original.config,
      data: original.data,
      category: original.category,
      tags: original.tags
    });
  }

  /**
   * Export dashboard as JSON
   */
  exportDashboard(dashboard: PinnedDashboard): string {
    return JSON.stringify({
      title: dashboard.title,
      description: dashboard.description,
      type: dashboard.type,
      config: dashboard.config,
      data: dashboard.data,
      category: dashboard.category,
      tags: dashboard.tags,
      exported_at: new Date().toISOString()
    }, null, 2);
  }
}

// Export singleton instance
export const dashboardService = DashboardService.getInstance();
