import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  TrendingUp,
  FileText,
  Zap,
  AlertCircle,
  Download,
  RefreshCw,
  Pin,
} from "lucide-react";
import { PinToDashboardButton } from "@/components/dashboard/PinToDashboardButton";
import { useToast } from "@/hooks/use-toast";
import {
  workflowService,
  WorkflowExecution,
  WorkflowInsight,
  Workflow,
} from "@/lib/services/workflowService";
import { workflowAIAgent } from "@/lib/services/workflowAIAgent";
import { supabase } from "@/integrations/supabase/client";

const WorkflowExecutionPage = () => {
  const { executionId } = useParams<{ executionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [insights, setInsights] = useState<WorkflowInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    status: string;
    health: 'healthy' | 'warning' | 'critical';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (executionId) {
      loadExecutionData();
      const interval = setInterval(() => {
        if (execution?.status === 'running') {
          loadExecutionData();
        }
      }, 3000); // Poll every 3 seconds for running executions

      return () => clearInterval(interval);
    }
  }, [executionId]);

  const loadExecutionData = async () => {
    try {
      setLoading(true);

      // Fetch execution details
      const { data: execData, error: execError } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (execError) throw execError;
      setExecution(execData as WorkflowExecution);

      // Fetch workflow details
      const { data: workflowData, error: workflowError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', execData.workflow_id)
        .single();

      if (workflowError) throw workflowError;
      setWorkflow(workflowData as Workflow);

      // Fetch insights
      const insightsData = await workflowService.fetchExecutionInsights(executionId!);
      setInsights(insightsData);

      // Analyze progress if running
      if (execData.status === 'running') {
        const health = await workflowAIAgent.analyzeProgress(
          execData as WorkflowExecution,
          execData.workflow_id
        );
        setHealthStatus(health);
      }
    } catch (error) {
      console.error('Error loading execution:', error);
      toast({
        title: "Error",
        description: "Failed to load execution details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async () => {
    if (!execution || !workflow) return;

    try {
      setAnalysisLoading(true);

      // Fetch historical executions
      const historicalExecutions = await workflowService.fetchExecutions(workflow.id, 10);

      // Run AI analysis
      const analysis = await workflowAIAgent.analyzeExecution(
        execution,
        workflow.id,
        historicalExecutions
      );

      // Save insights to database
      for (const insight of analysis.insights) {
        await workflowService.createInsight(insight);
      }

      toast({
        title: "Analysis Complete",
        description: `Generated ${analysis.insights.length} insights and ${analysis.recommendations.length} recommendations`,
      });

      // Reload insights
      const updatedInsights = await workflowService.fetchExecutionInsights(executionId!);
      setInsights(updatedInsights);
    } catch (error) {
      console.error('Error running AI analysis:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to run AI analysis",
        variant: "destructive",
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const generateReport = async () => {
    if (!workflow) return;

    try {
      const report = await workflowService.generateReport(
        workflow.id,
        'single_execution',
        executionId
      );

      toast({
        title: "Report Generated",
        description: "Execution report has been created successfully",
      });

      // Download report as JSON
      const dataStr = JSON.stringify(report.content, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `execution-report-${executionId}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      success: "bg-green-500/10 text-green-500 border-green-500/20",
      failed: "bg-red-500/10 text-red-500 border-red-500/20",
      running: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      partial: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    };

    return (
      <Badge className={variants[status] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getHealthBadge = (health: 'healthy' | 'warning' | 'critical') => {
    const variants: Record<string, { color: string; icon: any }> = {
      healthy: { color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
      warning: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: AlertTriangle },
      critical: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: AlertCircle },
    };

    const variant = variants[health];
    const Icon = variant.icon;

    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {health.toUpperCase()}
      </Badge>
    );
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'quality':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'anomaly':
        return <AlertCircle className="w-4 h-4" />;
      case 'recommendation':
        return <TrendingUp className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <AuthGuard>
        <MainLayout>
          <div className="flex items-center justify-center h-screen">
            <Activity className="w-8 h-8 animate-spin text-primary" />
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  if (!execution || !workflow) {
    return (
      <AuthGuard>
        <MainLayout>
          <div className="flex flex-col items-center justify-center h-screen">
            <XCircle className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Execution Not Found</h2>
            <Button onClick={() => navigate('/automation')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Automation
            </Button>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <MainLayout>
        <main className="p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/automation')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold">{workflow.name}</h1>
                  {getStatusBadge(execution.status)}
                  {healthStatus && getHealthBadge(healthStatus.health)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Execution ID: {execution.id.slice(0, 8)}...
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadExecutionData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={runAIAnalysis}
                disabled={analysisLoading || execution.status === 'running'}
              >
                <Zap className={`w-4 h-4 mr-2 ${analysisLoading ? 'animate-pulse' : ''}`} />
                {analysisLoading ? 'Analyzing...' : 'AI Analysis'}
              </Button>
              <Button onClick={generateReport}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              {execution.status === 'success' && (
                <PinToDashboardButton
                  title={`${workflow.name} Results`}
                  description={`Workflow execution completed on ${new Date(execution.completed_at || execution.started_at).toLocaleDateString()}`}
                  type="metric"
                  source="workflow"
                  sourceId={workflow.id}
                  sourceTable="workflows"
                  category="workflows"
                  data={{
                    value: Math.round(execution.progress_percentage || 100),
                    unit: '%',
                    trend: 'up',
                    summary: `${execution.current_step || execution.total_steps}/${execution.total_steps} steps completed in ${Math.round((execution.duration_ms || 0) / 1000)}s`
                  }}
                  variant="default"
                  size="default"
                  showLabel={true}
                />
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(execution.status)}
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold capitalize">{execution.status}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-lg font-semibold">{formatDuration(execution.duration_ms)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-lg font-semibold">
                    {execution.current_step || 0}/{execution.total_steps || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Insights</p>
                  <p className="text-lg font-semibold">{insights.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Progress Bar */}
          {execution.status === 'running' && (
            <Card className="p-6 mb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Execution Progress</h3>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(execution.progress_percentage || 0)}%
                  </span>
                </div>
                <Progress value={execution.progress_percentage || 0} className="h-2" />
                {healthStatus && (
                  <p className="text-sm text-muted-foreground">{healthStatus.message}</p>
                )}
              </div>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="logs" className="space-y-4">
            <TabsList>
              <TabsTrigger value="logs">
                <FileText className="w-4 h-4 mr-2" />
                Logs ({execution.logs?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="insights">
                <Zap className="w-4 h-4 mr-2" />
                Insights ({insights.length})
              </TabsTrigger>
              <TabsTrigger value="metrics">
                <TrendingUp className="w-4 h-4 mr-2" />
                Metrics
              </TabsTrigger>
              <TabsTrigger value="details">
                <Activity className="w-4 h-4 mr-2" />
                Details
              </TabsTrigger>
            </TabsList>

            {/* Logs Tab */}
            <TabsContent value="logs">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Execution Logs</h3>
                {execution.logs && execution.logs.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {execution.logs.map((log, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${log.level === 'error' ? 'bg-red-500/5 border-red-500/20' :
                            log.level === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
                              'bg-muted/50'
                          }`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {log.level === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                          {log.level === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                          {log.level === 'info' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {log.step}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{log.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No logs available</p>
                )}
              </Card>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">AI-Generated Insights</h3>
                  {insights.filter(i => i.is_significant).length > 0 && (
                    <Badge variant="destructive">
                      {insights.filter(i => i.is_significant).length} Significant
                    </Badge>
                  )}
                </div>
                {insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.map((insight) => (
                      <Card
                        key={insight.id}
                        className={`p-4 ${insight.is_significant ? 'border-primary/50 bg-primary/5' : ''
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 ${getSeverityColor(insight.severity)}`}>
                            {getInsightIcon(insight.insight_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{insight.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {insight.insight_type}
                              </Badge>
                              {insight.severity && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getSeverityColor(insight.severity)}`}
                                >
                                  {insight.severity}
                                </Badge>
                              )}
                              {insight.is_significant && (
                                <Badge className="text-xs bg-primary/20">
                                  Significant
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {insight.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(insight.created_at)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Zap className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">No insights generated yet</p>
                    <Button onClick={runAIAnalysis} disabled={analysisLoading}>
                      <Zap className="w-4 h-4 mr-2" />
                      Run AI Analysis
                    </Button>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Metrics Tab */}
            <TabsContent value="metrics">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                {execution.metrics && Object.keys(execution.metrics).length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(execution.metrics).map(([key, value]) => (
                      <div key={key} className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">
                          {key.replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <p className="text-xl font-semibold">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No metrics available</p>
                )}
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Execution Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Workflow</p>
                    <p className="font-medium">{workflow.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Started At</p>
                    <p className="font-medium">{formatTimestamp(execution.started_at)}</p>
                  </div>
                  {execution.completed_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Completed At</p>
                      <p className="font-medium">{formatTimestamp(execution.completed_at)}</p>
                    </div>
                  )}
                  {execution.error && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Error</p>
                      <Card className="p-3 bg-red-500/5 border-red-500/20">
                        <p className="text-sm text-red-500 font-mono">{execution.error}</p>
                      </Card>
                    </div>
                  )}
                  {execution.result && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Result</p>
                      <Card className="p-3 bg-muted/50">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(execution.result, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </MainLayout>
    </AuthGuard>
  );
};

export default WorkflowExecutionPage;
