/**
 * Notebook View Container
 * Main component for rendering notebook-style analyses with history sidebar
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NotebookOutput, NotebookCell } from '@/lib/types/notebook';
import { notebookEngine } from '@/lib/services/notebookEngine';
import { mockNotebookEngine } from '@/lib/services/mockNotebookEngine';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Play, PanelRight, Sparkles, BarChart3, Search, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AssistantPanel } from '../assistant/AssistantPanel';
import { ReasoningCard } from './ReasoningCard';
import { NotebookInputArea } from './NotebookInputArea';

// Cell renderers
import { PromptCell } from './cells/PromptCell';
import { ReasoningCell } from './cells/ReasoningCell';
import { MetricCell } from './cells/MetricCell';
import { VisualizationCell } from './cells/VisualizationCell';
import { TableCell } from './cells/TableCell';
import { CodeCell } from './cells/CodeCell';
import { ExplanationCell } from './cells/ExplanationCell';
import { InsightCell } from './cells/InsightCell';
import { SuggestionCell } from './cells/SuggestionCell';

interface NotebookViewProps {
    datasetId: string;
    notebookId?: string; // If provided, load existing notebook
    userId: string;
    highlightCellId?: string; // For drill-down from dashboard
    onNotebookChange?: (notebook: NotebookOutput | null) => void;
    onDatasetSelect?: (datasetId: string) => void;
}

export const NotebookView: React.FC<NotebookViewProps> = ({
    datasetId,
    notebookId,
    userId,
    highlightCellId,
    onNotebookChange,
    onDatasetSelect
}) => {
    const [notebook, setNotebook] = useState<NotebookOutput | null>(null);
    const [loading, setLoading] = useState(false);
    const [userPrompt, setUserPrompt] = useState('');
    const [streamingCells, setStreamingCells] = useState<NotebookCell[]>([]);
    const [currentNotebookId, setCurrentNotebookId] = useState<string | undefined>(notebookId);

    // Sidebar State
    const [showAssistantPanel, setShowAssistantPanel] = useState(true);

    const { toast } = useToast();
    const highlightRef = useRef<HTMLDivElement>(null);

    // Sync notebook state with parent (for Planning Tab)
    useEffect(() => {
        onNotebookChange?.(notebook);
    }, [notebook, onNotebookChange]);

    // Load existing notebook if notebookId provided
    useEffect(() => {
        if (currentNotebookId) {
            loadNotebook(currentNotebookId);
        }
    }, [currentNotebookId]);

    // Scroll to highlighted cell after render
    useEffect(() => {
        if (highlightCellId && highlightRef.current) {
            highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [highlightCellId, notebook]);

    // Extract thoughts for AssistantPanel
    const currentThoughtProcess = useMemo(() => {
        const cells = notebook?.cells || streamingCells;
        const reasoningCells = cells.filter(c => c.cell_type === 'reasoning');
        // Retrieve content from reasoning cells. 
        // Assuming reasoning content is the "thought". 
        // If it's a list, great; if string, wrap it.
        return reasoningCells.flatMap(c => {
            // Handle Mock Data Object Structure (content.steps)
            if (c.content && typeof c.content === 'object' && 'steps' in c.content && Array.isArray((c.content as any).steps)) {
                return (c.content as any).steps;
            }
            if (Array.isArray(c.content)) return c.content;
            if (typeof c.content === 'string') return [c.content];
            return ["Analyzing..."];
        });
    }, [notebook, streamingCells]);

    const loadNotebook = async (id: string) => {
        setLoading(true);
        try {
            const loadedNotebook = await notebookEngine.loadNotebook(id);
            setNotebook(loadedNotebook);
            setCurrentNotebookId(id);
        } catch (error) {
            console.error('Failed to load notebook:', error);
            toast({
                title: 'Load Failed',
                description: 'Could not load notebook',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateNotebook = async () => {
        if (!userPrompt.trim()) {
            toast({
                title: 'Prompt Required',
                description: 'Please enter an analytical question',
                variant: 'destructive'
            });
            return;
        }

        // MOCK AUTH CHECK SKIPPED FOR POC TO REDUCE FRICTION
        // if (!userId) ...

        setLoading(true);
        setStreamingCells([]);
        setNotebook(null);
        setShowAssistantPanel(true);

        try {
            // ALWAYS USE MOCK FOR THIS POC
            await new Promise<void>((resolve, reject) => {
                mockNotebookEngine.generateNotebookStream(
                    userPrompt,
                    datasetId,
                    userId,
                    {
                        onThought: (thought) => {
                            // Can't easily update valid state here without useState refactor, 
                            // but the component will re-render if we use a state setter.
                            // For this PoC, we rely on the final result or minimal updates.
                        },
                        onCode: (code) => {
                            // console.log("Code:", code);
                        },
                        onComplete: (nb) => {
                            setNotebook(nb);
                            setCurrentNotebookId(nb.notebook_id);
                            resolve();
                        },
                        onError: (err) => reject(new Error(err))
                    }
                );
            });

            setUserPrompt('');
            toast({
                title: 'Analysis Complete',
                description: `Generated Mock Analysis`
            });

        } catch (error) {
            console.error('Failed to generate:', error);
            toast({ title: 'Error', description: 'Failed to generate analysis', variant: 'destructive' });
        } finally {
            setLoading(false);
            setStreamingCells([]);
        }
    };

    const renderCell = (cell: NotebookCell, index: number) => {
        const isHighlighted = cell.cell_id === highlightCellId;
        const commonProps = {
            cell,
            isHighlighted,
            ref: isHighlighted ? highlightRef : undefined
        };

        let content = null;
        switch (cell.cell_type) {
            case 'prompt': content = <PromptCell key={cell.cell_id} {...commonProps} />; break;
            case 'reasoning': content = <ReasoningCell key={cell.cell_id} {...commonProps} />; break;
            case 'code': content = <CodeCell key={cell.cell_id} {...commonProps} />; break;
            case 'explanation': content = <ExplanationCell key={cell.cell_id} {...commonProps} />; break;
            case 'metric': content = <MetricCell key={cell.cell_id} {...commonProps} />; break;
            case 'visualization': content = <VisualizationCell key={cell.cell_id} {...commonProps} />; break;
            case 'table': content = <TableCell key={cell.cell_id} {...commonProps} />; break;
            case 'insight': content = <InsightCell key={cell.cell_id} {...commonProps} userId={userId} notebookId={notebook?.notebook_id || ''} />; break;
            case 'suggestion': content = <SuggestionCell key={cell.cell_id} {...commonProps} onSelectPrompt={setUserPrompt} />; break;
        }

        return (
            <div id={cell.cell_id} className="scroll-mt-32">
                {content}
            </div>
        );
    };

    const cellsToRender = notebook?.cells || streamingCells;

    return (
        <div className="flex h-full bg-background overflow-hidden">
            {/* Main Content - Chat Stream Layout */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-black/20 relative transition-all duration-300">
                <div className="flex-1 overflow-auto scroll-smooth pb-32">
                    <div className={cn(
                        "mx-auto w-full p-4 md:p-8 space-y-8 transition-all duration-500 ease-in-out",
                        showAssistantPanel ? "max-w-3xl" : "max-w-6xl"
                    )}>
                        {/* Analysis Metadata (Subtle Header) */}
                        {notebook && (
                            <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground uppercase tracking-widest opacity-50 border-b pb-4 mx-12">
                                <span>{notebook.analysis_metadata.domain}</span>
                                <span>•</span>
                                <span>{notebook.analysis_metadata.analysis_type}</span>
                            </div>
                        )}

                        {/* Stream of Cells */}
                        <div className="space-y-8">


                            {/* 1. User Query (Prompt) */}
                            {cellsToRender
                                .filter(cell => cell.cell_type === 'prompt')
                                .map((cell, index) => renderCell(cell, index))}

                            {/* 2. Reasoning Card (Middle - After Query) */}
                            {currentThoughtProcess.length > 0 && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <ReasoningCard
                                        thoughtProcess={currentThoughtProcess as any}
                                        isExpanded={true}
                                    />
                                </div>
                            )}

                            {loading && !notebook && (
                                <div className="flex items-start gap-4 p-4 animate-in fade-in duration-500">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Analyzing your request...</p>
                                        <p className="text-xs text-muted-foreground">Identifying relevant variables and models.</p>
                                    </div>
                                </div>
                            )}

                            {/* 3. Render Main Cells (excluding reasoning and prompt) */}
                            {cellsToRender
                                .filter(cell => cell.cell_type !== 'reasoning' && cell.cell_type !== 'prompt')
                                .map((cell, index) => renderCell(cell, index))}
                        </div>
                    </div>
                </div>

                {/* Bottom Input Area (Sticky) */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent pt-24 px-2 pb-1 z-20 pointer-events-none">
                    <div className={cn(
                        "mx-auto space-y-2 transition-all duration-500 ease-in-out pointer-events-auto",
                        showAssistantPanel ? "max-w-3xl" : "max-w-4xl"
                    )}>
                        {/* Suggested Questions (Chips) */}
                        {!notebook && cellsToRender.length === 0 && (
                            <div className="flex flex-wrap gap-2 justify-center pb-2 px-4">
                                <Button variant="outline" size="sm" className="rounded-2xl h-8 bg-background/50 hover:bg-background border-muted-foreground/20 text-muted-foreground hover:text-foreground text-xs font-normal shadow-sm" onClick={() => { setUserPrompt("Analyze distributions"); handleGenerateNotebook(); }}>
                                    What is the distribution of values?
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-2xl h-8 bg-background/50 hover:bg-background border-muted-foreground/20 text-muted-foreground hover:text-foreground text-xs font-normal shadow-sm" onClick={() => { setUserPrompt("Find outliers"); handleGenerateNotebook(); }}>
                                    Find any anomalies or outliers?
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-2xl h-8 bg-background/50 hover:bg-background border-muted-foreground/20 text-muted-foreground hover:text-foreground text-xs font-normal shadow-sm" onClick={() => { setUserPrompt("Summarize data"); handleGenerateNotebook(); }}>
                                    Summarize the key trends
                                </Button>
                            </div>
                        )}

                        <NotebookInputArea
                            value={userPrompt}
                            onChange={setUserPrompt}
                            onSubmit={handleGenerateNotebook}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>

            {/* Assistant Panel - Fixed Sidebar */}
            <AssistantPanel
                isOpen={showAssistantPanel}
                onToggle={() => setShowAssistantPanel(!showAssistantPanel)}
                notebook={notebook}
                datasetId={datasetId}
                userId={userId}
                currentThoughtProcess={currentThoughtProcess}
                onDatasetSelect={onDatasetSelect}
            />
        </div>
    );
};
