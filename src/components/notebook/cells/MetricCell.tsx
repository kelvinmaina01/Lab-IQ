/**
 * Metric Cell Renderer
 * Displays KPIs and quantitative values
 */

import React from 'react';
import { NotebookCell, MetricCellContent } from '@/lib/types/notebook';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCellProps {
    cell: NotebookCell;
    isHighlighted?: boolean;
}

export const MetricCell = React.forwardRef<HTMLDivElement, MetricCellProps>(
    ({ cell, isHighlighted }, ref) => {
        const content = cell.content as MetricCellContent;
        const emphasis = cell.ui_hints.emphasis;

        return (
            <Card
                ref={ref}
                className={cn(
                    'p-6 border-l-4 border-l-green-500',
                    emphasis === 'highlighted' && 'bg-green-50/30 dark:bg-green-950/10',
                    emphasis === 'critical' && 'bg-green-50/50 dark:bg-green-950/20 ring-1 ring-green-500/20',
                    isHighlighted && 'ring-2 ring-green-500'
                )}
            >
                <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-4">{cell.title}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {content.metrics.map((metric, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 rounded-lg bg-background border"
                                >
                                    <div className="text-xs text-muted-foreground mb-1">
                                        {metric.label}
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <div className="text-2xl font-bold text-foreground">
                                            {typeof metric.value === 'number'
                                                ? metric.value.toLocaleString()
                                                : metric.value}
                                        </div>
                                        {metric.unit && (
                                            <div className="text-sm text-muted-foreground">{metric.unit}</div>
                                        )}
                                    </div>
                                    {metric.interpretation && (
                                        <div className="text-xs text-muted-foreground mt-2">
                                            {metric.interpretation}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        );
    }
);

MetricCell.displayName = 'MetricCell';
