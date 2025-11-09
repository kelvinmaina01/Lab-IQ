import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload as UploadIcon, FileText, HardDrive, Clock, AlertCircle, Shield, Database, Boxes, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConnectDataSources from "@/components/ConnectDataSources";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { Badge } from "@/components/ui/badge";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { DeviceStreamsSection } from "@/components/upload/DeviceStreamsSection";
import { DatasetMetadataCard } from "@/components/upload/DatasetMetadataCard";
import { SampleDatasetCTA } from "@/components/upload/SampleDatasetCTA";
import { supabase } from "@/integrations/supabase/client";

export default function Upload() {
  const { toast } = useToast();
  const { subscription, isPro } = useSubscription();
  const { trackActivity } = useActivityTracker();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('datasets')
        .select(`
          *,
          dataset_metadata (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setDatasets(data || []);
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls', '.json'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: "Please upload CSV, Excel, or JSON files only",
        variant: "destructive"
      });
      return;
    }
    
    const fileSizeMB = file.size / (1024 * 1024);
    const storageLimit = subscription?.storage_limit_mb || 200;
    
    if (fileSizeMB > storageLimit) {
      toast({
        title: "File too large",
        description: `File size exceeds your ${storageLimit}MB limit. Upgrade for more storage!`,
        variant: "destructive"
      });
      setUpgradeOpen(true);
      return;
    }
    
    setUploadedFile(file);
    trackActivity("Dataset uploaded", file.name, "Database");
    toast({
      title: "File uploaded successfully",
      description: `${file.name} is ready for processing`
    });
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col lg:flex-row bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen md:ml-64">
          <TopBar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
            {/* Hero Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl shadow-lg">
                    <Database className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                      Data Ingestion Hub
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Enterprise-grade data pipeline • Secure • Compliant • Scalable
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" />
                    GMP Ready
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" />
                    PHI Compliant
                  </Badge>
                </div>
              </div>
              
              {/* Sample Dataset CTA */}
              <SampleDatasetCTA />
            </div>

            {/* Storage & Limits Card */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <HardDrive className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Storage</p>
                        <p className="text-xs text-muted-foreground">
                          0 MB / {subscription?.storage_limit_mb || 200} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Boxes className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Datasets</p>
                        <p className="text-xs text-muted-foreground">
                          {datasets.length} / {subscription?.max_datasets || 5}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Plan</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {subscription?.tier || 'free'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {!isPro && (
                    <Button variant="outline" size="sm" onClick={() => setUpgradeOpen(true)}>
                      Upgrade to Pro
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="upload">File Upload</TabsTrigger>
                <TabsTrigger value="devices">Live Devices</TabsTrigger>
                <TabsTrigger value="connect">Cloud Sources</TabsTrigger>
                <TabsTrigger value="metadata">Dataset Registry</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6 mt-6">
                <Card className="border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Project Information
                    </CardTitle>
                    <CardDescription>
                      Name your dataset and track its lineage through your pipeline
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="project-name">Dataset Name</Label>
                      <Input
                        id="project-name"
                        placeholder="e.g., Q4-2024-Lab-Results-Analysis"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use descriptive names for better data lineage tracking
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UploadIcon className="h-5 w-5 text-primary" />
                      Upload Dataset
                    </CardTitle>
                    <CardDescription>
                      Drag and drop files • Auto schema detection • Quality scanning enabled
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                        dragActive
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleChange}
                        accept=".csv,.xlsx,.xls,.json"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        {uploadedFile ? (
                          <div className="text-center space-y-3">
                            <FileText className="h-12 w-12 mx-auto text-primary" />
                            <div>
                              <p className="font-medium text-foreground">{uploadedFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <div className="flex items-center justify-center gap-4 pt-2">
                              <Badge variant="outline" className="gap-1">
                                <Shield className="h-3 w-3" />
                                PII Scanning
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Database className="h-3 w-3" />
                                Schema Detection
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="font-medium text-foreground mb-2">
                              Drop your file here or click to browse
                            </p>
                            <p className="text-sm text-muted-foreground mb-3">
                              Supports CSV, Excel, JSON • Max {subscription?.storage_limit_mb || 200}MB
                            </p>
                            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Auto PII Detection
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Database className="h-3 w-3" />
                                Schema Registry
                              </span>
                              <span>•</span>
                              <span>Data Quality Scoring</span>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  </CardContent>
                </Card>

                  {uploadedFile && (
                    <div className="space-y-4">
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            File Preview & Processing
                          </h4>
                          <div className="text-sm space-y-2 text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Name:</span>
                              <span className="font-medium text-foreground">{uploadedFile.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Size:</span>
                              <span className="font-medium text-foreground">
                                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Type:</span>
                              <span className="font-medium text-foreground">
                                {uploadedFile.type || "Unknown"}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                            <p className="text-xs font-medium">Auto-processing will include:</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Shield className="h-3 w-3" /> PII Classification
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Database className="h-3 w-3" /> Schema Registry
                              </span>
                              <span className="text-muted-foreground">Data Quality Score</span>
                              <span className="text-muted-foreground">Missingness Analysis</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Button className="w-full" size="lg" disabled={!projectName}>
                        Process & Analyze Dataset
                      </Button>
                    </div>
                  )}

                <Card className="border-border/50 shadow-sm bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-primary" />
                      Import Guidelines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>First row should contain column headers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Use consistent units across measurements</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Remove any sensitive or identifying information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Ensure data is clean and properly formatted</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="devices" className="space-y-6 mt-6">
                <DeviceStreamsSection />
              </TabsContent>

              <TabsContent value="connect" className="space-y-6 mt-6">
                <ConnectDataSources />
              </TabsContent>

              <TabsContent value="metadata" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        Schema & Metadata Registry
                      </CardTitle>
                      <CardDescription>
                        Auto-generated metadata, data quality scores, and PII classification for all datasets
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {loadingMetadata ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="border-border/50">
                          <CardContent className="p-6">
                            <div className="animate-pulse space-y-3">
                              <div className="h-4 bg-muted rounded w-2/3"></div>
                              <div className="h-4 bg-muted rounded w-full"></div>
                              <div className="h-4 bg-muted rounded w-1/2"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : datasets.length === 0 ? (
                    <Card className="border-border/50">
                      <CardContent className="p-12 text-center">
                        <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-lg font-medium text-foreground mb-2">No datasets yet</p>
                        <p className="text-sm text-muted-foreground">
                          Upload your first dataset to see metadata and quality metrics
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {datasets.map((dataset) => (
                        <DatasetMetadataCard
                          key={dataset.id}
                          datasetName={dataset.name}
                          metadata={dataset.dataset_metadata?.[0] || {}}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </main>
          <MobileNav />
        </div>
      </div>
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </AuthGuard>
  );
}
