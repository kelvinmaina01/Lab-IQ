import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, ShieldCheck, Zap, Users, ArrowUpRight, HeartPulse } from "lucide-react";
import { useLabHealth } from "@/hooks/useLabHealth";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from 'react-router-dom';

export const CommandCenterCard = () => {
    const {
        diagnosticConfidence,
        dataIntegrity,
        analysisTurnaround,
        teamVelocity,
        operationalEfficiency,
        isLoading
    } = useLabHealth();

    const navigate = useNavigate();

    const handleViewReport = () => {
        navigate('/reports', {
            state: {
                reportType: 'system-health',
                data: {
                    diagnosticConfidence,
                    dataIntegrity,
                    analysisTurnaround,
                    teamVelocity,
                    operationalEfficiency,
                    timestamp: new Date().toISOString()
                }
            }
        });
    };

    if (isLoading) {
        return <CommandCenterSkeleton />;
    }

    // Determine health color
    const getHealthColor = (score: number) => {
        if (score >= 80) return "text-emerald-500";
        if (score >= 60) return "text-amber-500";
        return "text-rose-500";
    };

    const healthColor = getHealthColor(operationalEfficiency);

    return (
        <Card className="col-span-12 lg:col-span-8 border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-xl font-bold">
                            <HeartPulse className="h-6 w-6 text-primary" />
                            Command Center
                        </CardTitle>
                        <CardDescription>
                            Real-time operational signals from your lab environment
                        </CardDescription>
                    </div>
                    <div className={`text-4xl font-bold ${healthColor} flex items-center gap-2`}>
                        {operationalEfficiency}%
                        <span className="text-sm font-medium text-muted-foreground self-end mb-2">Efficiency</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">

                    {/* Diagnostic Confidence */}
                    <div className="space-y-2 p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Activity className="h-4 w-4 text-blue-500" />
                                Diagnostic Confidence
                            </span>
                            <span className="font-bold text-lg">{diagnosticConfidence}%</span>
                        </div>
                        <Progress value={diagnosticConfidence} className="h-2 bg-blue-500/10" indicatorClassName="bg-blue-500" />
                        <p className="text-xs text-muted-foreground">
                            Avg. model accuracy across {diagnosticConfidence > 0 ? "deployed models" : "all models"}
                        </p>
                    </div>

                    {/* Data Integrity */}
                    <div className="space-y-2 p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                Data Integrity
                            </span>
                            <span className="font-bold text-lg">{dataIntegrity}%</span>
                        </div>
                        <Progress value={dataIntegrity} className="h-2 bg-emerald-500/10" indicatorClassName="bg-emerald-500" />
                        <p className="text-xs text-muted-foreground">
                            Quality score of active datasets
                        </p>
                    </div>

                    {/* Turnaround Time */}
                    <div className="space-y-2 p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-500" />
                                Avg Turnaround
                            </span>
                            <span className="font-bold text-lg">
                                {analysisTurnaround > 0 ? `${(analysisTurnaround / 60000).toFixed(1)}m` : "N/A"}
                            </span>
                        </div>
                        {/* Visualizing "speed" - inverse of duration? Just a static bar for presence now */}
                        <Progress value={analysisTurnaround > 0 ? 100 : 0} className="h-2 bg-amber-500/10" indicatorClassName="bg-amber-500" />
                        <p className="text-xs text-muted-foreground">
                            Mean time to insight (Workflow Speed)
                        </p>
                    </div>

                </div>

                <div className="mt-6 flex items-center justify-between text-sm bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="font-medium text-foreground">{teamVelocity}</span> active team members this week
                    </div>
                    <div
                        onClick={handleViewReport}
                        className="flex items-center gap-1 text-emerald-500 font-medium cursor-pointer hover:underline transition-all hover:gap-2"
                    >
                        View Analysis Report <ArrowUpRight className="h-3 w-3" />
                    </div>
                </div>

            </CardContent>
        </Card>
    );
};

const CommandCenterSkeleton = () => (
    <Card className="col-span-12 lg:col-span-8 h-[300px] border-primary/20">
        <CardHeader>
            <div className="flex justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-12 w-24" />
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-3 gap-6 mt-4">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
            </div>
        </CardContent>
    </Card>
);
