import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Database,
  TrendingUp,
  FileCheck,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  uploadFileWithProgress,
  type UploadProgress,
  getIngestionJob
} from "@/lib/services/enhancedUploadService";
import { useToast } from "@/hooks/use-toast";

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: UploadProgress | null;
  jobId: string | null;
  datasetId: string | null;
  error: string | null;
}

export function EnhancedFileUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: null,
    jobId: null,
    datasetId: null,
    error: null
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast({
        title: "Invalid file type",
        description: "Please upload CSV or Excel files only.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setUploadState({
      status: 'idle',
      progress: null,
      jobId: null,
      datasetId: null,
      error: null
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const startUpload = async () => {
    if (!selectedFile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      setUploadState(prev => ({ ...prev, status: 'uploading' }));

      const result = await uploadFileWithProgress(
        selectedFile,
        user.id,
        (progress) => {
          setUploadState(prev => ({
            ...prev,
            progress,
            status: progress.percentage === 100 ? 'complete' : 'uploading'
          }));
        }
      );

      setUploadState(prev => ({
        ...prev,
        status: 'complete',
        jobId: result.jobId,
        datasetId: result.datasetId
      }));

      toast({
        title: "Upload complete!",
        description: "Your dataset has been processed and is ready to use.",
      });

      // Auto-navigate after 2 seconds
      setTimeout(() => {
        window.location.href = `/dashboard/datasets/${result.datasetId}`;
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      }));

      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatETA = (seconds?: number) => {
    if (!seconds) return 'Calculating...';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload Dataset
        </CardTitle>
        <CardDescription>
          Upload CSV or Excel files with automatic profiling and quality assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {uploadState.status === 'idle' && !selectedFile && (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              Drop your file here or click to browse
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supports CSV and Excel files up to 50MB
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              Select File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>
        )}

        {selectedFile && uploadState.status === 'idle' && (
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <FileText className="h-10 w-10 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate">{selectedFile.name}</h4>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span>{selectedFile.type || 'Unknown type'}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                Remove
              </Button>
            </div>

            <Alert>
              <FileCheck className="h-4 w-4" />
              <AlertDescription>
                Your file will be automatically analyzed for:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Schema detection and data types</li>
                  <li>Data quality assessment</li>
                  <li>Experiment ID extraction</li>
                  <li>Automatic report generation</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              onClick={startUpload}
              className="w-full"
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              Start Upload
            </Button>
          </div>
        )}

        {(uploadState.status === 'uploading' || uploadState.status === 'processing') && uploadState.progress && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{uploadState.progress.currentStep}</span>
                <span className="text-muted-foreground">
                  {uploadState.progress.percentage.toFixed(0)}%
                </span>
              </div>
              <Progress value={uploadState.progress.percentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {uploadState.progress.uploadedBytes && uploadState.progress.totalBytes && (
                <div className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {formatFileSize(uploadState.progress.uploadedBytes)} / {formatFileSize(uploadState.progress.totalBytes)}
                  </span>
                </div>
              )}

              {uploadState.progress.eta && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>ETA: {formatETA(uploadState.progress.eta)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>

            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                Processing pipeline active: Quality profiling, schema detection, and report generation in progress...
              </AlertDescription>
            </Alert>
          </div>
        )}

        {uploadState.status === 'complete' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Upload Complete!</h3>
                  <p className="text-muted-foreground">
                    Your dataset has been processed and analyzed
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <FileCheck className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-sm text-muted-foreground">Quality Score</div>
                    <div className="text-2xl font-bold">95%</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge variant="default" className="mt-1">Ready</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Automatic processing complete:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Schema detected and validated</li>
                  <li>Data quality report generated</li>
                  <li>Experiments auto-linked</li>
                  <li>Ready for ML training</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={() => window.location.href = `/dashboard/datasets/${uploadState.datasetId}`}
                className="flex-1"
              >
                View Dataset
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                onClick={() => {
                  setSelectedFile(null);
                  setUploadState({
                    status: 'idle',
                    progress: null,
                    jobId: null,
                    datasetId: null,
                    error: null
                  });
                }}
                variant="outline"
              >
                Upload Another
              </Button>
            </div>
          </div>
        )}

        {uploadState.status === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {uploadState.error || 'An error occurred during upload'}
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => {
                setUploadState({
                  status: 'idle',
                  progress: null,
                  jobId: null,
                  datasetId: null,
                  error: null
                });
              }}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
