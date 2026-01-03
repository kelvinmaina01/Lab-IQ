/**
 * AI Assistant Container with Dual Modes
 * Supports both Chat and Notebook modes with unified sidebar
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { NotebookOutput } from '@/lib/types/notebook';
import { AssistantPanel } from '@/components/assistant/AssistantPanel';

type AssistantMode = 'chat' | 'notebook';

export const AIAssistantContainer: React.FC = () => {
    const { datasetId } = useParams<{ datasetId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [mode, setMode] = useState<AssistantMode>('chat');
    const [userId, setUserId] = useState<string>('');
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [currentNotebookId, setCurrentNotebookId] = useState<string | undefined>();
    const [activeNotebook, setActiveNotebook] = useState<NotebookOutput | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { toast } = useToast();

    // Handle deep linking from dashboard
    useEffect(() => {
        const notebookId = searchParams.get('notebookId');
        if (notebookId) {
            setMode('notebook');
            setCurrentNotebookId(notebookId);
        }
    }, [searchParams]);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
            }
        } catch (error) {
            console.error('Failed to load user:', error);
        } finally {
            setIsLoadingUser(false);
        }
    };

    const handleSelectNotebook = (notebookId: string) => {
        setMode('notebook');
        setCurrentNotebookId(notebookId);
        setSearchParams({ notebookId }); // Sync URL
    };

    const handleNewAnalysis = () => {
        setMode('notebook');
        setCurrentNotebookId(undefined);
        setSearchParams({}); // Clear URL
    };

    const handleModeChange = (newMode: AssistantMode) => {
        setMode(newMode);
        if (newMode === 'notebook') {
            setCurrentNotebookId(undefined);
            setSearchParams({});
        }
        if (newMode === 'chat') {
            setSearchParams({});
        }
    };

    if (isLoadingUser) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!datasetId) {
        return (
            <Card className="p-8 text-center">
                <p className="text-muted-foreground">No dataset selected</p>
            </Card>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Mode Toggle */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 px-6 py-3">
                <div className="flex items-center justify-between">
                    <Tabs value={mode} onValueChange={(v) => handleModeChange(v as AssistantMode)}>
                        <TabsList>
                            <TabsTrigger value="chat" className="gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Chat
                            </TabsTrigger>
                            <TabsTrigger value="notebook" className="gap-2">
                                <BookOpen className="w-4 h-4" />
                                Notebook
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {mode === 'notebook' && (
                        <Button onClick={handleNewAnalysis} variant="outline" size="sm">
                            New Analysis
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 flex flex-col overflow-hidden">
                    {mode === 'chat' ? (
                        <AIAssistantChat />
                    ) : (
                        <div className="flex-1 flex overflow-hidden">
                            <NotebookView
                                datasetId={datasetId}
                                notebookId={currentNotebookId}
                                userId={userId}
                                highlightCellId={searchParams.get('cellId') || undefined}
                                onNotebookChange={setActiveNotebook}
                            />
                            <NotebookHistorySidebar
                                datasetId={datasetId}
                                currentNotebookId={currentNotebookId}
                                currentMode={mode}
                                onSelectNotebook={handleSelectNotebook}
                                onNewAnalysis={handleNewAnalysis}
                            />
                        </div>
                    )}
                </div>

                {/* Interactive Intelligence Rail (Assistant Panel) */}
                <AssistantPanel
                    isOpen={sidebarOpen}
                    onToggle={() => setSidebarOpen(!sidebarOpen)}
                    notebook={activeNotebook}
                    datasetId={datasetId}
                    userId={userId}
                />
            </div>
        </div>
    );
};
