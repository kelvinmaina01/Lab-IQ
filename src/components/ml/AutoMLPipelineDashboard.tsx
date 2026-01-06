/**
 * AutoML Pipeline Dashboard
 * Real-time visualization of the Multi-Agent AutoML pipeline
 * Shows agent-by-agent progress with detailed status updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Brain,
    Database,
    Wand2,
    Target,
    Settings2,
    Zap,
    BarChart3,
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Play,
    Pause,
    RefreshCw,
    Clock,
    TrendingUp,
    ChevronRight,
    Activity,
    Sparkles,
    Pin
} from 'lucide-react';
import { runAutoMLWithProgress, checkMLServiceHealth, type ProgressUpdate, type AutoMLResponse } from '@/lib/services/automlService';
import { PinToDashboardButton } from '@/components/dashboard/PinToDashboardButton';

// =============================================================================
// TYPES
// =============================================================================

interface AgentStatus {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    status: 'pending' | 'running' | 'completed' | 'error';
    progress: number;
    duration?: number;
    message?: string;
    findings?: string[];
}

interface PipelineState {
    status: 'idle' | 'connecting' | 'running' | 'completed' | 'error';
    currentAgent: string | null;
    overallProgress: number;
    startTime: number | null;
    endTime: number | null;
    result: AutoMLResponse | null;
    error: string | null;
}

interface AutoMLPipelineDashboardProps {
    datasetId: string;
    data: Array<Record<string, any>>;
    targetColumn?: string;
    problemType?: 'classification' | 'regression' | 'clustering';
    onComplete?: (result: AutoMLResponse) => void;
    onError?: (error: string) => void;
}

// =============================================================================
// AGENT DEFINITIONS
// =============================================================================

const AGENT_DEFINITIONS: Omit<AgentStatus, 'status' | 'progress'>[] = [
    {
        id: 'data_agent',
        name: 'Data Agent',
        icon: Database,
        message: 'Analyzes data quality and structure'
    },
    {
        id: 'domain_agent',
        name: 'Domain Agent',
        icon: Brain,
        message: 'Detects domain-specific patterns'
    },
    {
        id: 'feature_agent',
        name: 'Feature Agent',
        icon: Wand2,
        message: 'Engineers and selects features'
    },
    {
        id: 'model_selection_agent',
        name: 'Model Selection',
        icon: Target,
        message: 'Recommends best algorithms'
    },
    {
        id: 'hyperparameter_agent',
        name: 'Hyperparameter Agent',
        icon: Settings2,
        message: 'Optimizes model parameters'
    },
    {
        id: 'training_agent',
        name: 'Training Agent',
        icon: Zap,
        message: 'Trains and evaluates models'
    },
    {
        id: 'insights_agent',
        name: 'Insights Agent',
        icon: BarChart3,
        message: 'Generates insights and recommendations'
    },
    {
        id: 'content_agent',
        name: 'Content Agent',
        icon: FileText,
        message: 'Creates report summaries'
    }
];

// =============================================================================
// COMPONENT
// =============================================================================

export const AutoMLPipelineDashboard: React.FC<AutoMLPipelineDashboardProps> = ({
    datasetId,
    data,
    targetColumn,
    problemType,
    onComplete,
    onError
}) => {
    // State
    const [pipelineState, setPipelineState] = useState<PipelineState>({
        status: 'idle',
        currentAgent: null,
        overallProgress: 0,
        startTime: null,
        endTime: null,
        result: null,
        error: null
    });

    const [agents, setAgents] = useState<AgentStatus[]>(
        AGENT_DEFINITIONS.map(a => ({ ...a, status: 'pending', progress: 0 }))
    );

    const [mlServiceAvailable, setMlServiceAvailable] = useState<boolean | null>(null);
    const [logs, setLogs] = useState<Array<{ time: string; message: string; type: 'info' | 'success' | 'error' }>>([]);
    const [cleanupFn, setCleanupFn] = useState<(() => void) | null>(null);

    // Check ML service health on mount
    useEffect(() => {
        const checkHealth = async () => {
            const isHealthy = await checkMLServiceHealth();
            setMlServiceAvailable(isHealthy);
            if (!isHealthy) {
                addLog('ML Service is not available. Please start the service.', 'error');
            }
        };
        checkHealth();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (cleanupFn) cleanupFn();
        };
    }, [cleanupFn]);

    // ---------------------------------------------------------------------------
    // HELPERS
    // ---------------------------------------------------------------------------

    const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { time, message, type }]);
    }, []);

    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    // ---------------------------------------------------------------------------
    // HANDLE PROGRESS UPDATES
    // ---------------------------------------------------------------------------

    const handleProgressUpdate = useCallback((update: ProgressUpdate) => {
        switch (update.type) {
            case 'status':
                // Update current agent status
                if (update.status) {
                    const agentId = update.status.current_agent;
                    const agentProgress = update.status.agent_progress || 0;

                    // Update agent status
                    setAgents(prev => prev.map(agent => {
                        if (agent.id === agentId) {
                            return {
                                ...agent,
                                status: 'running',
                                progress: agentProgress,
                                message: update.message || agent.message
                            };
                        }
                        // Mark previous agents as completed
                        const agentIndex = AGENT_DEFINITIONS.findIndex(a => a.id === agentId);
                        const currentIndex = AGENT_DEFINITIONS.findIndex(a => a.id === agent.id);
                        if (currentIndex < agentIndex && agent.status !== 'completed') {
                            return { ...agent, status: 'completed', progress: 100 };
                        }
                        return agent;
                    }));

                    setPipelineState(prev => ({
                        ...prev,
                        currentAgent: agentId,
                        overallProgress: update.progress || prev.overallProgress
                    }));

                    addLog(`${agentId}: ${update.message || 'Processing...'}`, 'info');
                }
                break;

            case 'progress':
                setPipelineState(prev => ({
                    ...prev,
                    overallProgress: update.progress || prev.overallProgress
                }));
                if (update.message) {
                    addLog(update.message, 'info');
                }
                break;

            case 'complete':
                // Mark all agents as completed
                setAgents(prev => prev.map(agent => ({
                    ...agent,
                    status: 'completed',
                    progress: 100
                })));

                setPipelineState(prev => ({
                    ...prev,
                    status: 'completed',
                    overallProgress: 100,
                    endTime: Date.now(),
                    result: update.result || null
                }));

                addLog('AutoML pipeline completed successfully!', 'success');
                if (update.result && onComplete) {
                    onComplete(update.result);
                }
                break;

            case 'error':
                setPipelineState(prev => ({
                    ...prev,
                    status: 'error',
                    error: update.error || 'Unknown error',
                    endTime: Date.now()
                }));

                // Mark current agent as error
                setAgents(prev => prev.map(agent => {
                    if (agent.status === 'running') {
                        return { ...agent, status: 'error' };
                    }
                    return agent;
                }));

                addLog(update.error || 'Pipeline failed', 'error');
                if (onError) {
                    onError(update.error || 'Unknown error');
                }
                break;
        }
    }, [addLog, onComplete, onError]);

    // ---------------------------------------------------------------------------
    // ACTIONS
    // ---------------------------------------------------------------------------

    const startPipeline = () => {
        if (!mlServiceAvailable) {
            addLog('Cannot start: ML Service is not available', 'error');
            return;
        }

        // Reset state
        setAgents(AGENT_DEFINITIONS.map(a => ({ ...a, status: 'pending', progress: 0 })));
        setPipelineState({
            status: 'connecting',
            currentAgent: null,
            overallProgress: 0,
            startTime: Date.now(),
            endTime: null,
            result: null,
            error: null
        });
        setLogs([]);

        addLog('Connecting to AutoML pipeline...', 'info');

        // Start WebSocket connection
        const cleanup = runAutoMLWithProgress(
            {
                dataset_id: datasetId,
                data,
                target_column: targetColumn,
                problem_type: problemType
            },
            (update) => {
                if (pipelineState.status === 'connecting') {
                    setPipelineState(prev => ({ ...prev, status: 'running' }));
                }
                handleProgressUpdate(update);
            }
        );

        setCleanupFn(() => cleanup);
    };

    const stopPipeline = () => {
        if (cleanupFn) {
            cleanupFn();
            setCleanupFn(null);
        }
        setPipelineState(prev => ({
            ...prev,
            status: 'idle',
            endTime: Date.now()
        }));
        addLog('Pipeline stopped by user', 'info');
    };

    const resetPipeline = () => {
        setAgents(AGENT_DEFINITIONS.map(a => ({ ...a, status: 'pending', progress: 0 })));
        setPipelineState({
            status: 'idle',
            currentAgent: null,
            overallProgress: 0,
            startTime: null,
            endTime: null,
            result: null,
            error: null
        });
        setLogs([]);
    };

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    const elapsedTime = pipelineState.startTime
        ? (pipelineState.endTime || Date.now()) - pipelineState.startTime
        : 0;

    const completedAgents = agents.filter(a => a.status === 'completed').length;
    const isRunning = pipelineState.status === 'running' || pipelineState.status === 'connecting';

    return (
        <Card className="border-2">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                Multi-Agent AutoML Pipeline
                                {pipelineState.status === 'completed' && (
                                    <Badge variant="default" className="bg-green-500">Complete</Badge>
                                )}
                                {isRunning && (
                                    <Badge variant="secondary" className="animate-pulse">Running</Badge>
                                )}
                                {pipelineState.status === 'error' && (
                                    <Badge variant="destructive">Error</Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                8 specialized agents working together for automated machine learning
                            </CardDescription>
                        </div>
                    </div>

                    {/* Service Status */}
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${mlServiceAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-muted-foreground">
                            ML Service {mlServiceAvailable ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Overall Progress */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Overall Progress</span>
                        <div className="flex items-center gap-4">
                            {pipelineState.startTime && (
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(elapsedTime)}
                                </span>
                            )}
                            <span>{pipelineState.overallProgress.toFixed(0)}%</span>
                        </div>
                    </div>
                    <Progress value={pipelineState.overallProgress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{completedAgents} of {agents.length} agents completed</span>
                        {pipelineState.currentAgent && (
                            <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                Running: {agents.find(a => a.id === pipelineState.currentAgent)?.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Agent Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {agents.map((agent, index) => {
                        const Icon = agent.icon;
                        const isActive = agent.status === 'running';
                        const isCompleted = agent.status === 'completed';
                        const isError = agent.status === 'error';

                        return (
                            <div
                                key={agent.id}
                                className={`p-3 rounded-lg border transition-all ${isActive ? 'border-primary bg-primary/5 ring-1 ring-primary/20' :
                                    isCompleted ? 'border-green-500/50 bg-green-500/5' :
                                        isError ? 'border-red-500/50 bg-red-500/5' :
                                            'border-border bg-muted/30'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-1.5 rounded ${isActive ? 'bg-primary/20' :
                                        isCompleted ? 'bg-green-500/20' :
                                            isError ? 'bg-red-500/20' :
                                                'bg-muted'
                                        }`}>
                                        {isActive ? (
                                            <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                        ) : isCompleted ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : isError ? (
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                        ) : (
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                    <span className="text-xs font-medium truncate">{agent.name}</span>
                                </div>
                                {isActive && (
                                    <Progress value={agent.progress} className="h-1" />
                                )}
                                {isCompleted && agent.duration && (
                                    <span className="text-xs text-muted-foreground">{formatDuration(agent.duration)}</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {pipelineState.status === 'idle' ? (
                        <Button
                            onClick={startPipeline}
                            className="flex-1"
                            size="lg"
                            disabled={!mlServiceAvailable}
                        >
                            <Play className="h-4 w-4 mr-2" />
                            Start AutoML Pipeline
                        </Button>
                    ) : isRunning ? (
                        <Button
                            onClick={stopPipeline}
                            variant="destructive"
                            className="flex-1"
                            size="lg"
                        >
                            <Pause className="h-4 w-4 mr-2" />
                            Stop Pipeline
                        </Button>
                    ) : (
                        <Button
                            onClick={resetPipeline}
                            variant="outline"
                            className="flex-1"
                            size="lg"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset & Run Again
                        </Button>
                    )}
                </div>

                {/* Results Summary */}
                {pipelineState.result && (
                    <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                Pipeline Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">Problem Type</p>
                                    <p className="font-semibold capitalize">{pipelineState.result.summary.problem_type}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Best Model</p>
                                    <p className="font-semibold">{pipelineState.result.summary.model_training_summary.best_model}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Best Score</p>
                                    <p className="font-semibold">{(pipelineState.result.summary.model_training_summary.best_score * 100).toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Duration</p>
                                    <p className="font-semibold">{pipelineState.result.summary.pipeline_duration_seconds.toFixed(1)}s</p>
                                </div>
                            </div>

                            {pipelineState.result.summary.key_findings.length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2">Key Findings</p>
                                    <div className="space-y-1">
                                        {pipelineState.result.summary.key_findings.slice(0, 3).map((finding, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm">
                                                <ChevronRight className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>{finding}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Pin to Dashboard Button */}
                            <div className="flex justify-end pt-2">
                                <PinToDashboardButton
                                    title={`AutoML: ${pipelineState.result.summary.model_training_summary.best_model}`}
                                    description={`${pipelineState.result.summary.problem_type} model with ${(pipelineState.result.summary.model_training_summary.best_score * 100).toFixed(1)}% accuracy`}
                                    type="chart"
                                    source="experiment"
                                    sourceId={datasetId}
                                    sourceTable="datasets"
                                    category="models"
                                    config={{
                                        chartType: 'bar',
                                        colors: ['#8b5cf6'],
                                        showLegend: false,
                                        animated: true
                                    }}
                                    data={{
                                        labels: ['Best Score'],
                                        datasets: [{
                                            label: 'Performance',
                                            data: [pipelineState.result.summary.model_training_summary.best_score * 100]
                                        }],
                                        summary: pipelineState.result.summary.key_findings.join('. ')
                                    }}
                                    tags={['automl', pipelineState.result.summary.problem_type, pipelineState.result.summary.model_training_summary.best_model]}
                                    variant="default"
                                    size="sm"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error Display */}
                {pipelineState.error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{pipelineState.error}</AlertDescription>
                    </Alert>
                )}

                {/* Logs */}
                {logs.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Activity Log</p>
                        <ScrollArea className="h-32 rounded border bg-muted/30 p-2">
                            <div className="space-y-1 text-xs font-mono">
                                {logs.map((log, i) => (
                                    <div
                                        key={i}
                                        className={`flex gap-2 ${log.type === 'error' ? 'text-red-500' :
                                            log.type === 'success' ? 'text-green-500' :
                                                'text-muted-foreground'
                                            }`}
                                    >
                                        <span className="text-muted-foreground">[{log.time}]</span>
                                        <span>{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AutoMLPipelineDashboard;
