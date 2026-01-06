/**
 * ExperimentStateFlow - State Machine Visualization
 * 
 * Per Blueprint Phase 4: Experiments
 * Displays experiment status with visual state machine: PLANNED → RUNNING → COMPLETED → FAILED
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
    Circle,
    Play,
    CheckCircle,
    XCircle,
    ArrowRight,
    Clock,
    Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// =============================================================================
// TYPES
// =============================================================================

export type ExperimentStatus = 'planned' | 'running' | 'completed' | 'failed';

export interface ExperimentStateFlowProps {
    currentStatus: ExperimentStatus;
    startedAt?: string;
    completedAt?: string;
    className?: string;
    showLabels?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

// =============================================================================
// STATE CONFIGURATION
// =============================================================================

const STATES: { key: ExperimentStatus; label: string; icon: React.ElementType }[] = [
    { key: 'planned', label: 'Planned', icon: Circle },
    { key: 'running', label: 'Running', icon: Play },
    { key: 'completed', label: 'Completed', icon: CheckCircle },
];

const STATE_COLORS: Record<ExperimentStatus, { bg: string; text: string; border: string }> = {
    planned: { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500' },
    running: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500' },
    completed: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500' },
};

const SIZE_CONFIG = {
    sm: { icon: 'h-4 w-4', circle: 'h-6 w-6', connector: 'w-4', text: 'text-xs' },
    md: { icon: 'h-5 w-5', circle: 'h-8 w-8', connector: 'w-8', text: 'text-sm' },
    lg: { icon: 'h-6 w-6', circle: 'h-10 w-10', connector: 'w-12', text: 'text-base' },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function ExperimentStateFlow({
    currentStatus,
    startedAt,
    completedAt,
    className,
    showLabels = true,
    size = 'md',
}: ExperimentStateFlowProps) {
    const sizes = SIZE_CONFIG[size];

    const getStateIndex = (status: ExperimentStatus): number => {
        if (status === 'failed') return 1; // Failed branches from running
        return STATES.findIndex(s => s.key === status);
    };

    const currentIndex = getStateIndex(currentStatus);

    const isStateComplete = (stateKey: ExperimentStatus): boolean => {
        if (currentStatus === 'failed') {
            return stateKey === 'planned';
        }
        return getStateIndex(stateKey) < currentIndex;
    };

    const isStateCurrent = (stateKey: ExperimentStatus): boolean => {
        return stateKey === currentStatus;
    };

    return (
        <div className={cn('flex flex-col', className)}>
            {/* Main Flow */}
            <div className="flex items-center">
                {STATES.map((state, index) => (
                    <React.Fragment key={state.key}>
                        {/* State Circle */}
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    'rounded-full flex items-center justify-center border-2 transition-all',
                                    sizes.circle,
                                    isStateCurrent(state.key) && STATE_COLORS[currentStatus].bg,
                                    isStateCurrent(state.key) && STATE_COLORS[currentStatus].border,
                                    isStateComplete(state.key) && 'bg-green-500/10 border-green-500',
                                    !isStateCurrent(state.key) && !isStateComplete(state.key) && 'border-muted-foreground/30'
                                )}
                            >
                                {isStateCurrent(state.key) && currentStatus === 'running' ? (
                                    <Loader2 className={cn(sizes.icon, 'animate-spin text-blue-500')} />
                                ) : isStateComplete(state.key) ? (
                                    <CheckCircle className={cn(sizes.icon, 'text-green-500')} />
                                ) : isStateCurrent(state.key) ? (
                                    <state.icon className={cn(sizes.icon, STATE_COLORS[currentStatus].text)} />
                                ) : (
                                    <state.icon className={cn(sizes.icon, 'text-muted-foreground/30')} />
                                )}
                            </div>
                            {showLabels && (
                                <span className={cn(
                                    'mt-1',
                                    sizes.text,
                                    isStateCurrent(state.key) ? STATE_COLORS[currentStatus].text : 'text-muted-foreground'
                                )}>
                                    {state.label}
                                </span>
                            )}
                        </div>

                        {/* Connector Arrow */}
                        {index < STATES.length - 1 && (
                            <div className={cn('flex items-center mx-1', sizes.connector)}>
                                <div className={cn(
                                    'h-0.5 flex-1',
                                    isStateComplete(STATES[index + 1].key) ||
                                        (isStateComplete(state.key) && (currentStatus === 'running' || currentStatus === 'completed'))
                                        ? 'bg-green-500'
                                        : 'bg-muted-foreground/30'
                                )} />
                                <ArrowRight className={cn(
                                    'h-3 w-3 -ml-1',
                                    isStateComplete(STATES[index + 1].key) ||
                                        (isStateComplete(state.key) && (currentStatus === 'running' || currentStatus === 'completed'))
                                        ? 'text-green-500'
                                        : 'text-muted-foreground/30'
                                )} />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Failed State (branches from Running) */}
            {currentStatus === 'failed' && (
                <div className="flex items-center mt-2 ml-16">
                    <div className="h-4 w-0.5 bg-red-500" />
                    <ArrowRight className="h-3 w-3 text-red-500 rotate-90 -ml-1" />
                    <div className="flex flex-col items-center ml-2">
                        <div className={cn(
                            'rounded-full flex items-center justify-center border-2',
                            sizes.circle,
                            STATE_COLORS.failed.bg,
                            STATE_COLORS.failed.border
                        )}>
                            <XCircle className={cn(sizes.icon, 'text-red-500')} />
                        </div>
                        {showLabels && (
                            <span className={cn('mt-1 text-red-500', sizes.text)}>
                                Failed
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Timestamps */}
            {(startedAt || completedAt) && (
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    {startedAt && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Started: {new Date(startedAt).toLocaleDateString()}
                        </div>
                    )}
                    {completedAt && (
                        <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Completed: {new Date(completedAt).toLocaleDateString()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// STATUS BADGE COMPONENT
// =============================================================================

export interface ExperimentStatusBadgeProps {
    status: ExperimentStatus;
    className?: string;
}

export function ExperimentStatusBadge({ status, className }: ExperimentStatusBadgeProps) {
    const colors = STATE_COLORS[status];

    return (
        <Badge
            className={cn(
                colors.bg,
                colors.text,
                'border-0',
                className
            )}
        >
            {status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
            {status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
            {status === 'planned' && <Circle className="h-3 w-3 mr-1" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );
}
