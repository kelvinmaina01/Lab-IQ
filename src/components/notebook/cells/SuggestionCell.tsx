/**
 * Suggestion Cell Renderer
 * Displays clickable next-step prompts
 */

import React from 'react';
import { NotebookCell, SuggestionCellContent } from '@/lib/types/notebook';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestionCellProps {
    cell: NotebookCell;
    isHighlighted?: boolean;
    onSelectPrompt: (prompt: string) => void;
}

export const SuggestionCell = React.forwardRef<HTMLDivElement, SuggestionCellProps>(
    ({ cell, isHighlighted, onSelectPrompt }, ref) => {
        const content = cell.content as SuggestionCellContent;

        return (
            <Card
                ref={ref}
                className={cn(
                    'p-6 border-l-4 border-l-cyan-500',
                    isHighlighted && 'ring-2 ring-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20'
                )}
            >
                <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-3">{cell.title}</h3>

                        <div className="space-y-2">
                            {content.suggestions.map((suggestion, idx) => (
                                <Button
                                    key={idx}
                                    variant="outline"
                                    className="w-full justify-between text-left h-auto py-3 px-4"
                                    onClick={() => onSelectPrompt(suggestion.prompt)}
                                >
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{suggestion.prompt}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {suggestion.rationale}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 ml-2 flex-shrink-0" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        );
    }
);

SuggestionCell.displayName = 'SuggestionCell';
