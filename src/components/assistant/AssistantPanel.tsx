/**
 * Advanced Assistant Panel
 * Interactive intelligence rail for Planning, Data Exploration, and Insights.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Brain,
    Database,
    Lightbulb,
    ChevronLeft,
    ChevronRight,
    Search,
    Table2,
    FileSpreadsheet,
    ChevronDown,
    BarChart3,
    ArrowRight,
    Clock,
    Sparkles,
    Pin,
    AlertCircle,
    ChevronDown,
    Play,
    Eye,
    MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from '@/integrations/supabase/client';
import { NotebookOutput, PinnedInsightRecord } from '@/lib/types/notebook';
import { VisualizationCell } from '@/components/notebook/cells/VisualizationCell';

interface AssistantPanelProps {
    notebook: NotebookOutput | null;
    datasetId?: string;
    userId: string;
    isOpen: boolean;
    onToggle: () => void;
    currentThoughtProcess?: any[];
    onDatasetSelect?: (datasetId: string) => void;
    onRestoreConversation?: (datasetId: string) => void;
}

type Tab = 'planning' | 'data' | 'insights';

function DatasetExplorerContent({
    dataset,
    searchQuery,
    isActive,
    onSelect
}: {
    dataset: any,
    searchQuery: string,
    isActive: boolean,
    onSelect?: () => void
}) {
    const [viewMode, setViewMode] = useState<'schema' | 'preview'>('schema');
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const hasTable = !!dataset.table_name;

    const loadPreview = useCallback(async () => {
        if (previewData.length > 0) return; // Already loaded
        if (!hasTable) return;

        setIsLoadingPreview(true);
        setPreviewError(null);
        try {
            const tableName = dataset.table_name;
            if (!tableName) throw new Error("No linked table found for this dataset");

            // Safe query - limit 10
            const { data, error } = await supabase
                .from(tableName as any)
                .select('*')
                .limit(10);

            if (error) {
                console.warn("Direct table fetch failed", error);
                throw error;
            }
            if (data) setPreviewData(data);
        } catch (err) {
            console.error("Failed to load preview", err);
            setPreviewError("Preview unavailable");
        } finally {
            setIsLoadingPreview(false);
        }
    }, [dataset.table_name, hasTable, previewData.length]);

    // Filter columns based on search
    const filteredColumns = useMemo(() => {
        if (!dataset.dataset_columns) return [];
        return dataset.dataset_columns.filter((col: any) =>
            (col.column_name || col.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [dataset, searchQuery]);

    return (
        <div className="bg-background/50">
            {!isActive && onSelect && (
                <div className="p-2 border-b bg-muted/30">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs h-7 gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                        onClick={onSelect}
                    >
                        <Sparkles className="w-3 h-3" />
                        Switch AI Context to this Dataset
                    </Button>
                </div>
            )}
            <div className="flex items-center px-2 border-b">
                <button
                    className={cn(
                        "text-xs font-medium px-3 py-2 border-b-2 transition-colors",
                        viewMode === 'schema' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setViewMode('schema')}
                >
                    Schema
                </button>
                <button
                    className={cn(
                        "text-xs font-medium px-3 py-2 border-b-2 transition-colors",
                        viewMode === 'preview' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                        !hasTable && "opacity-50 cursor-not-allowed text-muted-foreground/70"
                    )}
                    disabled={!hasTable}
                    title={!hasTable ? "No table connected for preview" : "View first 10 rows"}
                    onClick={() => { if (hasTable) { setViewMode('preview'); loadPreview(); } }}
                >
                    Preview Rows
                </button>
            </div>

            <ScrollArea className="h-56">
                {viewMode === 'schema' ? (
                    <div className="p-2 space-y-1">
                        {filteredColumns.length > 0 ? (
                            filteredColumns.map((col: any) => (
                                <div key={col.id} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/50 text-sm group transition-colors cursor-pointer border border-transparent hover:border-border/50">
                                    <div className="flex items-center gap-2">
                                        <Table2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                                        <span className="font-medium text-foreground/80 group-hover:text-foreground">
                                            {col.column_name || col.name}
                                        </span>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] h-5 opacity-70 group-hover:opacity-100">
                                        {col.data_type}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-muted-foreground text-xs">
                                {dataset.dataset_columns?.length > 0 ? "No matching columns." : "No columns found."}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-2">
                        {isLoadingPreview ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">Loading data...</div>
                        ) : previewError ? (
                            <div className="p-4 text-center text-xs text-destructive bg-destructive/10 rounded-md mx-2">
                                <AlertCircle className="w-4 h-4 mx-auto mb-1 text-destructive" />
                                {previewError}
                                {!dataset.table_name && <p className="mt-1 opacity-70">Dataset has no valid table linked.</p>}
                            </div>
                        ) : previewData.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="text-muted-foreground font-medium bg-muted/30 sticky top-0">
                                        <tr>
                                            {Object.keys(previewData[0]).slice(0, 3).map(k => (
                                                <th key={k} className="p-2 whitespace-nowrap border-b">{k}</th>
                                            ))}
                                            {Object.keys(previewData[0]).length > 3 && <th className="p-2 border-b">...</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {previewData.map((row, i) => (
                                            <tr key={i} className="hover:bg-muted/30">
                                                {Object.keys(row).slice(0, 3).map((k, j) => (
                                                    <td key={j} className="p-2 max-w-[100px] truncate text-foreground/80">
                                                        {String(row[k])}
                                                    </td>
                                                ))}
                                                {Object.keys(row).length > 3 && <td className="p-2 text-muted-foreground">...</td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="p-2 text-[10px] text-center text-muted-foreground border-t mt-2">
                                    Showing first 10 rows
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                                No preview available.
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

export function AssistantPanel({
    notebook,
    datasetId,
    userId,
    isOpen,
    onToggle,
    currentThoughtProcess = [],
    onDatasetSelect,
    onRestoreConversation
}: AssistantPanelProps) {
    const [activeTab, setActiveTab] = useState<Tab>('planning');
    const [isHovered, setIsHovered] = useState(false);

    // Resizable State
    const [width, setWidth] = useState(400); // Default width
    const [isDragging, setIsDragging] = useState(false);

    // Data State
    const [datasets, setDatasets] = useState<any[]>([]);
    const [pinnedInsights, setPinnedInsights] = useState<PinnedInsightRecord[]>([]);
    const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Computed Interaction State
    const isExpanded = isOpen || isDragging; // Removed isHovered constraint

    useEffect(() => {
        loadDatasets();
        if (userId) loadPinnedInsights();
    }, [userId, datasetId]);

    // Drag handling
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                // Sidebar is on right. Width = WindowWidth - MouseX
                const newWidth = window.innerWidth - e.clientX;
                // Constraints: Min 300, Max 800
                setWidth(Math.max(300, Math.min(newWidth, 800)));
            }
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
            }
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            // Disable selection while dragging
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
        };
    }, [isDragging]);

    const loadDatasets = async () => {
        const { data, error } = await supabase
            .from('datasets')
            .select('*, dataset_columns(*)')
            .order('created_at', { ascending: false }); // Newest first

        if (!error && data) {
            // Deduplicate by name & Filter Invalid
            const seen = new Set();
            const cleanDatasets = data.filter((d: any) => {
                // Must have a name
                if (!d.name) return false;
                // Must have useful content: either a linked table or parsed columns
                const hasContent = d.table_name || (d.dataset_columns && d.dataset_columns.length > 0);
                if (!hasContent) return false;

                const isDuplicate = seen.has(d.name);
                seen.add(d.name);
                return !isDuplicate;
            });
            setDatasets(cleanDatasets);
        }
    };

    const loadPinnedInsights = async () => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('pinned_insights')
            .select(`
                *,
                notebooks ( dataset_id )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setPinnedInsights(data as any[]);
        }
    };

    // Filter Insights by Active Dataset (Context Aware)
    // If datasetId is active, only show insights from that dataset.
    // If no dataset active, show all? Or show grouped?
    const visibleInsights = useMemo(() => {
        let filtered = pinnedInsights;

        if (datasetId) {
            filtered = pinnedInsights.filter(p => {
                const notebook = p.notebooks as any;
                return notebook?.dataset_id === datasetId;
            });
        }

        // Sort by created_at descending (newest first)
        return filtered.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }, [pinnedInsights, datasetId]);

    // Filtered Datasets List
    const visibleDatasets = useMemo(() => {
        if (!searchQuery) return datasets;

        const q = searchQuery.toLowerCase();
        return datasets.filter(d => {
            const nameMatch = (d.name || '').toLowerCase().includes(q);
            const columnMatch = d.dataset_columns?.some((c: any) => (c.name || '').toLowerCase().includes(q));
            return nameMatch || columnMatch;
        });
    }, [datasets, searchQuery]);

    // --- Tab Content Renderers ---

    const renderPlanningTab = () => (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-lg">Analysis Reasoning</h3>
            </div>

            {currentThoughtProcess.length > 0 ? (
                <div className="relative border-l-2 border-purple-200 dark:border-purple-900 ml-3 space-y-8 pb-4">
                    {currentThoughtProcess.map((step, idx) => {
                        const content = typeof step === 'string' ? step : step.content;
                        const section = typeof step === 'string' ? null : step.section;

                        return (
                            <div key={idx} className="relative pl-6 group">
                                <span className={cn(
                                    "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-colors duration-300",
                                    idx === currentThoughtProcess.length - 1
                                        ? "bg-purple-500 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                        : "bg-background border-purple-300 dark:border-purple-700"
                                )} />
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                                        Step {idx + 1} {section && `• ${section}`}
                                    </span>
                                    <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                                        {content}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-10 text-muted-foreground px-4">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Start a conversation to see the AI's thought process unfold here.</p>
                </div>
            )}
        </div>
    );

    const renderDataExplorerTab = () => (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-lg">Active Data</h3>
                </div>
                <Badge variant="outline" className="text-xs">
                    {datasets.length} Sources
                </Badge>
            </div>

            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search columns, files..."
                    className="pl-9 bg-muted/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <ScrollArea className="h-[calc(100vh-280px)] pr-2">
                <Accordion type="single" collapsible className="w-full" defaultValue={datasetId}>
                    {visibleDatasets.map((dataset) => (
                        <AccordionItem key={dataset.id} value={dataset.id} className="border-b-0 mb-2">
                            <Card className="border shadow-sm overflow-hidden">
                                <div className="px-3 py-2 bg-gradient-to-r from-muted/50 to-transparent">
                                    <AccordionTrigger className="hover:no-underline py-1">
                                        <div className="flex items-center gap-3 w-full pr-2">
                                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded shrink-0">
                                                <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="text-left flex-1 overflow-hidden">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium text-sm leading-none mb-1 truncate" title={dataset.name}>{dataset.name}</p>
                                                    <div className="flex items-center gap-1">
                                                        {onRestoreConversation && (
                                                            <div
                                                                role="button"
                                                                tabIndex={0}
                                                                className="group/resume flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 transition-all cursor-pointer mr-2"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onRestoreConversation(dataset.id);
                                                                }}
                                                            >
                                                                <MessageCircle className="w-3.5 h-3.5 animate-pulse" />
                                                                <span className="text-[10px] font-medium max-w-0 overflow-hidden group-hover/resume:max-w-[100px] transition-[max-width] duration-300 ease-in-out whitespace-nowrap">
                                                                    Resume Chat
                                                                </span>
                                                            </div>
                                                        )}
                                                        {dataset.id === datasetId && (
                                                            <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                                                                Active
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground truncate">
                                                    {dataset.row_count?.toLocaleString()} rows • {dataset.dataset_columns?.length} cols
                                                </p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                </div>
                                <AccordionContent className="px-0 pb-0">
                                    <DatasetExplorerContent
                                        dataset={dataset}
                                        searchQuery={searchQuery}
                                        isActive={dataset.id === datasetId}
                                        onSelect={() => onDatasetSelect?.(dataset.id)}
                                    />
                                </AccordionContent>
                            </Card>
                        </AccordionItem>
                    ))}
                    {visibleDatasets.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No datasets found.
                        </div>
                    )}
                </Accordion>
            </ScrollArea>
        </div>
    );

    const renderInsightsTab = () => (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-lg">
                    {datasetId ? 'Context Insights' : 'Pinned Insights'}
                </h3>
            </div>

            <div className="space-y-3">
                {visibleInsights.map((insight) => (
                    <div
                        key={insight.id}
                        className={cn(
                            "relative transition-all duration-300 ease-in-out",
                            expandedInsight === insight.id ? "z-10" : "z-0"
                        )}
                    >
                        <Card
                            className={cn(
                                "cursor-pointer transition-all hover:shadow-md border-l-4",
                                expandedInsight === insight.id
                                    ? "border-l-primary shadow-lg scale-[1.02]"
                                    : "border-l-transparent hover:border-l-muted-foreground/50"
                            )}
                            onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
                        >
                            <div className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-medium text-sm line-clamp-2 leading-snug">
                                        {insight.title}
                                    </h4>
                                    <Pin className="w-3.5 h-3.5 text-muted-foreground shrink-0 rotate-45" />
                                </div>
                                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>{new Date(insight.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Slide-out / Expansion Area */}
                            {expandedInsight === insight.id && (
                                <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 duration-200">
                                    <Separator className="my-2" />
                                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                        {insight.description}
                                    </p>

                                    {/* Render visualization if type matches */}
                                    {insight.insight_data?.type === 'visualization' && (
                                        <div className="rounded-lg border bg-card overflow-hidden">
                                            <VisualizationCell
                                                cell={{
                                                    id: insight.cell_id,
                                                    type: 'visualization',
                                                    title: insight.title,
                                                    content: insight.insight_data
                                                }}
                                                datasetId={datasetId}
                                            />
                                        </div>
                                    )}

                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="w-full mt-3 text-xs h-7"
                                        onClick={() => onRestoreConversation?.(insight.dataset_id || datasetId || '')}
                                    >
                                        Open in Notebook <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </div>
                ))}

                {visibleInsights.length === 0 && (
                    <div className="text-center py-10 px-4 border-2 border-dashed rounded-xl">
                        <Pin className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">
                            {datasetId
                                ? "No specific insights found for this dataset."
                                : "Pin interesting insights from the chat to save them here."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    // --- Main Layout ---
    // Width logic: if expanded, use `width` state. If collapsed, 3.5rem (w-14).

    return (
        <div
            className={cn(
                "h-full border-l bg-background/50 backdrop-blur-sm shadow-xl transition-all duration-75 ease-out flex flex-col z-30 relative group",
                !isExpanded && "w-14 items-center"
            )}
            style={{ width: isExpanded ? width : undefined }}
            onMouseEnter={() => { }} // Disabled hover expansion
            onMouseLeave={() => { }}
        >
            {/* Resize Handle - Only visible when expanded */}
            {isExpanded && (
                <div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-transparent hover:bg-primary/20 cursor-ew-resize z-50 transition-colors flex items-center justify-center group-resize"
                    onMouseDown={() => setIsDragging(true)}
                >
                    <div className="h-8 w-1 rounded-full bg-border group-hover/resize:bg-primary/50 transition-colors" />
                </div>
            )}

            {/* Sidebar Navigation (Vertical Rail) */}
            <div className={cn(
                "flex flex-col gap-4 py-4 shrink-0 transition-opacity",
                isExpanded ? "hidden" : "flex w-full items-center"
            )}>
                <Button variant={activeTab === 'planning' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 rounded-full" onClick={() => { setActiveTab('planning'); if (!isOpen) onToggle(); }}>
                    <Brain className="h-4 w-4" />
                </Button>
                <Button variant={activeTab === 'data' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 rounded-full" onClick={() => { setActiveTab('data'); if (!isOpen) onToggle(); }}>
                    <Database className="h-4 w-4" />
                </Button>
                <Button variant={activeTab === 'insights' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 rounded-full" onClick={() => { setActiveTab('insights'); if (!isOpen) onToggle(); }}>
                    <Lightbulb className="h-4 w-4" />
                </Button>
                <div className="flex-1" />
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={onToggle}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </div>

            {/* Expanded Content Area */}
            <div className={cn(
                "flex-1 flex flex-col w-full overflow-hidden transition-all duration-300 delay-100",
                isExpanded ? "opacity-100" : "opacity-0 invisible pointer-events-none"
            )}>
                {/* Header Actions */}
                <div className="p-4 border-b flex items-center justify-between shrink-0">
                    <div className="flex bg-muted/50 p-1 rounded-lg">
                        <Button
                            variant={activeTab === 'planning' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 text-xs px-2.5"
                            onClick={() => setActiveTab('planning')}
                        >
                            Planning
                        </Button>
                        <Button
                            variant={activeTab === 'data' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 text-xs px-2.5"
                            onClick={() => setActiveTab('data')}
                        >
                            Data
                        </Button>
                        <Button
                            variant={activeTab === 'insights' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 text-xs px-2.5"
                            onClick={() => setActiveTab('insights')}
                        >
                            Insights
                        </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
                        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden relative">
                    <ScrollArea className="h-full p-4">
                        {activeTab === 'planning' && renderPlanningTab()}
                        {activeTab === 'data' && renderDataExplorerTab()}
                        {activeTab === 'insights' && renderInsightsTab()}
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
