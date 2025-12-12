import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Brain, TrendingUp, Zap, CheckCircle, Loader2, Database, Workflow as WorkflowIcon } from "lucide-react";
import {
  prepareMLTrainingData,
  getEnrichedDeviceData,
  triggerWorkflowFromDevice,
  createDatasetFromStream
} from "@/lib/services/deviceDataService";
import { supabase } from "@/integrations/supabase/client";

interface DeviceMLIntegrationProps {
  streamId: string;
  streamName: string;
}

export function DeviceMLIntegration({ streamId, streamName }: DeviceMLIntegrationProps) {
  const { toast } = useToast();
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [featureColumns, setFeatureColumns] = useState<string[]>([]);
  const [trainTestSplit, setTrainTestSplit] = useState(0.8);
  const [loading, setLoading] = useState(false);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');

  useEffect(() => {
    loadFields();
    loadWorkflows();
  }, [streamId]);

  const loadFields = async () => {
    try {
      const data = await getEnrichedDeviceData(streamId, 10, true);
      if (data.length > 0) {
        const fields = Object.keys(data[0].payload);
        setAvailableFields(fields);
      }
    } catch (error) {
      console.error('Error loading fields:', error);
    }
  };

  const loadWorkflows = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const handleToggleFeature = (field: string) => {
    if (featureColumns.includes(field)) {
      setFeatureColumns(prev => prev.filter(f => f !== field));
    } else {
      setFeatureColumns(prev => [...prev, field]);
    }
  };

  const handlePrepareTrainingData = async () => {
    if (!targetColumn) {
      toast({
        title: "Target column required",
        description: "Please select a target column for prediction",
        variant: "destructive"
      });
      return;
    }

    if (featureColumns.length === 0) {
      toast({
        title: "Feature columns required",
        description: "Please select at least one feature column",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      toast({
        title: "Preparing ML training data...",
        description: "Processing device stream data"
      });

      const trainingData = await prepareMLTrainingData(
        streamId,
        targetColumn,
        featureColumns,
        trainTestSplit
      );

      toast({
        title: "Training data prepared!",
        description: `Ready for ML training: ${trainingData.length} samples`,
      });

      // Optionally, save this as a dataset for AutoML
      const datasetId = await createDatasetFromStream(streamId, `${streamName} - ML Training Data`);

      toast({
        title: "Dataset created for ML",
        description: "You can now train models using AutoML",
        action: (
          <Button size="sm" onClick={() => window.location.href = `/automl?dataset=${datasetId}`}>
            Train Model
          </Button>
        )
      });
    } catch (error) {
      console.error('Error preparing training data:', error);
      toast({
        title: "Error",
        description: "Failed to prepare training data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerWorkflow = async () => {
    if (!selectedWorkflow) {
      toast({
        title: "Workflow required",
        description: "Please select a workflow to trigger",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      toast({
        title: "Triggering workflow...",
        description: "Starting workflow execution"
      });

      const executionId = await triggerWorkflowFromDevice(
        streamId,
        selectedWorkflow,
        'always'
      );

      toast({
        title: "Workflow triggered!",
        description: "Workflow execution started",
        action: (
          <Button size="sm" onClick={() => window.location.href = `/workflows/${selectedWorkflow}/executions/${executionId}`}>
            View Execution
          </Button>
        )
      });
    } catch (error) {
      console.error('Error triggering workflow:', error);
      toast({
        title: "Error",
        description: "Failed to trigger workflow",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDataset = async () => {
    try {
      setLoading(true);
      toast({
        title: "Creating dataset...",
        description: "Converting device data to dataset"
      });

      const datasetId = await createDatasetFromStream(streamId, streamName);

      toast({
        title: "Dataset created!",
        description: "Device data has been saved as a dataset",
        action: (
          <Button size="sm" onClick={() => window.location.href = `/datasets/${datasetId}`}>
            View Dataset
          </Button>
        )
      });
    } catch (error) {
      console.error('Error creating dataset:', error);
      toast({
        title: "Error",
        description: "Failed to create dataset",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Process device data across Lab-IQ platform
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={handleCreateDataset}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Database className="h-6 w-6" />
            )}
            <span>Create Dataset</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => {
              if (availableFields.length > 0) {
                setFeatureColumns(availableFields.filter(f => f !== targetColumn));
              }
            }}
            disabled={loading || availableFields.length === 0}
          >
            <Brain className="h-6 w-6" />
            <span>Train ML Model</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={handleTriggerWorkflow}
            disabled={loading || workflows.length === 0}
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <WorkflowIcon className="h-6 w-6" />
            )}
            <span>Run Workflow</span>
          </Button>
        </CardContent>
      </Card>

      {/* ML Model Training */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Machine Learning Training
          </CardTitle>
          <CardDescription>
            Prepare device data for ML model training
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target Column Selection */}
          <div className="space-y-2">
            <Label>Target Column (What to Predict)</Label>
            <Select value={targetColumn} onValueChange={setTargetColumn}>
              <SelectTrigger>
                <SelectValue placeholder="Select target column" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.map(field => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feature Columns Selection */}
          <div className="space-y-2">
            <Label>Feature Columns (Input Data)</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px]">
              {availableFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fields available</p>
              ) : (
                availableFields
                  .filter(field => field !== targetColumn)
                  .map(field => (
                    <Badge
                      key={field}
                      variant={featureColumns.includes(field) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleToggleFeature(field)}
                    >
                      {field}
                      {featureColumns.includes(field) && <CheckCircle className="ml-1 h-3 w-3" />}
                    </Badge>
                  ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Click to select/deselect feature columns
            </p>
          </div>

          {/* Train/Test Split */}
          <div className="space-y-2">
            <Label>Train/Test Split: {(trainTestSplit * 100).toFixed(0)}% / {((1 - trainTestSplit) * 100).toFixed(0)}%</Label>
            <Input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={trainTestSplit}
              onChange={(e) => setTrainTestSplit(parseFloat(e.target.value))}
            />
          </div>

          <Button
            className="w-full"
            onClick={handlePrepareTrainingData}
            disabled={loading || !targetColumn || featureColumns.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Prepare Training Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Workflow Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WorkflowIcon className="h-5 w-5 text-blue-600" />
            Workflow Integration
          </CardTitle>
          <CardDescription>
            Trigger automated workflows with device data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {workflows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <WorkflowIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No active workflows</p>
              <p className="text-sm">Create workflows to automate device data processing</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.href = '/workflows'}
              >
                Create Workflow
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Select Workflow</Label>
                <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map(workflow => (
                      <SelectItem key={workflow.id} value={workflow.id}>
                        <div className="flex items-center gap-2">
                          <span>{workflow.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {workflow.trigger_type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleTriggerWorkflow}
                disabled={loading || !selectedWorkflow}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Triggering...
                  </>
                ) : (
                  <>
                    <WorkflowIcon className="mr-2 h-4 w-4" />
                    Trigger Workflow
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Device Data Collection</span>
              </div>
              <Badge variant="default" className="bg-green-600">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Dataset Creation</span>
              </div>
              <Badge variant="default" className="bg-blue-600">Ready</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">ML Training</span>
              </div>
              <Badge variant="default" className="bg-purple-600">Ready</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Workflow Automation</span>
              </div>
              <Badge variant="default" className="bg-orange-600">Ready</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-cyan-600" />
                <span className="text-sm font-medium">AI Assistant Context</span>
              </div>
              <Badge variant="default" className="bg-cyan-600">Integrated</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
