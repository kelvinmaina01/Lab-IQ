import { AuthGuard } from "@/components/auth/AuthGuard";
import { MainLayout } from "@/components/layout/MainLayout";
import { NotebookView } from "@/components/notebook/NotebookView";
import { AIAssistantChat } from "@/components/AIAssistantChat";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { MessageSquare, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type InsightsMode = 'chat' | 'notebook';

const Insights = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  // Get mode from localStorage or default to chat
  const [insightsMode, setInsightsMode] = useState<InsightsMode>(() => {
    const saved = localStorage.getItem('insights-mode');
    return (saved as InsightsMode) || 'chat';
  });

  const [aiMode, setAiMode] = useState<'analyst' | 'ml' | 'learn'>('analyst');

  useEffect(() => {
    // Check if coming from QuickActions or Dashboard drill-down
    const state = location.state as {
      datasetId?: string;
      notebookId?: string;
      highlightCellId?: string;
      insightsMode?: InsightsMode;
    };

    if (state?.datasetId) {
      setSelectedDatasetId(state.datasetId);
    }

    // Override mode if specified in navigation
    if (state?.insightsMode) {
      setInsightsMode(state.insightsMode);
    }
  }, [location.state]);

  const handleModeChange = (mode: InsightsMode) => {
    setInsightsMode(mode);
    localStorage.setItem('insights-mode', mode);
  };

  const locationState = location.state as {
    datasetId?: string;
    notebookId?: string;
    highlightCellId?: string;
  } | null;

  const datasetId = locationState?.datasetId || selectedDatasetId;
  const notebookId = locationState?.notebookId;
  const highlightCellId = locationState?.highlightCellId;

  const handleDatasetSelect = (id: string | null) => {
    setSelectedDatasetId(id);
    if (id) {
      // User requested "take me to the chats", so switch to chat mode
      setInsightsMode('chat');
    }
  };

  return (
    <AuthGuard>
      <MainLayout>
        <main className="h-[calc(100vh-64px)] flex flex-col">
          {/* Mode Toggle */}
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={insightsMode === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleModeChange('chat')}
                  className={cn(
                    "gap-2",
                    insightsMode === 'chat' && "bg-primary text-primary-foreground"
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat Mode
                </Button>
                <Button
                  variant={insightsMode === 'notebook' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleModeChange('notebook')}
                  className={cn(
                    "gap-2",
                    insightsMode === 'notebook' && "bg-primary text-primary-foreground"
                  )}
                >
                  <BookOpen className="w-4 h-4" />
                  Notebook Mode
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                {insightsMode === 'chat'
                  ? 'Conversational AI assistant'
                  : 'Structured analytical notebook'}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto" data-tour="insights-feed">
            {!user || !datasetId ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">
                  Please select a dataset to begin analysis
                </p>
              </div>
            ) : insightsMode === 'chat' ? (
              // Original Chat Interface
              <AIAssistantChat
                mode={aiMode}
                onModeChange={setAiMode}
                onImmersiveChange={() => { }}
                initialDatasetId={datasetId}
                onDatasetChange={handleDatasetSelect}
              />
            ) : (
              // New Notebook Interface
              <NotebookView
                datasetId={datasetId}
                notebookId={notebookId}
                userId={user.id}
                highlightCellId={highlightCellId}
                onDatasetSelect={handleDatasetSelect}
              />
            )}
          </div>
        </main>
      </MainLayout>
    </AuthGuard>
  );
};

export default Insights;
