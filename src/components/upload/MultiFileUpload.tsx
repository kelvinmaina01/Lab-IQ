/**
 * MultiFileUpload Component - Enhanced for Health Data
 * Supports batch upload with individual progress, EHR format detection, and PHI awareness
 */

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    ArrowRight,
    X,
    FileSpreadsheet,
    Shield,
    Activity,
    Plus,
    Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { detectHealthFileFormat, analyzeHealthData } from "@/lib/parsers/healthDataTypes";
import JSZip from "jszip";
import { datasetService } from "@/lib/services/datasetService";
import { csvParser } from "@/lib/parsers/csvParser";
import { excelParser } from "@/lib/parsers/excelParser";
import { jsonParser } from "@/lib/parsers/jsonParser";

// =============================================================================
// TYPES
// =============================================================================

interface FileUploadState {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
    progress: number;
    currentStep: string;
    datasetId?: string;
    error?: string;
    healthFormat?: string;
    isHealthFormat?: boolean;
    phiDetected?: boolean;
    domain?: string;
    qualityScore?: number;
}

interface UploadProgress {
    percentage: number;
    currentStep: string;
    eta?: string;
    uploadedBytes?: number;
    totalBytes?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_FILES = 10;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB per file
const CONCURRENT_UPLOADS = 3;

const SUPPORTED_TYPES = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'text/plain',
    'text/tab-separated-values',
    'application/zip',
    'application/x-zip-compressed'
];

const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.json', '.tsv', '.txt', '.hl7', '.zip'];

// =============================================================================
// COMPONENT
// =============================================================================

