import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FlaskConical, Calendar, User, MoreVertical, Play, Pause, CheckCircle, AlertCircle, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ExperimentTemplates } from "@/components/experiments/ExperimentTemplates";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { useActivityTracker } from "@/hooks/useActivityTracker";

const Experiments = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { toast } = useToast();
  const { subscription, loading } = useSubscription();
  const { trackActivity } = useActivityTracker();

  const [experiments, setExperiments] = useState<any[]>([]);
  const [loadingExperiments, setLoadingExperiments] = useState(true);
  const [datasets, setDatasets] = useState<any[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [experimentType, setExperimentType] = useState("");
  const [selectedDatasetId, setSelectedDatasetId] = useState("");

  useEffect(() => {
    fetchExperiments();
    fetchDatasets();

    // Check if we're coming from QuickActions
    const state = location.state as any;
    if (state?.createNew && state?.datasetId) {
      setIsCreateDialogOpen(true);
      setSelectedDatasetId(state.datasetId);
      if (state.datasetName) {
        setTitle(`Experiment: ${state.datasetName}`);
        setDescription(`Experiment protocol for ${state.datasetName}`);
      }
    }
  }, [location.state]);

  const fetchExperiments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('experiments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (error) throw error;

      const formattedExperiments = (data || []).map(exp => ({
        ...exp,
        created: new Date(exp.created_at).toLocaleDateString(),
        researcher: user.email
      }));

      setExperiments(formattedExperiments);
    } catch (error) {
      console.error('Error fetching experiments:', error);
      toast({
        title: "Error loading experiments",
        description: "Could not load your experiments.",
        variant: "destructive"
      });
    } finally {
      setLoadingExperiments(false);
    }
  };

  const fetchDatasets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('datasets')
        .select('id, name, file_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDatasets(data || []);
    } catch (error) {
      console.error('Error fetching datasets:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "completed": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pending": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "failed": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running": return <Play className="w-4 h-4" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "pending": return <Pause className="w-4 h-4" />;
      case "failed": return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleCreateExperiment = async () => {
    if (!title || !experimentType) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and experiment type.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('experiments')
        .insert({
          user_id: user.id,
          title,
          description,
          type: experimentType,
          dataset_id: selectedDatasetId || null,
          auto_created: !!selectedDatasetId,
          status: 'pending',
          protocol: {
            steps: [
              'Prepare materials and equipment',
              'Set up experimental conditions',
              'Execute protocol',
              'Collect and record data',
              'Analyze results'
            ]
          }
        })
        .select();

      if (error) throw error;

      trackActivity("Experiment created", title, "FlaskConical");
      toast({
        title: "Experiment Created",
        description: "Your experiment has been created successfully.",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setExperimentType("");
      setSelectedDatasetId("");
      setIsCreateDialogOpen(false);

      // Refresh experiments list
      fetchExperiments();
    } catch (error) {
      console.error('Error creating experiment:', error);
      toast({
        title: "Error",
        description: "Failed to create experiment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredExperiments = experiments.filter(exp =>
    exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />

        <div className="flex-1 md:ml-64 pb-16 md:pb-0">
          <TopBar />

          <main className="p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Experiments</h1>
                <p className="text-muted-foreground">Design, track, and manage your laboratory experiments</p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Experiment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Experiment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Experiment Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Protein Structure Analysis"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your experiment objectives..."
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Experiment Type</Label>
                        <Select value={experimentType} onValueChange={setExperimentType}>
                          <SelectTrigger id="type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="biological">Biological</SelectItem>
                            <SelectItem value="chemical">Chemical</SelectItem>
                            <SelectItem value="material">Material</SelectItem>
                            <SelectItem value="environmental">Environmental</SelectItem>
                            <SelectItem value="qc">Quality Control</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dataset">Dataset (Optional)</Label>
                        <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
                          <SelectTrigger id="dataset">
                            <SelectValue placeholder="Select dataset" />
                          </SelectTrigger>
                          <SelectContent>
                            {datasets.length === 0 ? (
                              <SelectItem value="none" disabled>No datasets available</SelectItem>
                            ) : (
                              datasets.map((ds) => (
                                <SelectItem key={ds.id} value={ds.id}>
                                  {ds.name || ds.file_name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleCreateExperiment} className="w-full" disabled={!title || !experimentType}>
                      Create Experiment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search experiments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All ({experiments.length})</TabsTrigger>
                <TabsTrigger value="running">Running ({experiments.filter(e => e.status === "running").length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({experiments.filter(e => e.status === "completed").length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({experiments.filter(e => e.status === "pending").length})</TabsTrigger>
                <TabsTrigger value="templates">Templates Library</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-6">
                {filteredExperiments.map((exp) => (
                  <Card key={exp.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <FlaskConical className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{exp.title}</h3>
                            <Badge className={getStatusColor(exp.status)}>
                              {getStatusIcon(exp.status)}
                              <span className="ml-1 capitalize">{exp.status}</span>
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{exp.description}</p>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {exp.researcher}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {exp.created}
                            </div>
                            <Badge variant="outline">{exp.type}</Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                    {exp.status === "running" && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{exp.progress}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${exp.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="running" className="space-y-4 mt-6">
                {filteredExperiments.filter(e => e.status === "running").map((exp) => (
                  <Card key={exp.id} className="p-6">
                    <h3 className="font-semibold mb-2">{exp.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{exp.description}</p>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${exp.progress}%` }} />
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 mt-6">
                {filteredExperiments.filter(e => e.status === "completed").map((exp) => (
                  <Card key={exp.id} className="p-6">
                    <h3 className="font-semibold mb-2">{exp.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{exp.description}</p>
                    <div className="flex justify-end">
                      <Link to="/models">
                        <Button size="sm" className="gap-2" variant="outline">
                          <Brain className="w-4 h-4" />
                          Train AI Model
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4 mt-6">
                {filteredExperiments.filter(e => e.status === "pending").map((exp) => (
                  <Card key={exp.id} className="p-6">
                    <h3 className="font-semibold mb-2">{exp.title}</h3>
                    <p className="text-sm text-muted-foreground">{exp.description}</p>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="templates" className="mt-6">
                <ExperimentTemplates
                  onSelectTemplate={(template) => {
                    toast({
                      title: "Template Loaded",
                      description: `${template.name} template is ready to use.`,
                    });
                  }}
                  onUpgradeClick={() => setUpgradeOpen(true)}
                />
              </TabsContent>
            </Tabs>

            <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
          </main>
        </div>
        <MobileNav />
      </div>
    </AuthGuard>
  );
};

export default Experiments;
