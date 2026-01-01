/**
 * PromptBI Service - Dashboard & Visualization Interface
 * 
 * Per Blueprint Phase 4: Dashboards & Visualization
 * Abstract interface for PromptBI API (placeholder until API is provided)
 * 
 * Key Features:
 * - Dynamic dashboard creation
 * - Chart generation with data validation
 * - Alert threshold configuration
 * - Auto-refresh mechanism
 */

import { eventBus, EventTypes } from '@/lib/events';

// =============================================================================
// TYPES
// =============================================================================

export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'histogram';

export interface ChartConfig {
    type: ChartType;
    title: string;
    xAxis: string;
    yAxis: string;
    groupBy?: string;
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
    filters?: Record<string, unknown>;
    annotations?: string[];
    colorScheme?: string;
}

export interface ChartData {
    config: ChartConfig;
    data: Record<string, unknown>[];
    metadata: {
        rowCount: number;
        generatedAt: string;
        datasetVersion?: string;
        validated: boolean;
    };
}

export interface Dashboard {
    id: string;
    name: string;
    description?: string;
    charts: DashboardChart[];
    layout: DashboardLayout;
    refreshInterval?: number; // seconds
    createdAt: string;
    updatedAt: string;
}

export interface DashboardChart {
    id: string;
    config: ChartConfig;
    position: { x: number; y: number; width: number; height: number };
    datasetId: string;
}

export interface DashboardLayout {
    columns: number;
    rowHeight: number;
}

export interface AlertConfig {
    id: string;
    chartId: string;
    metricField: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
}

// =============================================================================
// PROMPTBI SERVICE CLASS
// =============================================================================

export class PromptBIService {
    private dashboards: Map<string, Dashboard> = new Map();
    private alerts: Map<string, AlertConfig> = new Map();
    private refreshIntervals: Map<string, NodeJS.Timeout> = new Map();

    // =========================================================================
    // DASHBOARD MANAGEMENT
    // =========================================================================

