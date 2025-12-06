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
import { MainLayout } from "@/components/layout/MainLayout";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { Badge } from "@/components/ui/badge";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { DeviceStreamsSection } from "@/components/upload/DeviceStreamsSection";
import { DatasetMetadataCard } from "@/components/upload/DatasetMetadataCard";
import { SampleDatasetCTA } from "@/components/upload/SampleDatasetCTA";
import { supabase } from "@/integrations/supabase/client";
import { TemplateSuggestions } from "@/components/upload/TemplateSuggestions";
import { suggestTemplates } from "@/lib/utils/templateSuggestions";

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

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);

  const handleFile = async (file: File) => {
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

    setUploadedFile(file);

    // Auto-fill project name from filename if empty
    if (!projectName) {
      const baseName = file.name.split('.')[0];
      setProjectName(baseName);
    }

    // Parse immediately for preview
    setIsProcessing(true);
    setProgressMessage("Parsing file...");

    try {
      let result;

      if (fileExtension === '.csv') {
        const { csvParser } = await import("@/lib/parsers/csvParser");
        result = await csvParser.parse(file);
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        const { excelParser } = await import("@/lib/parsers/excelParser");
        result = await excelParser.parse(file);
      } else if (fileExtension === '.json') {
        const { jsonParser } = await import("@/lib/parsers/jsonParser");
        result = await jsonParser.parse(file);
      }

      if (result && result.success && result.data) {
        setParsedData(result.data);
        toast({
          title: "File parsed successfully",
          description: `Found ${result.data.rowCount} rows and ${result.data.columnCount} columns`
        });
      } else {
        throw new Error(result?.error || "Parsing failed or format not supported");
      }
    } catch (error) {
      console.error("Parse error:", error);
      toast({
        title: "Error parsing file",
        description: error instanceof Error ? error.message : "Could not parse the file. Please check the format.",
        variant: "destructive"
      });
      setParsedData(null);
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  const handleProcess = async () => {
    if (!uploadedFile || !parsedData) {
      toast({
        title: "Missing data",
        description: "Please upload and parse a file first",
        variant: "destructive"
      });
      return;
    }

    if (!projectName || projectName.trim() === '') {
      toast({
        title: "Missing dataset name",
        description: "Please enter a dataset name",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      setUploadProgress(0);
      setProgressMessage("Starting upload...");

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload datasets",
          variant: "destructive"
        });
        return;
      }

      const { datasetService } = await import("@/lib/services/datasetService");

      // Update parsedData with the user's chosen name
      const datasetWithName = {
        ...parsedData,
        fileName: projectName + '.' + uploadedFile.name.split('.').pop()
      };

      console.log('Starting upload for:', projectName);
      console.log('User ID:', user.id);
      console.log('Parsed data:', datasetWithName);

      const datasetId = await datasetService.saveDataset(
        user.id,
        datasetWithName,
        (progress, message) => {
          console.log(`Progress: ${progress}% - ${message}`);
          setUploadProgress(progress);
          setProgressMessage(message);
        }
      );

      console.log('Dataset saved with ID:', datasetId);

      toast({
        title: "Success!",
        description: "Dataset uploaded and processed successfully."
      });

      // Track activity
      await trackActivity('Dataset uploaded', projectName, 'Database');

      // Refresh dataset list
      await fetchDatasets();

      // Clear form
      setUploadedFile(null);
      setParsedData(null);
      setProjectName("");
      setUploadProgress(0);
      setProgressMessage("");

      // Navigate to dataset detail page
      setTimeout(() => {
        window.location.href = `/dashboard/datasets/${datasetId}`;
      }, 1000);

    } catch (error: any) {
      console.error("Processing error:", error);

      // Show detailed error
      const errorMessage = error?.message || error?.toString() || "An unknown error occurred";

      toast({
        title: "Error processing dataset",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AuthGuard>
      <MainLayout>
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
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive
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
                          {parsedData && (
                            <div className="flex items-center justify-center gap-4 pt-2">
                              <Badge variant="secondary" className="gap-1">
                                <Database className="h-3 w-3" />
                                {parsedData.rowCount.toLocaleString()} Rows
                              </Badge>
                              <Badge variant="secondary" className="gap-1">
                                <Boxes className="h-3 w-3" />
                                {parsedData.columnCount} Columns
                              </Badge>
                            </div>
                          )}
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

                      {isProcessing && uploadProgress > 0 ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{progressMessage}</span>
                            <span>{Math.round(uploadProgress)}%</span>
                          </div>
                          <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
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
                          <div className="flex justify-between">
                            <span>Parse Status:</span>
                            <span className={`font-medium ${parsedData ? 'text-green-600' : 'text-orange-600'}`}>
                              {parsedData ? '✓ Parsed Successfully' : '⚠ Parsing...'}
                            </span>
                          </div>
                          {parsedData && (
                            <>
                              <div className="flex justify-between">
                                <span>Rows Found:</span>
                                <span className="font-medium text-foreground">
                                  {parsedData.rowCount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Columns Found:</span>
                                <span className="font-medium text-foreground">
                                  {parsedData.columnCount}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

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

                  {/* Button Status Card */}
                  {(!projectName || !parsedData) && (
                    <Card className="border-orange-500/20 bg-orange-500/5">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-sm mb-1">Action Required:</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {!projectName && (
                                <li className="flex items-center gap-2">
                                  <X className="h-4 w-4 text-red-500" />
                                  Enter a dataset name above
                                </li>
                              )}
                              {!parsedData && (
                                <li className="flex items-center gap-2">
                                  <X className="h-4 w-4 text-red-500" />
                                  Wait for file to finish parsing
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!projectName || isProcessing || !parsedData}
                    onClick={handleProcess}
                  >
                    {isProcessing ? "Processing..." : "Process & Analyze Dataset"}
                  </Button>

                  {parsedData && uploadedFile && (
                    <TemplateSuggestions
                      suggestedTemplateIds={suggestTemplates(uploadedFile.name, parsedData.headers || [])}
                    />
                  )}
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
      </MainLayout>
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </AuthGuard>
  );
}
