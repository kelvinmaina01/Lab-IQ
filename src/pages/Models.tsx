import { AuthGuard } from "@/components/auth/AuthGuard";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { AutoMLInterface } from "@/components/automl/AutoMLInterface";
import { MLModelWizard } from "@/components/ml/MLModelWizard";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const Models = () => {
    const location = useLocation();
    const [wizardOpen, setWizardOpen] = useState(false);
    const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
    const [selectedDatasetName, setSelectedDatasetName] = useState<string>('');

    useEffect(() => {
        // Check if we're coming from QuickActions
        const state = location.state as any;
        if (state?.openWizard && state?.datasetId) {
            setWizardOpen(true);
            setSelectedDatasetId(state.datasetId);
            setSelectedDatasetName(state.datasetName || '');
        }
    }, [location.state]);

    return (
        <AuthGuard>
            <div className="flex min-h-screen bg-background">
                <Sidebar />

                <div className="flex-1 md:ml-64 pb-16 md:pb-0">
                    <TopBar />

                    <main className="min-h-screen">
                        <AutoMLInterface />
                    </main>
                </div>
                <MobileNav />
            </div>

            {/* ML Model Wizard */}
            <MLModelWizard
                isOpen={wizardOpen}
                onClose={() => {
                    setWizardOpen(false);
                    setSelectedDatasetId('');
                    setSelectedDatasetName('');
                }}
                datasetId={selectedDatasetId}
                datasetName={selectedDatasetName}
            />
        </AuthGuard>
    );
};

export default Models;
