/**
 * CollapsibleDashboardCard - Expandable/collapsible card wrapper for dashboard items
 * Provides PromptBI-style collapsible functionality
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ChevronDown,
    ChevronUp,
    MoreVertical,
    Star,
    StarOff,
    Trash2,
    Copy,
    Download,
    Maximize2,
    Brain,
    ArrowUpRight
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { DashboardSource } from '@/lib/services/dashboardService';

// Source badge colors
const SOURCE_COLORS: Record<DashboardSource, string> = {
    ai_assistant: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    manual: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    experiment: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    report: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    workflow: 'bg-green-500/10 text-green-600 border-green-500/20',
    system: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

const SOURCE_LABELS: Record<DashboardSource, string> = {
    ai_assistant: 'AI',
    manual: 'Manual',
    experiment: 'Experiment',
    report: 'Report',
    workflow: 'Workflow',
    system: 'System',
};

interface CollapsibleDashboardCardProps {
    id: string;
    title: string;
    description?: string;
    source: DashboardSource;
    isFavorite?: boolean;
    createdAt?: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    onToggleFavorite?: () => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    onExport?: () => void;
    onExpand?: () => void;
    className?: string;
    onAnalyze?: () => void;
}

export function CollapsibleDashboardCard({
    id,
    title,
    description,
    source,
    isFavorite = false,
    createdAt,
    children,
    defaultOpen = true,
    onToggleFavorite,
    onDelete,
    onDuplicate,
    onExport,
    onExpand,
    onAnalyze,
    className
}: CollapsibleDashboardCardProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className={cn("transition-all duration-200", className)}>
                <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                    {isOpen ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>

                            <div className="min-w-0 flex-1">
                                <CardTitle className="text-sm font-medium truncate">
                                    {title}
                                </CardTitle>
                                {description && !isOpen && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {description}
                                    </p>
                                )}
                            </div>

                            <Badge
                                variant="outline"
                                className={cn("text-[10px] shrink-0", SOURCE_COLORS[source])}
                            >
                                {SOURCE_LABELS[source]}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                            {onToggleFavorite && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                                >
                                    {isFavorite ? (
                                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                    ) : (
                                        <StarOff className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                </Button>
                            )}

                            {/* Drill Down Button - Link to AI Analysis */}
                            {onAnalyze && (source === 'ai_assistant' || (data && (data as any).context)) && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-primary hover:text-primary/80 hover:bg-primary/10"
                                                onClick={(e) => { e.stopPropagation(); onAnalyze(); }}
                                            >
                                                <div className="flex items-center text-[10px] font-bold mr-1">Drill down</div>
                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>View Original Analysis</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}

                            {onExpand && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => { e.stopPropagation(); onExpand(); }}
                                >
                                    <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                            )}

                            {onAnalyze && source === 'ai_assistant' && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={(e) => { e.stopPropagation(); onAnalyze(); }}
                                            >
                                                <Brain className="h-3.5 w-3.5 text-primary" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Detailed Analysis</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {onDuplicate && (
                                        <DropdownMenuItem onClick={onDuplicate}>
                                            <Copy className="h-4 w-4 mr-2" /> Duplicate
                                        </DropdownMenuItem>
                                    )}
                                    {onExport && (
                                        <DropdownMenuItem onClick={onExport}>
                                            <Download className="h-4 w-4 mr-2" /> Export
                                        </DropdownMenuItem>
                                    )}
                                    {(onDuplicate || onExport) && onDelete && (
                                        <DropdownMenuSeparator />
                                    )}
                                    {onDelete && (
                                        <DropdownMenuItem
                                            onClick={onDelete}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="pt-0 pb-4 px-4">
                        {children}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}

export default CollapsibleDashboardCard;
