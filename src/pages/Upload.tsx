import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload as UploadIcon, FileText, HardDrive, Clock, AlertCircle, Shield, Database, Boxes, Check, X, CheckCircle2, ArrowRight, Activity, TrendingUp, Search, Info } from "lucide-react";
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
import { ResourceUsageRow } from "@/components/upload/ResourceUsageRow";
import { supabase } from "@/integrations/supabase/client";
import { TemplateSuggestions } from "@/components/upload/TemplateSuggestions";
import type { TemplateRecommendation } from "@/lib/types/templates";
import { EnhancedFileUpload } from "@/components/upload/EnhancedFileUpload";
import { MultiFileUpload } from "@/components/upload/MultiFileUpload";
import { UploadJobMonitor } from "@/components/upload/UploadJobMonitor";
import { UploadStatistics } from "@/components/upload/UploadStatistics";
import JSZip from "jszip";

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  // AI Recommendations state
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls', '.json', '.zip'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: "Please upload CSV, Excel, JSON, or ZIP files",
        variant: "destructive"
      });
      return;
    }

    if (fileExtension === '.zip') {
      try {
        setIsProcessing(true);
        setProgressMessage("Extracting ZIP...");

        const zip = new JSZip();
        const contents = await zip.loadAsync(file);

        // Find the first valid data file in the zip
        let dataFile: File | null = null;
        for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
          if (zipEntry.dir) continue;

          const fileName = relativePath.split('/').pop() || zipEntry.name;
          const zipExt = '.' + fileName.split('.').pop()?.toLowerCase();
          const supportedDataExts = ['.csv', '.xlsx', '.xls', '.json'];

          if (supportedDataExts.includes(zipExt)) {
            const blob = await zipEntry.async("blob");
            dataFile = new File([blob], fileName, { type: getMimeType(zipExt) });
            break; // Just take the first one for legacy/single upload
          }
        }

        if (!dataFile) {
          throw new Error("No supported data files (.csv, .xlsx, .json) found in ZIP");
        }

        file = dataFile;
        const newExt = '.' + file.name.split('.').pop()?.toLowerCase();
        // Update local variables for subsequent logic
        // (Note: we continue with 'file' being the extracted file)
      } catch (error: any) {
        toast({
          title: "ZIP extraction failed",
          description: error.message || "Could not extract data from ZIP",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
    }

    setUploadedFile(file);
    const finalExt = '.' + file.name.split('.').pop()?.toLowerCase();

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

      if (finalExt === '.csv') {
        const { csvParser } = await import("@/lib/parsers/csvParser");
        result = await csvParser.parse(file);
      } else if (finalExt === '.xlsx' || finalExt === '.xls') {
        const { excelParser } = await import("@/lib/parsers/excelParser");
        result = await excelParser.parse(file);
      } else if (finalExt === '.json') {
        const { jsonParser } = await import("@/lib/parsers/jsonParser");
        result = await jsonParser.parse(file);
      }

      if (result && result.success && result.data) {
        setParsedData(result.data);
        toast({
          title: "File parsed successfully",
          description: `Found ${result.data.rowCount} rows and ${result.data.columnCount} columns`
        });
        // AI recommendations will be triggered AFTER upload completes
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

  const getMimeType = (extension: string) => {
    const types: Record<string, string> = {
      '.csv': 'text/csv',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.json': 'application/json'
    };
    return types[extension] || 'application/octet-stream';
  };

  // Fetch AI-powered template recommendations
  const fetchAIRecommendations = async (fileName: string, data: any) => {
    setRecommendationsLoading(true);
    setRecommendationsError(null);

    try {
      const { suggestTemplatesWithAI } = await import('@/lib/utils/templateSuggestions');

      // Build context with column info and sample data
      const context = {
        fileName,
        columns: (data.columns || []).map((col: any) => ({
          name: col.name,
          type: col.dataType,
          sampleValues: col.sampleValues,
          uniqueCount: col.uniqueValues,
          nullCount: col.nullCount
        })),
        sampleRows: data.rows?.slice(0, 10),
        rowCount: data.rowCount,
        columnCount: data.columnCount,
        dataQuality: data.quality_score
      };

      const recommendations = await suggestTemplatesWithAI(context);
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('Failed to get AI recommendations:', error);
      setRecommendationsError('Using pattern matching for recommendations');

      // Fallback to simple pattern matching
      const { suggestTemplates } = await import('@/lib/utils/templateSuggestions');
      const simpleIds = suggestTemplates(fileName, data.headers || []);
      setAiRecommendations(simpleIds.map(id => ({
        id,
        confidence: 0.5,
        reasoning: 'Matched based on filename and column patterns'
      })));
    } finally {
      setRecommendationsLoading(false);
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
        uploadedFile,
        (progress, message) => {
          console.log(`Progress: ${progress}% - ${message}`);
          setUploadProgress(progress);
          setProgressMessage(message);
        }
      );

      console.log('Dataset saved with ID:', datasetId);

      // Fetch the full dataset details for the summary
      const { data: fullDataset } = await supabase
        .from('datasets')
        .select('*')
        .eq('id', datasetId)
        .single();

      if (fullDataset) {
        setSuccessData(fullDataset);
        setShowSuccess(true);
      }

      toast({
        title: "Success!",
        description: "Dataset uploaded and processed successfully."
      });

      // Trigger AI recommendations AFTER successful upload
      if (uploadedFile && parsedData) {
        fetchAIRecommendations(uploadedFile.name, parsedData);
      }

    } catch (error: any) {
      console.error("Processing error:", error);
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

  const SuccessSummary = ({ data }: { data: any }) => (
    <Card className="border-2 border-green-500/20 bg-green-50/10 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <CheckCircle2 className="w-32 h-32 text-green-600" />
      </div>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-green-900">Ingestion Successful!</CardTitle>
            <CardDescription className="text-green-700">Dataset is now indexed and ready for analysis</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/50 border-green-100">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="p-2 bg-blue-50 rounded-lg mb-2">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Detected Domain</span>
              <p className="text-xl font-bold text-slate-900 mt-1 capitalize">{data.domain || 'General'}</p>
              <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-700 hover:bg-blue-100">
                {data.domain === 'clinical' ? 'High Precision' : 'Standard'}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-white/50 border-green-100">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="p-2 bg-green-50 rounded-lg mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Quality Score</span>
              <p className="text-3xl font-bold text-slate-900 mt-1">{Math.round(data.quality_score || 0)}%</p>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-1000"
                  style={{ width: `${data.quality_score || 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 border-green-100">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="p-2 bg-slate-50 rounded-lg mb-2">
                <Database className="h-5 w-5 text-slate-600" />
              </div>
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Statistics</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{data.row_count?.toLocaleString() || 0} Rows</p>
              <p className="text-sm text-muted-foreground">{data.column_count || 0} Columns</p>
              <div className="mt-2 flex gap-1">
                {data.is_anonymized && (
                  <Badge variant="outline" className="text-[10px] py-0 bg-indigo-50 text-indigo-700 border-indigo-100">
                    <Shield className="w-2.5 h-2.5 mr-1" /> PHI Safe
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Agent Findings (The Brain Results) */}
        {data.metadata?.aiInsights && (
          <div className="bg-white/50 border border-indigo-100 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-indigo-900 border-b border-indigo-50 pb-2">
              <Shield className="h-4 w-4" />
              <h4 className="font-bold text-sm">AI Agent Diagnosis & Treatment</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Logic & Screening</p>
                {data.metadata.aiInsights.domain_analysis?.logic_errors?.length > 0 ? (
                  <div className="space-y-1">
                    {data.metadata.aiInsights.domain_analysis.logic_errors.map((err: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50/50 p-2 rounded">
                        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> No logic errors detected
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">AI Diagnosis (Anomalies)</p>
                {data.metadata.aiInsights.data_profile?.anomaly_classification?.ai_detected_count > 0 ? (
                  <div className="flex items-center gap-2 p-2 bg-indigo-50/50 rounded text-indigo-700">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs font-bold">
                      {data.metadata.aiInsights.data_profile.anomaly_classification.ai_detected_count} AI Anomalies Flagged
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> No multivariale anomalies found
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-green-100">
          <Button
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
            onClick={() => window.location.href = `/dashboard/datasets/${data.id}`}
          >
            Explore Dataset
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12 text-lg border-green-200"
            onClick={() => {
              setShowSuccess(false);
              setUploadedFile(null);
              setParsedData(null);
              setProjectName("");
            }}
          >
            Upload Another
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AuthGuard>
      <MainLayout>
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          {/* Unified Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl shadow-sm">
                <Database className="h-7 w-7 text-primary" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                  Data Ingestion Hub
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  Enterprise-grade data pipeline • Secure • Compliant • Scalable
                </p>
              </div>
            </div>
            <ResourceUsageRow />
          </div>

          {/* Compliance Indicators */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>HIPAA COMPLIANT</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span>GMP VERIFIED</span>
            </div>
          </div>

          {/* Sample Dataset CTA */}
          <SampleDatasetCTA />

          {/* Analysis CTA */}


          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="manual">Manual Upload</TabsTrigger>
              <TabsTrigger value="devices">IoT & Device Streams</TabsTrigger>
              <TabsTrigger value="connect">Cloud Sources</TabsTrigger>
              <TabsTrigger value="metadata">Dataset Registry</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-6 mt-6">
              <Tabs defaultValue="health" className="w-full">
                <div className="flex justify-center mb-8">
                  <TabsList className="w-full max-w-md grid grid-cols-2">
                    <TabsTrigger value="health">Health Data Pipeline</TabsTrigger>
                    <TabsTrigger value="standard">Standard Upload</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="health" className="space-y-6">
                  {/* Beautiful Explanation for Health Data */}
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
                    <CardContent className="pt-6 pb-6 px-6 md:px-8">
                      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-blue-100 shrink-0">
                          <Shield className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                            Optimized for Health Data
                            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">HIPAA Ready</Badge>
                          </h3>
                          <p className="text-blue-800/80 leading-relaxed max-w-2xl">
                            This pipeline is specifically engineered for sensitive medical and research data.
                            It automatically applies <span className="font-semibold">advanced PII detection</span> and <span className="font-semibold">anonymization algorithms</span> before processing, ensuring your data remains compliant and secure by design.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Upload Statistics */}
                  <UploadStatistics />

                  {/* Multi-File Upload with Health Data Detection */}
                  <MultiFileUpload />

                  {/* Single File Upload (Alternative) */}
                  <EnhancedFileUpload />

                  {/* Upload Job Monitor */}
                  <UploadJobMonitor />
                </TabsContent>

                <TabsContent value="standard" className="space-y-6">
                  {/* Legacy Content Wrapper */}

                  {/* End Legacy Content Wrapper */}
                </TabsContent>
              </Tabs>
            </TabsContent>

            <div className="hidden">
              {showSuccess ? (
                <SuccessSummary data={successData} />
              ) : (
                <div className="space-y-6">
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
                        data-tour="upload-zone"
                      >
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          onChange={handleChange}
                          accept=".csv,.xlsx,.xls,.json,.zip"
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
                                Supports CSV, Excel, JSON, ZIP • Max {subscription?.storage_limit_mb || 200}MB
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

                      disabled={isProcessing || !parsedData || !projectName}
                      onClick={handleProcess}
                    >
                      {isProcessing ? "Processing..." : "Upload Dataset"}
                    </Button>
                  </div>
                </div>
              )}

            <TemplateSuggestions
              recommendations={aiRecommendations}
              loading={recommendationsLoading}
              error={recommendationsError}
            />

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
        </Tabs>
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
    </Tabs >
    </main >
      </MainLayout >
    <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </AuthGuard >
  );
}
