/**
 * Notebook View Container
 * Main component for rendering notebook-style analyses with history sidebar
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NotebookOutput, NotebookCell } from '@/lib/types/notebook';
import { notebookEngine } from '@/lib/services/notebookEngine';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Play, PanelRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AssistantPanel } from '../assistant/AssistantPanel';

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

        if (!userId) {
            toast({
                title: 'Authentication Required',
                description: 'Please sign in to save your analysis',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        setStreamingCells([]);
        setNotebook(null); // Clear current notebook
        // Keep AssistantPanel open during generation
        setShowAssistantPanel(true);

        try {
            // Generate notebook with progressive cell streaming
            const generatedNotebook = await notebookEngine.generateNotebook(
                userPrompt,
                datasetId,
                userId,
                (cell) => {
                    // Stream cells to UI as they're generated
                    setStreamingCells(prev => [...prev, cell]);
                }
            );

            setNotebook(generatedNotebook);
            setCurrentNotebookId(generatedNotebook.notebook_id);
            setUserPrompt(''); // Clear prompt after generation

            toast({
                title: 'Analysis Complete',
                description: `Generated ${generatedNotebook.cells.length} cells`
            });
        } catch (error) {
            console.error('Failed to generate notebook:', error);

            // For testing: Load mock data if AI fails
            if (process.env.NODE_ENV === 'development') {
                console.warn('Loading mock notebook data for testing...');
                const { mockNotebookData } = await import('@/lib/types/mockNotebookData');

                // Save mock notebook with current datasetId
                const mockWithDataset = {
                    ...mockNotebookData,
                    notebook_id: crypto.randomUUID()
                };

                await notebookEngine.saveNotebook(mockWithDataset, datasetId, userId);
                setNotebook(mockWithDataset);
                setCurrentNotebookId(mockWithDataset.notebook_id);
                setUserPrompt('');

                toast({
                    title: 'Mock Data Loaded',
                    description: 'Using sample notebook for UI testing',
                    variant: 'default'
                });

                return;
            }

            toast({
                title: 'Generation Failed',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive'
            });
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
            case 'prompt':
                content = <PromptCell key={cell.cell_id} {...commonProps} />;
                break;
            case 'reasoning':
                content = <ReasoningCell key={cell.cell_id} {...commonProps} />;
                break;
            case 'code':
                content = <CodeCell key={cell.cell_id} {...commonProps} />;
                break;
            case 'explanation':
                content = <ExplanationCell key={cell.cell_id} {...commonProps} />;
                break;
            case 'metric':
                content = <MetricCell key={cell.cell_id} {...commonProps} />;
                break;
            case 'visualization':
                content = <VisualizationCell key={cell.cell_id} {...commonProps} />;
                break;
            case 'table':
                content = <TableCell key={cell.cell_id} {...commonProps} />;
                break;
            case 'insight':
                content = <InsightCell key={cell.cell_id} {...commonProps} userId={userId} notebookId={notebook?.notebook_id || ''} />;
                break;
            case 'suggestion':
                content = <SuggestionCell key={cell.cell_id} {...commonProps} onSelectPrompt={setUserPrompt} />;
                break;
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
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 overflow-auto">
                    <div className="max-w-4xl mx-auto p-6 space-y-4">
                        {/* Prompt Input */}
                        <Card className="p-4 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border-b">
                            <div className="flex gap-2 relative">
                                <Input
                                    value={userPrompt}
                                    onChange={(e) => setUserPrompt(e.target.value)}
                                    placeholder="Ask an analytical question about your data..."
                                    disabled={loading}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleGenerateNotebook();
                                        }
                                    }}
                                    className="flex-1 pr-24"
                                />
                                <div className="absolute right-1 top-1 flex gap-1">
                                    <Button
                                        onClick={handleGenerateNotebook}
                                        disabled={loading || !userPrompt.trim()}
                                        size="icon"
                                        className="h-8 w-8"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowAssistantPanel(!showAssistantPanel)}
                                        className="h-8 w-8 text-muted-foreground"
                                    >
                                        <PanelRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Analysis Metadata (if notebook exists) */}
                            {notebook && (
                                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="capitalize">{notebook.analysis_metadata.domain}</span>
                                    <span>•</span>
                                    <span className="capitalize">{notebook.analysis_metadata.analysis_type}</span>
                                    <span>•</span>
                                    <span className="capitalize">{notebook.analysis_metadata.confidence_level}</span>
                                </div>
                            )}
                        </Card>

                        {/* Notebook Cells */}
                        <div className="space-y-4 pb-20">
                            {loading && streamingCells.length === 0 && (
                                <Card className="p-8 flex items-center justify-center">
                                    <div className="text-center space-y-2">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                        <p className="text-sm text-muted-foreground">Generating analysis...</p>
                                    </div>
                                </Card>
                            )}

                            {cellsToRender.map((cell, index) => renderCell(cell, index))}

                            {loading && streamingCells.length > 0 && (
                                <Card className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating more cells...
                                </Card>
                            )}
                        </div>

                        {/* Empty State */}
                        {!loading && cellsToRender.length === 0 && (
                            <Card className="p-12 text-center border-dashed">
                                <p className="text-muted-foreground">
                                    Enter a question above to generate a notebook analysis.
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Assistant Panel */}
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
