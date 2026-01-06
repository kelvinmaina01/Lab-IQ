
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ThoughtStep {
    step_number: number;
    section: string;
    content: string;
}

interface ReasoningCardProps {
    thoughtProcess: ThoughtStep[];
    isExpanded?: boolean;
}

export const ReasoningCard: React.FC<ReasoningCardProps> = ({
    thoughtProcess,
    isExpanded: defaultExpanded = false
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    if (!thoughtProcess || thoughtProcess.length === 0) return null;

    return (
        <Card className="mb-6 border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/10">
            <CardHeader
                className="py-3 px-4 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                        <Sparkles className="h-5 w-5" />
                        <CardTitle className="text-sm font-medium">
                            AI Thought Process ({thoughtProcess.length} Steps)
                        </CardTitle>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-0 px-4 pb-4">
                    <div className="mt-4 space-y-4 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-indigo-200 dark:before:bg-indigo-800">
                        {thoughtProcess.map((step, index) => (
                            <div key={index} className="relative pl-10">
                                {/* Step Indicator */}
                                <div className="absolute left-0 top-1 p-1 bg-background rounded-full border border-indigo-200 dark:border-indigo-800 z-10">
                                    <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                </div>

                                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                                    Step {step.step_number}: {(step.section || 'Reasoning').replace('_', ' ')}
                                </h4>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    {step.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            )}
        </Card>
    );
};
