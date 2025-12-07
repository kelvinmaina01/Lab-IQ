import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Zap,
  Clock,
  PlayCircle,
  Settings,
  TrendingUp,
  MoreVertical,
  Play,
  Trash2,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkflowBuilder } from "@/components/workflows/WorkflowBuilder";
import { workflowService, Workflow } from "@/lib/services/workflowService";

const Automation = () => {
  const location = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTemplatesDialogOpen, setIsTemplatesDialogOpen] = useState(false);
  const [useBuilder, setUseBuilder] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [executeLoading, setExecuteLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const [initialDatasetId, setInitialDatasetId] = useState<string>();
  const [stats, setStats] = useState({
    active: 0,
    totalRuns: 0,
    successRate: 0,
    timeSaved: 0,
  });

  useEffect(() => {
    // Check if coming from QuickActions
    const state = location.state as any;
    if (state?.createNew && state?.datasetId) {
      setIsCreateDialogOpen(true);
      setUseBuilder(true);
      setInitialDatasetId(state.datasetId);
    }
  }, [location.state]);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowService.fetchWorkflows();
      setWorkflows(data);

      // Calculate stats
      const active = data.filter((w) => w.status === "active").length;
      const totalRuns = data.reduce(
        (sum, w) => sum + w.success_count + w.failure_count,
        0
      );
      const totalSuccess = data.reduce((sum, w) => sum + w.success_count, 0);
      const successRate =
        totalRuns > 0 ? (totalSuccess / totalRuns) * 100 : 0;

      // Estimate time saved (5 minutes per successful workflow run)
      const timeSavedMinutes = totalSuccess * 5;
      const timeSavedHours = Math.round(timeSavedMinutes / 60);

      setStats({
        active,
        totalRuns,
        successRate: Math.round(successRate * 10) / 10,
        timeSaved: timeSavedHours,
      });
    } catch (error) {
      console.error("Error loading workflows:", error);
      toast({
        title: "Error",
        description: "Failed to load workflows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWorkflow = async (id: string, currentStatus: string) => {
    try {
      const newStatus =
        currentStatus === "active" ? "paused" : "active";
      await workflowService.updateWorkflowStatus(id, newStatus);

      toast({
        title: "Workflow Updated",
        description: `Workflow ${
          newStatus === "active" ? "activated" : "paused"
        } successfully.`,
      });

      loadWorkflows();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update workflow",
        variant: "destructive",
      });
    }
  };

  const handleExecuteWorkflow = async (id: string) => {
    try {
      setExecuteLoading(id);
      await workflowService.executeWorkflow(id);

      toast({
        title: "Workflow Executed",
        description: "Workflow is running in the background.",
      });

      // Reload after a delay to get updated stats
      setTimeout(() => {
        loadWorkflows();
      }, 2000);
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: "Failed to execute workflow",
        variant: "destructive",
      });
    } finally {
      setExecuteLoading(null);
    }
  };

  const handleDeleteWorkflow = async () => {
    if (!workflowToDelete) return;

    try {
      await workflowService.deleteWorkflow(workflowToDelete);

      toast({
        title: "Workflow Deleted",
        description: "Workflow has been deleted successfully.",
      });

      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
      loadWorkflows();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      });
    }
  };

  const handleCreateWorkflow = async (workflow: any) => {
    try {
      await workflowService.createWorkflow(workflow);

      toast({
        title: "Workflow Created",
        description: "Your automation workflow has been created successfully.",
      });

      setIsCreateDialogOpen(false);
      setUseBuilder(false);
      loadWorkflows();
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive",
      });
    }
  };

  const handleCreateFromTemplate = async (template: any) => {
    try {
      await workflowService.createWorkflow(template);

      toast({
        title: "Workflow Created",
        description: "Workflow created from template successfully.",
      });

      setIsTemplatesDialogOpen(false);
      loadWorkflows();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create workflow from template",
        variant: "destructive",
      });
    }
  };

  const getTriggerLabel = (workflow: Workflow) => {
    switch (workflow.trigger_type) {
      case "dataset_upload":
        return "On Dataset Upload";
      case "manual":
        return "Manual Trigger";
      case "schedule":
        return "Scheduled";
      case "threshold":
        return "Threshold Based";
      case "event":
        return "On Event";
      default:
        return workflow.trigger_type;
    }
  };

  const getStatusBadge = (workflow: Workflow) => {
    const totalRuns = workflow.success_count + workflow.failure_count;
    const successRate =
      totalRuns > 0 ? (workflow.success_count / totalRuns) * 100 : 0;

    if (workflow.status !== "active") {
      return (
        <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
          Paused
        </Badge>
      );
    }

    if (totalRuns === 0) {
      return (
        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          Not Run Yet
        </Badge>
      );
    }

    if (successRate >= 95) {
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          Running Smoothly
        </Badge>
      );
    }

    if (successRate >= 80) {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          Minor Issues
        </Badge>
      );
    }

    return (
      <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
        Needs Attention
      </Badge>
    );
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "Never";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AuthGuard>
      <MainLayout>
        <main className="p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Automation
              </h1>
              <p className="text-muted-foreground">
                Configure automated workflows and processes
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog
                open={isTemplatesDialogOpen}
                onOpenChange={setIsTemplatesDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Activity className="w-4 h-4" />
                    Templates
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Workflow Templates</DialogTitle>
                    <DialogDescription>
                      Choose from pre-built workflow templates
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-4">
                    {workflowService.getWorkflowTemplates().map((template, index) => (
                      <Card key={index} className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => handleCreateFromTemplate(template)}
                      >
                        <h4 className="font-semibold mb-1">{template.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline">{template.steps.length} steps</Badge>
                          <Badge variant="outline">{getTriggerLabel({ trigger_type: template.trigger_type } as any)}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Workflow
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Automation Workflow</DialogTitle>
                  </DialogHeader>
                  {useBuilder ? (
                    <WorkflowBuilder
                      onSave={handleCreateWorkflow}
                      onCancel={() => {
                        setIsCreateDialogOpen(false);
                        setUseBuilder(false);
                      }}
                      initialDatasetId={initialDatasetId}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Button onClick={() => setUseBuilder(true)} size="lg">
                        Open Workflow Builder
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">
                    Active Workflows
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <PlayCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalRuns}</p>
                  <p className="text-sm text-muted-foreground">Total Runs</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.successRate}%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.timeSaved}h</p>
                  <p className="text-sm text-muted-foreground">Time Saved</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Workflows List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : workflows.length === 0 ? (
            <Card className="p-12 text-center">
              <Zap className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                No Workflows Yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Create your first automation workflow to save time on repetitive tasks
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setIsTemplatesDialogOpen(true)} variant="outline">
                  Browse Templates
                </Button>
                <Button onClick={() => {
                  setIsCreateDialogOpen(true);
                  setUseBuilder(true);
                }}>
                  Create Custom Workflow
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`p-3 rounded-lg ${
                          workflow.status === "active"
                            ? "bg-primary/10"
                            : "bg-muted"
                        }`}
                      >
                        <Zap
                          className={`w-6 h-6 ${
                            workflow.status === "active"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {workflow.name}
                          </h3>
                          <Badge variant="outline">
                            {getTriggerLabel(workflow)}
                          </Badge>
                          {getStatusBadge(workflow)}
                        </div>
                        <p className="text-muted-foreground mb-4">
                          {workflow.description}
                        </p>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Last run: {formatRelativeTime(workflow.last_run_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            {workflow.success_count} success
                          </div>
                          {workflow.failure_count > 0 && (
                            <div className="flex items-center gap-1">
                              <XCircle className="w-4 h-4 text-red-500" />
                              {workflow.failure_count} failed
                            </div>
                          )}
                          <div className="text-xs">
                            {workflow.steps.length} steps
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={workflow.status === "active"}
                        onCheckedChange={() =>
                          handleToggleWorkflow(workflow.id, workflow.status)
                        }
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleExecuteWorkflow(workflow.id)}
                            disabled={executeLoading === workflow.id}
                          >
                            {executeLoading === workflow.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Running...
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Run Now
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Edit Workflow
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setWorkflowToDelete(workflow.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Info Card */}
          <Card className="mt-8 p-6 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Automation Benefits</h3>
                <p className="text-sm text-muted-foreground">
                  Automation workflows help you save time by handling repetitive
                  tasks automatically. Set up triggers based on schedules, events,
                  or thresholds, and let Lab-IQ handle the rest. Each successful
                  workflow run saves approximately 5 minutes of manual work.
                </p>
              </div>
            </div>
          </Card>

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Workflow?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  workflow and all its execution history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteWorkflow}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </MainLayout>
    </AuthGuard>
  );
};

export default Automation;
