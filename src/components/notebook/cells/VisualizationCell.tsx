/**
 * Visualization Cell Renderer
 * Displays charts using Recharts library
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotebookCell, VisualizationCellContent } from '@/lib/types/notebook';
import {
    ScatterChart,
    Scatter,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface VisualizationCellProps {
    cell: NotebookCell;
    isHighlighted?: boolean;
    datasetId?: string; // For fetching real data
}

/**
 * Parse visualization config to extract chart data
 * Supports both pre-computed data and data fetching instructions
 */
const parseChartData = (config: any, chartType: string): any[] => {
    // If data is already provided in config
    if (config.data && Array.isArray(config.data)) {
        return config.data;
    }

    // Generate mock data for demo (fallback)
    return generateMockData(chartType);
};

// Mock data generator for demo purposes (fallback)
const generateMockData = (chartType: string) => {
    if (chartType === 'scatter') {
        return [
            { bmi: 22, diabetic: 0, nonDiabetic: 12 },
            { bmi: 25, diabetic: 5, nonDiabetic: 28 },
            { bmi: 28, diabetic: 15, nonDiabetic: 45 },
            { bmi: 31, diabetic: 35, nonDiabetic: 38 },
            { bmi: 34, diabetic: 55, nonDiabetic: 25 },
            { bmi: 37, diabetic: 72, nonDiabetic: 15 },
            { bmi: 40, diabetic: 88, nonDiabetic: 8 }
        ];
    }
    return [];
};

export const VisualizationCell = React.forwardRef<HTMLDivElement, VisualizationCellProps>(
    ({ cell, isHighlighted, datasetId }, ref) => {
        const content = cell.content as VisualizationCellContent;
        const chartData = parseChartData(content.config, content.chart_type);

        const renderChart = () => {
            switch (content.chart_type) {
                case 'scatter':
                    return (
                        <ResponsiveContainer width="100%" height={400}>
                            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis
                                    dataKey="bmi"
                                    type="number"
                                    name="BMI"
                                    label={{ value: 'BMI (kg/m²)', position: 'insideBottom', offset: -10 }}
                                    className="text-sm"
                                />
                                <YAxis
                                    type="number"
                                    name="Count"
                                    label={{ value: 'Patient Count', angle: -90, position: 'insideLeft' }}
                                    className="text-sm"
                                />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px'
                                    }}
                                />
                                <Legend />
                                <Scatter
                                    name="Diabetic"
                                    data={chartData}
                                    dataKey="diabetic"
                                    fill="hsl(var(--destructive))"
                                    opacity={0.8}
                                />
                                <Scatter
                                    name="Non-Diabetic"
                                    data={chartData}
                                    dataKey="nonDiabetic"
                                    fill="hsl(var(--primary))"
                                    opacity={0.8}
                                />
                            </ScatterChart>
                        </ResponsiveContainer>
                    );

                case 'bar':
                case 'histogram':
                    return (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis
                                    dataKey={content.chart_type === 'histogram' ? 'bin' : 'bmi'}
                                    label={{
                                        value: content.chart_type === 'histogram' ? 'Range' : 'Category',
                                        position: 'insideBottom',
                                        offset: -10
                                    }}
                                />
                                <YAxis
                                    label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px'
                                    }}
                                />
                                <Legend />
                                <Bar
                                    dataKey={content.chart_type === 'histogram' ? 'count' : 'diabetic'}
                                    fill="hsl(var(--primary))"
                                    name={content.chart_type === 'histogram' ? 'Frequency' : 'Diabetic'}
                                />
                                {content.chart_type === 'bar' && (
                                    <Bar dataKey="nonDiabetic" fill="hsl(var(--muted))" name="Non-Diabetic" />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    );

                case 'line':
                    return (
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis
                                    dataKey="bmi"
                                    label={{ value: 'BMI', position: 'insideBottom', offset: -10 }}
                                />
                                <YAxis
                                    label={{ value: 'Prevalence', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px'
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="diabetic"
                                    stroke="hsl(var(--destructive))"
                                    strokeWidth={2}
                                    name="Diabetic"
                                    dot={{ fill: 'hsl(var(--destructive))' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="nonDiabetic"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    name="Non-Diabetic"
                                    dot={{ fill: 'hsl(var(--primary))' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    );

                default:
                    return (
                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                            <p>Chart type "{content.chart_type}" not yet implemented</p>
                        </div>
                    );
            }
        };

        return (
            <div ref={ref}>
                <Card
                    className={cn(
                        'border-l-4 transition-all',
                        isHighlighted
                            ? 'border-l-primary bg-primary/5 shadow-lg'
                            : 'border-l-purple-500 dark:border-l-purple-400'
                    )}
                >
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                                <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
                                    <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs font-mono">
                                            visualization
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs capitalize">
                                            {content.chart_type}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg">{cell.title}</CardTitle>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Chart Description */}
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {content.description}
                        </p>

                        {/* Chart Rendering */}
                        <div className="bg-muted/30 rounded-lg p-4">
                            {renderChart()}
                        </div>

                        {/* Data Source References */}
                        {content.data_source_cell_ids && content.data_source_cell_ids.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                <TrendingUp className="w-3 h-3" />
                                <span>
                                    Data from: {content.data_source_cell_ids.map(id => `#${id}`).join(', ')}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }
);

VisualizationCell.displayName = 'VisualizationCell';
