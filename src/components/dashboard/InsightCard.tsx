/**
 * Insight Card Component
 * Displays pinned insights on dashboard with drill-down capability
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Lightbulb,
    TrendingUp,
    AlertTriangle,
    Target,
    Sparkles,
    ArrowRight,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PinnedInsightRecord, PinTag } from '@/lib/types/notebook';
import { useNavigate } from 'react-router-dom';

interface InsightCardProps {
    insight: PinnedInsightRecord;
    rank?: number;
}

const tagConfig: Record<PinTag, { icon: React.ElementType; color: string; label: string }> = {
    trend: {
        icon: TrendingUp,
        color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950',
        label: 'Trend'
    },
    correlation: {
        icon: Target,
        color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950',
        label: 'Correlation'
    },
    outlier: {
        icon: AlertTriangle,
        color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950',
        label: 'Outlier'
    },
    risk: {
        icon: AlertTriangle,
        color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950',
        label: 'Risk'
    },
    quality: {
        icon: CheckCircle2,
        color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950',
        label: 'Quality'
    }
};

const confidenceConfig = {
    high: { color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400', label: 'High Confidence' },
    medium: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', label: 'Medium Confidence' },
    low: { color: 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-400', label: 'Low Confidence' }
};

export const InsightCard: React.FC<InsightCardProps> = ({ insight, rank }) => {
    const navigate = useNavigate();
    const confidence = insight.insight_data.confidence;
    const primaryTag = insight.tags[0];
    const tagInfo = primaryTag ? tagConfig[primaryTag] : null;
    const TagIcon = tagInfo?.icon || Lightbulb;

    const handleDrillDown = () => {
        // Navigate to insights page in notebook mode with specific notebook and cell highlighted
        const drilldownPath = insight.insight_data.pin_metadata.drilldown_path;

        navigate('/insights', {
            state: {
                mode: 'notebook',
                notebookId: insight.notebook_id,
                highlightCellId: drilldownPath.target_cell_ids[0] // Highlight first target cell
            }
        });
    };

    return (
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-l-4 border-l-primary">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                        {/* Icon */}
                        <div className={cn(
                            'p-2 rounded-lg',
                            tagInfo?.color || 'bg-primary/10'
                        )}>
                            <TagIcon className="w-5 h-5" />
                        </div>

                        {/* Title and badges */}
                        <div className="flex-1 min-w-0">
                            {rank && (
                                <Badge variant="outline" className="mb-2 text-xs">
                                    #{rank}
                                </Badge>
                            )}
                            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                                {insight.title}
                            </CardTitle>
                        </div>
                    </div>
                </div>

                {/* Tags and Confidence */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    {/* Tags */}
                    {insight.tags.map((tag) => {
                        const config = tagConfig[tag];
                        return (
                            <Badge key={tag} variant="secondary" className="text-xs">
                                {config.label}
                            </Badge>
                        );
                    })}

                    {/* Confidence Badge */}
                    <Badge className={cn('text-xs', confidenceConfig[confidence].color)}>
                        {confidenceConfig[confidence].label}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent>
                {/* Description */}
                <CardDescription className="text-sm leading-relaxed line-clamp-3">
                    {insight.description}
                </CardDescription>

                {/* Key Evidence Preview */}
                {insight.insight_data.key_evidence && insight.insight_data.key_evidence.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Key Evidence:</p>
                        <ul className="space-y-1">
                            {insight.insight_data.key_evidence.slice(0, 2).map((evidence, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                    <span className="text-primary mt-0.5">•</span>
                                    <span className="line-clamp-1">{evidence}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDrillDown}
                    className="w-full group/btn"
                >
                    <span>View Full Analysis</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
            </CardFooter>

            {/* Timestamp */}
            <div className="px-6 pb-4">
                <p className="text-xs text-muted-foreground">
                    Pinned {new Date(insight.created_at).toLocaleDateString()}
                </p>
            </div>
        </Card>
    );
};
