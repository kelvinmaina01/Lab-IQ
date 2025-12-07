import { AuthGuard } from "@/components/auth/AuthGuard";
import { MainLayout } from "@/components/layout/MainLayout";
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
            <MainLayout>
                <main className="min-h-screen" data-tour="models-grid">
                    <AutoMLInterface />
                </main>
            </MainLayout>

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
