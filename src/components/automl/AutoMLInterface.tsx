import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Brain,
    TrendingUp,
    Target,
    Zap,
    CheckCircle2,
    Play,
    Download,
    BarChart3,
    AlertCircle
} from 'lucide-react';

interface ModelMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    rmse?: number;
    r2?: number;
}

interface ModelResult {
    algorithm: string;
    metrics: ModelMetrics;
    trainingTime: number;
    status: 'training' | 'completed' | 'failed';
}

export const AutoMLInterface = () => {
    const [selectedTarget, setSelectedTarget] = useState<string>('');
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [taskType, setTaskType] = useState<'classification' | 'regression'>('classification');
    const [isTraining, setIsTraining] = useState(false);
    const [trainingProgress, setTrainingProgress] = useState(0);
    const [models, setModels] = useState<ModelResult[]>([]);

    // Mock data - dataset columns
    const mockColumns = [
        'temperature',
        'pH_level',
        'concentration',
        'humidity',
        'yield',
        'quality_score',
        'experiment_duration'
    ];

    // Mock training function
    const handleTrain = async () => {
        if (!selectedTarget) {
            alert('Please select a target column!');
            return;
        }

        setIsTraining(true);
        setModels([]);
        setTrainingProgress(0);

        // Simulate training 3 models
        const algorithms = ['Random Forest', 'XGBoost', 'Gradient Boosting'];

        for (let i = 0; i < algorithms.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500));

            setTrainingProgress(((i + 1) / algorithms.length) * 100);

            const mockMetrics: ModelMetrics = taskType === 'classification'
                ? {
                    accuracy: 0.85 + Math.random() * 0.12,
                    precision: 0.82 + Math.random() * 0.15,
                    recall: 0.79 + Math.random() * 0.18,
                    f1Score: 0.83 + Math.random() * 0.14
                }
                : {
                    accuracy: 0,
                    precision: 0,
                    recall: 0,
                    f1Score: 0,
                    rmse: 2.5 + Math.random() * 3,
                    r2: 0.75 + Math.random() * 0.2
                };

            setModels(prev => [...prev, {
                algorithm: algorithms[i],
                metrics: mockMetrics,
                trainingTime: 12 + Math.random() * 8,
                status: 'completed'
            }]);
        }

        setIsTraining(false);
    };

    const getBestModel = () => {
        if (models.length === 0) return null;

        return models.reduce((best, current) => {
            const metric = taskType === 'classification' ? 'accuracy' : 'r2';
            return (current.metrics[metric as keyof ModelMetrics] || 0) > (best.metrics[metric as keyof ModelMetrics] || 0)
                ? current
                : best;
        });
    };

    const bestModel = getBestModel();

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Brain className="w-8 h-8 text-purple-500" />
                        AutoML Model Builder
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Automatically train and compare machine learning models
                    </p>
                </div>
                <Badge variant="outline" className="text-sm px-4 py-2">
                    <Zap className="w-4 h-4 mr-2" />
                    No Code Required
                </Badge>
            </div>

            {/* Configuration Section */}
            <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/20">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Configure Training
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Task Type</label>
                        <Select value={taskType} onValueChange={(v: typeof taskType) => setTaskType(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="classification">Classification</SelectItem>
                                <SelectItem value="regression">Regression</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Target Column</label>
                        <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select target variable..." />
                            </SelectTrigger>
                            <SelectContent>
                                {mockColumns.map(col => (
                                    <SelectItem key={col} value={col}>
                                        {col.replace(/_/g, ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2 mt-4">
                    <label className="text-sm font-medium">Feature Selection (Optional)</label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-background/50">
                        {mockColumns.filter(col => col !== selectedTarget).map(col => (
                            <Badge
                                key={col}
                                variant={selectedFeatures.includes(col) ? "default" : "outline"}
                                className="cursor-pointer hover:bg-primary/80"
                                onClick={() => {
                                    setSelectedFeatures(prev =>
                                        prev.includes(col)
                                            ? prev.filter(f => f !== col)
                                            : [...prev, col]
                                    );
                                }}
                            >
                                {col.replace(/_/g, ' ')}
                            </Badge>
                        ))}
                        {mockColumns.filter(col => col !== selectedTarget).length === 0 && (
                            <span className="text-sm text-muted-foreground">Select a target first to see available features</span>
                        )}
                    </div>
                </div>

                <Button
                    onClick={handleTrain}
                    disabled={isTraining || !selectedTarget}
                    className="w-full mt-6 h-12 text-base"
                    size="lg"
                >
                    {isTraining ? (
                        <>
                            <div className="animate-spin mr-2">⚙️</div>
                            Training Models...
                        </>
                    ) : (
                        <>
                            <Play className="w-5 h-5 mr-2" />
                            Start Training
                        </>
                    )}
                </Button>
            </Card>

            {/* Training Progress */}
            {isTraining && (
                <Card className="p-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Training Progress</span>
                            <span className="text-sm text-muted-foreground">
                                {Math.round(trainingProgress)}%
                            </span>
                        </div>
                        <Progress value={trainingProgress} className="h-2" />
                        <p className="text-sm text-muted-foreground">
                            Training {models.length + 1}/3 models...
                        </p>
                    </div>
                </Card>
            )}

            {/* Results */}
            {models.length > 0 && (
                <>
                    {/* Best Model Highlight */}
                    {bestModel && (
                        <Card className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        <h3 className="text-lg font-semibold">Best Model</h3>
                                    </div>
                                    <p className="text-2xl font-bold">{bestModel.algorithm}</p>
                                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {taskType === 'classification' ? (
                                            <>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Accuracy</p>
                                                    <p className="text-xl font-semibold">
                                                        {(bestModel.metrics.accuracy * 100).toFixed(1)}%
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Precision</p>
                                                    <p className="text-xl font-semibold">
                                                        {(bestModel.metrics.precision * 100).toFixed(1)}%
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Recall</p>
                                                    <p className="text-xl font-semibold">
                                                        {(bestModel.metrics.recall * 100).toFixed(1)}%
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">F1 Score</p>
                                                    <p className="text-xl font-semibold">
                                                        {(bestModel.metrics.f1Score * 100).toFixed(1)}%
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">R² Score</p>
                                                    <p className="text-xl font-semibold">
                                                        {(bestModel.metrics.r2 || 0).toFixed(3)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">RMSE</p>
                                                    <p className="text-xl font-semibold">
                                                        {(bestModel.metrics.rmse || 0).toFixed(2)}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => {
                                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(models, null, 2));
                                        const downloadAnchorNode = document.createElement('a');
                                        downloadAnchorNode.setAttribute("href", dataStr);
                                        downloadAnchorNode.setAttribute("download", "automl_results.json");
                                        document.body.appendChild(downloadAnchorNode);
                                        downloadAnchorNode.click();
                                        downloadAnchorNode.remove();
                                    }}
                                >
                                    <Download className="w-4 h-4" />
                                    Export Results
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* All Models Comparison */}
                    <Card className="p-6">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Model Comparison
                        </h3>

                        <div className="space-y-4">
                            {models.map((model, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg border transition-all ${model === bestModel
                                        ? 'border-green-500/50 bg-green-500/5'
                                        : 'border-border bg-muted/30'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${model === bestModel ? 'bg-green-500' : 'bg-muted'
                                                }`}>
                                                {model === bestModel ? (
                                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                                ) : (
                                                    <span className="text-white font-bold">{idx + 1}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{model.algorithm}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {model.trainingTime.toFixed(1)}s training time
                                                </p>
                                            </div>
                                        </div>
                                        {model === bestModel && (
                                            <Badge className="bg-green-500">Recommended</Badge>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {taskType === 'classification' ? (
                                            <>
                                                <MetricCard label="Accuracy" value={model.metrics.accuracy} />
                                                <MetricCard label="Precision" value={model.metrics.precision} />
                                                <MetricCard label="Recall" value={model.metrics.recall} />
                                                <MetricCard label="F1" value={model.metrics.f1Score} />
                                            </>
                                        ) : (
                                            <>
                                                <MetricCard label="R²" value={model.metrics.r2 || 0} isR2 />
                                                <MetricCard label="RMSE" value={model.metrics.rmse || 0} isRMSE />
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Insights */}
                    <Card className="p-6 bg-blue-500/5 border-blue-500/20">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                            <div>
                                <h4 className="font-semibold mb-2">💡 AI Insights</h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li>• {bestModel?.algorithm} achieved the best performance for this task</li>
                                    <li>• Model is ready for predictions on new data</li>
                                    <li>• Consider collecting more {selectedTarget} samples to improve accuracy</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </>
            )}

            {/* Empty State */}
            {!isTraining && models.length === 0 && (
                <Card className="p-12 text-center">
                    <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Models Trained Yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Select a target variable and click "Start Training" to build your first model
                    </p>
                </Card>
            )}
        </div>
    );
};

const MetricCard = ({ label, value, isR2, isRMSE }: {
    label: string;
    value: number;
    isR2?: boolean;
    isRMSE?: boolean;
}) => (
    <div className="bg-background/50 rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-lg font-bold">
            {isRMSE ? value.toFixed(2) : isR2 ? value.toFixed(3) : `${(value * 100).toFixed(1)}%`}
        </p>
    </div>
);