    /**
     * Create a new dashboard
     */
    async createDashboard(params: {
        name: string;
        description?: string;
        layout?: Partial<DashboardLayout>;
    }): Promise<Dashboard> {
        const dashboard: Dashboard = {
            id: `dash_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: params.name,
            description: params.description,
            charts: [],
            layout: {
                columns: params.layout?.columns || 12,
                rowHeight: params.layout?.rowHeight || 150,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        this.dashboards.set(dashboard.id, dashboard);
        console.log('[PromptBI] Created dashboard:', dashboard.id);

        return dashboard;
    }

    /**
     * Get dashboard by ID
     */
    async getDashboard(id: string): Promise<Dashboard | null> {
        return this.dashboards.get(id) || null;
    }

    /**
     * Update dashboard
     */
    async updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard> {
        const dashboard = this.dashboards.get(id);
        if (!dashboard) {
            throw new Error(`Dashboard ${id} not found`);
        }

        const updated = {
            ...dashboard,
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        this.dashboards.set(id, updated);
        return updated;
    }

    /**
     * Delete dashboard
     */
    async deleteDashboard(id: string): Promise<void> {
        this.dashboards.delete(id);
        this.stopAutoRefresh(id);
    }

    // =========================================================================
    // CHART GENERATION
    // =========================================================================

    /**
     * Generate chart data from dataset
     * IMPORTANT: Data is validated, not hallucinated
     */
    async generateChart(params: {
        datasetId: string;
        config: ChartConfig;
        dataRows: Record<string, unknown>[];
    }): Promise<ChartData> {
        // Validate that required fields exist in data
        const validation = this.validateChartConfig(params.config, params.dataRows);
        if (!validation.valid) {
            throw new Error(`Invalid chart config: ${validation.errors.join(', ')}`);
        }

        // Process data for chart
        const processedData = this.processDataForChart(
            params.dataRows,
            params.config
        );

        const chartData: ChartData = {
            config: params.config,
            data: processedData,
            metadata: {
                rowCount: params.dataRows.length,
                generatedAt: new Date().toISOString(),
                validated: true,
            },
        };

        console.log('[PromptBI] Generated chart:', {
            type: params.config.type,
            title: params.config.title,
            dataPoints: processedData.length,
        });

        return chartData;
    }

    /**
     * Add chart to dashboard
     */
    async addChartToDashboard(dashboardId: string, chart: DashboardChart): Promise<Dashboard> {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) {
            throw new Error(`Dashboard ${dashboardId} not found`);
        }

        dashboard.charts.push(chart);
        dashboard.updatedAt = new Date().toISOString();

        return dashboard;
    }

    // =========================================================================
    // ALERTS
    // =========================================================================

    /**
     * Set an alert on a metric
     */
    async setAlert(config: Omit<AlertConfig, 'id'>): Promise<AlertConfig> {
        const alert: AlertConfig = {
            ...config,
            id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        };

        this.alerts.set(alert.id, alert);
        console.log('[PromptBI] Alert configured:', alert.id);

        return alert;
    }

    /**
     * Check alerts against current data
     */
    async checkAlerts(datasetId: string, currentData: Record<string, unknown>[]): Promise<void> {
        for (const alert of this.alerts.values()) {
            if (!alert.enabled) continue;

            for (const row of currentData) {
                const value = row[alert.metricField] as number;
                if (value === undefined) continue;

                const triggered = this.evaluateAlertCondition(value, alert.operator, alert.threshold);

                if (triggered) {
                    eventBus.emit(EventTypes.THRESHOLD_EXCEEDED, {
                        alertId: alert.id,
                        datasetId,
                        field: alert.metricField,
                        currentValue: value,
                        threshold: alert.threshold,
                        operator: alert.operator,
                        severity: alert.severity,
                    }, {
                        source: 'promptBIService',
                    });
                }
            }
        }
    }

    /**
     * Delete alert
     */
    async deleteAlert(id: string): Promise<void> {
        this.alerts.delete(id);
    }

    // =========================================================================
    // AUTO-REFRESH
    // =========================================================================

    /**
     * Start auto-refresh for a dashboard
     */
    startAutoRefresh(dashboardId: string, intervalSeconds: number, onRefresh: () => void): void {
        this.stopAutoRefresh(dashboardId);

        const interval = setInterval(onRefresh, intervalSeconds * 1000);
        this.refreshIntervals.set(dashboardId, interval);

        console.log(`[PromptBI] Auto-refresh started for ${dashboardId} every ${intervalSeconds}s`);
    }

    /**
     * Stop auto-refresh for a dashboard
     */
    stopAutoRefresh(dashboardId: string): void {
        const interval = this.refreshIntervals.get(dashboardId);
        if (interval) {
            clearInterval(interval);
            this.refreshIntervals.delete(dashboardId);
        }
    }

    /**
     * Trigger manual refresh
     */
    async triggerRefresh(dashboardId: string): Promise<void> {
        console.log(`[PromptBI] Triggering refresh for ${dashboardId}`);
        // Implementation would reload all chart data
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private validateChartConfig(
        config: ChartConfig,
        data: Record<string, unknown>[]
    ): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (data.length === 0) {
            errors.push('No data provided');
            return { valid: false, errors };
        }

        const sampleRow = data[0];
        const fields = Object.keys(sampleRow);

        if (!fields.includes(config.xAxis)) {
            errors.push(`X-axis field '${config.xAxis}' not found in data`);
        }

        if (!fields.includes(config.yAxis)) {
            errors.push(`Y-axis field '${config.yAxis}' not found in data`);
        }

        if (config.groupBy && !fields.includes(config.groupBy)) {
            errors.push(`Group-by field '${config.groupBy}' not found in data`);
        }

        return { valid: errors.length === 0, errors };
    }

    private processDataForChart(
        data: Record<string, unknown>[],
        config: ChartConfig
    ): Record<string, unknown>[] {
        // Basic processing - extract relevant fields
        return data.map(row => ({
            x: row[config.xAxis],
            y: row[config.yAxis],
            ...(config.groupBy ? { group: row[config.groupBy] } : {}),
        }));
    }

    private evaluateAlertCondition(value: number, operator: string, threshold: number): boolean {
        switch (operator) {
            case 'gt': return value > threshold;
            case 'lt': return value < threshold;
            case 'eq': return value === threshold;
            case 'gte': return value >= threshold;
            case 'lte': return value <= threshold;
            default: return false;
        }
    }
}

// Singleton export
export const promptBIService = new PromptBIService();
