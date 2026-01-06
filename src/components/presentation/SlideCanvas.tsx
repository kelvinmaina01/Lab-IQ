/**
 * Slide Canvas - Renders individual slides with different layouts
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    AreaChart,
    Area,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Slide, PresentationThemeConfig } from '@/lib/services/presentationService';
import { cn } from '@/lib/utils';

interface SlideCanvasProps {
    slide: Slide;
    theme: PresentationThemeConfig;
    isFullscreen?: boolean;
}

export function SlideCanvas({ slide, theme, isFullscreen }: SlideCanvasProps) {
    const { content } = slide;

    // Common styles based on theme
    const headerStyle = {
        background: theme.colors.headerBg,
        color: theme.colors.background
    };

    const cardStyle = {
        backgroundColor: theme.colors.cardBg,
        borderColor: `${theme.colors.primary}20`
    };

    const renderChart = () => {
        if (!content.chart) return null;

        const chartData = content.chart.data.labels?.map((label, i) => ({
            name: label,
            ...content.chart!.data.datasets.reduce((acc, ds, dsIdx) => ({
                ...acc,
                [`value${dsIdx}`]: ds.data[i]
            }), {})
        })) || [];

        const colors = content.chart.data.datasets.map((ds, i) =>
            ds.color || theme.colors.primary
        );

        const commonProps = {
            width: '100%',
            height: isFullscreen ? 500 : 350
        };

        switch (content.chart.type) {
            case 'bar':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.textMuted + '30'} />
                            <XAxis dataKey="name" stroke={theme.colors.text} />
                            <YAxis stroke={theme.colors.text} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: theme.colors.background,
                                    border: `1px solid ${theme.colors.primary}`,
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            {content.chart.data.datasets.map((ds, idx) => (
                                <Bar
                                    key={idx}
                                    dataKey={`value${idx}`}
                                    name={ds.label}
                                    fill={colors[idx]}
                                    radius={[8, 8, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.textMuted + '30'} />
                            <XAxis dataKey="name" stroke={theme.colors.text} />
                            <YAxis stroke={theme.colors.text} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: theme.colors.background,
                                    border: `1px solid ${theme.colors.primary}`,
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            {content.chart.data.datasets.map((ds, idx) => (
                                <Line
                                    key={idx}
                                    type="monotone"
                                    dataKey={`value${idx}`}
                                    name={ds.label}
                                    stroke={colors[idx]}
                                    strokeWidth={3}
                                    dot={{ fill: colors[idx], r: 5 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.textMuted + '30'} />
                            <XAxis dataKey="name" stroke={theme.colors.text} />
                            <YAxis stroke={theme.colors.text} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: theme.colors.background,
                                    border: `1px solid ${theme.colors.primary}`,
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            {content.chart.data.datasets.map((ds, idx) => (
                                <Area
                                    key={idx}
                                    type="monotone"
                                    dataKey={`value${idx}`}
                                    name={ds.label}
                                    stroke={colors[idx]}
                                    fill={colors[idx]}
                                    fillOpacity={0.6}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'pie':
            case 'donut':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={isFullscreen ? 180 : 120}
                                innerRadius={content.chart.type === 'donut' ? (isFullscreen ? 100 : 60) : 0}
                                fill="#8884d8"
                                dataKey="value0"
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    const renderLayout = () => {
        switch (content.layout) {
            case 'title':
                return (
                    <div className="h-full flex flex-col items-center justify-center text-center px-16">
                        <div
                            className="w-full py-12 px-8 rounded-2xl mb-8"
                            style={headerStyle}
                        >
                            <h1
                                className={cn(
                                    "font-bold mb-4",
                                    isFullscreen ? "text-7xl" : "text-5xl"
                                )}
                                style={{ fontFamily: theme.fonts.heading }}
                            >
                                {content.title}
                            </h1>
                            {content.subtitle && (
                                <p
                                    className={cn(
                                        "opacity-90",
                                        isFullscreen ? "text-2xl" : "text-xl"
                                    )}
                                    style={{ fontFamily: theme.fonts.body }}
                                >
                                    {content.subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                );

            case 'content':
                return (
                    <div className="h-full flex flex-col p-12">
                        <h2
                            className={cn(
                                "font-bold mb-8",
                                isFullscreen ? "text-5xl" : "text-4xl"
                            )}
                            style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}
                        >
                            {content.title}
                        </h2>
                        {content.subtitle && (
                            <p
                                className={cn(
                                    "mb-6",
                                    isFullscreen ? "text-xl" : "text-lg"
                                )}
                                style={{ color: theme.colors.textMuted }}
                            >
                                {content.subtitle}
                            </p>
                        )}
                        {content.bullets && (
                            <ul className="space-y-4 flex-1">
                                {content.bullets.map((bullet, i) => (
                                    <li
                                        key={i}
                                        className={cn(
                                            "flex items-start gap-4",
                                            isFullscreen ? "text-2xl" : "text-xl"
                                        )}
                                        style={{ color: theme.colors.text }}
                                    >
                                        <span
                                            className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                                            style={{ backgroundColor: theme.colors.primary }}
                                        />
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {content.content && (
                            <p
                                className={cn(
                                    "leading-relaxed",
                                    isFullscreen ? "text-xl" : "text-lg"
                                )}
                                style={{ color: theme.colors.text }}
                            >
                                {content.content}
                            </p>
                        )}
                    </div>
                );

            case 'chart-full':
                return (
                    <div className="h-full flex flex-col p-12">
                        <h2
                            className={cn(
                                "font-bold mb-2",
                                isFullscreen ? "text-5xl" : "text-4xl"
                            )}
                            style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}
                        >
                            {content.title}
                        </h2>
                        {content.subtitle && (
                            <p
                                className={cn(
                                    "mb-8",
                                    isFullscreen ? "text-xl" : "text-lg"
                                )}
                                style={{ color: theme.colors.textMuted }}
                            >
                                {content.subtitle}
                            </p>
                        )}
                        <div className="flex-1 flex items-center justify-center">
                            {renderChart()}
                        </div>
                    </div>
                );

            case 'metrics':
                return (
                    <div className="h-full flex flex-col p-12">
                        <h2
                            className={cn(
                                "font-bold mb-12",
                                isFullscreen ? "text-5xl" : "text-4xl"
                            )}
                            style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}
                        >
                            {content.title || 'Key Metrics'}
                        </h2>
                        <div className={cn(
                            "grid gap-6 flex-1",
                            content.metrics && content.metrics.length <= 2 ? "grid-cols-2" : "grid-cols-4"
                        )}>
                            {content.metrics?.map((metric, i) => (
                                <Card
                                    key={i}
                                    className="border-2 shadow-lg hover:shadow-xl transition-shadow"
                                    style={cardStyle}
                                >
                                    <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                                        <div className={cn(
                                            "mb-4",
                                            isFullscreen ? "text-5xl" : "text-4xl"
                                        )}>
                                            {metric.icon}
                                        </div>
                                        <p
                                            className={cn(
                                                "font-medium mb-3",
                                                isFullscreen ? "text-lg" : "text-base"
                                            )}
                                            style={{ color: theme.colors.textMuted }}
                                        >
                                            {metric.label}
                                        </p>
                                        <p
                                            className={cn(
                                                "font-bold",
                                                isFullscreen ? "text-5xl" : "text-4xl"
                                            )}
                                            style={{ color: theme.colors.primary }}
                                        >
                                            {metric.value}
                                            {metric.unit && (
                                                <span
                                                    className={cn(
                                                        "ml-2",
                                                        isFullscreen ? "text-3xl" : "text-2xl"
                                                    )}
                                                    style={{ color: theme.colors.textMuted }}
                                                >
                                                    {metric.unit}
                                                </span>
                                            )}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                );

            case 'insight':
                return (
                    <div className="h-full flex flex-col p-12">
                        <div
                            className="w-full py-8 px-10 rounded-2xl mb-8"
                            style={headerStyle}
                        >
                            <h2
                                className={cn(
                                    "font-bold",
                                    isFullscreen ? "text-5xl" : "text-4xl"
                                )}
                                style={{ fontFamily: theme.fonts.heading }}
                            >
                                {content.title}
                            </h2>
                        </div>

                        {content.insight && (
                            <div className="flex-1 space-y-8">
                                {content.insight.summary && (
                                    <Card className="border-2 shadow-lg" style={cardStyle}>
                                        <CardContent className="p-8">
                                            <h3
                                                className={cn(
                                                    "font-semibold mb-4",
                                                    isFullscreen ? "text-2xl" : "text-xl"
                                                )}
                                                style={{ color: theme.colors.secondary }}
                                            >
                                                Overview
                                            </h3>
                                            <p
                                                className={cn(
                                                    "leading-relaxed",
                                                    isFullscreen ? "text-xl" : "text-lg"
                                                )}
                                                style={{ color: theme.colors.text }}
                                            >
                                                {content.insight.summary}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                {content.insight.keyPoints && content.insight.keyPoints.length > 0 && (
                                    <Card className="border-2 shadow-lg" style={cardStyle}>
                                        <CardContent className="p-8">
                                            <h3
                                                className={cn(
                                                    "font-semibold mb-6",
                                                    isFullscreen ? "text-2xl" : "text-xl"
                                                )}
                                                style={{ color: theme.colors.secondary }}
                                            >
                                                Key Findings
                                            </h3>
                                            <ul className="space-y-4">
                                                {content.insight.keyPoints.map((point, i) => (
                                                    <li
                                                        key={i}
                                                        className={cn(
                                                            "flex items-start gap-4",
                                                            isFullscreen ? "text-xl" : "text-lg"
                                                        )}
                                                        style={{ color: theme.colors.text }}
                                                    >
                                                        <span
                                                            className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                                                            style={{ backgroundColor: theme.colors.accent }}
                                                        />
                                                        <span>{point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                );

            default:
                return (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">Unsupported layout</p>
                    </div>
                );
        }
    };

    return (
        <div
            className="w-full h-full rounded-xl shadow-2xl overflow-hidden"
            style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text
            }}
        >
            {renderLayout()}
        </div>
    );
}
