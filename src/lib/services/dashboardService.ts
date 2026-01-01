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
  title: string;
  type: DashboardType;
  source: DashboardSource;
  config: any;
  // Rich data payload for deep analysis
  data: {
    // Primary display data
    value?: any;
    labels?: string[];
    datasets?: any[];
    rows?: any[];
    columns?: any[];
    trend?: 'up' | 'down' | 'stable';
    summary?: string;
    keyPoints?: string[];
    recommendations?: string[];

    // Context for Drill-Down & AI Memory
    context?: {
      messageId: string;       // Link back to original chat message
      datasetId: string;       // The dataset being analyzed
      datasetName: string;
      analysisType?: string;   // e.g., 'correlation', 'distribution', 'outlier'
      query?: string;          // The user's question that triggered this
    };

    // Detailed Data Findings (PromptBI style)
    findings?: {
      statistical_significance?: string; // e.g., "p < 0.05"
      correlation_coefficient?: number;  // e.g., 0.85
      sample_size?: number;
      outliers_detected?: number;
    };

    // Generic metadata support
    metadata?: Record<string, any>;
  };
  layout: {
    w: number;
    h: number;
    x: number;
    y: number;
  };
  createdAt: string;
  userId: string;
  tags: string[];
  isFavorite?: boolean;
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

  private constructor() { }

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

      // If not logged in, return empty array (no demo data)
      if (!user) {
        console.log('User not authenticated, returning empty dashboards');
        return [];
      }

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
        return [];
      }

      // Return only real data from database - no demo/mocked data
      return data || [];
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      return [];
    }
  }

  /**
   * Get a single dashboard by ID
   */
  async getDashboard(id: string): Promise<PinnedDashboard | null> {
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
      metadata: {},
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
   * Auto-pin an insight from AI Assistant (Enhanced with rich metadata)
   */
  async autoPinFromAI(
    aiResponse: any,
    datasetId?: string,
    messageId?: string,
    userQuery?: string
  ): Promise<PinnedDashboard | null> {
    // 1. Fetch Dataset Context (Real-time Name Resolution)
    let datasetName = 'Health Data';
    if (datasetId) {
      try {
        const { data } = await supabase
          .from('files')
          .select('filename')
          .eq('id', datasetId)
          .single();
        if (data) datasetName = data.filename;
      } catch (e) {
        console.warn("Could not fetch dataset name", e);
      }
    }

    // 2. Determine Dashboard Type & Data from AI Response
    // We expect aiResponse to have sections (chart, metric, list, etc.)
    const sections = aiResponse.sections || [];
    let type: DashboardType = 'insight';
    let config: any = {};
    let displayData: any = {};
    let title = aiResponse.title || `Analysis of ${datasetName}`;
    let description = aiResponse.text || aiResponse.summary || '';

    // Prioritize charts
    const chartSection = sections.find((s: any) => s.type === 'chart');
    if (chartSection && chartSection.data) {
      type = 'chart';
      title = chartSection.title || title;
      config = {
        chartType: chartSection.chartType || 'bar',
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'], // Standard palette
        showLegend: true
      };
      displayData = {
        labels: chartSection.data.labels || [],
        datasets: [{
          label: chartSection.title || 'Data',
          data: chartSection.data.values || []
        }]
      };
      description = chartSection.description || description;
    }
    // Then metrics
    else if (sections.find((s: any) => s.type === 'metric')) {
      const metric = sections.find((s: any) => s.type === 'metric');
      type = 'metric';
      title = metric.title || title;
      displayData = {
        value: metric.value,
        trend: metric.trend,
        summary: metric.content
      };
    }
    // Then lists/insights
    else {
      // Default to insight
      const listSection = sections.find((s: any) => s.type === 'list');
      if (listSection) {
        type = 'insight';
        title = listSection.title || title;
        displayData = {
          keyPoints: listSection.items
        };
      } else {
        // Fallback or text summary
        type = 'insight';
        displayData = {
          summary: description
        };
      }
    }

    // 3. Construct Rich Data Payload with Context & Findings
    const dashboardData = {
      ...displayData, // The visual data
      summary: description,
      keyPoints: aiResponse.keyPoints || displayData.keyPoints || [],
      recommendations: aiResponse.recommendations || [],

      // CONTEXT for Drill-Down & Memory
      context: {
        messageId: messageId || 'system',
        datasetId: datasetId || '',
        datasetName: datasetName,
        query: userQuery || '',
        analysisType: aiResponse.type || 'general_analysis'
      },

      // PROMPTBI-STYLE FINDINGS
      findings: {
        statistical_significance: aiResponse.significance,
        correlation_coefficient: aiResponse.correlation,
        sample_size: aiResponse.sampleSize,
        outliers_detected: aiResponse.outliers
      },

      // Backwards compatibility
      metadata: {
        dataset_name: datasetName,
        dataset_id: datasetId
      }
    };

    const dashboard: PinnedDashboard = {
      id: crypto.randomUUID(),
      title,
      type,
      source: 'ai_assistant',
      config,
      data: dashboardData,
      layout: { w: 1, h: 1, x: 0, y: 0 },
      createdAt: new Date().toISOString(),
      userId: 'user-id', // Replaced in createDashboard
      tags: ['ai-generated', 'data-insight', datasetName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')]
    };

    return this.createDashboard(dashboard);
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

  /**
   * Pin workflow execution results as dashboard
   */
  async pinFromWorkflow(
    workflowId: string,
    workflowName: string,
    executionData: {
      status?: string;
      duration?: number;
      stepsCompleted?: number;
      totalSteps?: number;
      outputs?: Record<string, any>;
    }
  ): Promise<PinnedDashboard | null> {
    // Create a metric for workflow execution
    const completionRate = executionData.stepsCompleted && executionData.totalSteps
      ? Math.round((executionData.stepsCompleted / executionData.totalSteps) * 100)
      : 100;

    return this.createDashboard({
      title: `${workflowName} Execution`,
      description: `Workflow completed with ${completionRate}% success`,
      type: 'metric',
      source: 'workflow',
      config: {
        layout: { width: 1, height: 1 }
      },
      data: {
        value: completionRate,
        unit: '%',
        trend: completionRate >= 80 ? 'up' : completionRate >= 50 ? 'stable' : 'down',
        summary: `Workflow ${workflowName} executed in ${executionData.duration || 0}s`
      },
      source_id: workflowId,
      source_table: 'workflows',
      category: 'workflows',
      tags: ['workflow-execution', executionData.status || 'completed']
    });
  }

  /**
   * Pin workflow output chart/table
   */
  async pinWorkflowOutput(
    workflowId: string,
    workflowName: string,
    output: {
      type: 'chart' | 'table' | 'metric';
      title: string;
      data: DashboardData;
      config?: DashboardConfig;
    }
  ): Promise<PinnedDashboard | null> {
    return this.createDashboard({
      title: `${workflowName}: ${output.title}`,
      description: 'Output from workflow execution',
      type: output.type,
      source: 'workflow',
      config: output.config || {},
      data: output.data,
      source_id: workflowId,
      source_table: 'workflows',
      category: 'workflows',
      tags: ['workflow-output']
    });
  }

  /**
   * Pin AutoML model performance metrics
   */
  async pinFromModel(
    modelId: string,
    modelName: string,
    performance: {
      accuracy?: number;
      precision?: number;
      recall?: number;
      f1Score?: number;
      mse?: number;
      r2?: number;
      modelType?: string;
    }
  ): Promise<PinnedDashboard | null> {
    // Create performance chart
    const metrics = Object.entries(performance)
      .filter(([key, val]) => typeof val === 'number' && key !== 'modelType')
      .reduce((acc, [key, val]) => {
        // Format metric names nicely
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        acc[label] = val as number;
        return acc;
      }, {} as Record<string, number>);

    const labels = Object.keys(metrics);
    const values = Object.values(metrics);

    return this.createDashboard({
      title: `${modelName} Performance`,
      description: `${performance.modelType || 'Model'} performance metrics`,
      type: 'chart',
      source: 'experiment',
      config: {
        chartType: 'bar',
        colors: ['#8b5cf6'],
        showLegend: false,
        animated: true
      },
      data: {
        labels,
        datasets: [{ label: 'Performance', data: values }]
      },
      source_id: modelId,
      source_table: 'ml_models',
      category: 'models',
      tags: ['automl', 'model-performance', performance.modelType || 'ml']
    });
  }

  /**
   * Pin from AI Assistant with rich context
   */
  async autoPinFromAI(
    title: string,
    content: string,
    aiResponse: any,
    datasetId?: string
  ): Promise<PinnedDashboard | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Extract potential chart data from sections
    let chartData: any = null;
    let chartConfig: any = null;
    let type: DashboardType = 'insight';
    let dataSummary = content;

    if (aiResponse?.sections) {
      // Look for chart sections like in PromptBI example
      const chartSection = aiResponse.sections.find((s: any) =>
        s.type === 'chart' || s.content.includes('```json') || s.type === 'data_visualization'
      );

      if (chartSection) {
        // Simple heuristic to detect if we have chartable data
        // In a real implementation this would parser the JSON from the section
        type = 'chart';
        chartConfig = { chartType: 'bar', colors: ['#3b82f6'] };
        // We would extract real data here, for now using a placeholder if parsing fails
        // but trying to use the section content as the data source
      }
    }

    return this.createDashboard({
      title: title.replace(/^"|"$/g, ''), // Remove quotes if present
      description: content.substring(0, 150) + (content.length > 150 ? '...' : ''),
      type: type,
      source: 'ai_assistant',
      config: chartConfig || {},
      data: {
        summary: dataSummary,
        // Store the full context for drill-down
        context: {
          datasetId: datasetId,
          fullContent: content,
          aiSections: aiResponse?.sections
        },
        // If we had real chart data extraction, it would go here
        labels: [],
        datasets: []
      },
      category: 'ai_insights',
      tags: ['ai-generated', datasetId ? 'dataset-analysis' : 'general'],
      source_id: datasetId,
      is_favorite: true
    });
  }

  /**
   * Pin dataset quick stats
   */
  async pinFromDataset(
    datasetId: string,
    datasetName: string,
    stats: {
      rowCount?: number;
      columnCount?: number;
      missingValues?: number;
      dataTypes?: Record<string, number>;
    }
  ): Promise<PinnedDashboard | null> {
    return this.createDashboard({
      title: `${datasetName} Overview`,
      description: 'Dataset statistics',
      type: 'metric',
      source: 'manual',
      config: {
        layout: { width: 1, height: 1 }
      },
      data: {
        value: stats.rowCount || 0,
        unit: 'rows',
        summary: `${stats.columnCount || 0} columns, ${stats.missingValues || 0} missing values`
      },
      source_id: datasetId,
      source_table: 'datasets',
      category: 'general',
      tags: ['dataset-stats']
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