export function MultiFileUpload() {
    const [fileQueue, setFileQueue] = useState<FileUploadState[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // ---------------------------------------------------------------------------
    // FILE VALIDATION
    // ---------------------------------------------------------------------------

    const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
        // Check file type
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!SUPPORTED_TYPES.includes(file.type) && !SUPPORTED_EXTENSIONS.includes(extension)) {
            return { valid: false, error: `Unsupported file type: ${file.type || extension}` };
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return { valid: false, error: `File too large. Maximum size is 100MB.` };
        }

        // Check if already in queue
        if (fileQueue.some(f => f.file.name === file.name && f.file.size === file.size)) {
            return { valid: false, error: `File already in queue` };
        }

        return { valid: true };
    }, [fileQueue]);

    // ---------------------------------------------------------------------------
    // FILE HANDLERS
    // ---------------------------------------------------------------------------

    const addFiles = useCallback(async (files: File[]) => {
        const currentCount = fileQueue.length;
        const remainingSlots = MAX_FILES - currentCount;

        if (remainingSlots <= 0) {
            toast({
                title: "Queue full",
                description: `Maximum ${MAX_FILES} files allowed per batch.`,
                variant: "destructive"
            });
            return;
        }

        const processedFiles: File[] = [];

        for (const file of files) {
            const extension = '.' + file.name.split('.').pop()?.toLowerCase();
            if (extension === '.zip') {
                try {
                    toast({
                        title: "Extracting zip",
                        description: `Unzipping ${file.name}...`
                    });
                    const zip = new JSZip();
                    const contents = await zip.loadAsync(file);
                    const zipFiles: File[] = [];

                    for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
                        if (zipEntry.dir) continue;

                        const fileName = relativePath.split('/').pop() || zipEntry.name;
                        const zipExt = '.' + fileName.split('.').pop()?.toLowerCase();

                        if (SUPPORTED_EXTENSIONS.includes(zipExt) && zipExt !== '.zip') {
                            const blob = await zipEntry.async("blob");
                            const unzippedFile = new File([blob], fileName, {
                                type: getMimeType(zipExt)
                            });
                            zipFiles.push(unzippedFile);
                        }
                    }
                    processedFiles.push(...zipFiles);
                } catch (error) {
                    console.error("Zip extraction error:", error);
                    toast({
                        title: "Extraction failed",
                        description: `Could not unzip ${file.name}`,
                        variant: "destructive"
                    });
                }
            } else {
                processedFiles.push(file);
            }
        }

        const filesToAdd = processedFiles.slice(0, remainingSlots);
        const newFileStates: FileUploadState[] = [];

        for (const file of filesToAdd) {
            const validation = validateFile(file);
            if (!validation.valid) {
                toast({
                    title: "Invalid file",
                    description: `${file.name}: ${validation.error}`,
                    variant: "destructive"
                });
                continue;
            }

            // Detect health format
            const formatInfo = detectHealthFileFormat(file);

            newFileStates.push({
                id: crypto.randomUUID(),
                file,
                status: 'pending',
                progress: 0,
                currentStep: 'Ready to upload',
                healthFormat: formatInfo.format,
                isHealthFormat: formatInfo.isHealthFormat
            });
        }

        if (newFileStates.length > 0) {
            setFileQueue(prev => [...prev, ...newFileStates]);
            toast({
                title: "Files added",
                description: `${newFileStates.length} file(s) added to queue.`
            });
        }
    }, [fileQueue, validateFile, toast]);

    const getMimeType = (extension: string) => {
        const types: Record<string, string> = {
            '.csv': 'text/csv',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel',
            '.json': 'application/json',
            '.tsv': 'text/tab-separated-values',
            '.txt': 'text/plain',
            '.hl7': 'text/plain'
        };
        return types[extension] || 'application/octet-stream';
    };

    const removeFile = useCallback((fileId: string) => {
        setFileQueue(prev => prev.filter(f => f.id !== fileId));
    }, []);

    const clearQueue = useCallback(() => {
        setFileQueue([]);
    }, []);

    // ---------------------------------------------------------------------------
    // DRAG & DROP HANDLERS
    // ---------------------------------------------------------------------------

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            addFiles(files);
        }
    }, [addFiles]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    // ---------------------------------------------------------------------------
    // UPLOAD LOGIC
    // ---------------------------------------------------------------------------

    const uploadSingleFile = async (fileState: FileUploadState, userId: string): Promise<void> => {
        const { file, id } = fileState;

        try {
            // Update status to uploading
            setFileQueue(prev => prev.map(f =>
                f.id === id ? { ...f, status: 'uploading', currentStep: 'Uploading...', progress: 10 } : f
            ));

            // Parse file properly using our parsers
            let parseResult;
            const extension = '.' + file.name.split('.').pop()?.toLowerCase();

            if (extension === '.csv') {
                parseResult = await csvParser.parse(file);
            } else if (extension === '.xlsx' || extension === '.xls') {
                parseResult = await excelParser.parse(file);
            } else if (extension === '.json') {
                parseResult = await jsonParser.parse(file);
            } else {
                // Fallback for .txt or other types
                const text = await file.text();
                const lines = text.split('\n').filter(l => l.trim());
                const columns = lines[0]?.split(',').map(c => c.trim().replace(/"/g, '')) || [];
                const rows = lines.slice(1).map(line => {
                    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                    const row: Record<string, any> = {};
                    columns.forEach((col, idx) => {
                        row[col] = values[idx] || null;
                    });
                    return row;
                });
                parseResult = {
                    success: true,
                    data: {
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: extension.slice(1),
                        rowCount: rows.length,
                        columnCount: columns.length,
                        rows,
                        columns: columns.map((name, index) => ({
                            name,
                            index,
                            dataType: 'string',
                            nullable: true,
                            uniqueValues: 0,
                            sampleValues: []
                        }))
                    }
                };
            }

            if (!parseResult || !parseResult.success || !parseResult.data) {
                throw new Error(parseResult?.error || 'Failed to parse file');
            }

            // Save using DatasetService for full consistency
            const datasetId = await datasetService.saveDataset(
                userId,
                parseResult.data,
                file, // rawFile is now 3rd arg
                (progress, message) => {
                    setFileQueue(prev => prev.map(f =>
                        f.id === id ? { ...f, progress: 40 + (progress * 0.6), currentStep: message } : f
                    ));
                },
                {
                    healthFormat: fileState.healthFormat,
                    isHealthFormat: fileState.isHealthFormat
                }
            );

            // Fetch metadata for feedback
            const { data: datasetInfo } = await supabase
                .from('datasets')
                .select('domain, quality_score')
                .eq('id', datasetId)
                .single();

            // Complete
            setFileQueue(prev => prev.map(f =>
                f.id === id ? {
                    ...f,
                    status: 'complete',
                    progress: 100,
                    currentStep: 'Uploaded & Indexed!',
                    datasetId: datasetId,
                    domain: datasetInfo?.domain,
                    qualityScore: datasetInfo?.quality_score
                } : f
            ));

        } catch (error) {
            console.error(`Upload error for ${file.name}:`, error);
            setFileQueue(prev => prev.map(f =>
                f.id === id ? {
                    ...f,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Upload failed',
                    currentStep: 'Failed'
                } : f
            ));
        }
    };

    const startUploadAll = async () => {
        const pendingFiles = fileQueue.filter(f => f.status === 'pending');
        if (pendingFiles.length === 0) return;

        setIsUploading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Not authenticated');
            }

            // Process files in batches with concurrency limit
            for (let i = 0; i < pendingFiles.length; i += CONCURRENT_UPLOADS) {
                const batch = pendingFiles.slice(i, i + CONCURRENT_UPLOADS);
                await Promise.all(batch.map(f => uploadSingleFile(f, user.id)));
            }

            const successCount = fileQueue.filter(f => f.status === 'complete').length;
            const errorCount = fileQueue.filter(f => f.status === 'error').length;

            toast({
                title: "Upload complete",
                description: `${successCount} succeeded, ${errorCount} failed.`
            });

        } catch (error) {
            toast({
                title: "Upload failed",
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    // ---------------------------------------------------------------------------
    // HELPERS
    // ---------------------------------------------------------------------------

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    const getFileIcon = (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'xlsx' || ext === 'xls') return FileSpreadsheet;
        if (ext === 'json') return Database;
        if (ext === 'hl7') return Activity;
        return FileText;
    };

    const pendingCount = fileQueue.filter(f => f.status === 'pending').length;
    const completedCount = fileQueue.filter(f => f.status === 'complete').length;
    const errorCount = fileQueue.filter(f => f.status === 'error').length;
    const totalProgress = fileQueue.length > 0
        ? fileQueue.reduce((sum, f) => sum + f.progress, 0) / fileQueue.length
        : 0;

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Upload Health Data
                    {fileQueue.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                            {fileQueue.length} file{fileQueue.length !== 1 ? 's' : ''}
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription>
                    Upload multiple CSV, Excel, or health data files with automatic EHR pattern detection
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Drop Zone */}
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                        }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-1">
                        Drop files here or click to browse
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        Supports CSV, Excel, JSON, HL7, and TSV • Up to {MAX_FILES} files • 100MB max each
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        <span>Automatic PHI detection for compliance awareness</span>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={SUPPORTED_EXTENSIONS.join(',')}
                        className="hidden"
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) addFiles(files);
                            e.target.value = '';
                        }}
                    />
                </div>

                {/* File Queue */}
                {fileQueue.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Upload Queue</h4>
                            <div className="flex items-center gap-2">
                                {completedCount > 0 && (
                                    <Badge variant="default" className="bg-green-500">
                                        {completedCount} complete
                                    </Badge>
                                )}
                                {errorCount > 0 && (
                                    <Badge variant="destructive">
                                        {errorCount} failed
                                    </Badge>
                                )}
                                {!isUploading && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearQueue}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Overall Progress */}
                        {isUploading && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Overall Progress</span>
                                    <span>{totalProgress.toFixed(0)}%</span>
                                </div>
                                <Progress value={totalProgress} className="h-2" />
                            </div>
                        )}

                        {/* File List */}
                        <ScrollArea className="h-[350px] pr-4">
                            <div className="space-y-2">
                                {fileQueue.map((fileState) => {
                                    const FileIcon = getFileIcon(fileState.file);

                                    return (
                                        <div
                                            key={fileState.id}
                                            className={`p-3 rounded-lg border transition-colors ${fileState.status === 'complete' ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20' :
                                                fileState.status === 'error' ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20' :
                                                    fileState.status === 'uploading' || fileState.status === 'processing' ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20' :
                                                        'bg-muted/30 border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Icon */}
                                                <div className="flex-shrink-0">
                                                    {fileState.status === 'uploading' || fileState.status === 'processing' ? (
                                                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                                                    ) : fileState.status === 'complete' ? (
                                                        <CheckCircle className="h-8 w-8 text-green-500" />
                                                    ) : fileState.status === 'error' ? (
                                                        <AlertCircle className="h-8 w-8 text-red-500" />
                                                    ) : (
                                                        <FileIcon className="h-8 w-8 text-muted-foreground" />
                                                    )}
                                                </div>

                                                {/* File Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold truncate text-sm">{fileState.file.name}</span>
                                                        {fileState.isHealthFormat && (
                                                            <Badge variant="outline" className="text-[10px] py-0">
                                                                {fileState.healthFormat}
                                                            </Badge>
                                                        )}
                                                        {fileState.phiDetected && (
                                                            <Badge variant="destructive" className="text-[10px] py-0">
                                                                <Shield className="h-2.5 w-2.5 mr-1" />
                                                                PHI
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                        <span>{formatFileSize(fileState.file.size)}</span>
                                                        <span>•</span>
                                                        <span>{fileState.currentStep}</span>
                                                        {fileState.status === 'complete' && fileState.qualityScore !== undefined && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-green-600 font-bold">Quality: {Math.round(fileState.qualityScore)}%</span>
                                                            </>
                                                        )}
                                                        {fileState.status === 'complete' && fileState.domain && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="capitalize text-blue-600 px-1.5 py-0 bg-blue-50 border border-blue-100 rounded text-[10px] font-medium">
                                                                    {fileState.domain}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex-shrink-0 flex items-center gap-2">
                                                    {fileState.status === 'pending' && !isUploading && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                            onClick={() => removeFile(fileState.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {fileState.status === 'complete' && fileState.datasetId && (
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="h-8 gap-1"
                                                            onClick={() => window.location.href = `/dashboard/datasets/${fileState.datasetId}`}
                                                        >
                                                            View
                                                            <ArrowRight className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {(fileState.status === 'uploading' || fileState.status === 'processing') && (
                                                <div className="mt-2 pl-11">
                                                    <Progress value={fileState.progress} className="h-1" />
                                                </div>
                                            )}
                                            {fileState.status === 'error' && fileState.error && (
                                                <p className="text-[10px] text-red-500 mt-1 pl-11">{fileState.error}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>

                        {/* Queue Actions */}
                        <div className="flex gap-3">
                            <Button
                                onClick={startUploadAll}
                                disabled={pendingCount === 0 || isUploading}
                                className="flex-1"
                                size="lg"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload {pendingCount} File{pendingCount !== 1 ? 's' : ''}
                                    </>
                                )}
                            </Button>

                            {!isUploading && fileQueue.length < MAX_FILES && (
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add More
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Health Data Info */}
                {fileQueue.length === 0 && (
                    <Alert>
                        <Activity className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Optimized for Health Data:</strong>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                                <li>Auto-detects EHR fields (MRN, ICD-10, CPT, LOINC codes)</li>
                                <li>Identifies PHI fields for compliance awareness</li>
                                <li>Supports standard health file formats (CSV, HL7, FHIR)</li>
                                <li>Batch upload up to {MAX_FILES} files simultaneously</li>
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}

export default MultiFileUpload;
