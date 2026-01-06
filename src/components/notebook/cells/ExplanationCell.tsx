import React from 'react';
import { ExplanationCellContent, NotebookCell } from '@/lib/types/notebook';
import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface ExplanationCellProps {
    cell: NotebookCell;
    isHighlighted?: boolean;
}

export const ExplanationCell: React.FC<ExplanationCellProps> = ({ cell, isHighlighted }) => {
    const content = cell.content as ExplanationCellContent;

    return (
        <Card className={`p-4 border-l-4 border-l-blue-500/30 bg-blue-50/10 ${isHighlighted ? 'ring-2 ring-primary' : ''}`}>
            <div className="flex gap-3">
                <div className="mt-0.5">
                    <Info className="w-4 h-4 text-blue-500" />
                </div>
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400">Code Explanation</h4>
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {content.explanation}
                    </div>
                </div>
            </div>
        </Card>
    );
};
