/**
 * Data Explorer Side Panel
 * Julius AI-style collapsible sidebar showing:
 * - Active Data Connections
 * - Dataframes (tables, correlation matrices)
 * - Search for datasets, tables, columns
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Search,
    Table2,
    Database,
    Grid3X3,
    FileSpreadsheet,
    X,
    Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataframeItem {
    id: string;
    name: string;
    type: 'table' | 'matrix' | 'dataframe';
    dimensions: string; // e.g., "6115 × 11" or "3 × 3"
    columns: string[];
}

interface DataExplorerPanelProps {
    dataframes: DataframeItem[];
    isOpen: boolean;
    onToggle: () => void;
    onSelectDataframe?: (df: DataframeItem) => void;
    selectedDataframeId?: string;
}

export function DataExplorerPanel({
    dataframes,
    isOpen,
    onToggle,
    onSelectDataframe,
    selectedDataframeId,
    thoughtProcess = []
}: DataExplorerPanelProps & { thoughtProcess?: string[] }) {
    const [activeTab, setActiveTab] = useState<'planning' | 'data' | 'notes'>('data');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [notes, setNotes] = useState('');

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedItems(newExpanded);
    };

    const filteredDataframes = dataframes.filter(df =>
        df.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        df.columns.some(col => col.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getIcon = (type: DataframeItem['type']) => {
        switch (type) {
            case 'matrix': return Grid3X3;
            case 'table': return Table2;
            default: return FileSpreadsheet;
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="w-80 border-l bg-background flex flex-col h-full shadow-xl z-20">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                <span className="text-sm font-medium">Assistant Panel</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggle}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b text-sm shrink-0">
                <button
                    onClick={() => setActiveTab('planning')}
                    className={cn(
                        "flex-1 py-2 px-3 transition-colors border-b-2",
                        activeTab === 'planning' ? "font-medium text-foreground border-primary" : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    Planning
                </button>
                <button
                    onClick={() => setActiveTab('data')}
                    className={cn(
                        "flex-1 py-2 px-3 transition-colors border-b-2",
                        activeTab === 'data' ? "font-medium text-foreground border-primary" : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    Data Explorer
                </button>
                <button
                    onClick={() => setActiveTab('notes')}
                    className={cn(
                        "flex-1 py-2 px-3 transition-colors border-b-2",
                        activeTab === 'notes' ? "font-medium text-foreground border-primary" : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    Notes
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'planning' && (
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Brain className="h-4 w-4" />
                                <span>AI Thought Process</span>
                            </div>
                            {thoughtProcess.length > 0 ? (
                                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-px before:bg-border/50">
                                    {thoughtProcess.map((step, i) => (
                                        <div key={i} className="relative flex gap-4 text-sm animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-background border-2 border-primary text-primary flex items-center justify-center text-[10px] font-bold z-10 shadow-sm">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 pt-0.5">
                                                <p className="text-foreground/90 leading-snug font-medium">{step.split(':')[0].replace(/\*\*/g, '').trim()}</p>
                                                {step.includes(':') && (
                                                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                                                        {step.split(':').slice(1).join(':').replace(/\*\*/g, '').trim()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No active analysis plan yet. Ask a question to start planning.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                )}

                {activeTab === 'data' && (
                    <div className="flex flex-col h-full">
                        {/* Active Data Connections */}
                        <div className="px-4 py-3 border-b shrink-0">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Database className="h-4 w-4" />
                                <span>Active Data Connections</span>
                            </div>
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search columns..."
                                    className="h-8 pl-9 text-xs"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Dataframes List */}
                        <ScrollArea className="flex-1">
                            <div className="p-2">
                                {filteredDataframes.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                        No dataframes found. Upload a dataset to explore.
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredDataframes.map((df) => {
                                            const Icon = getIcon(df.type);
                                            const isExpanded = expandedItems.has(df.id);
                                            const isSelected = selectedDataframeId === df.id;

                                            return (
                                                <div key={df.id}>
                                                    <button
                                                        onClick={() => toggleExpand(df.id)}
                                                        className={cn(
                                                            "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted/50 transition-colors text-left",
                                                            isSelected && "bg-primary/10 text-primary"
                                                        )}
                                                    >
                                                        <ChevronDown
                                                            className={cn(
                                                                "h-3 w-3 text-muted-foreground transition-transform",
                                                                !isExpanded && "-rotate-90"
                                                            )}
                                                        />
                                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                                        <span className="flex-1 truncate font-medium">{df.name}</span>
                                                        <span className="text-xs text-muted-foreground">{df.dimensions}</span>
                                                    </button>

                                                    {/* Columns List */}
                                                    {isExpanded && (
                                                        <div className="ml-7 pl-2 border-l text-xs text-muted-foreground space-y-0.5 py-1">
                                                            {df.columns.map((col, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="px-2 py-0.5 hover:bg-muted/50 rounded cursor-pointer truncate"
                                                                    onClick={() => onSelectDataframe?.(df)}
                                                                >
                                                                    {col}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="flex flex-col h-full p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>Research Notes</span>
                        </div>
                        <textarea
                            className="flex-1 w-full resize-none bg-muted/30 p-3 rounded-md border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Take notes about your analysis here..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default DataExplorerPanel;
