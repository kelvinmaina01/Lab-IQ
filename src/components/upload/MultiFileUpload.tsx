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
    'text/tab-separated-values'
];

const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.json', '.tsv', '.txt', '.hl7'];

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

    const addFiles = useCallback((files: File[]) => {
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

        const filesToAdd = files.slice(0, remainingSlots);
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

            // Upload to storage
            const filePath = `${userId}/${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}_${Date.now()}.${file.name.split('.').pop()}`;

            const { error: uploadError } = await supabase.storage
                .from('datasets')
                .upload(filePath, file, { upsert: false });

            if (uploadError) throw uploadError;

            // Update progress - parsing
            setFileQueue(prev => prev.map(f =>
                f.id === id ? { ...f, progress: 40, currentStep: 'Parsing file...' } : f
            ));

            // Parse file
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

            // Analyze for health data
            setFileQueue(prev => prev.map(f =>
                f.id === id ? { ...f, progress: 60, currentStep: 'Detecting health data patterns...' } : f
            ));

            const healthMetadata = analyzeHealthData(columns, rows);

            // Update PHI detection
            setFileQueue(prev => prev.map(f =>
                f.id === id ? { ...f, phiDetected: healthMetadata.phiFields.length > 0 } : f
            ));

            // Detect schema
            setFileQueue(prev => prev.map(f =>
                f.id === id ? { ...f, progress: 75, currentStep: 'Creating dataset...' } : f
            ));

            const schema: Record<string, string> = {};
            columns.forEach(column => {
                const samples = rows.slice(0, 100).map(row => row[column]).filter(v => v != null);
                if (samples.length === 0) {
                    schema[column] = 'text';
                } else if (samples.every(v => !isNaN(parseFloat(v)))) {
                    schema[column] = 'numeric';
                } else if (samples.every(v => !isNaN(Date.parse(v)))) {
                    schema[column] = 'date';
                } else {
                    schema[column] = 'text';
                }
            });

            // Create dataset record
            const { data: dataset, error: datasetError } = await supabase
                .from('datasets')
                .insert({
                    user_id: userId,
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    file_name: file.name,
                    file_path: filePath,
                    file_size: file.size,
                    file_type: file.name.split('.').pop() || 'unknown',
                    row_count: rows.length,
                    column_count: columns.length,
                    columns_info: schema,
                    status: 'ready',
                    metadata: {
                        healthMetadata,
                        uploadedAt: new Date().toISOString()
                    }
                })
                .select()
                .single();

            if (datasetError) throw datasetError;

            // Complete
            setFileQueue(prev => prev.map(f =>
                f.id === id ? {
                    ...f,
                    status: 'complete',
                    progress: 100,
                    currentStep: 'Complete!',
                    datasetId: dataset.id
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
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-2">
                                {fileQueue.map((fileState) => {
                                    const FileIcon = getFileIcon(fileState.file);

                                    return (
                                        <div
                                            key={fileState.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border ${fileState.status === 'complete' ? 'bg-green-50 border-green-200 dark:bg-green-950/20' :
                                                    fileState.status === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-950/20' :
                                                        fileState.status === 'uploading' || fileState.status === 'processing' ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20' :
                                                            'bg-muted/30'
                                                }`}
                                        >
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
                                                    <span className="font-medium truncate">{fileState.file.name}</span>
                                                    {fileState.isHealthFormat && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {fileState.healthFormat}
                                                        </Badge>
                                                    )}
                                                    {fileState.phiDetected && (
                                                        <Badge variant="destructive" className="text-xs">
                                                            <Shield className="h-3 w-3 mr-1" />
                                                            PHI
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{formatFileSize(fileState.file.size)}</span>
                                                    <span>•</span>
                                                    <span>{fileState.currentStep}</span>
                                                </div>
                                                {(fileState.status === 'uploading' || fileState.status === 'processing') && (
                                                    <Progress value={fileState.progress} className="h-1 mt-2" />
                                                )}
                                                {fileState.status === 'error' && fileState.error && (
                                                    <p className="text-xs text-red-500 mt-1">{fileState.error}</p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex-shrink-0">
                                                {fileState.status === 'pending' && !isUploading && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeFile(fileState.id)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {fileState.status === 'complete' && fileState.datasetId && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => window.location.href = `/dashboard/datasets/${fileState.datasetId}`}
                                                    >
                                                        View
                                                        <ArrowRight className="h-4 w-4 ml-1" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>

                        {/* Actions */}
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

                            {!isUploading && (
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={fileQueue.length >= MAX_FILES}
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
