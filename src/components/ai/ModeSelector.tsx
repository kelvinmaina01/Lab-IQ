/**
 * AI Mode Selector Component
 * 
 * PromptBI-style 3-mode toggle:
 * - 🧠 Analyst Mode - What is happening in the data?
 * - 🤖 ML Mode - What did the model do, and why?
 * - 📘 Learn Mode - What does this mean in real-world health terms?
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
    Brain,
    FlaskConical,
    GraduationCap,
    Sparkles,
    ChevronDown
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// =============================================================================
// TYPES
// =============================================================================

export type AIMode = 'analyst' | 'ml' | 'learn';

export interface ModeSelectorProps {
    /** Current selected mode */
    mode: AIMode;
    /** Callback when mode changes */
    onModeChange: (mode: AIMode) => void;
    /** Display variant */
    variant?: 'dropdown' | 'tabs' | 'pills';
    /** Size */
    size?: 'sm' | 'md' | 'lg';
    /** CSS class name */
    className?: string;
}

// =============================================================================
// MODE CONFIGURATIONS
// =============================================================================

export const MODE_CONFIG: Record<AIMode, {
    icon: React.ElementType;
    emoji: string;
    label: string;
    shortLabel: string;
    description: string;
    color: string;
    bgColor: string;
    question: string;
}> = {
    analyst: {
        icon: Brain,
        emoji: '🧠',
        label: 'Analyst Mode',
        shortLabel: 'Analyst',
        description: 'What is happening in the data?',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
        question: 'Explore patterns, statistics, and data quality',
    },
    ml: {
        icon: FlaskConical,
        emoji: '🤖',
        label: 'ML Mode',
        shortLabel: 'ML',
        description: 'What did the model do, and why?',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
        question: 'Understand model decisions and predictions',
    },
    learn: {
        icon: GraduationCap,
        emoji: '📘',
        label: 'Learn Mode',
        shortLabel: 'Learn',
        description: 'What does this mean in health terms?',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10 hover:bg-green-500/20',
        question: 'Learn concepts in plain language',
    },
};

// =============================================================================
// DROPDOWN VARIANT
// =============================================================================

const DropdownSelector: React.FC<ModeSelectorProps> = ({
    mode,
    onModeChange,
    size = 'md',
    className,
}) => {
    const config = MODE_CONFIG[mode] || MODE_CONFIG.analyst; // Safe fallback
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'text-xs py-1.5 px-2',
        md: 'text-sm py-2 px-3',
        lg: 'text-base py-2.5 px-4',
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'gap-2 border-border/50 hover:border-border',
                        config.bgColor,
                        sizeClasses[size],
                        className
                    )}
                >
                    <span className="text-lg">{config.emoji}</span>
                    <span className="font-medium hidden sm:inline">{config.shortLabel}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
                {Object.entries(MODE_CONFIG).map(([key, modeConfig]) => {
                    const ModeIcon = modeConfig.icon;
                    const isActive = key === mode;

                    return (
                        <DropdownMenuItem
                            key={key}
                            onClick={() => onModeChange(key as AIMode)}
                            className={cn(
                                'flex flex-col items-start py-3 px-4 cursor-pointer',
                                isActive && 'bg-muted'
                            )}
                        >
                            <div className="flex items-center gap-2 w-full">
                                <span className="text-xl">{modeConfig.emoji}</span>
                                <span className={cn('font-semibold', modeConfig.color)}>
                                    {modeConfig.label}
                                </span>
                                {isActive && (
                                    <Badge variant="secondary" className="ml-auto text-xs">
                                        Active
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 pl-8">
                                {modeConfig.description}
                            </p>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

// =============================================================================
// TABS VARIANT
// =============================================================================

const TabsSelector: React.FC<ModeSelectorProps> = ({
    mode,
    onModeChange,
    size = 'md',
    className,
}) => {
    const sizeClasses = {
        sm: 'gap-1 p-1',
        md: 'gap-1.5 p-1.5',
        lg: 'gap-2 p-2',
    };

    const tabSizeClasses = {
        sm: 'px-2 py-1 text-xs gap-1',
        md: 'px-3 py-1.5 text-sm gap-1.5',
        lg: 'px-4 py-2 text-sm gap-2',
    };

    return (
        <div
            className={cn(
                'inline-flex items-center bg-muted/50 rounded-lg',
                sizeClasses[size],
                className
            )}
        >
            {Object.entries(MODE_CONFIG).map(([key, config]) => {
                const isActive = key === mode;

                return (
                    <button
                        key={key}
                        onClick={() => onModeChange(key as AIMode)}
                        className={cn(
                            'inline-flex items-center rounded-md font-medium transition-all',
                            tabSizeClasses[size],
                            isActive
                                ? cn('bg-background shadow-sm', config.color)
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <span>{config.emoji}</span>
                        <span className="hidden sm:inline">{config.shortLabel}</span>
                    </button>
                );
            })}
        </div>
    );
};

// =============================================================================
// PILLS VARIANT (Full width cards)
// =============================================================================

const PillsSelector: React.FC<ModeSelectorProps> = ({
    mode,
    onModeChange,
    className,
}) => {
    return (
        <div className={cn('grid grid-cols-3 gap-3', className)}>
            {Object.entries(MODE_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const isActive = key === mode;

                return (
                    <button
                        key={key}
                        onClick={() => onModeChange(key as AIMode)}
                        className={cn(
                            'flex flex-col items-center p-4 rounded-xl border-2 transition-all',
                            isActive
                                ? cn('border-current', config.color, config.bgColor.replace('hover:', ''))
                                : 'border-border/50 hover:border-border hover:bg-muted/50'
                        )}
                    >
                        <div className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center mb-2',
                            isActive ? config.bgColor.replace('hover:', '') : 'bg-muted'
                        )}>
                            <Icon className={cn('w-6 h-6', isActive ? config.color : 'text-muted-foreground')} />
                        </div>
                        <span className={cn(
                            'font-medium text-sm',
                            isActive ? config.color : 'text-foreground'
                        )}>
                            {config.label}
                        </span>
                        <span className="text-xs text-muted-foreground text-center mt-1">
                            {config.question}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ModeSelector: React.FC<ModeSelectorProps> = (props) => {
    const { variant = 'dropdown' } = props;

    switch (variant) {
        case 'tabs':
            return <TabsSelector {...props} />;
        case 'pills':
            return <PillsSelector {...props} />;
        default:
            return <DropdownSelector {...props} />;
    }
};

// =============================================================================
// MODE INFO BANNER (for display under header)
// =============================================================================

export const ModeInfoBanner: React.FC<{ mode: AIMode; className?: string }> = ({
    mode,
    className,
}) => {
    const config = MODE_CONFIG[mode] || MODE_CONFIG.analyst; // Safe fallback

    return (
        <div
            className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-lg border',
                config.bgColor.replace('hover:', ''),
                'border-current/20',
                config.color,
                className
            )}
        >
            <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">{config.label}</span>
            </div>
            <span className="text-sm opacity-80">—</span>
            <span className="text-sm opacity-80">{config.description}</span>
        </div>
    );
};

export default ModeSelector;
