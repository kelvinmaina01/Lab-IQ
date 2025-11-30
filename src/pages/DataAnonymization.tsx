import { AuthGuard } from "@/components/auth/AuthGuard";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { DataAnonymizationPipeline } from "@/components/anonymization/DataAnonymizationPipeline";

const DataAnonymization = () => {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        
        <div className="flex-1 md:ml-64 pb-16 md:pb-0">
          <TopBar />
          
          <main className="p-4 md:p-8">
            <DataAnonymizationPipeline />
          </main>
        </div>
        <MobileNav />
      </div>
    </AuthGuard>
  );
};

export default DataAnonymization;
