/**
 * Table Cell Renderer
 * Displays structured data with clear headers
 */

import React, { useState } from 'react';
import { NotebookCell, TableCellContent } from '@/lib/types/notebook';
import { Card } from '@/components/ui/card';
import { Table, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface TableCellProps {
    cell: NotebookCell;
    isHighlighted?: boolean;
}

export const TableCell = React.forwardRef<HTMLDivElement, TableCellProps>(
    ({ cell, isHighlighted }, ref) => {
        const content = cell.content as TableCellContent;
        const [isOpen, setIsOpen] = useState(!cell.ui_hints.collapsible);

        return (
            <Card
                ref={ref}
                className={cn(
                    'p-6 border-l-4 border-l-slate-500',
                    isHighlighted && 'ring-2 ring-slate-500 bg-slate-50/50 dark:bg-slate-950/20'
                )}
            >
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <div className="flex items-start gap-3">
                        <Table className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
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

                            {content.caption && (
                                <p className="text-sm text-muted-foreground mt-1">{content.caption}</p>
                            )}

                            <CollapsibleContent className="mt-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b">
                                                {content.headers.map((header, idx) => (
                                                    <th
                                                        key={idx}
                                                        className="text-left p-2 text-sm font-semibold text-foreground"
                                                    >
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {content.rows.map((row, rowIdx) => (
                                                <tr key={rowIdx} className="border-b last:border-0 hover:bg-muted/30">
                                                    {row.map((cell, cellIdx) => (
                                                        <td key={cellIdx} className="p-2 text-sm text-muted-foreground">
                                                            {typeof cell === 'number' ? cell.toLocaleString() : cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CollapsibleContent>
                        </div>
                    </div>
                </Collapsible>
            </Card>
        );
    }
);

TableCell.displayName = 'TableCell';
