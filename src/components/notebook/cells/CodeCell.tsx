import React from 'react';
import { CodeCellContent, NotebookCell } from '@/lib/types/notebook';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Terminal, Check } from 'lucide-react';

interface CodeCellProps {
    cell: NotebookCell;
    isHighlighted?: boolean;
}

export const CodeCell: React.FC<CodeCellProps> = ({ cell, isHighlighted }) => {
    const content = cell.content as CodeCellContent;

    return (
        <Card className={`p-0 overflow-hidden border-l-4 border-l-primary/40 ${isHighlighted ? 'ring-2 ring-primary' : ''}`}>
            {/* Header */}
            <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground uppercase">{content.language || 'Code'}</span>
                </div>
                {/* Simulated Success State */}
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 gap-1 text-[10px] h-5">
                    <Check className="w-3 h-3" /> Executed
                </Badge>
            </div>

            {/* Code Block */}
            <div className="bg-slate-950 text-slate-50 p-4 overflow-x-auto font-mono text-sm leading-relaxed">
                <pre>{content.code}</pre>
            </div>
        </Card>
    );
};
