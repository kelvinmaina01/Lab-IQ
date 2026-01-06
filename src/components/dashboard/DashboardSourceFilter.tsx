/**
 * DashboardSourceFilter - Filter tabs for dashboard sources
 * Allows filtering pinned dashboards by their source (AI, Experiments, etc.)
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Brain,
    FlaskConical,
    GitBranch,
    Cpu,
    Database,
    Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardSource } from '@/lib/services/dashboardService';

export type FilterSource = DashboardSource | 'all';

interface SourceConfig {
    label: string;
    icon: React.ElementType;
    color: string;
}

const SOURCE_CONFIG: Record<FilterSource, SourceConfig> = {
    all: {
        label: 'All',
        icon: Layers,
        color: 'text-foreground'
    },
    ai_assistant: {
        label: 'AI Insights',
        icon: Brain,
        color: 'text-blue-500'
    },
    experiment: {
        label: 'Experiments',
        icon: FlaskConical,
        color: 'text-purple-500'
    },
    workflow: {
        label: 'Workflows',
        icon: GitBranch,
        color: 'text-green-500'
    },
    report: {
        label: 'Reports',
        icon: Database,
        color: 'text-orange-500'
    },
    manual: {
        label: 'Manual',
        icon: Cpu,
        color: 'text-gray-500'
    },
    system: {
        label: 'System',
        icon: Cpu,
        color: 'text-slate-500'
    }
};

interface DashboardSourceFilterProps {
    activeFilter: FilterSource;
    onFilterChange: (filter: FilterSource) => void;
    counts?: Partial<Record<FilterSource, number>>;
    className?: string;
}

export function DashboardSourceFilter({
    activeFilter,
    onFilterChange,
    counts = {},
    className
}: DashboardSourceFilterProps) {
    // Only show filters that have items or are 'all'
    const visibleFilters: FilterSource[] = ['all', 'ai_assistant', 'experiment', 'workflow', 'manual'];

    return (
        <div className={cn("flex items-center gap-1 overflow-x-auto pb-2", className)}>
            {visibleFilters.map((source) => {
                const config = SOURCE_CONFIG[source];
                const Icon = config.icon;
                const count = source === 'all'
                    ? Object.values(counts).reduce((a, b) => a + (b || 0), 0)
                    : counts[source] || 0;
                const isActive = activeFilter === source;

                return (
                    <Button
                        key={source}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                            "gap-1.5 shrink-0",
                            isActive && "bg-primary text-primary-foreground",
                            !isActive && config.color
                        )}
                        onClick={() => onFilterChange(source)}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-xs">{config.label}</span>
                        {count > 0 && (
                            <Badge
                                variant={isActive ? "secondary" : "outline"}
                                className="h-4 px-1 text-[10px] ml-1"
                            >
                                {count}
                            </Badge>
                        )}
                    </Button>
                );
            })}
        </div>
    );
}

export default DashboardSourceFilter;
