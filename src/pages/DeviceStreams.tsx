import { AuthGuard } from "@/components/auth/AuthGuard";
import { MainLayout } from "@/components/layout/MainLayout";
import { DeviceStreamDashboard } from "@/components/devices/DeviceStreamDashboard";

const DeviceStreams = () => {
  return (
    <AuthGuard>
      <MainLayout>
        <main className="p-4 md:p-8">
          <DeviceStreamDashboard />
        </main>
      </MainLayout>
    </AuthGuard>
  );
};

export default DeviceStreams;
