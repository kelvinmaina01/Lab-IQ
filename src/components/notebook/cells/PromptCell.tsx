import React, { useState } from 'react';
import { NotebookCell, PromptCellContent } from '@/lib/types/notebook';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Pencil, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface PromptCellProps {
    cell: NotebookCell;
    isHighlighted?: boolean;
}

export const PromptCell = React.forwardRef<HTMLDivElement, PromptCellProps>(
    ({ cell, isHighlighted }, ref) => {
        const content = cell.content as PromptCellContent;
        const [copied, setCopied] = useState(false);
        const { toast } = useToast();

        const handleCopy = async () => {
            try {
                await navigator.clipboard.writeText(content.user_question);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy', err);
            }
        };

        const handleEdit = () => {
            toast({
                title: "Edit Prompt",
                description: "Editing allows you to refine your query (Coming Soon)",
            });
        };

        return (
            <Card
                ref={ref}
                className={cn(
                    'p-6 border-l-4 border-l-blue-500 transition-all duration-300',
                    isHighlighted && 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                )}
            >
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full flex-shrink-0 mt-1">
                        <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm text-blue-600 dark:text-blue-400 uppercase tracking-wider">User Query</h3>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={handleCopy}
                                    title="Copy Query"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={handleEdit}
                                    title="Edit Query"
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <p className="text-lg font-medium text-foreground leading-relaxed">
                            {content.user_question}
                        </p>
                    </div>
                </div>
            </Card>
        );
    }
);

PromptCell.displayName = 'PromptCell';
