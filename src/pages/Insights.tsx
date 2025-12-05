import { AuthGuard } from "@/components/auth/AuthGuard";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
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
      <div className="flex min-h-screen bg-background">
        <Sidebar />

        <div className="flex-1 md:ml-64 pb-16 md:pb-0">
          <TopBar />

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
        </div>
        <MobileNav />
      </div>
    </AuthGuard>
  );
};

export default Insights;
