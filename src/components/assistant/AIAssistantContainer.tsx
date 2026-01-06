import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NotebookOutput } from '@/lib/types/notebook';
import { AssistantPanel } from '@/components/assistant/AssistantPanel';
import { NotebookView } from '@/components/notebook/NotebookView';
import { NotebookHistorySidebar } from '@/components/notebook/NotebookHistorySidebar';
import { AIAssistantChat } from '@/components/AIAssistantChat';

export const AIAssistantContainer: React.FC = () => {
    const { datasetId } = useParams<{ datasetId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
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
        setCurrentNotebookId(notebookId);
        setSearchParams({ notebookId }); // Sync URL
    };

    const handleNewAnalysis = () => {
        setCurrentNotebookId(undefined);
        setSearchParams({}); // Clear URL
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
            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 flex overflow-hidden">
                        {/* 
                            TEMPORARY: Swapping NotebookView for AIAssistantChat 
                            to verify Code Monitor Mock visibility as per user request. 
                        */}
                        <AIAssistantChat
                            datasetId={datasetId}
                            userId={userId}
                            initialMode="analyst"
                        />

                        {/* 
                        <NotebookView
                            datasetId={datasetId}
                            notebookId={currentNotebookId}
                            userId={userId}
                            highlightCellId={searchParams.get('cellId') || undefined}
                            onNotebookChange={setActiveNotebook}
                        />
                        */}

                        <NotebookHistorySidebar
                            datasetId={datasetId}
                            currentNotebookId={currentNotebookId}
                            onSelectNotebook={handleSelectNotebook}
                            onNewAnalysis={handleNewAnalysis}
                        />
                    </div>
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
