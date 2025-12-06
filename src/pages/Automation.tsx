
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Zap, Clock, PlayCircle, PauseCircle, Settings, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkflowBuilder } from "@/components/workflows/WorkflowBuilder";
import { supabase } from "@/integrations/supabase/client";

const Automation = () => {
  const location = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [useBuilder, setUseBuilder] = useState(false);
  const { toast } = useToast();
  const [initialDatasetId, setInitialDatasetId] = useState<string>();

  useEffect(() => {
    // Check if coming from QuickActions
    const state = location.state as any;
    if (state?.createNew && state?.datasetId) {
      setIsCreateDialogOpen(true);
      setUseBuilder(true);
      setInitialDatasetId(state.datasetId);
    }
  }, [location.state]);

  const workflows = [
    {
      id: 1,
      name: "Daily Data Backup",
      description: "Automatically backup all experimental data to cloud storage",
      trigger: "Schedule",
      schedule: "Every day at 2:00 AM",
      enabled: true,
      lastRun: "2025-01-27 02:00",
      status: "success",
      runs: 145
    },
    {
      id: 2,
      name: "Anomaly Detection",
      description: "Scan incoming data for anomalies and send alerts",
      trigger: "Data Upload",
      schedule: "On new upload",
      enabled: true,
      lastRun: "2025-01-27 10:15",
      status: "success",
      runs: 89
    },
    {
      id: 3,
      name: "Weekly Report Generation",
      description: "Generate and email comprehensive lab reports",
      trigger: "Schedule",
      schedule: "Every Monday at 9:00 AM",
      enabled: true,
      lastRun: "2025-01-22 09:00",
      status: "success",
      runs: 52
    },
    {
      id: 4,
      name: "Model Retraining",
      description: "Retrain ML models with new data when accuracy drops",
      trigger: "Threshold",
      schedule: "When accuracy < 85%",
      enabled: false,
      lastRun: "2025-01-20 14:30",
      status: "warning",
      runs: 12
    },
    {
      id: 5,
      name: "Experiment Status Notifications",
      description: "Send notifications when experiments complete",
      trigger: "Event",
      schedule: "On experiment completion",
      enabled: true,
      lastRun: "2025-01-27 11:45",
      status: "success",
      runs: 234
    },
  ];

  const handleToggleWorkflow = (id: number) => {
    toast({
      title: "Workflow Updated",
      description: "Workflow status has been changed.",
    });
  };

  const handleCreateWorkflow = async (workflow: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('workflows' as any)
        .insert({
          user_id: user.id,
          name: workflow.name,
          description: workflow.description,
          trigger_type: workflow.trigger_type,
          trigger_config: workflow.trigger_config || {},
          steps: workflow.steps,
          status: workflow.status || 'active'
        });

      if (error) throw error;

      toast({
        title: "Workflow Created",
        description: "Your automation workflow has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setUseBuilder(false);
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive"
      });
    }
  };

  return (
    <AuthGuard>
      <MainLayout>
        <main className="p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Automation</h1>
              <p className="text-muted-foreground">Configure automated workflows and processes</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                    <Button
                      onClick={() => setUseBuilder(true)}
                      size="lg"
                    >
                      Open Workflow Builder
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-sm text-muted-foreground">Active Workflows</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <PlayCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">532</p>
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
                  <p className="text-2xl font-bold">98.5%</p>
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
                  <p className="text-2xl font-bold">124h</p>
                  <p className="text-sm text-muted-foreground">Time Saved</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Workflows List */}
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${workflow.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Zap className={`w-6 h-6 ${workflow.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{workflow.name}</h3>
                        <Badge variant="outline">{workflow.trigger}</Badge>
                        {workflow.status === "success" && (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                            Running smoothly
                          </Badge>
                        )}
                        {workflow.status === "warning" && (
                          <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                            Needs attention
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-4">{workflow.description}</p>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {workflow.schedule}
                        </div>
                        <div>Last run: {workflow.lastRun}</div>
                        <div>{workflow.runs} total runs</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={workflow.enabled}
                      onCheckedChange={() => handleToggleWorkflow(workflow.id)}
                    />
                    <Button variant="ghost" size="icon">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Info Card */}
          <Card className="mt-8 p-6 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Automation Benefits</h3>
                <p className="text-sm text-muted-foreground">
                  Automation workflows help you save time by handling repetitive tasks automatically.
                  Set up triggers based on schedules, events, or thresholds, and let LabIQ handle the rest.
                </p>
              </div>
            </div>
          </Card>
        </main>
      </MainLayout>
    </AuthGuard>
  );
};

export default Automation;
