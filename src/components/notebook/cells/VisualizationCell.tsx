import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    BarChart3,
    TrendingUp,
    Pin,
    DownloadCloud,
    Share2,
    LineChart as LineChartIcon,
    PieChart,
    MoreHorizontal,
    Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotebookCell, VisualizationCellContent } from '@/lib/types/notebook';
import {
    ScatterChart,
    Scatter,
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface VisualizationCellProps {
    cell: NotebookCell;
    isHighlighted?: boolean;
    datasetId?: string;
    onPin?: (cell: NotebookCell) => void;
}

const parseChartData = (config: any, chartType: string): any[] => {
    if (config.data && Array.isArray(config.data)) {
        return config.data;
    }
    return generateMockData(chartType);
};

const generateMockData = (chartType: string) => {
    // Generic mock data suitable for multiple types
    return [
        { name: 'Small', value: 45, count: 120, engagement: 6.91 },
        { name: 'Medium', value: 68, count: 250, engagement: 7.2 },
        { name: 'Large', value: 89, count: 180, engagement: 7.68 },
        { name: 'Unknown', value: 55, count: 80, engagement: 7.68 },
    ];
};

export const VisualizationCell = React.forwardRef<HTMLDivElement, VisualizationCellProps>(
    ({ cell, isHighlighted, datasetId, onPin }, ref) => {
        const content = cell.content as VisualizationCellContent;
        // State for interactivity
        const [activeChartType, setActiveChartType] = useState<string>(content.chart_type || 'bar');
        const chartData = parseChartData(content.config, activeChartType);

        const renderChart = () => {
            const CommonAxis = () => (
                <>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-10 stroke-muted-foreground" vertical={false} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        className="mt-4"
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                        contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: '4px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                </>
            );

            // Dynamic Chart Rendering
            switch (activeChartType) {
                case 'line':
                    return (
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                                <CommonAxis />
                                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Metric A" />
                                <Line type="monotone" dataKey="engagement" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }} name="Metric B" />
                            </LineChart>
                        </ResponsiveContainer>
                    );
                case 'area':
                    return (
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CommonAxis />
                                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" name="Value" />
                            </AreaChart>
                        </ResponsiveContainer>
                    );
                case 'bar':
                default:
                    return (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 0 }} barSize={40}>
                                <CommonAxis />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Value" />
                                <Bar dataKey="count" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Count" />
                            </BarChart>
                        </ResponsiveContainer>
                    );
            }
        };

        return (
            <div ref={ref} className="group">
                <Card className={cn(
                    "overflow-hidden border-0 shadow-sm ring-1 ring-border/50 bg-card transition-all duration-300",
                    isHighlighted && "ring-2 ring-primary shadow-lg"
                )}>
                    {/* Header with Controls */}
                    <CardHeader className="pb-2 border-b bg-muted/30">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    {activeChartType === 'line' ? <TrendingUp className="w-5 h-5 text-primary" /> : <BarChart3 className="w-5 h-5 text-primary" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider bg-background/50">
                                            visualization
                                        </Badge>
                                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                                            {activeChartType}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-base font-semibold text-foreground/90">{cell.title}</CardTitle>
                                </div>
                            </div>

                            {/* Toolbar */}
                            <div className="flex items-center gap-1 opacity-100 transition-opacity">
                                <div className="flex bg-background border rounded-lg p-0.5 mr-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-7 w-7 rounded-sm", activeChartType === 'bar' && "bg-muted shadow-sm")}
                                        onClick={() => setActiveChartType('bar')}
                                        title="Bar Chart"
                                    >
                                        <BarChart3 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-7 w-7 rounded-sm", activeChartType === 'line' && "bg-muted shadow-sm")}
                                        onClick={() => setActiveChartType('line')}
                                        title="Line Chart"
                                    >
                                        <LineChartIcon className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-7 w-7 rounded-sm", activeChartType === 'area' && "bg-muted shadow-sm")}
                                        onClick={() => setActiveChartType('area')}
                                        title="Area Chart"
                                    >
                                        <TrendingUp className="w-4 h-4" />
                                    </Button>
                                </div>

                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <DownloadCloud className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <Share2 className="w-4 h-4" />
                                </Button>
                                {onPin && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onPin(cell)}>
                                        <Pin className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 p-6">
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-4xl">
                            {content.description}
                        </p>

                        <div className="w-full min-h-[350px] animate-in fade-in zoom-in-95 duration-500">
                            {renderChart()}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
);

VisualizationCell.displayName = 'VisualizationCell';
