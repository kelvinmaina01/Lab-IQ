import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Brain,
    CheckCircle2,
    AlertCircle,
    Loader2,
    TrendingUp,
    Target,
    Zap,
    BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { mlService, type Algorithm } from '@/lib/services/mlService';
import { toast } from 'sonner';

interface MLModelWizardProps {
    isOpen: boolean;
    onClose: () => void;
    datasetId: string;
    datasetName?: string;
}

type WizardStep = 'detect' | 'configure' | 'training' | 'results';

export const MLModelWizard: React.FC<MLModelWizardProps> = ({
    isOpen,
    onClose,
    datasetId,
    datasetName
}) => {
    const [currentStep, setCurrentStep] = useState<WizardStep>('detect');
    const [loading, setLoading] = useState(false);

    // Detection state
    const [problemType, setProblemType] = useState<string | null>(null);
    const [suggestedTarget, setSuggestedTarget] = useState<string | null>(null);
    const [columns, setColumns] = useState<string[]>([]);
    const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);

    // Configuration state
    const [selectedTarget, setSelectedTarget] = useState<string>('');
    const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('');
    const [featureColumns, setFeatureColumns] = useState<string[]>([]);

    // Training state
    const [trainingProgress, setTrainingProgress] = useState(0);

    // Results state
    const [modelId, setModelId] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<Record<string, number>>({});
    const [featureImportance, setFeatureImportance] = useState<Array<{ feature: string; importance: number }>>([]);

    useEffect(() => {
        if (isOpen && datasetId) {
            detectProblemType();
        }
    }, [isOpen, datasetId]);

    const detectProblemType = async () => {
        try {
            setLoading(true);
            setCurrentStep('detect');

            // Fetch dataset from Supabase
            const { data: rows, error } = await supabase
                .from('dataset_rows')
                .select('data')
                .eq('dataset_id', datasetId)
                .limit(1000); // Sample for detection

            if (error) throw error;

            const data = rows?.map(r => r.data) || [];
            if (data.length === 0) {
                throw new Error('No data found in dataset');
            }

            const columnList = Object.keys(data[0]);
            setColumns(columnList);

            // Call ML service
            const result = await mlService.detectProblem({
                data,
                columns: columnList
            });

            setProblemType(result.problem_type);
            setSuggestedTarget(result.suggested_target);
            setAlgorithms(result.recommended_algorithms);

            // Auto-select suggestions
            if (result.suggested_target) {
                setSelectedTarget(result.suggested_target);
            }
            if (result.recommended_algorithms.length > 0) {
                setSelectedAlgorithm(result.recommended_algorithms[0].id);
            }

            // Auto-select feature columns (all except target)
            const features = columnList.filter(col => col !== result.suggested_target);
            setFeatureColumns(features);

            toast.success('Problem type detected successfully!');
            setCurrentStep('configure');
        } catch (error) {
            console.error('Error detecting problem:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to detect problem type');
        } finally {
            setLoading(false);
        }
    };

    const startTraining = async () => {
        try {
            setLoading(true);
            setCurrentStep('training');
            setTrainingProgress(20);

            // Fetch full dataset
            const { data: rows, error } = await supabase
                .from('dataset_rows')
                .select('data')
                .eq('dataset_id', datasetId);

            if (error) throw error;

            const data = rows?.map(r => r.data) || [];
            setTrainingProgress(40);

            // Train model
            const result = await mlService.trainModel({
                dataset_id: datasetId,
                data,
                target_column: selectedTarget || undefined,
                feature_columns: featureColumns,
                model_type: problemType as any,
                algorithm: selectedAlgorithm
            });

            setTrainingProgress(80);

            // Save model metadata to Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: modelData, error: modelError } = await supabase
                    .from('ml_models')
                    .insert({
                        user_id: user.id,
                        dataset_id: datasetId,
                        name: `Model for ${datasetName || datasetId}`,
                        model_type: result.problem_type,
                        algorithm: result.algorithm,
                        target_column: selectedTarget,
                        feature_columns: featureColumns,
                        metrics: result.metrics,
                        status: 'ready',
                        training_completed_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (modelError) throw modelError;
                setModelId(modelData.id);
            }

            setMetrics(result.metrics);
            setFeatureImportance(result.feature_importance || []);
            setTrainingProgress(100);
            setCurrentStep('results');

            toast.success('Model trained successfully!');
        } catch (error) {
            console.error('Training error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to train model');
            setCurrentStep('configure');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 'detect':
                return (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4">
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                <Loader2 className="relative h-16 w-16 animate-spin text-primary" />
                            </div>
                            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                Analyzing your dataset...
                            </h3>
                            <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
                                Auto-detecting problem type and suggesting best approaches
                            </p>
                        </div>
                    </div>
                );

            case 'configure':
                return (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Target className="h-4 w-4" />
                                        Problem Type
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Badge className="text-lg px-3 py-1 capitalize">
                                        {problemType || 'Unknown'}
                                    </Badge>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" />
                                        Features
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{featureColumns.length}</div>
                                    <p className="text-xs text-muted-foreground">Selected features</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-4">
                            {problemType !== 'clustering' && (
                                <div className="space-y-2">
                                    <Label htmlFor="target">Target Column (What to predict)</Label>
                                    <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                                        <SelectTrigger id="target">
                                            <SelectValue placeholder="Select target column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {columns.map((col) => (
                                                <SelectItem key={col} value={col}>
                                                    {col}
                                                    {col === suggestedTarget && (
                                                        <span className="ml-2 text-xs text-green-500">✓ Suggested</span>
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="algorithm">ML Algorithm</Label>
                                <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                                    <SelectTrigger id="algorithm">
                                        <SelectValue placeholder="Select algorithm" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {algorithms.map((algo) => (
                                            <SelectItem key={algo.id} value={algo.id}>
                                                <div>
                                                    <div className="font-medium">{algo.name}</div>
                                                    <div className="text-xs text-muted-foreground">{algo.description}</div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button
                            onClick={startTraining}
                            className="w-full"
                            size="lg"
                            disabled={!selectedAlgorithm || (problemType !== 'clustering' && !selectedTarget)}
                        >
                            <Zap className="mr-2 h-5 w-5" />
                            Start Training
                        </Button>
                    </div>
                );

            case 'training':
                return (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-left-4">
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative mb-6">
                                <Brain className="h-16 w-16 text-primary animate-pulse" />
                                <Loader2 className="h-8 w-8 animate-spin text-purple-500 absolute -top-2 -right-2" />
                            </div>
                            <h3 className="text-xl font-bold">Training Your Model</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                This may take a few moments...
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{trainingProgress}%</span>
                            </div>
                            <Progress value={trainingProgress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font bold">
                                    {trainingProgress >= 40 ? '✓' : '⋯'}
                                </div>
                                <p className="text-xs text-muted-foreground">Loading Data</p>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {trainingProgress >= 80 ? '✓' : trainingProgress >= 40 ? '⋯' : ''}
                                </div>
                                <p className="text-xs text-muted-foreground">Training</p>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {trainingProgress === 100 ? '✓' : ''}
                                </div>
                                <p className="text-xs text-muted-foreground">Evaluating</p>
                            </div>
                        </div>
                    </div>
                );

            case 'results':
                return (
                    <div className="space-y-6 animate-in fade-in-50 zoom-in-95">
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="relative mb-4">
                                <div className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl animate-pulse" />
                                <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                                    <CheckCircle2 className="h-10 w-10 text-white animate-in zoom-in-50" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                                Model Training Complete!
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Your model is ready to make predictions
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(metrics).map(([key, value]) => (
                                <Card key={key}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium capitalize">
                                            {key.replace('_', ' ')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {typeof value === 'number' ? value.toFixed(4) : value}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {featureImportance.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Feature Importance</CardTitle>
                                    <CardDescription>Top contributing features</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {featureImportance.slice(0, 5).map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <div className="w-32 text-sm font-medium truncate">{item.feature}</div>
                                                <Progress value={item.importance * 100} className="flex-1 h-2" />
                                                <div className="w-12 text-sm text-right text-muted-foreground">
                                                    {(item.importance * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex gap-2">
                            <Button onClick={onClose} variant="outline" className="flex-1">
                                Close
                            </Button>
                            <Button
                                onClick={() => {/* Navigate to models page */ }}
                                className="flex-1"
                            >
                                View Model Details
                            </Button>
                        </div>
                    </div>
                );
        }
    };

    const steps = [
        { id: 'detect', label: 'Detection', icon: Brain },
        { id: 'configure', label: 'Configure', icon: Target },
        { id: 'training', label: 'Training', icon: Zap },
        { id: 'results', label: 'Results', icon: TrendingUp }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Train ML Model
                        {datasetName && <span className="text-sm font-normal text-muted-foreground">• {datasetName}</span>}
                    </DialogTitle>
                </DialogHeader>

                {/* Step Progress Indicator */}
                <div className="flex items-center justify-between px-4 py-3 border-y">
                    {steps.map((step, index) => {
                        const StepIcon = step.icon;
                        const isActive = index === currentStepIndex;
                        const isCompleted = index < currentStepIndex;

                        return (
                            <div key={step.id} className="flex items-center gap-2 flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted
                                                ? 'bg-green-500 text-white'
                                                : isActive
                                                    ? 'bg-primary text-white scale-110'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-5 h-5" />
                                        ) : (
                                            <StepIcon className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span
                                        className={`text-xs mt-1 font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'
                                            }`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`flex-1 h-0.5 -mt-6 transition-colors ${isCompleted ? 'bg-green-500' : 'bg-muted'
                                            }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {renderStep()}
                </div>
            </DialogContent>
        </Dialog>
    );
};
