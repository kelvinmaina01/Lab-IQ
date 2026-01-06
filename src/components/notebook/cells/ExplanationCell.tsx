import React from 'react';
import { ExplanationCellContent, NotebookCell } from '@/lib/types/notebook';
import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExplanationCellProps {
    cell: NotebookCell;
    isHighlighted?: boolean;
}

export const ExplanationCell: React.FC<ExplanationCellProps> = ({ cell, isHighlighted }) => {
    const content = cell.content as ExplanationCellContent;

    // Custom Markdown Renderer (Lightweight)
    const renderMarkdown = (text: string) => {
        if (!text) return null;

        const lines = text.split('\n');
        return lines.map((line, i) => {
            // Headers (###)
            if (line.startsWith('### ')) {
                return <h3 key={i} className="text-lg font-semibold mt-6 mb-3 flex items-center gap-2 text-foreground/90">{line.replace('### ', '')}</h3>;
            }
            // Bold Key-Value (e.g., **Label**: Value)
            if (line.includes('**') && line.includes(':')) {
                const parts = line.split(':');
                const label = parts[0].replace(/\*\*/g, '');
                const value = parts.slice(1).join(':');
                return (
                    <div key={i} className="mb-2">
                        <span className="font-semibold text-foreground/80">{label}:</span>
                        <span className="text-muted-foreground">{value}</span>
                    </div>
                );
            }
            // Bullet Points
            if (line.trim().startsWith('* ')) {
                const content = line.trim().substring(2);
                // Check if content has bold
                const hasBold = content.includes('**');
                return (
                    <li key={i} className="ml-4 mb-1 text-sm text-foreground/80 list-disc pl-1">
                        {hasBold ? (
                            <span>
                                {content.split('**').map((part, idx) =>
                                    idx % 2 === 1 ? <strong key={idx} className="font-medium text-foreground">{part}</strong> : part
                                )}
                            </span>
                        ) : content}
                    </li>
                );
            }

            // Standard Paragraph
            if (line.trim() === '') return <div key={i} className="h-2" />;

            return <p key={i} className="mb-2 text-sm text-muted-foreground leading-relaxed">{line}</p>;
        });
    };

    return (
        <div className={cn("my-6 animate-in fade-in slide-in-from-bottom-3 duration-500 max-w-none prose prose-neutral dark:prose-invert", isHighlighted && "ring-2 ring-primary ring-offset-2 rounded-lg")}>
            <div className="bg-transparent">
                {/*  Render Custom Markdown */}
                <div className="text-sm">
                    {renderMarkdown(content.explanation)}
                </div>
            </div>
        </div>
    );
};
