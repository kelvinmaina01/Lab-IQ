/**
 * Interactive Chart Card Component
 * Julius AI / PromptBI-style chart with controls:
 * - Share, Download buttons
 * - Chart type switcher (Bar, Pie, Line, Heatmap)
 * - Expand/collapse
 * - Analysis section below
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Share2,
    Download,
    ChevronDown,
    BarChart3,
    PieChart as PieChartIcon,
    LineChart as LineChartIcon,
    Grid3X3,
    Expand,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ScatterChart,
    Scatter,
    ZAxis
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

type ChartType = 'bar' | 'line' | 'pie' | 'heatmap' | 'scatter';

interface ChartData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
    }>;
}

interface AnalysisSection {
    title: string;
    content: string;
    keyFindings?: string[];
}

interface InteractiveChartCardProps {
    title: string;
    data: ChartData;
    defaultChartType?: ChartType;
    analysis?: AnalysisSection;
    showControls?: boolean;
    currentSlide?: number;
    totalSlides?: number;
    onSlideChange?: (direction: 'prev' | 'next') => void;
}

export function InteractiveChartCard({
    title,
    data,
    defaultChartType = 'bar',
    analysis,
    showControls = true,
    currentSlide,
    totalSlides,
    onSlideChange
}: InteractiveChartCardProps) {
    const [chartType, setChartType] = useState<ChartType>(defaultChartType);
    const [isExpanded, setIsExpanded] = useState(false);
    const { toast } = useToast();

    // Transform data for recharts
    const chartData = data.labels.map((label, i) => ({
        name: label,
        value: data.datasets[0]?.data[i] || 0,
        ...data.datasets.reduce((acc, ds, dsIdx) => ({
            ...acc,
            [`value${dsIdx}`]: ds.data[i]
        }), {})
    }));

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast({
                title: "Link copied!",
                description: "Dashboard link copied to clipboard",
            });
        } catch {
            toast({
                title: "Share",
                description: "Use this URL to share this dashboard",
            });
        }
    };

    const handleDownload = () => {
        // Create CSV from data
        const headers = ['Name', ...data.datasets.map(ds => ds.label)].join(',');
        const rows = data.labels.map((label, i) =>
            [label, ...data.datasets.map(ds => ds.data[i])].join(',')
        );
        const csv = [headers, ...rows].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s+/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: "Downloaded!",
            description: "Chart data exported as CSV",
        });
    };

    const renderChart = () => {
        switch (chartType) {
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            {data.datasets.map((ds, idx) => (
                                <Line
                                    key={idx}
                                    type="monotone"
                                    dataKey={`value${idx}`}
                                    name={ds.label}
                                    stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'heatmap':
                // Simple heatmap representation
                const maxVal = Math.max(...chartData.map(d => d.value));
                return (
                    <div className="p-4">
                        <div className="flex gap-2 mb-4">
                            <span className="text-xs text-muted-foreground">Low</span>
                            <div className="flex-1 h-4 bg-gradient-to-r from-blue-100 via-yellow-200 to-red-500 rounded" />
                            <span className="text-xs text-muted-foreground">High</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {chartData.map((item, idx) => {
                                const intensity = item.value / maxVal;
                                const bgColor = intensity > 0.7 ? 'bg-red-400' :
                                    intensity > 0.4 ? 'bg-yellow-300' :
                                        intensity > 0.1 ? 'bg-blue-200' : 'bg-gray-100';
                                return (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded text-center ${bgColor}`}
                                        title={`${item.name}: ${item.value}`}
                                    >
                                        <div className="text-xs font-medium truncate">{item.name}</div>
                                        <div className="text-sm font-bold">{item.value.toLocaleString()}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid />
                            <XAxis type="number" dataKey="x" name="x" unit="" />
                            <YAxis type="number" dataKey="y" name="y" unit="" />
                            <ZAxis type="number" dataKey="z" range={[60, 400]} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Legend />
                            {data.datasets.map((ds, idx) => (
                                <Scatter
                                    key={idx}
                                    name={ds.label}
                                    data={chartData.map(d => ({ x: d.name, y: (ds.data as any)[d.name] || d[`value${idx}`] || Math.random() * 100 }))} // Simplified mapping, real scatter needs x/y pairs
                                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                                />
                            ))}
                        </ScatterChart>
                    </ResponsiveContainer>
                );

            case 'bar':
            default:
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            {data.datasets.map((ds, idx) => (
                                <Bar
                                    key={idx}
                                    dataKey={`value${idx}`}
                                    name={ds.label}
                                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                                    radius={[4, 4, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );
        }
    };

    const chartTypeOptions = [
        { type: 'bar' as ChartType, icon: BarChart3, label: 'Bar Chart' },
        { type: 'line' as ChartType, icon: LineChartIcon, label: 'Line Chart' },
        { type: 'pie' as ChartType, icon: PieChartIcon, label: 'Pie Chart' },
        { type: 'scatter' as ChartType, icon: Grid3X3, label: 'Scatter' },
        { type: 'heatmap' as ChartType, icon: Grid3X3, label: 'Heatmap' },
    ];

    return (
        <Card className={`overflow-hidden transition-all ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{title}</CardTitle>

                    {showControls && (
                        <div className="flex items-center gap-2">
                            {/* Slide Navigation */}
                            {totalSlides && totalSlides > 1 && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => onSlideChange?.('prev')}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span>{currentSlide}/{totalSlides}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => onSlideChange?.('next')}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            {/* Share Button */}
                            <Button
                                variant="default"
                                size="sm"
                                className="h-7 gap-1"
                                onClick={handleShare}
                            >
                                Share
                            </Button>

                            {/* Download Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1"
                                onClick={handleDownload}
                            >
                                <Download className="h-3.5 w-3.5" />
                                Download
                            </Button>

                            {/* Expand */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                <Expand className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Chart Type Switcher */}
                {showControls && (
                    <div className="flex items-center gap-1 mt-3">
                        {chartTypeOptions.map(({ type, icon: Icon, label }) => (
                            <Button
                                key={type}
                                variant={chartType === type ? 'default' : 'ghost'}
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() => setChartType(type)}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {chartType === type && <span>{label}</span>}
                            </Button>
                        ))}
                    </div>
                )}
            </CardHeader>

            <CardContent>
                {/* Chart */}
                {renderChart()}

                {/* Analysis Section */}
                {analysis && (
                    <div className="mt-6 pt-4 border-t space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            {analysis.title}
                        </h4>

                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {analysis.content}
                        </p>

                        {analysis.keyFindings && analysis.keyFindings.length > 0 && (
                            <ul className="space-y-1">
                                {analysis.keyFindings.map((finding, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                        <span className="text-muted-foreground">{finding}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </CardContent>

            {/* Close button for expanded mode */}
            {isExpanded && (
                <Button
                    variant="outline"
                    className="absolute top-4 right-4"
                    onClick={() => setIsExpanded(false)}
                >
                    Close
                </Button>
            )}
        </Card>
    );
}

export default InteractiveChartCard;
