
/**
 * Metric Cell Renderer
 * Displays KPIs in cards matching the user's "Glass Box" / Dashboard design
 * Styling: Title Top-Left, Value Bottom-Left (Big), Icon Top-Right (Arrow)
 */

import React, { useState } from 'react';
import { NotebookCell, MetricCellContent, Metric } from '@/lib/types/notebook';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pin, Info, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricCellProps {
    cell: NotebookCell;
    isHighlighted?: boolean;
    userId: string;
    notebookId: string;
}

export const MetricCell = React.forwardRef<HTMLDivElement, MetricCellProps>(
    ({ cell, isHighlighted, userId, notebookId }, ref) => {
        const content = cell.content as MetricCellContent;
        const { toast } = useToast();
        const [isPinning, setIsPinning] = useState(false);
        const [showPinDialog, setShowPinDialog] = useState(false);

        // Track which metric is being pinned if we want granular pinning
        // For now, the implementation supports pinning the *entire cell* (all metrics) as one Insight Unit
        // But the user's screenshot suggests individual cards might be pinnable? 
        // "Screenshot 0" shows individual cards on dashboard.
        // If we pin the cell, we should probably pin ALL data, and the Dashboard can choose how to render it.

        const handlePinConfirm = async (title: string, description: string, dashboardId: string | null, newDashboardName?: string) => {
            if (!content.pin_metadata) return;
            setIsPinning(true);
            try {
                // In a real app, we'd handle 'dashboardId' or create 'newDashboardName' logic here or in backend
                // For MVP, we insert into standard pinned_insights table

                const { error } = await supabase.from('pinned_insights').insert({
                    user_id: userId,
                    notebook_id: notebookId,
                    cell_id: cell.cell_id,
                    title: title,
                    description: description,
                    insight_data: content,
                    tags: content.pin_metadata.pin_tags
                });

                if (error) throw error;
                toast({ title: 'Metrics Pinned', description: `Added to ${newDashboardName || 'Dashboard'}` });
            } catch (error) {
                toast({ title: 'Pin Failed', description: 'Could not pin metrics', variant: 'destructive' });
            } finally {
                setIsPinning(false);
            }
        };

        return (
            <div ref={ref} className={cn("space-y-4", isHighlighted && "ring-2 ring-primary ring-offset-2 rounded-lg p-2")}>

                <div className="flex items-center justify-between">
                    {/* Header Hidden/Minimal for clean look as per request */}
                    <div className="flex w-full justify-end mb-2">
                        {/* Pinning Removed */}
                    </div>
                </div>

                {/* Grid of Cards matching Screenshot 0 Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {content.metrics.map((metric, idx) => (
                        <Card
                            key={idx}
                            className="bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow border border-border/60 relative overflow-hidden"
                        >
                            <CardContent className="p-5 flex flex-col justify-between h-[140px]">
                                {/* Top Row: Title + Icon */}
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium text-muted-foreground line-clamp-2 leading-tight pr-4">
                                        {metric.label}
                                    </span>
                                    {/* Trend Icon - Mocked based on value or random for style if not provided */}
                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/50" />
                                </div>

                                {/* Bottom Row: Value */}
                                <div className="mt-auto">
                                    <span className="text-4xl font-bold tracking-tight text-foreground">
                                        {metric.value}
                                    </span>
                                </div>

                                {/* Context/Interpretation Tooltip */}
                                {metric.interpretation && (
                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="h-4 w-4 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs text-xs">
                                                    {metric.interpretation}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }
);
