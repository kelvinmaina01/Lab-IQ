import { AuthGuard } from "@/components/auth/AuthGuard";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataAnonymizationPipeline } from "@/components/anonymization/DataAnonymizationPipeline";

const DataAnonymization = () => {
  return (
    <AuthGuard>
      <MainLayout>
        <main className="p-4 md:p-8">
          <DataAnonymizationPipeline />
        </main>
      </MainLayout>
    </AuthGuard>
  );
};

export default DataAnonymization;
