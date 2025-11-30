import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from "recharts";

export const ModelPerformanceWidget = () => {
    // Mock data for the chart
    const data = [
        { name: 'Mon', accuracy: 82 },
        { name: 'Tue', accuracy: 85 },
        { name: 'Wed', accuracy: 84 },
        { name: 'Thu', accuracy: 89 },
        { name: 'Fri', accuracy: 92 },
        { name: 'Sat', accuracy: 94 },
        { name: 'Sun', accuracy: 95 },
    ];

    return (
        <Card className="p-6 col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Brain className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Model Performance</h3>
                        <p className="text-sm text-muted-foreground">Real-time accuracy tracking</p>
                    </div>
                </div>
                <Link to="/models">
                    <Button variant="outline" size="sm" className="gap-2">
                        View All Models
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="md:col-span-2 h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                            />
                            <YAxis
                                hide
                                domain={[0, 100]}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="accuracy"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorAccuracy)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Stats Column */}
                <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Best Model</span>
                            <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                        </div>
                        <p className="font-bold text-lg">Random Forest v2</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            <span>+2.4% accuracy</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Precision</span>
                            <span className="font-semibold">94.2%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Recall</span>
                            <span className="font-semibold">91.8%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">F1 Score</span>
                            <span className="font-semibold">93.0%</span>
                        </div>
                    </div>

                    <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            Last trained 2 hours ago
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
