import React from 'react';
import { Card } from '@/components/ui/card';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface ChartData {
    labels: string[];
    values: number[];
    xLabel?: string;
    yLabel?: string;
}

interface DataVisualizationProps {
    type: 'bar' | 'line' | 'pie';
    data: ChartData;
    title?: string;
    height?: number;
}

const COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE',
    '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
];

export const DataVisualization: React.FC<DataVisualizationProps> = ({
    type,
    data,
    title,
    height = 300
}) => {
    // Transform data for recharts format
    const chartData = data.labels.map((label, index) => ({
        name: label,
        value: data.values[index]
    }));

    const renderChart = () => {
        switch (type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                label={{ value: data.xLabel, position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                label={{ value: data.yLabel, angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                            <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                label={{ value: data.xLabel, position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                label={{ value: data.yLabel, angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#82ca9d"
                                strokeWidth={3}
                                dot={{ fill: '#82ca9d', r: 5 }}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    return (
        <Card className="p-6">
            {title && (
                <h3 className="text-lg font-semibold mb-4">{title}</h3>
            )}
            {renderChart()}
        </Card>
    );
};

// Quick visualization examples
export const VisualizationExamples = () => {
    const barData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [65, 59, 80, 81, 56, 55],
        xLabel: 'Month',
        yLabel: 'Sales'
    };

    const lineData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: [12, 19, 3, 5, 2, 3, 9],
        xLabel: 'Day',
        yLabel: 'Temperature (°C)'
    };

    const pieData = {
        labels: ['Product A', 'Product B', 'Product C', 'Product D'],
        values: [300, 50, 100, 80]
    };

    return (
        <div className="space-y-6 p-6">
            <h2 className="text-2xl font-bold">Data Visualizations</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DataVisualization
                    type="bar"
                    data={barData}
                    title="Bar Chart Example"
                />

                <DataVisualization
                    type="line"
                    data={lineData}
                    title="Line Chart Example"
                />
            </div>

            <DataVisualization
                type="pie"
                data={pieData}
                title="Pie Chart Example"
                height={400}
            />
        </div>
    );
};
