import React, { useState } from 'react';
import { CodeCellContent, NotebookCell, TableCellContent, VisualizationCellContent } from '@/lib/types/notebook';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Terminal,
    Check,
    ChevronDown,
    ChevronUp,
    Table as TableIcon,
    FileText,
    Image as ImageIcon,
    BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableCell } from './TableCell';
import { VisualizationCell } from './VisualizationCell';

interface CodeCellProps {
    cell: NotebookCell;
    isHighlighted?: boolean;
}

export const CodeCell: React.FC<CodeCellProps> = ({ cell, isHighlighted }) => {
    const content = cell.content as CodeCellContent;
    const [showExplanation, setShowExplanation] = useState(false);

    // Determine default active tab
    const hasTable = content.display_formats?.table;
    const hasText = content.display_formats?.text;
    const hasImage = content.display_formats?.image_url;
    const hasChart = content.display_formats?.chart;

    const [activeTab, setActiveTab] = useState<'table' | 'text' | 'image' | 'chart'>(
        hasTable ? 'table' : hasChart ? 'chart' : hasImage ? 'image' : 'text'
    );

    const hasOutputs = hasTable || hasText || hasImage || hasChart;

    return (
        <Card className={cn(
            "overflow-hidden border-l-4 border-l-primary/40 transition-all duration-300",
            isHighlighted ? 'ring-2 ring-primary shadow-lg' : 'shadow-sm'
        )}>
            {/* Header */}
            <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground uppercase">{content.language || 'Code'}</span>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 gap-1 text-[10px] h-5">
                    <Check className="w-3 h-3" /> Executed
                </Badge>
            </div>

            {/* Code Block */}
            <div className="bg-slate-950 text-slate-50 p-4 font-mono text-sm leading-relaxed overflow-x-auto relative group">
                <pre>{content.code}</pre>
            </div>

            {/* Code Explanation Section */}
            {content.explanation && (
                <div className="border-t bg-card p-4">
                    <h4 className="text-sm font-semibold mb-1 text-foreground/90">Code Explanation</h4>
                    <div className={cn("text-sm text-muted-foreground leading-relaxed", !showExplanation && "line-clamp-2")}>
                        {content.explanation}
                    </div>
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="p-0 h-auto font-medium text-primary mt-1"
                    >
                        {showExplanation ? "Show Less" : "Show More"}
                    </Button>
                </div>
            )}

            {/* Output Tabs & Area */}
            {content.display_formats && hasOutputs && (
                <div className="border-t bg-slate-50/50 dark:bg-muted/10 p-4">
                    {/* Tab Buttons */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {hasTable && (
                            <TabButton
                                active={activeTab === 'table'}
                                onClick={() => setActiveTab('table')}
                                icon={TableIcon}
                                label="Table"
                            />
                        )}
                        {hasText && (
                            <TabButton
                                active={activeTab === 'text'}
                                onClick={() => setActiveTab('text')}
                                icon={FileText}
                                label="Text"
                            />
                        )}
                        {hasImage && (
                            <TabButton
                                active={activeTab === 'image'}
                                onClick={() => setActiveTab('image')}
                                icon={ImageIcon}
                                label="Image"
                            />
                        )}
                        {hasChart && (
                            <TabButton
                                active={activeTab === 'chart'}
                                onClick={() => setActiveTab('chart')}
                                icon={BarChart3}
                                label="Chart"
                            />
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="bg-card rounded-lg border shadow-sm p-4 min-h-[100px] animate-in fade-in duration-300">
                        {activeTab === 'table' && content.display_formats.table && (
                            // Reuse TableCell logic by passing a mock cell 
                            <div className="overflow-hidden rounded-md">
                                <TableCell cell={{ ...cell, content: content.display_formats.table } as any} />
                            </div>
                        )}

                        {activeTab === 'text' && content.display_formats.text && (
                            <div className="font-mono text-xs text-foreground/80 whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                                {content.display_formats.text}
                            </div>
                        )}

                        {activeTab === 'image' && content.display_formats.image_url && (
                            <div className="flex justify-center">
                                <img
                                    src={content.display_formats.image_url}
                                    alt="Output Visualization"
                                    className="max-w-full rounded-md border"
                                />
                            </div>
                        )}

                        {activeTab === 'chart' && content.display_formats.chart && (
                            <div className="overflow-hidden rounded-md">
                                <VisualizationCell cell={{ ...cell, content: content.display_formats.chart } as any} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
};

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border",
            active
                ? "bg-white dark:bg-slate-800 text-primary border-primary/20 shadow-sm"
                : "bg-transparent text-muted-foreground border-transparent hover:bg-muted"
        )}
    >
        <span className={cn("p-1 rounded bg-primary/10", active ? "text-primary" : "text-muted-foreground")}>
            <Icon className="w-3.5 h-3.5" />
        </span>
        {label}
        {active && <span className="ml-1 text-[10px] text-muted-foreground/50">Click to view</span>}
    </button>
);
