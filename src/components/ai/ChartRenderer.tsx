/**
 * ChartRenderer - Data-Validated Chart Component
 * 
 * Per Blueprint: Graphs are NOT hallucinated. Graphs are generated from verified data.
 * This component validates data before rendering charts.
 */

import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    ScatterChart,
    Scatter,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'area';

export interface ChartConfig {
    type: ChartType;
    title: string;
    description?: string;
    xField: string;
    yField: string;
    groupField?: string;
    colorScheme?: string[];
    height?: number;
    showLegend?: boolean;
    showGrid?: boolean;
    animate?: boolean;
}

export interface ChartData {
    data: Record<string, unknown>[];
    validated: boolean;
    rowCount: number;
    coverage: number;
    warnings?: string[];
}

export interface ChartRendererProps {
    config: ChartConfig;
    chartData: ChartData;
    className?: string;
}

// Default colors
const DEFAULT_COLORS = [
    '#8b5cf6', '#06b6d4', '#22c55e', '#eab308', '#ef4444',
    '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16',
];

// =============================================================================
// VALIDATION
// =============================================================================

function validateChartData(
    data: Record<string, unknown>[],
    xField: string,
    yField: string
): { valid: boolean; warnings: string[]; coverage: number } {
    const warnings: string[] = [];

    if (!data || data.length === 0) {
        return { valid: false, warnings: ['No data provided'], coverage: 0 };
    }

    const fields = Object.keys(data[0]);

    if (!fields.includes(xField)) {
        warnings.push(`X-axis field '${xField}' not found in data`);
    }

    if (!fields.includes(yField)) {
        warnings.push(`Y-axis field '${yField}' not found in data`);
    }

    // Check for null/undefined values
    let validRows = 0;
    data.forEach((row, index) => {
        const xVal = row[xField];
        const yVal = row[yField];

        if (xVal !== null && xVal !== undefined && yVal !== null && yVal !== undefined) {
            validRows++;
        }
    });

    const coverage = (validRows / data.length) * 100;

    if (coverage < 50) {
        warnings.push(`Low data coverage: ${coverage.toFixed(1)}%`);
    }

    return {
        valid: warnings.length === 0,
        warnings,
        coverage,
    };
}

// =============================================================================
// CHART COMPONENTS
// =============================================================================

