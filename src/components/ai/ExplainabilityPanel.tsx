/**
 * Explainability Panel Component
 * 
 * PromptBI-style AI reasoning display with:
 * - Thought process/reasoning sections
 * - Collapsible insights
 * - Smart highlights with emojis and icons
 * - Confidence indicators
 * - Evidence citations
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    ChevronDown,
    ChevronRight,
    Brain,
    Lightbulb,
    AlertTriangle,
    CheckCircle2,
    Info,
    Target,
    TrendingUp,
    TrendingDown,
    Minus,
    Database,
    Clock,
    Shield,
    Sparkles,
    FileText,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface ThoughtStep {
    step: number;
    thought: string;
    reasoning: string;
    confidence?: number;
    dataExamined?: string;
}

export interface Evidence {
    datasetVersion?: string;
    rowsCovered: number;
    columnsCovered: string[];
    analysisType: string;
    timestamp?: string;
}

export interface Finding {
    title: string;
    description: string;
    type: 'insight' | 'warning' | 'success' | 'info';
    confidence?: number;
    trend?: 'up' | 'down' | 'stable';
    value?: string | number;
}

export interface ExplainabilityPanelProps {
    /** The AI's thought process steps */
    thoughtProcess?: ThoughtStep[];
    /** Key findings from the analysis */
    findings?: Finding[];
    /** Evidence supporting the analysis */
    evidence?: Evidence;
    /** Overall confidence score (0-1) */
    confidence?: number;
    /** Methodology used */
    methodology?: string;
    /** Limitations of the analysis */
    limitations?: string[];
    /** Whether to show in compact mode */
    compact?: boolean;
    /** CSS class name */
    className?: string;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const ConfidenceIndicator: React.FC<{ confidence: number; size?: 'sm' | 'md' }> = ({
    confidence,
    size = 'md'
}) => {
    const getColor = () => {
        if (confidence >= 0.8) return 'text-green-500 bg-green-500/10';
        if (confidence >= 0.6) return 'text-yellow-500 bg-yellow-500/10';
        return 'text-red-500 bg-red-500/10';
    };

    const getIcon = () => {
        if (confidence >= 0.8) return <CheckCircle2 className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />;
        if (confidence >= 0.6) return <AlertTriangle className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />;
        return <AlertCircle className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />;
    };

    return (
        <div className={cn(
            'inline-flex items-center gap-1.5 px-2 py-1 rounded-full',
            getColor(),
            size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
            {getIcon()}
            <span className="font-medium">{(confidence * 100).toFixed(0)}%</span>
        </div>
    );
};

const TrendIndicator: React.FC<{ trend: 'up' | 'down' | 'stable' }> = ({ trend }) => {
    const config = {
        up: { icon: TrendingUp, color: 'text-green-500', label: 'Increasing' },
        down: { icon: TrendingDown, color: 'text-red-500', label: 'Decreasing' },
        stable: { icon: Minus, color: 'text-yellow-500', label: 'Stable' },
    };

    const { icon: Icon, color, label } = config[trend];

    return (
        <div className={cn('inline-flex items-center gap-1', color)}>
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium">{label}</span>
        </div>
    );
};

const CollapsibleSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    defaultOpen?: boolean;
    badge?: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, icon, defaultOpen = false, badge, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-border/40 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                        {icon}
                    </div>
                    <span className="font-medium text-sm">{title}</span>
                    {badge}
                </div>
                {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
            </button>
            {isOpen && (
                <div className="px-4 py-3 bg-card animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
    thoughtProcess = [],
    findings = [],
    evidence,
    confidence = 0.75,
    methodology,
    limitations = [],
    compact = false,
    className,
}) => {
    const [showFullProcess, setShowFullProcess] = useState(false);

    // For compact mode, show minimal info
    if (compact) {
        return (
            <Card className={cn('p-3 bg-muted/20 border-border/40', className)}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">AI Analysis</span>
                    </div>
                    <ConfidenceIndicator confidence={confidence} size="sm" />
                </div>
            </Card>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Header with Overall Confidence */}
            <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border-border/40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Brain className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">AI Analysis Explainability</h3>
                            <p className="text-sm text-muted-foreground">
                                Understanding how insights were generated
                            </p>
                        </div>
                    </div>
                    <ConfidenceIndicator confidence={confidence} />
                </div>

                {/* Confidence bar */}
                <div className="mt-4 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Analysis Confidence</span>
                        <span>{(confidence * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={confidence * 100} className="h-2" />
                </div>
            </Card>

            {/* Thought Process Section */}
            {thoughtProcess.length > 0 && (
                <CollapsibleSection
                    title="Thought Process"
                    icon={<Lightbulb className="w-4 h-4" />}
                    defaultOpen={true}
                    badge={
                        <Badge variant="secondary" className="text-xs">
                            {thoughtProcess.length} steps
                        </Badge>
                    }
                >
                    <div className="space-y-3">
                        {(showFullProcess ? thoughtProcess : thoughtProcess.slice(0, 3)).map((step, idx) => (
                            <div
                                key={idx}
                                className="flex gap-3 p-3 bg-muted/30 rounded-lg border-l-2 border-primary/50"
                            >
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary">{step.step}</span>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium">{step.thought}</p>
                                    <p className="text-xs text-muted-foreground">{step.reasoning}</p>
                                    {step.dataExamined && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                            <Database className="w-3 h-3" />
                                            <span>{step.dataExamined}</span>
                                        </div>
                                    )}
                                    {step.confidence && (
                                        <ConfidenceIndicator confidence={step.confidence} size="sm" />
                                    )}
                                </div>
                            </div>
                        ))}

                        {thoughtProcess.length > 3 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFullProcess(!showFullProcess)}
                                className="w-full text-xs"
                            >
                                {showFullProcess ? 'Show Less' : `Show ${thoughtProcess.length - 3} More Steps`}
                            </Button>
                        )}
                    </div>
                </CollapsibleSection>
            )}

            {/* Key Findings */}
            {findings.length > 0 && (
                <CollapsibleSection
                    title="Key Findings"
                    icon={<Target className="w-4 h-4" />}
                    defaultOpen={true}
                    badge={
                        <Badge variant="secondary" className="text-xs">
                            {findings.length} insights
                        </Badge>
                    }
                >
                    <div className="space-y-2">
                        {findings.map((finding, idx) => {
                            const typeConfig = {
                                insight: { icon: Lightbulb, color: 'border-blue-500 bg-blue-500/5' },
                                warning: { icon: AlertTriangle, color: 'border-yellow-500 bg-yellow-500/5' },
                                success: { icon: CheckCircle2, color: 'border-green-500 bg-green-500/5' },
                                info: { icon: Info, color: 'border-gray-500 bg-gray-500/5' },
                            };
                            const { icon: Icon, color } = typeConfig[finding.type];

                            return (
                                <div
                                    key={idx}
                                    className={cn('p-3 rounded-lg border-l-4', color)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2">
                                            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium">{finding.title}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {finding.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {finding.value && (
                                                <span className="text-sm font-bold">{finding.value}</span>
                                            )}
                                            {finding.trend && <TrendIndicator trend={finding.trend} />}
                                            {finding.confidence && (
                                                <ConfidenceIndicator confidence={finding.confidence} size="sm" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CollapsibleSection>
            )}

            {/* Evidence Section */}
            {evidence && (
                <CollapsibleSection
                    title="Evidence & Data Coverage"
                    icon={<Database className="w-4 h-4" />}
                    defaultOpen={false}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Dataset Version</span>
                            <p className="text-sm font-medium flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {evidence.datasetVersion || 'Latest'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Rows Analyzed</span>
                            <p className="text-sm font-medium">{evidence.rowsCovered.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Columns Covered</span>
                            <div className="flex flex-wrap gap-1">
                                {evidence.columnsCovered.slice(0, 5).map((col, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                        {col}
                                    </Badge>
                                ))}
                                {evidence.columnsCovered.length > 5 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{evidence.columnsCovered.length - 5} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Analysis Type</span>
                            <p className="text-sm font-medium">{evidence.analysisType}</p>
                        </div>
                        {evidence.timestamp && (
                            <div className="col-span-2 flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>Analyzed {evidence.timestamp}</span>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
            )}

            {/* Methodology */}
            {methodology && (
                <CollapsibleSection
                    title="Methodology"
                    icon={<Shield className="w-4 h-4" />}
                    defaultOpen={false}
                >
                    <p className="text-sm text-muted-foreground">{methodology}</p>
                </CollapsibleSection>
            )}

            {/* Limitations */}
            {limitations.length > 0 && (
                <CollapsibleSection
                    title="Limitations & Caveats"
                    icon={<AlertTriangle className="w-4 h-4" />}
                    defaultOpen={false}
                >
                    <ul className="space-y-2">
                        {limitations.map((limitation, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="text-yellow-500 mt-1">•</span>
                                {limitation}
                            </li>
                        ))}
                    </ul>
                </CollapsibleSection>
            )}

            {/* Disclaimer */}
            <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/40">
                <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                        <strong>Disclaimer:</strong> This AI analysis provides population-level insights only.
                        Results should be validated by domain experts before making decisions.
                        Do not use for individual clinical diagnosis or treatment.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExplainabilityPanel;
