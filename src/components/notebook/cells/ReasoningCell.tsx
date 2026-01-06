/**
 * Reasoning Cell Renderer
 * Displays analytical methodology, assumptions, challenges, observations
 */

import React, { useState } from 'react';
import { NotebookCell, ReasoningCellContent } from '@/lib/types/notebook';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ThoughtProcessCard } from '@/components/notebook/ThoughtProcessCard';

interface ReasoningCellProps {
    cell: NotebookCell;
    isHighlighted?: boolean;
}

export const ReasoningCell = React.forwardRef<HTMLDivElement, ReasoningCellProps>(
    ({ cell, isHighlighted }, ref) => {
        const content = cell.content as ReasoningCellContent;
        const [isOpen, setIsOpen] = useState(!cell.ui_hints.collapsible);

        return (
            <Card
                ref={ref}
                className={cn(
                    'p-6 border-l-4 border-l-purple-500',
                    isHighlighted && 'ring-2 ring-purple-500 bg-purple-50/50 dark:bg-purple-950/20'
                )}
            >
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <div className="flex items-start gap-3">
                        <Brain className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">{cell.title}</h3>
                                {cell.ui_hints.collapsible && (
                                    <CollapsibleTrigger asChild>
                                        <button className="text-muted-foreground hover:text-foreground">
                                            {isOpen ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                        </button>
                                    </CollapsibleTrigger>
                                )}
                            </div>

                            <CollapsibleContent className="mt-4 space-y-4">
                                {/* Thought Process (New) */}
                                {content.thought_process && content.thought_process.length > 0 && (
                                    <div className="mb-6">
                                        <ThoughtProcessCard steps={content.thought_process} />
                                    </div>
                                )}

                                {/* Methodology */}
                                <div>
                                    <Badge variant="secondary" className="mb-2">Methodology</Badge>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {content.methodology}
                                    </p>
                                </div>

                                {/* Assumptions */}
                                {content.assumptions && content.assumptions.length > 0 && (
                                    <div>
                                        <Badge variant="secondary" className="mb-2">Assumptions</Badge>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                            {content.assumptions.map((assumption, idx) => (
                                                <li key={idx}>{assumption}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Challenges */}
                                {content.challenges && content.challenges.length > 0 && (
                                    <div>
                                        <Badge variant="secondary" className="mb-2">Challenges</Badge>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                            {content.challenges.map((challenge, idx) => (
                                                <li key={idx}>{challenge}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Observations */}
                                {content.observations && content.observations.length > 0 && (
                                    <div>
                                        <Badge variant="secondary" className="mb-2">Observations</Badge>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                            {content.observations.map((observation, idx) => (
                                                <li key={idx}>{observation}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CollapsibleContent>
                        </div>
                    </div>
                </Collapsible>
            </Card>
        );
    }
);

ReasoningCell.displayName = 'ReasoningCell';
