/**
 * Prompt Cell Renderer
 * Displays the user's analytical question
 */

import React from 'react';
import { NotebookCell, PromptCellContent } from '@/lib/types/notebook';
import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptCellProps {
    cell: NotebookCell;
    isHighlighted?: boolean;
}

export const PromptCell = React.forwardRef<HTMLDivElement, PromptCellProps>(
    ({ cell, isHighlighted }, ref) => {
        const content = cell.content as PromptCellContent;

        return (
            <Card
                ref={ref}
                className={cn(
                    'p-6 border-l-4 border-l-blue-500',
                    isHighlighted && 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                )}
            >
                <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{cell.title}</h3>
                        <p className="text-foreground leading-relaxed">
                            {content.user_question}
                        </p>
                    </div>
                </div>
            </Card>
        );
    }
);

PromptCell.displayName = 'PromptCell';
