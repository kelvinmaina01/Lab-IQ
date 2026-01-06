import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PinnedDashboard } from "@/lib/services/dashboardService";
import {
    Brain,
    Lightbulb,
    FileText,
    TrendingUp,
    BarChart3,
    Calendar,
    Database
} from "lucide-react";
import { DashboardCard } from './DashboardCard';
// import { ReasoningCard } from '../notebook/ReasoningCard'; // Assuming we can reuse this or similar
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DrillDownPanelProps {
    isOpen: boolean;
    onClose: () => void;
    dashboardItem: PinnedDashboard | null;
}

export const DrillDownPanel: React.FC<DrillDownPanelProps> = ({
    isOpen,
    onClose,
    dashboardItem
}) => {
    if (!dashboardItem) return null;

    const { title, description, data, source, created_at, category, tags } = dashboardItem;
    const thoughtProcess = data.thoughtProcess || (data.context as any)?.thoughtProcess || [];

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px] md:w-[700px] lg:w-[800px] sm:max-w-none overflow-hidden flex flex-col p-0">

                {/* Header Section */}
                <div className="p-6 pb-2 border-b bg-muted/10">
                    <SheetHeader className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <Badge variant="outline" className="flex gap-1 items-center capitalize">
                                    {source === 'ai_assistant' ? <Brain className="w-3 h-3" /> : <BarChart3 className="w-3 h-3" />}
                                    {source.replace('_', ' ')}
                                </Badge>
                                <Badge variant="secondary" className="flex gap-1 items-center capitalize">
                                    {category}
                                </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(created_at).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <SheetTitle className="text-2xl font-bold tracking-tight">{title}</SheetTitle>
                            <SheetDescription className="text-base line-clamp-2">
                                {description}
                            </SheetDescription>
                        </div>

                        {tags && tags.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                ))}
                            </div>
                        )}
                    </SheetHeader>
                </div>

                {/* Scrollable Content */}
                <ScrollArea className="flex-1 p-6 bg-background">
                    <div className="space-y-8 max-w-4xl mx-auto pb-10">

                        {/* 1. Visual Focus (The Chart/Metric) */}
                        <section>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="h-[300px] md:h-[350px] w-full">
                                    {/* We pass a stripped down version of the item to DashboardCard to force it to render the viz only */}
                                    {/* Or we could extract the render logic. For now, reusing DashboardCard is easiest but might have overhead. */}
                                    {/* Let's just create a wrapper that disables interactions/menus for the preview */}
                                    <DashboardCard
                                        dashboard={dashboardItem}
                                        onToggleFavorite={() => { }}
                                        onDuplicate={() => { }}
                                        onDelete={() => { }}
                                        onExport={() => { }}
                                        className="h-full border shadow-sm pointer-events-none" // Disable interactions on the preview
                                    />
                                </div>

                                {/* Key Metrics / Quick Stats Side by Side */}
                                <div className="space-y-4">
                                    <Card>
                                        <CardHeader className="py-3 px-4 bg-muted/20">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-primary" />
                                                <CardTitle className="text-sm font-medium">Key Metrics</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-4">
                                            {data.value && (
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Main Value</div>
                                                    <div className="text-2xl font-bold">{data.value} <span className="text-base font-normal text-muted-foreground">{data.unit}</span></div>
                                                </div>
                                            )}
                                            {data.keyPoints && data.keyPoints.slice(0, 3).map((point, idx) => (
                                                <div key={idx} className="flex gap-2 items-start text-sm border-l-2 border-primary/20 pl-3">
                                                    <span>{point}</span>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </section>

                        {/* 2. Deep Dive Analysis (Tabs) */}
                        <section>
                            <Tabs defaultValue="analysis" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="analysis">Analysis & Findings</TabsTrigger>
                                    <TabsTrigger value="thought-process">AI Thought Process</TabsTrigger>
                                    <TabsTrigger value="data">Raw Data</TabsTrigger>
                                </TabsList>

                                {/* Analysis Tab */}
                                <TabsContent value="analysis" className="mt-6 space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <h3 className="flex items-center gap-2 text-lg font-semibold">
                                            <FileText className="w-5 h-5 text-primary" />
                                            Detailed Analysis
                                        </h3>
                                        <div className="bg-muted/30 p-4 rounded-lg border text-sm leading-relaxed whitespace-pre-wrap">
                                            {data.context?.fullContent || data.summary || "No detailed analysis available."}
                                        </div>
                                    </div>

                                    {data.recommendations && data.recommendations.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="flex items-center gap-2 text-lg font-semibold">
                                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                                                Strategic Recommendations
                                            </h3>
                                            <div className="grid gap-3">
                                                {data.recommendations.map((rec, i) => (
                                                    <Card key={i} className="border-l-4 border-l-yellow-500/50">
                                                        <CardContent className="p-4 text-sm">
                                                            {rec}
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Thought Process Tab */}
                                <TabsContent value="thought-process" className="mt-6 animate-in slide-in-from-bottom-2 duration-500">
                                    <div className="space-y-4">
                                        <h3 className="flex items-center gap-2 text-lg font-semibold">
                                            <Brain className="w-5 h-5 text-primary" />
                                            How AI Arrived at this Conclusion
                                        </h3>

                                        {thoughtProcess && thoughtProcess.length > 0 ? (
                                            <div className="space-y-4">
                                                {thoughtProcess.map((step: any, idx: number) => (
                                                    <div key={idx} className="relative pl-8 pb-6 border-l-2 border-muted last:border-0 last:pb-0">
                                                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Step {idx + 1}</span>
                                                            <p className="text-sm">{typeof step === 'string' ? step : step.thought || step.action}</p>
                                                            {/* Support both simple string array and object array */}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-muted-foreground text-sm italic p-8 text-center border rounded-lg border-dashed">
                                                No thought process data captured for this insight.
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Raw Data Tab */}
                                <TabsContent value="data" className="mt-6 animate-in slide-in-from-bottom-2 duration-500">
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <Database className="w-4 h-4 text-muted-foreground" />
                                                <CardTitle className="text-sm">Underlying Data Configuration</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <ScrollArea className="h-[400px]">
                                                <pre className="text-xs font-mono bg-muted/50 p-4 rounded-lg overflow-auto">
                                                    {JSON.stringify({ config: dashboardItem.config, data: dashboardItem.data }, null, 2)}
                                                </pre>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </section>

                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};
