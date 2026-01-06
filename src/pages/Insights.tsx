import { AuthGuard } from "@/components/auth/AuthGuard";
import { MainLayout } from "@/components/layout/MainLayout";
import { NotebookView } from "@/components/notebook/NotebookView";
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

  // Initialize from localStorage
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(() => {
    return localStorage.getItem('last-dataset-id');
  });

  // Force notebook mode
  const insightsMode = 'notebook';

  useEffect(() => {
    // Check if coming from QuickActions or Dashboard drill-down
    const state = location.state as {
      datasetId?: string;
      notebookId?: string;
      highlightCellId?: string;
    } | null;

    if (state?.datasetId) {
      setSelectedDatasetId(state.datasetId);
      localStorage.setItem('last-dataset-id', state.datasetId);
    }
  }, [location.state]);

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
      localStorage.setItem('last-dataset-id', id);
    } else {
      localStorage.removeItem('last-dataset-id');
    }
  };

  return (
    <AuthGuard>
      <MainLayout>
        <main className="h-[calc(100vh-64px)] flex flex-col">
          <div className="flex-1 overflow-auto" data-tour="insights-feed">
            {!user || !datasetId ? (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-semibold text-foreground">No Dataset Selected</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                  Please select a dataset to begin your analysis. The AI analyst is ready to help.
                </p>
              </div>
            ) : (
              // Notebook Interface Only
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
