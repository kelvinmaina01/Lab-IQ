import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    FlaskConical,
    Brain,
    Zap,
    Sparkles,
    ArrowRight,
    Rocket,
    FileBox
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';


interface QuickActionsPanelProps {
    datasetId: string;
    datasetName?: string;
}

interface QuickAction {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    action: () => void;
    gradient: string;
    iconColor: string;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
    datasetId,
    datasetName
}) => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const quickActions: QuickAction[] = [
        {
            id: 'experiment',
            icon: FlaskConical,
            title: 'Create Experiment',
            description: 'Design experiment protocol using this data',
            action: () => handleCreateExperiment(),
            gradient: 'from-blue-500 to-cyan-500',
            iconColor: 'text-blue-500'
        },
        {
            id: 'ml_model',
            icon: Brain,
            title: 'Train ML Model',
            description: 'Auto-detect problem and train model',
            action: () => handleTrainModel(),
            gradient: 'from-purple-500 to-pink-500',
            iconColor: 'text-purple-500'
        },
        {
            id: 'workflow',
            icon: Zap,
            title: 'Build Workflow',
            description: 'Automate data processing pipeline',
            action: () => handleBuildWorkflow(),
            gradient: 'from-orange-500 to-red-500',
            iconColor: 'text-orange-500'
        },
        {
            id: 'ai_assistant',
            icon: Sparkles,
            title: 'Interactive Agent',
            description: 'Get instant insights from LabIQ Interactive Agent',
            action: () => handleAnalyzeWithAI(),
            gradient: 'from-green-500 to-emerald-500',
            iconColor: 'text-green-500'
        },
        {
            id: 'auto_analysis',
            icon: FileBox,
            title: 'Auto Analysis',
            description: 'Run background analysis & create artifacts',
            action: () => handleAutoAnalysis(),
            gradient: 'from-amber-400 to-orange-600',
            iconColor: 'text-amber-500'
        }
    ];

    const handleCreateExperiment = () => {
        // Navigate to experiments page with dataset pre-selected
        navigate('/experiments', {
            state: {
                createNew: true,
                datasetId,
                datasetName
            }
        });
    };

    const handleTrainModel = () => {
        // Navigate to models page with ML wizard open
        navigate('/models', {
            state: {
                openWizard: true,
                datasetId,
                datasetName
            }
        });
    };

    const handleBuildWorkflow = () => {
        // Navigate to automation page with workflow builder
        navigate('/automation', {
            state: {
                createNew: true,
                datasetId,
                datasetName
            }
        });
    };



    const handleAnalyzeWithAI = () => {
        // Navigate directly to insights in notebook mode
        navigate('/insights', {
            state: {
                datasetId,
                insightsMode: 'notebook'
            }
        });
    };

    const handleAutoAnalysis = () => {
        toast({
            title: "Phase 2 Initiated",
            description: "Auto Analysis system architecture is being designed.",
        });
    };

    return (
        <>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                            <Rocket className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Quick Actions</CardTitle>
                            <CardDescription>What would you like to do with this dataset?</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Card
                                    key={action.id}
                                    className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border/50 overflow-hidden"
                                    onClick={action.action}
                                >
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {/* Icon with gradient background */}
                                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                                <Icon className="w-7 h-7 text-white" />
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                                                {action.title}
                                            </h3>

                                            {/* Description */}
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {action.description}
                                            </p>

                                            {/* Arrow indicator */}
                                            <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span>Get started</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Additional context */}
                    <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
                        <p className="text-sm text-muted-foreground">
                            💡 <strong>Tip:</strong> These quick actions help you immediately leverage your data.
                            Start with experiments for hypothesis testing, train ML models for predictions,
                            build workflows for automation, or use AI for instant insights.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};