function LineChartComponent({ data, config }: { data: Record<string, unknown>[]; config: ChartConfig }) {
    return (
        <ResponsiveContainer width="100%" height={config.height || 300}>
            <LineChart data={data}>
                {config.showGrid !== false && (
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                )}
                <XAxis
                    dataKey={config.xField}
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    className="text-muted-foreground"
                />
                <YAxis
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    className="text-muted-foreground"
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                    }}
                />
                {config.showLegend && <Legend />}
                <Line
                    type="monotone"
                    dataKey={config.yField}
                    stroke={config.colorScheme?.[0] || DEFAULT_COLORS[0]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    animationDuration={config.animate !== false ? 1000 : 0}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

function BarChartComponent({ data, config }: { data: Record<string, unknown>[]; config: ChartConfig }) {
    return (
        <ResponsiveContainer width="100%" height={config.height || 300}>
            <BarChart data={data}>
                {config.showGrid !== false && (
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                )}
                <XAxis
                    dataKey={config.xField}
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                />
                <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                    }}
                />
                {config.showLegend && <Legend />}
                <Bar
                    dataKey={config.yField}
                    fill={config.colorScheme?.[0] || DEFAULT_COLORS[0]}
                    radius={[4, 4, 0, 0]}
                    animationDuration={config.animate !== false ? 1000 : 0}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

function AreaChartComponent({ data, config }: { data: Record<string, unknown>[]; config: ChartConfig }) {
    const color = config.colorScheme?.[0] || DEFAULT_COLORS[0];

    return (
        <ResponsiveContainer width="100%" height={config.height || 300}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id={`gradient-${config.yField}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                {config.showGrid !== false && (
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                )}
                <XAxis
                    dataKey={config.xField}
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                />
                <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                    }}
                />
                {config.showLegend && <Legend />}
                <Area
                    type="monotone"
                    dataKey={config.yField}
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#gradient-${config.yField})`}
                    animationDuration={config.animate !== false ? 1000 : 0}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

function PieChartComponent({ data, config }: { data: Record<string, unknown>[]; config: ChartConfig }) {
    const colors = config.colorScheme || DEFAULT_COLORS;

    return (
        <ResponsiveContainer width="100%" height={config.height || 300}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey={config.yField}
                    nameKey={config.xField}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    animationDuration={config.animate !== false ? 1000 : 0}
                >
                    {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                    }}
                />
                {config.showLegend && <Legend />}
            </PieChart>
        </ResponsiveContainer>
    );
}

function ScatterChartComponent({ data, config }: { data: Record<string, unknown>[]; config: ChartConfig }) {
    return (
        <ResponsiveContainer width="100%" height={config.height || 300}>
            <ScatterChart>
                {config.showGrid !== false && (
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                )}
                <XAxis
                    dataKey={config.xField}
                    type="number"
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    name={config.xField}
                />
                <YAxis
                    dataKey={config.yField}
                    type="number"
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    name={config.yField}
                />
                <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                    }}
                />
                {config.showLegend && <Legend />}
                <Scatter
                    data={data}
                    fill={config.colorScheme?.[0] || DEFAULT_COLORS[0]}
                    animationDuration={config.animate !== false ? 1000 : 0}
                />
            </ScatterChart>
        </ResponsiveContainer>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ChartRenderer({ config, chartData, className }: ChartRendererProps) {
    // Validate data
    const validation = useMemo(() => {
        return validateChartData(chartData.data, config.xField, config.yField);
    }, [chartData.data, config.xField, config.yField]);

    // Render appropriate chart
    const renderChart = () => {
        if (!validation.valid && validation.warnings.some(w => w.includes('not found'))) {
            return (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mb-2 text-yellow-500" />
                    <p className="text-sm">Cannot render chart: invalid configuration</p>
                    <ul className="text-xs mt-2 space-y-1">
                        {validation.warnings.map((w, i) => (
                            <li key={i}>• {w}</li>
                        ))}
                    </ul>
                </div>
            );
        }

        switch (config.type) {
            case 'line':
                return <LineChartComponent data={chartData.data} config={config} />;
            case 'bar':
                return <BarChartComponent data={chartData.data} config={config} />;
            case 'area':
                return <AreaChartComponent data={chartData.data} config={config} />;
            case 'pie':
                return <PieChartComponent data={chartData.data} config={config} />;
            case 'scatter':
                return <ScatterChartComponent data={chartData.data} config={config} />;
            default:
                return <LineChartComponent data={chartData.data} config={config} />;
        }
    };

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">{config.title}</CardTitle>
                        {config.description && (
                            <CardDescription>{config.description}</CardDescription>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {chartData.validated && (
                            <Badge variant="outline" className="text-green-500 border-green-500/50">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                            </Badge>
                        )}
                        <Badge variant="secondary">
                            {chartData.rowCount} rows
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {renderChart()}

                {/* Data quality indicator */}
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Coverage: {validation.coverage.toFixed(1)}%</span>
                    {validation.warnings.length > 0 && (
                        <span className="text-yellow-500">
                            {validation.warnings.length} warning(s)
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// =============================================================================
// HELPER HOOK
// =============================================================================

export function useChartData(
    rawData: Record<string, unknown>[],
    xField: string,
    yField: string
): ChartData {
    return useMemo(() => {
        const validation = validateChartData(rawData, xField, yField);

        return {
            data: rawData,
            validated: validation.valid,
            rowCount: rawData.length,
            coverage: validation.coverage,
            warnings: validation.warnings,
        };
    }, [rawData, xField, yField]);
}
