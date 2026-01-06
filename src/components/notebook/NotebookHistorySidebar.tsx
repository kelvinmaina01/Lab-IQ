/**
 * Notebook History Sidebar
 * Shows all notebooks for current dataset, works in both Chat and Notebook modes
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    BookOpen,
    Calendar,
    ChevronRight,
    Plus,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface NotebookHistoryItem {
    id: string;
    title: string;
    analysis_metadata: {
        domain: string;
        analysis_type: string;
        confidence_level: string;
        generated_at: string;
    };
    created_at: string;
}

interface NotebookHistorySidebarProps {
    datasetId: string;
    currentNotebookId?: string;
    onSelectNotebook: (notebookId: string) => void;
    onNewAnalysis: () => void;
}

export const NotebookHistorySidebar: React.FC<NotebookHistorySidebarProps> = ({
    datasetId,
    currentNotebookId,
    onSelectNotebook,
    onNewAnalysis
}) => {
    const [notebooks, setNotebooks] = useState<NotebookHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadNotebooks();
    }, [datasetId]);

    const loadNotebooks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notebooks')
                .select('id, title, analysis_metadata, created_at')
                .eq('dataset_id', datasetId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setNotebooks(data || []);
        } catch (error) {
            console.error('Failed to load notebooks:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getConfidenceColor = (level: string) => {
        switch (level) {
            case 'high': return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
            case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-400';
        }
    };

    if (collapsed) {
        return (
            <div className="h-full w-12 border-l bg-background flex flex-col items-center py-4 gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(false)}
                    className="mb-2"
                >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onNewAnalysis}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="h-full w-80 border-l bg-background flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">Analysis History</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(true)}
                        className="h-6 w-6"
                    >
                        <ChevronRight className="w-3 h-3" />
                    </Button>
                </div>

                <Button
                    onClick={onNewAnalysis}
                    className="w-full"
                    size="sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Analysis
                </Button>
            </div>

            {/* Notebook List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading...
                        </div>
                    ) : notebooks.length === 0 ? (
                        <div className="p-4 text-center">
                            <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                No analyses yet
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Start a new analysis to begin
                            </p>
                        </div>
                    ) : (
                        notebooks.map((notebook) => (
                            <Card
                                key={notebook.id}
                                className={cn(
                                    "p-3 cursor-pointer hover:bg-accent/50 transition-colors",
                                    currentNotebookId === notebook.id && "bg-accent border-primary"
                                )}
                                onClick={() => onSelectNotebook(notebook.id)}
                            >
                                <div className="flex items-start gap-2">
                                    <BookOpen className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium line-clamp-2 mb-1">
                                            {notebook.title}
                                        </h4>

                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge
                                                variant="secondary"
                                                className={cn("text-xs", getConfidenceColor(notebook.analysis_metadata.confidence_level))}
                                            >
                                                {notebook.analysis_metadata.confidence_level}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground capitalize">
                                                {notebook.analysis_metadata.analysis_type}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(notebook.created_at)}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
