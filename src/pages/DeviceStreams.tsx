import { AuthGuard } from "@/components/auth/AuthGuard";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { DeviceStreamDashboard } from "@/components/devices/DeviceStreamDashboard";

const DeviceStreams = () => {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        
        <div className="flex-1 md:ml-64 pb-16 md:pb-0">
          <TopBar />
          
          <main className="p-4 md:p-8">
            <DeviceStreamDashboard />
          </main>
        </div>
        <MobileNav />
      </div>
    </AuthGuard>
  );
};

export default DeviceStreams;
