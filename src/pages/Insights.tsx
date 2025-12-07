import { AuthGuard } from "@/components/auth/AuthGuard";
import { MainLayout } from "@/components/layout/MainLayout";
import { AIAssistantChat } from "@/components/AIAssistantChat";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const Insights = () => {
  const location = useLocation();
  const [mode, setMode] = useState<'analysis' | 'automl' | 'educator'>('analysis');
  const [isImmersive, setIsImmersive] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  useEffect(() => {
    // Check if coming from QuickActions with dataset
    const state = location.state as any;
    if (state?.datasetId) {
      setSelectedDatasetId(state.datasetId);
      if (state?.mode) {
        setMode(state.mode);
      }
    }
  }, [location.state]);

  return (
    <AuthGuard>
      <MainLayout>
        <main className="h-[calc(100vh-64px)] flex flex-col">
          <div className="flex-1 overflow-hidden">
            <AIAssistantChat
              mode={mode}
              onModeChange={setMode}
              onImmersiveChange={setIsImmersive}
              initialDatasetId={selectedDatasetId || undefined}
            />
          </div>
        </main>
      </MainLayout>
    </AuthGuard>
  );
};

export default Insights;
