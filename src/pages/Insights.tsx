import { AuthGuard } from "@/components/auth/AuthGuard";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { AIAssistantChat } from "@/components/AIAssistantChat";
import { useState } from "react";

const Insights = () => {
  const [mode, setMode] = useState<'analysis' | 'automl' | 'educator'>('analysis');
  const [isImmersive, setIsImmersive] = useState(false);

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
