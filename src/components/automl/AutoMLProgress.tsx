/**
 * AutoML Progress Component
 * Shows real-time progress of the multi-agent pipeline
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Database,
    Cog,
    Bot,
    Target,
    BarChart3,
    Lightbulb,
    Loader2,
    CheckCircle
} from 'lucide-react';

interface AutoMLProgressProps {
    progress: number;
    currentStage?: string;
    message?: string;
}

const stages = [
    {
        progress: 10,
        name: 'Data Understanding',
        icon: Database,
        description: 'Analyzing data quality and characteristics',
        emoji: '🗂️'
    },
    {
        progress: 25,
        name: 'Feature Engineering',
        icon: Cog,
        description: 'Generating and selecting features',
        emoji: '⚙️'
    },
    {
        progress: 40,
        name: 'Model Selection',
        icon: Bot,
        description: 'Choosing optimal algorithms',
        emoji: '🤖'
    },
    {
        progress: 55,
        name: 'Hyperparameter Tuning',
        icon: Target,
        description: 'Optimizing model parameters',
        emoji: '🎯'
    },
    {
        progress: 70,
        name: 'Training & Evaluation',
        icon: BarChart3,
        description: 'Training models with cross-validation',
        emoji: '📊'
    },
    {
        progress: 90,
        name: 'Insights Generation',
        icon: Lightbulb,
        description: 'Analyzing results and recommendations',
        emoji: '💡'
    },
];

export function AutoMLProgress({ progress, currentStage, message }: AutoMLProgressProps) {
    const getCurrentStageIndex = () => {
        for (let i = stages.length - 1; i >= 0; i--) {
            if (progress >= stages[i].progress) {
                return i;
            }
        }
        return 0;
    };

    const currentIndex = getCurrentStageIndex();
    const currentStageData = stages[currentIndex];

    return (
        <Card className="border-2 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    AutoML Pipeline Running...
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Overall Progress */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Overall Progress</span>
                        <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Current Stage */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            {currentStageData.icon && <currentStageData.icon className="h-5 w-5 text-primary" />}
                        </div>
                        <div>
                            <div className="font-semibold flex items-center gap-2">
                                <span>{currentStageData.emoji}</span>
                                {currentStageData.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {currentStageData.description}
                            </div>
                        </div>
                    </div>
                    {message && (
                        <div className="mt-2 text-sm text-muted-foreground italic">
                            {message}
                        </div>
                    )}
                </div>

                {/* All Stages */}
                <div className="space-y-2">
                    <div className="text-sm font-medium mb-3">Pipeline Stages</div>
                    {stages.map((stage, index) => {
                        const isComplete = progress > stage.progress;
                        const isCurrent = index === currentIndex && progress < 100;
                        const isPending = progress < stage.progress;

                        return (
                            <div
                                key={stage.name}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isComplete
                                        ? 'bg-green-50 border border-green-200'
                                        : isCurrent
                                            ? 'bg-blue-50 border border-blue-200'
                                            : 'bg-gray-50 border border-gray-200'
                                    }`}
                            >
                                <div className="flex-shrink-0">
                                    {isComplete ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : isCurrent ? (
                                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                                    ) : (
                                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium truncate">
                                            {stage.emoji} {stage.name}
                                        </span>
                                        {isComplete && (
                                            <Badge variant="secondary" className="text-xs">
                                                ✓ Done
                                            </Badge>
                                        )}
                                        {isCurrent && (
                                            <Badge variant="default" className="text-xs">
                                                In Progress
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {stage.description}
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {stage.progress}%
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Agent System Info */}
                <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground text-center">
                        <strong>Powered by 6 AI Agents</strong> working together to automate your ML workflow
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
