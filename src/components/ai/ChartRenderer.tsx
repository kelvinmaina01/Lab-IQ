import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    ScatterChart,
    Scatter,
    PieChart,
    Pie,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig } from '@/lib/services/promptBIService';

interface ChartRendererProps {
    config: ChartConfig;
    data: any[];
    height?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const ChartRenderer: React.FC<ChartRendererProps> = ({ config, data, height = 300 }) => {
    const { type, title, xAxis, yAxis, description, colors = COLORS } = config;

    // Ensure data exists
    if (!data || data.length === 0) {
        return (
            <Card className="h-full flex items-center justify-center p-6 text-muted-foreground">
                No data available for visualization
            </Card>
        );
    }

    const renderChart = () => {
        switch (type) {
            case 'bar':
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey={xAxis} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {yAxis.map((key, i) => (
                            <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                        ))}
                    </BarChart>
                );

            case 'line':
                return (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey={xAxis} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {yAxis.map((key, i) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={colors[i % colors.length]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                            />
                        ))}
                    </LineChart>
                );

            case 'area':
                return (
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey={xAxis} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {yAxis.map((key, i) => (
                            <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                fill={colors[i % colors.length]}
                                stroke={colors[i % colors.length]}
                                fillOpacity={0.3}
                            />
                        ))}
                    </AreaChart>
                );

            case 'pie':
                // Pie usually expects one value key. We take the first yAxis.
                const valueKey = yAxis[0];
                return (
                    <PieChart>
                        <Tooltip />
                        <Legend />
                        <Pie
                            data={data}
                            dataKey={valueKey}
                            nameKey={xAxis}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                );

            case 'scatter':
                // Scatter usually needs numeric X and Y
                const xKey = xAxis; // Assuming numeric for scatter, or index
                const yKeyScore = yAxis[0];
                return (
                    <ScatterChart>
                        <CartesianGrid />
                        <XAxis type="number" dataKey={xKey} name={xKey} />
                        <YAxis type="number" dataKey={yKeyScore} name={yKeyScore} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Legend />
                        <Scatter name={title} data={data} fill={colors[0]} />
                    </ScatterChart>
                );

            default:
                return <div>Unsupported chart type: {type}</div>;
        }
    };

    return (
        <Card className="w-full h-full shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div style={{ width: '100%', height: height }}>
                    <ResponsiveContainer>
                        {renderChart()}
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
