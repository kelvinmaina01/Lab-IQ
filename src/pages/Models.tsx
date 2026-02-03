/**
 * Models Page
 * Production-grade ML model management with AutoML, training, evaluation, and deployment
 * Integrates with datasets, experiments, and the unified AI system
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Target,
  Zap,
  Download,
  Upload,
  BarChart3,
  Settings,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  Sparkles,
  Database,
  FlaskConical,
  Layers,
  GitBranch,
  Activity,
  FileJson,
  Rocket,
  History,
  MoreVertical,
  ChevronRight,
  Search,
  Filter,
  ArrowUpRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { labIQAI } from "@/lib/ai/LabIQAI";
import { mlService } from "@/lib/services/mlService";
import { modelRegistry } from "@/lib/services/ModelRegistry";
import { PredictionDialog } from "@/components/models/PredictionDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// =============================================================================
// TYPES
// =============================================================================

interface MLModel {
  id: string;
  name: string;
  description: string;
  type: 'classification' | 'regression' | 'clustering' | 'timeseries';
  algorithm: string;
  status: 'draft' | 'training' | 'completed' | 'deployed' | 'failed';
  datasetId: string;
  datasetName?: string;
  experimentId?: string;
  targetColumn: string;
  features: string[];
  metrics: ModelMetrics;
  hyperparameters: Record<string, any>;
  version: string;
  createdAt: string;
  updatedAt: string;
  trainingProgress?: number;
  trainingDuration?: number;
  predictions?: number;
}

interface ModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  rmse?: number;
  mae?: number;
  r2?: number;
  silhouetteScore?: number;
  auc?: number;
  confusionMatrix?: number[][];
}

interface Dataset {
  id: string;
  name: string;
  file_name: string;
  row_count: number;
  columns: string[] | { name: string; type: string }[];
  schema?: { columns: { name: string; type: string }[] };
}

// =============================================================================
// ALGORITHM CONFIGURATIONS
// =============================================================================

const ALGORITHMS = {
  classification: [
    { id: 'random_forest_clf', name: 'Random Forest', description: 'Ensemble of decision trees' },
    { id: 'xgboost_clf', name: 'XGBoost', description: 'Gradient boosting framework' },
    { id: 'logistic_regression', name: 'Logistic Regression', description: 'Linear classifier' },
    { id: 'svm_clf', name: 'Support Vector Machine', description: 'Kernel-based classifier' },
    { id: 'neural_network_clf', name: 'Neural Network', description: 'Deep learning model' },
    { id: 'gradient_boosting_clf', name: 'Gradient Boosting', description: 'Sequential ensemble' },
  ],
  regression: [
    { id: 'random_forest_reg', name: 'Random Forest', description: 'Ensemble for continuous values' },
    { id: 'xgboost_reg', name: 'XGBoost', description: 'Gradient boosting for regression' },
    { id: 'linear_regression', name: 'Linear Regression', description: 'Simple linear model' },
    { id: 'ridge_regression', name: 'Ridge Regression', description: 'Regularized linear model' },
    { id: 'neural_network_reg', name: 'Neural Network', description: 'Deep learning regressor' },
    { id: 'elastic_net', name: 'Elastic Net', description: 'L1 + L2 regularization' },
  ],
  clustering: [
    { id: 'kmeans', name: 'K-Means', description: 'Centroid-based clustering' },
    { id: 'dbscan', name: 'DBSCAN', description: 'Density-based clustering' },
    { id: 'hierarchical', name: 'Hierarchical', description: 'Agglomerative clustering' },
  ],
  timeseries: [
    { id: 'arima', name: 'ARIMA', description: 'Autoregressive integrated moving average' },
    { id: 'prophet', name: 'Prophet', description: 'Facebook time series forecasting' },
    { id: 'lstm', name: 'LSTM', description: 'Long short-term memory network' },
  ],
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const Models = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [models, setModels] = useState<MLModel[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [aiProvider, setAiProvider] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [predictionModel, setPredictionModel] = useState<MLModel | null>(null);
  const [trainingModels, setTrainingModels] = useState<Set<string>>(new Set());

  // Create model form state
  const [newModel, setNewModel] = useState({
    name: '',
    description: '',
    type: 'classification' as MLModel['type'],
    algorithm: '',
    datasetId: '',
    targetColumn: '',
    features: [] as string[],
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  // Check AI provider on mount
  useEffect(() => {
    setAiProvider(labIQAI.getActiveProvider());
  }, []);

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const fetchModels = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        console.error('Error fetching models:', error);
      }

      if (data) {
        const formattedModels: MLModel[] = data.map((m: any) => ({
          id: m.id,
          name: m.name || 'Untitled Model',
          description: m.description || '',
          type: m.type || 'classification',
          algorithm: m.algorithm || 'random_forest_clf',
          status: m.status || 'draft',
          datasetId: m.dataset_id || '',
          datasetName: m.dataset_name,
          experimentId: m.experiment_id,
          targetColumn: m.target_column || '',
          features: m.features || [],
          metrics: m.metrics || {},
          hyperparameters: m.hyperparameters || {},
          version: m.version || '1.0.0',
          createdAt: m.created_at,
          updatedAt: m.updated_at,
          trainingProgress: m.training_progress,
          trainingDuration: m.training_duration,
          predictions: m.predictions_count || 0,
        }));
        setModels(formattedModels);
      } else {
        setModels([]);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDatasets = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('datasets')
        .select('id, name, file_name, row_count, columns, schema')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching datasets:', error);
        return;
      }

      setDatasets((data || []).map((d: any) => ({
        ...d,
        // Ensure columns are populated from schema if the top-level columns field is empty
        columns: d.columns?.length ? d.columns : d.schema?.columns || []
      })));
    } catch (error) {
      console.error('Error fetching datasets:', error);
    }
  }, []);

  useEffect(() => {
    fetchModels();
    fetchDatasets();

    // Check if coming from another page with intent to create
    const state = location.state as any;
    if (state?.openWizard && state?.datasetId) {
      setNewModel(prev => ({
        ...prev,
        datasetId: state.datasetId,
        name: state.datasetName ? `Model: ${state.datasetName}` : '',
      }));
      setCreateDialogOpen(true);
    }
  }, [fetchModels, fetchDatasets, location.state]);

  // Update columns when dataset changes
  // Update columns and auto-configure when dataset changes
  useEffect(() => {
    if (newModel.datasetId) {
      const dataset = datasets.find(d => d.id === newModel.datasetId);
      if (dataset) {
        // Robust Column Extraction
        let cols: string[] = [];
        if (dataset.schema?.columns) {
          cols = dataset.schema.columns.map(c => c.name);
        } else if (Array.isArray(dataset.columns) && dataset.columns.length > 0) {
          cols = dataset.columns.map(c => typeof c === 'string' ? c : c.name);
        }

        setAvailableColumns(cols);

        // Initial Name Auto-fill (if empty)
        setNewModel(prev => {
          if (!prev.name) {
            return { ...prev, name: `Analysis of ${dataset.name}` };
          }
          return prev;
        });
      }
    } else {
      setAvailableColumns([]);
    }
  }, [newModel.datasetId, datasets]);

  // Auto-configure Task Type and Metadata based on Target Column
  useEffect(() => {
    if (newModel.datasetId && newModel.targetColumn) {
      const dataset = datasets.find(d => d.id === newModel.datasetId);
      if (!dataset) return;

      // Try to find column type from schema
      const colDef = dataset.schema?.columns?.find(c => c.name === newModel.targetColumn);
      // Fallback: assume string if not found, unless we have data suggesting otherwise
      // Simple heuristic: 'id', 'category', 'label', 'status' -> classification
      // 'price', 'amount', 'score', 'temperature' -> regression
      let suggestedType: MLModel['type'] = 'classification';

      if (colDef) {
        const type = colDef.type.toLowerCase();
        if (['integer', 'number', 'float', 'double', 'decimal', 'numeric'].some(t => type.includes(t))) {
          suggestedType = 'regression';
        }
      }

      // Auto-Generate Name/Description
      // "Human-readable" heuristic
      const cleanTarget = newModel.targetColumn.replace(/_/g, ' ');
      const cleanDataset = dataset.name.replace(/_/g, ' ').replace('.csv', '');

      const suggestedName = `${cleanTarget.charAt(0).toUpperCase() + cleanTarget.slice(1)} Predictor`;
      const suggestedDesc = `An automated ${suggestedType} model designed to predict ${cleanTarget} based on patterns in ${cleanDataset}.`;

      setNewModel(prev => {
        // Only update if user hasn't typed a custom meaningful name (or if it's the generic default)
        const isDefaultName = !prev.name || prev.name.startsWith('Analysis of') || prev.name.includes('Predictor');
        const isDefaultDesc = !prev.description;

        return {
          ...prev,
          type: suggestedType,
          name: isDefaultName ? suggestedName : prev.name,
          description: isDefaultDesc ? suggestedDesc : prev.description
        };
      });
    }
  }, [newModel.targetColumn, newModel.datasetId, datasets]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleCreateModel = async () => {
    if (!newModel.name || !newModel.datasetId || !newModel.targetColumn || !newModel.algorithm) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dataset = datasets.find(d => d.id === newModel.datasetId);

      const modelData = {
        user_id: user.id,
        name: newModel.name,
        description: newModel.description,
        model_type: newModel.type,
        algorithm: newModel.algorithm,
        dataset_id: newModel.datasetId,
        dataset_name: dataset?.name || dataset?.file_name,
        target_column: newModel.targetColumn,
        features: newModel.features.length > 0 ? newModel.features : availableColumns.filter(c => c !== newModel.targetColumn),
        status: 'draft',
        version: '1.0.0',
        metrics: {},
        hyperparameters: getDefaultHyperparameters(newModel.algorithm),
      };

      const { data, error } = await supabase
        .from('models')
        .insert(modelData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Model Created",
        description: "Your model has been created. Start training when ready.",
      });

      setCreateDialogOpen(false);
      resetNewModelForm();
      fetchModels();
    } catch (error: any) {
      console.error('Error creating model:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create model.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleTrainModel = async (model: MLModel) => {
    // Prevent double training
    if (trainingModels.has(model.id)) {
      toast({
        title: "Already Training",
        description: `${model.name} is already being trained.`,
        variant: "destructive",
      });
      return;
    }

    setTrainingModels(prev => new Set(prev).add(model.id));

    toast({
      title: "Training Started",
      description: `Training ${model.name}. Connecting to ML Service...`,
    });

    try {
      // 1. Update status to training
      await supabase
        .from('models')
        .update({
          status: 'training',
          training_progress: 0,
        })
        .eq('id', model.id);

      setModels(prev => prev.map(m =>
        m.id === model.id ? { ...m, status: 'training', trainingProgress: 0 } : m
      ));

      // 2. Fetch Data to send to ML Service
      // The Orchestrator requires raw data. We fetch a sample (up to 2000 rows) to ensure responsiveness
      const { data: rowData, error: rowError } = await supabase
        .from('dataset_rows')
        .select('data')
        .eq('dataset_id', model.datasetId)
        .limit(2000);

      if (rowError || !rowData || rowData.length === 0) {
        throw new Error("Could not fetch training data. Please ensure the dataset is uploaded correctly.");
      }

      const trainingData = rowData.map(r => r.data);

      // 3. Connect to WebSocket
      let ws: WebSocket | null = null;

      ws = mlService.connectToAutoML(model.datasetId, {
        onOpen: () => {
          // Send configuration payload immediately upon connection
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              target_column: model.targetColumn,
              problem_type: model.type,
              options: { ...model.hyperparameters },
              data: trainingData
            }));
            console.log("Sent training payload with", trainingData.length, "rows");
          }
        },
        onProgress: async ({ progress, status }) => {
          // Update UI
          setModels(prev => prev.map(m =>
            m.id === model.id ? { ...m, trainingProgress: progress } : m
          ));

          // Sync with DB periodically (every 10%) to avoid spamming
          if (progress % 10 === 0) {
            await supabase.from('models').update({ training_progress: progress }).eq('id', model.id);
          }
        },
        onComplete: async (result) => {
          const trainingDuration = result.pipeline_duration || 0;
          const trainingSummary = result.summary?.model_training_summary || {};

          const metrics = trainingSummary.best_score ? {
            // Adapt backend summary to frontend metrics structure
            accuracy: trainingSummary.best_score,
            description: trainingSummary.best_model,
            model_path: trainingSummary.model_path, // Capture the model path
            // Add other metrics if available in result
            ...trainingSummary.metrics
          } : {};

          // @ts-ignore
          await supabase
            .from('models')
            .update({
              status: 'completed',
              training_progress: 100,
              training_duration: trainingDuration,
              metrics,
            })
            .eq('id', model.id);

          setModels(prev => prev.map(m =>
            m.id === model.id ? {
              ...m,
              status: 'completed',
              trainingProgress: 100,
              trainingDuration,
              metrics
            } : m
          ));

          toast({
            title: "Training Complete",
            description: `Model successfully trained! Duration: ${trainingDuration.toFixed(2)}s`,
          });

          setTrainingModels(prev => {
            const next = new Set(prev);
            next.delete(model.id);
            return next;
          });
        },
        onError: async (error) => {
          console.error('WS Error:', error);
          await supabase
            .from('models')
            .update({ status: 'failed' })
            .eq('id', model.id);

          setModels(prev => prev.map(m =>
            m.id === model.id ? { ...m, status: 'failed' } : m
          ));

          setTrainingModels(prev => {
            const next = new Set(prev);
            next.delete(model.id);
            return next;
          });

          toast({
            title: "Training Failed",
            description: "Backend connection failed or training error.",
            variant: "destructive",
          });
        }
      });

    } catch (error: any) {
      console.error("Setup error", error);
      toast({
        title: "Training Start Error",
        description: error.message || "Failed to start training.",
        variant: "destructive",
      });
      setTrainingModels(prev => {
        const next = new Set(prev);
        next.delete(model.id);
        return next;
      });
    }
  };

  const handleDeployModel = async (model: MLModel) => {
    try {
      await supabase
        .from('models')
        .update({ status: 'deployed' })
        .eq('id', model.id);

      toast({
        title: "Model Deployed",
        description: `${model.name} is now available for predictions.`,
      });

      fetchModels();
    } catch (error) {
      console.error('Deployment error:', error);
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy the model.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    try {
      await supabase
        .from('models')
        .delete()
        .eq('id', modelId);

      toast({
        title: "Model Deleted",
        description: "The model has been removed.",
      });

      fetchModels();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const generateDescription = async () => {
    if (!newModel.name) {
      toast({
        title: "Model Name Required",
        description: "Please enter a model name first.",
        variant: "destructive",
      });
      return;
    }

    if (!labIQAI.isAvailable()) {
      toast({
        title: "AI Not Available",
        description: "AI service is not configured or reachable.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const dataset = datasets.find(d => d.id === newModel.datasetId);
      const context = `Dataset: ${dataset?.name || 'Unknown'}. Target: ${newModel.targetColumn}. Type: ${newModel.type}`;

      const result = await labIQAI.generateEntityDetails('model', newModel.name, context);

      if (result) {
        setNewModel(prev => ({
          ...prev,
          name: result.title,
          description: result.description
        }));
        toast({
          title: "AI Details Generated",
          description: "Title and description have been updated.",
        });
      } else {
        toast({
          title: "Generation Failed",
          description: "AI could not generate details. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating details:', error);
      toast({
        title: "Error",
        description: "Failed to generate description.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const resetNewModelForm = () => {
    setNewModel({
      name: '',
      description: '',
      type: 'classification',
      algorithm: '',
      datasetId: '',
      targetColumn: '',
      features: [],
    });
    setAvailableColumns([]);
  };

  // =============================================================================
  // FILTERING
  // =============================================================================

  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || model.status === filterStatus;
    const matchesType = filterType === 'all' || model.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // =============================================================================
  // STATS
  // =============================================================================

  const stats = {
    total: models.length,
    training: models.filter(m => m.status === 'training').length,
    deployed: models.filter(m => m.status === 'deployed').length,
    completed: models.filter(m => m.status === 'completed').length,
    avgAccuracy: models.filter(m => m.metrics?.accuracy).reduce((sum, m) => sum + (m.metrics.accuracy || 0), 0) /
      (models.filter(m => m.metrics?.accuracy).length || 1),
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <AuthGuard>
      <MainLayout>
        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-500" />
                ML Models
              </h1>
              <p className="text-muted-foreground mt-1">
                Train, evaluate, and deploy machine learning models
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* AI Provider Status */}
              <Badge variant={aiProvider ? "default" : "secondary"} className="gap-1.5">
                <div className={`w-2 h-2 rounded-full ${aiProvider ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                {aiProvider ? `AI: ${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)}` : 'AI Offline'}
              </Badge>
              <Button variant="outline" onClick={fetchModels}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Model
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Models</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.training}</p>
                  <p className="text-sm text-muted-foreground">Training</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.deployed}</p>
                  <p className="text-sm text-muted-foreground">Deployed</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{(stats.avgAccuracy * 100).toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="deployed">Deployed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="classification">Classification</SelectItem>
                <SelectItem value="regression">Regression</SelectItem>
                <SelectItem value="clustering">Clustering</SelectItem>
                <SelectItem value="timeseries">Time Series</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Models Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-10 bg-muted rounded" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredModels.length === 0 ? (
            <Card className="p-12 text-center">
              <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Models Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first machine learning model to start making predictions from your data.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Model
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="models-grid">
              {filteredModels.map(model => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onTrain={() => handleTrainModel(model)}
                  onDeploy={() => handleDeployModel(model)}
                  onDelete={() => handleDeleteModel(model.id)}
                  onViewDetails={() => {
                    setSelectedModel(model);
                    setDetailsDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {/* Create Model Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Create New Model
                </DialogTitle>
                <DialogDescription>
                  Configure your machine learning model settings
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">

                {/* 1. Dataset Selection (Primary Driver) */}
                <div className="space-y-2">
                  <Label>Dataset *</Label>
                  <Select
                    value={newModel.datasetId}
                    onValueChange={(val) => setNewModel(prev => ({ ...prev, datasetId: val, targetColumn: '', features: [] }))}
                  >
                    <SelectTrigger className="h-12 border-primary/20">
                      <SelectValue placeholder="Select a dataset to begin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.length === 0 ? (
                        <SelectItem value="none" disabled>No datasets available</SelectItem>
                      ) : (
                        datasets.map(ds => (
                          <SelectItem key={ds.id} value={ds.id}>
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-primary" />
                              <span className="font-medium">{ds.name || ds.file_name}</span>
                              <span className="text-muted-foreground text-xs">({ds.row_count?.toLocaleString()} rows)</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {datasets.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      <Link to="/upload" className="text-primary hover:underline">Upload a dataset</Link> first.
                    </p>
                  )}
                </div>

                {/* 2. Configuration Grid */}
                {newModel.datasetId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">

                    {/* Target Column */}
                    <div className="space-y-2">
                      <Label>Target Column {newModel.type !== 'clustering' && '*'}</Label>
                      <Select
                        value={newModel.targetColumn}
                        onValueChange={(val) => setNewModel(prev => ({ ...prev, targetColumn: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={availableColumns.length ? "Select target..." : "Loading columns..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableColumns.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">No columns found</div>
                          ) : (
                            availableColumns.map(col => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {availableColumns.length === 0 && (
                        <p className="text-xs text-yellow-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          If columns don't appear, try re-uploading the dataset.
                        </p>
                      )}
                    </div>

                    {/* Task Type (Auto-selected) */}
                    <div className="space-y-2">
                      <Label>Task Type *</Label>
                      <Select
                        value={newModel.type}
                        onValueChange={(val: MLModel['type']) => setNewModel(prev => ({ ...prev, type: val, algorithm: '' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="classification">Classification (Categories)</SelectItem>
                          <SelectItem value="regression">Regression (Numbers)</SelectItem>
                          <SelectItem value="clustering">Clustering (Grouping)</SelectItem>
                          <SelectItem value="timeseries">Time Series (Forecasting)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Algorithm */}
                    <div className="space-y-2 col-span-2">
                      <Label>
                        Algorithm *
                        <span className="text-xs font-normal text-muted-foreground ml-2">(AutoML will optimize hyperparameters)</span>
                      </Label>
                      <Select
                        value={newModel.algorithm}
                        onValueChange={(val) => setNewModel(prev => ({ ...prev, algorithm: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select algorithm" />
                        </SelectTrigger>
                        <SelectContent>
                          {newModel.type === 'classification' && (
                            <>
                              <SelectItem value="random_forest_clf">Random Forest Classifier (Recommended)</SelectItem>
                              <SelectItem value="xgboost_clf">XGBoost Classifier</SelectItem>
                              <SelectItem value="logistic_regression">Logistic Regression</SelectItem>
                              <SelectItem value="neural_network_clf">Neural Network</SelectItem>
                            </>
                          )}
                          {newModel.type === 'regression' && (
                            <>
                              <SelectItem value="random_forest_reg">Random Forest Regressor (Recommended)</SelectItem>
                              <SelectItem value="xgboost_reg">XGBoost Regressor</SelectItem>
                              <SelectItem value="linear_regression">Linear Regression</SelectItem>
                            </>
                          )}
                          {newModel.type === 'clustering' && (
                            <>
                              <SelectItem value="kmeans">K-Means Clustering</SelectItem>
                              <SelectItem value="dbscan">DBSCAN</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Name & Description (Auto-filled) */}
                    <div className="space-y-2 col-span-2">
                      <Label>Model Name</Label>
                      <Input
                        value={newModel.name}
                        onChange={(e) => setNewModel(prev => ({ ...prev, name: e.target.value }))}
                        className="font-medium"
                        placeholder="Auto-generated name..."
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={newModel.description}
                        onChange={(e) => setNewModel(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="resize-none"
                        placeholder="Auto-generated description..."
                      />
                    </div>

                  </div>
                )}

                {/* Feature Selection */}
                {newModel.datasetId && availableColumns.length > 0 && (
                  <div className="space-y-2">
                    <Label>Features (Optional - defaults to all)</Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30 max-h-32 overflow-y-auto">
                      {availableColumns
                        .filter(col => col !== newModel.targetColumn)
                        .map(col => (
                          <Badge
                            key={col}
                            variant={newModel.features.includes(col) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              setNewModel(prev => ({
                                ...prev,
                                features: prev.features.includes(col)
                                  ? prev.features.filter(f => f !== col)
                                  : [...prev.features, col]
                              }));
                            }}
                          >
                            {col}
                          </Badge>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {newModel.features.length === 0
                        ? 'All columns will be used as features'
                        : `${newModel.features.length} features selected`}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateModel}
                  disabled={
                    isCreating ||
                    !newModel.name ||
                    !newModel.datasetId ||
                    (!newModel.targetColumn && newModel.type !== 'clustering') ||
                    !newModel.algorithm
                  }
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Model
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Model Details Dialog */}
          {selectedModel && (
            <ModelDetailsDialog
              open={detailsDialogOpen}
              onOpenChange={setDetailsDialogOpen}
              model={selectedModel}
              onTrain={() => handleTrainModel(selectedModel)}
              onDeploy={() => handleDeployModel(selectedModel)}
              onTest={() => setPredictionModel(selectedModel)}
            />
          )}

          <PredictionDialog
            model={predictionModel}
            open={!!predictionModel}
            onOpenChange={(open) => !open && setPredictionModel(null)}
          />
        </main>
      </MainLayout>
    </AuthGuard>
  );
};

// =============================================================================
// MODEL CARD COMPONENT
// =============================================================================

interface ModelCardProps {
  model: MLModel;
  onTrain: () => void;
  onDeploy: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, onTrain, onDeploy, onDelete, onViewDetails }) => {
  const getStatusBadge = () => {
    const configs: Record<MLModel['status'], { color: string; icon: React.ReactNode }> = {
      draft: { color: 'bg-gray-500/10 text-gray-500', icon: <Clock className="w-3 h-3" /> },
      training: { color: 'bg-blue-500/10 text-blue-500', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
      completed: { color: 'bg-green-500/10 text-green-500', icon: <CheckCircle2 className="w-3 h-3" /> },
      deployed: { color: 'bg-purple-500/10 text-purple-500', icon: <Rocket className="w-3 h-3" /> },
      failed: { color: 'bg-red-500/10 text-red-500', icon: <AlertCircle className="w-3 h-3" /> },
    };
    const config = configs[model.status];
    return (
      <Badge className={`${config.color} gap-1`}>
        {config.icon}
        {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = () => {
    const icons: Record<MLModel['type'], React.ReactNode> = {
      classification: <Target className="w-5 h-5 text-purple-500" />,
      regression: <TrendingUp className="w-5 h-5 text-blue-500" />,
      clustering: <GitBranch className="w-5 h-5 text-green-500" />,
      timeseries: <Activity className="w-5 h-5 text-amber-500" />,
    };
    return icons[model.type];
  };

  const primaryMetric = model.type === 'classification'
    ? model.metrics?.accuracy
    : model.type === 'regression'
      ? model.metrics?.r2
      : model.metrics?.silhouetteScore;

  return (
    <Card className="p-6 hover:shadow-lg transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            {getTypeIcon()}
          </div>
          <div>
            <h3 className="font-semibold">{model.name}</h3>
            <p className="text-sm text-muted-foreground">{model.algorithm.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTrain} disabled={model.status === 'training'}>
                <Play className="w-4 h-4 mr-2" />
                {model.status === 'completed' ? 'Retrain' : 'Train'}
              </DropdownMenuItem>
              {model.status === 'completed' && (
                <DropdownMenuItem onClick={onDeploy}>
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {model.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {model.description}
        </p>
      )}

      {/* Training Progress */}
      {model.status === 'training' && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Training</span>
            <span>{model.trainingProgress || 0}%</span>
          </div>
          <Progress value={model.trainingProgress || 0} className="h-2" />
        </div>
      )}

      {/* Metrics */}
      {model.status === 'completed' || model.status === 'deployed' ? (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              {model.type === 'classification' ? 'Accuracy' : model.type === 'regression' ? 'R² Score' : 'Score'}
            </p>
            <p className="text-lg font-bold">
              {primaryMetric ? `${(primaryMetric * 100).toFixed(1)}%` : 'N/A'}
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Predictions</p>
            <p className="text-lg font-bold">{model.predictions?.toLocaleString() || 0}</p>
          </div>
        </div>
      ) : null}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        {getStatusBadge()}
        <Button variant="ghost" size="sm" onClick={onViewDetails}>
          Details
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
};

// =============================================================================
// MODEL DETAILS DIALOG
// =============================================================================

interface ModelDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: MLModel;
  onTrain: () => void;
  onDeploy: () => void;
  onTest?: () => void;
}

const ModelDetailsDialog: React.FC<ModelDetailsDialogProps> = ({
  open,
  onOpenChange,
  model,
  onTrain,
  onDeploy,
  onTest,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            {model.name}
          </DialogTitle>
          <DialogDescription>{model.description || 'No description'}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-semibold capitalize">{model.type}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Algorithm</p>
                <p className="font-semibold">{model.algorithm.replace(/_/g, ' ')}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="font-semibold">{model.version}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{model.status}</p>
              </Card>
            </div>

            {model.datasetName && (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dataset</p>
                    <p className="font-semibold">{model.datasetName}</p>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Target Column</p>
              <Badge variant="secondary">{model.targetColumn}</Badge>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Features ({model.features.length})</p>
              <div className="flex flex-wrap gap-2">
                {model.features.map(f => (
                  <Badge key={f} variant="outline">{f}</Badge>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4 mt-4">
            {model.metrics && Object.keys(model.metrics).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {model.metrics.accuracy !== undefined && (
                  <MetricCard label="Accuracy" value={model.metrics.accuracy * 100} suffix="%" />
                )}
                {model.metrics.precision !== undefined && (
                  <MetricCard label="Precision" value={model.metrics.precision * 100} suffix="%" />
                )}
                {model.metrics.recall !== undefined && (
                  <MetricCard label="Recall" value={model.metrics.recall * 100} suffix="%" />
                )}
                {model.metrics.f1Score !== undefined && (
                  <MetricCard label="F1 Score" value={model.metrics.f1Score * 100} suffix="%" />
                )}
                {model.metrics.r2 !== undefined && (
                  <MetricCard label="R² Score" value={model.metrics.r2} />
                )}
                {model.metrics.rmse !== undefined && (
                  <MetricCard label="RMSE" value={model.metrics.rmse} />
                )}
                {model.metrics.mae !== undefined && (
                  <MetricCard label="MAE" value={model.metrics.mae} />
                )}
                {model.metrics.auc !== undefined && (
                  <MetricCard label="AUC" value={model.metrics.auc} />
                )}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No metrics available. Train the model first.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="config" className="space-y-4 mt-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Hyperparameters</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                {JSON.stringify(model.hyperparameters, null, 2)}
              </pre>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          {model.status === 'draft' && (
            <Button onClick={onTrain}>
              <Play className="w-4 h-4 mr-2" />
              Start Training
            </Button>
          )}
          {model.status === 'completed' && (
            <>
              <Button variant="outline" onClick={onTrain}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retrain
              </Button>
              {onTest && (
                <Button variant="outline" onClick={onTest}>
                  <FlaskConical className="w-4 h-4 mr-2" />
                  Test Prediction
                </Button>
              )}
              <Button onClick={onDeploy}>
                <Rocket className="w-4 h-4 mr-2" />
                Deploy Model
              </Button>
            </>
          )}
          {model.status === 'deployed' && (
            <>
              {onTest && (
                <Button variant="outline" onClick={onTest}>
                  <FlaskConical className="w-4 h-4 mr-2" />
                  Test Prediction
                </Button>
              )}
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Model
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// =============================================================================
// METRIC CARD
// =============================================================================

const MetricCard: React.FC<{ label: string; value: number; suffix?: string }> = ({ label, value, suffix = '' }) => (
  <Card className="p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold">{value.toFixed(2)}{suffix}</p>
  </Card>
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================



function getDefaultHyperparameters(algorithm: string): Record<string, any> {
  const defaults: Record<string, Record<string, any>> = {
    random_forest_clf: { n_estimators: 100, max_depth: 10, min_samples_split: 2 },
    random_forest_reg: { n_estimators: 100, max_depth: 10, min_samples_split: 2 },
    xgboost_clf: { learning_rate: 0.1, max_depth: 6, n_estimators: 100 },
    xgboost_reg: { learning_rate: 0.1, max_depth: 6, n_estimators: 100 },
    logistic_regression: { C: 1.0, max_iter: 100 },
    linear_regression: { fit_intercept: true },
    neural_network_clf: { hidden_layers: [64, 32], learning_rate: 0.001, epochs: 50 },
    neural_network_reg: { hidden_layers: [64, 32], learning_rate: 0.001, epochs: 50 },
    kmeans: { n_clusters: 5, max_iter: 300 },
    dbscan: { eps: 0.5, min_samples: 5 },
  };
  return defaults[algorithm] || {};
}

// generateMockMetrics removed


export default Models;
