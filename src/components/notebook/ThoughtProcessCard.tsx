import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, ChevronDown, ChevronRight, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ThoughtStep } from '@/lib/types/notebook';
import { cn } from '@/lib/utils';

interface ThoughtProcessCardProps {
    steps: ThoughtStep[];
    defaultOpen?: boolean;
}

export const ThoughtProcessCard: React.FC<ThoughtProcessCardProps> = ({ steps, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (!steps || steps.length === 0) return null;

    return (
        <Card className="border-l-4 border-l-purple-500 overflow-hidden mb-6">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <div className="p-4 bg-purple-50/50 dark:bg-purple-950/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base text-purple-900 dark:text-purple-100 flex items-center gap-2">
                                AI Thought Process
                                <Badge variant="outline" className="text-[10px] h-5 border-purple-200 text-purple-700">
                                    {steps.length} Steps
                                </Badge>
                            </h3>
                            <p className="text-xs text-purple-600 dark:text-purple-300">
                                Transparent reasoning engine
                            </p>
                        </div>
                    </div>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="hover:bg-purple-100 dark:hover:bg-purple-900/50">
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                    </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                    <div className="p-4 space-y-4 bg-white dark:bg-card">
                        {steps.map((step, index) => (
                            <div key={index} className="relative pl-6 pb-2 last:pb-0 border-l border-purple-100 dark:border-purple-800/50 ml-2">
                                {/* Timeline Node */}
                                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-200 dark:bg-purple-700 border-2 border-white dark:border-card" />

                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                                            Step {step.step_number}
                                        </span>
                                        {step.confidence && (
                                            <span className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded-full",
                                                step.confidence > 0.8 ? "bg-green-100 text-green-700" :
                                                    step.confidence > 0.5 ? "bg-yellow-100 text-yellow-700" :
                                                        "bg-red-100 text-red-700"
                                            )}>
                                                {(step.confidence * 100).toFixed(0)}% Conf.
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm font-medium text-foreground">
                                        {step.thought}
                                    </p>

                                    <div className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-start gap-2">
                                            <Activity className="w-4 h-4 mt-0.5 text-slate-400" />
                                            <span>{step.reasoning}</span>
                                        </div>
                                        {step.data_examined && (
                                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-500">
                                                examined: {step.data_examined}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
};
