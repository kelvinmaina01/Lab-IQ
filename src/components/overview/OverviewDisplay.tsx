/**
 * Overview Display - Beautiful data overview renderer
 * Displays AI-generated comprehensive analysis with sections, charts, and insights
 */

import { DataOverview } from '@/lib/services/overviewService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    X,
    Download,
    Share2,
    Sparkles,
    TrendingUp,
    TrendingDown,
    Minus,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import { useState } from 'react';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface OverviewDisplayProps {
    overview: DataOverview;
    onClose: () => void;
    onExport?: () => void;
}

export function OverviewDisplay({ overview, onClose, onExport }: OverviewDisplayProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['overview', 'insights', 'charts', 'takeaways'])
    );

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(section)) {
                newSet.delete(section);
            } else {
                newSet.add(section);
            }
            return newSet;
        });
    };

    const renderChart = (chart: DataOverview['featured_charts'][0]) => {
        const chartData = chart.data.labels?.map((label: string, i: number) => ({
            name: label,
            value: chart.data.datasets?.[0]?.data[i] || 0
        })) || [];

        switch (chart.type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsLineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={CHART_COLORS[1]}
                                strokeWidth={2}
                                dot={{ fill: CHART_COLORS[1], r: 4 }}
                            />
                        </RechartsLineChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={CHART_COLORS[0]}
                                fill={CHART_COLORS[0]}
                                fillOpacity={0.3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsPieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                );

            default:
                return <div className="text-muted-foreground text-sm">Chart type not supported</div>;
        }
    };

    return (
        <div className="h-full overflow-hidden flex flex-col bg-background">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Data Overview</h2>
                        <p className="text-xs text-muted-foreground">
                            AI-generated from {overview.dashboard_ids.length} insights
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {onExport && (
                        <Button variant="outline" size="sm" onClick={onExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    )}
                    <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Scrollable content */}
            <ScrollArea className="flex-1">
                <div className="px-6 py-6 space-y-8 max-w-6xl mx-auto">
                    {/* Title Header with colored background */}
                    <div
                        className="rounded-lg p-8 text-white relative overflow-hidden"
                        style={{ backgroundColor: overview.theme_color }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                        <div className="relative">
                            <h1 className="text-3xl font-bold mb-2">{overview.title}</h1>
                            <p className="text-white/90 text-sm">
                                {overview.dataset_name} • Generated {new Date(overview.created_at).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Metrics Summary */}
                    {overview.metrics_summary.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {overview.metrics_summary.map((metric, idx) => (
                                <Card key={idx} className="border-2">
                                    <CardContent className="p-4">
                                        <p className="text-xs text-muted-foreground font-medium mb-2">
                                            {metric.label}
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold">
                                                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                                            </span>
                                            {metric.trend && (
                                                <span className={
                                                    metric.trend === 'up' ? 'text-green-500' :
                                                        metric.trend === 'down' ? 'text-red-500' :
                                                            'text-muted-foreground'
                                                }>
                                                    {metric.trend === 'up' ? <TrendingUp className="h-4 w-4" /> :
                                                        metric.trend === 'down' ? <TrendingDown className="h-4 w-4" /> :
                                                            <Minus className="h-4 w-4" />}
                                                </span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Overview Section */}
                    <section>
                        <button
                            onClick={() => toggleSection('overview')}
                            className="flex items-center justify-between w-full mb-4 group"
                        >
                            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                Overview
                                <Badge variant="outline" className="text-xs">AI-Generated</Badge>
                            </h2>
                            {expandedSections.has('overview') ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                            )}
                        </button>
                        {expandedSections.has('overview') && (
                            <Card>
                                <CardContent className="p-6">
                                    <p className="text-foreground/90 leading-relaxed text-base">
                                        {overview.overview_text}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </section>

                    {/* Overall Insights */}
                    <section>
                        <button
                            onClick={() => toggleSection('insights')}
                            className="flex items-center justify-between w-full mb-4 group"
                        >
                            <h2 className="text-xl font-semibold text-foreground">Overall Insights</h2>
                            {expandedSections.has('insights') ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                            )}
                        </button>
                        {expandedSections.has('insights') && (
                            <Card>
                                <CardContent className="p-6">
                                    <ul className="space-y-3">
                                        {overview.overall_insights.map((insight, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm">
                                                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                                                <span className="text-foreground/90 leading-relaxed">{insight}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </section>

                    {/* Featured Charts */}
                    {overview.featured_charts.length > 0 && (
                        <section>
                            <button
                                onClick={() => toggleSection('charts')}
                                className="flex items-center justify-between w-full mb-4 group"
                            >
                                <h2 className="text-xl font-semibold text-foreground">Data Visualizations</h2>
                                {expandedSections.has('charts') ? (
                                    <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                                )}
                            </button>
                            {expandedSections.has('charts') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {overview.featured_charts.map((chart, idx) => (
                                        <Card key={idx}>
                                            <CardContent className="p-6">
                                                <h3 className="font-semibold text-base mb-1">{chart.title}</h3>
                                                {chart.description && (
                                                    <p className="text-xs text-muted-foreground mb-4">{chart.description}</p>
                                                )}
                                                {renderChart(chart)}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Key Takeaways */}
                    <section>
                        <button
                            onClick={() => toggleSection('takeaways')}
                            className="flex items-center justify-between w-full mb-4 group"
                        >
                            <h2 className="text-xl font-semibold text-foreground">Key Takeaways</h2>
                            {expandedSections.has('takeaways') ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                            )}
                        </button>
                        {expandedSections.has('takeaways') && (
                            <Card className="border-2 border-primary/20 bg-primary/5">
                                <CardContent className="p-6">
                                    <ul className="space-y-3">
                                        {overview.key_insights.map((takeaway, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <TrendingUp className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                                <span className="text-foreground/90 font-medium text-sm leading-relaxed">
                                                    {takeaway}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </section>
                </div>
            </ScrollArea>
        </div>
    );
}
