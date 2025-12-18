import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Upload,
    File,
    FileText,
    FileSpreadsheet,
    FileCode,
    Image as ImageIcon,
    Download,
    Eye,
    Trash2,
    Search,
    Filter,
    Clock,
    User,
    X,
    FileVideo,
    FileArchive
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useServices } from '@/core/ServiceProvider';
import { SharedFile } from '@/core/interfaces';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface FileSharingProps {
    projectId?: string;
    projectName?: string;
}

// File preview modal component
const FilePreviewModal = ({ file, open, onOpenChange }: { file: SharedFile | null; open: boolean; onOpenChange: (open: boolean) => void }) => {
  if (!file) return null;

  const isImage = file.mime_type?.startsWith('image/');
  const isVideo = file.mime_type?.startsWith('video/');
  const isText = file.mime_type?.includes('text') || file.mime_type?.includes('json');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileIcon category={file.category} />
            {file.name}
          </DialogTitle>
          <DialogDescription>
            Uploaded by {file.uploader?.display_name || 'Unknown'} • {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex-1 overflow-auto bg-muted/30 rounded-lg p-4">
          {isImage && (
            <img src={file.storage_path} alt={file.name} className="max-w-full h-auto mx-auto rounded-lg shadow-lg" />
          )}
          {isVideo && (
            <video controls className="max-w-full h-auto mx-auto rounded-lg shadow-lg">
              <source src={file.storage_path} type={file.mime_type} />
              Your browser does not support video playback.
            </video>
          )}
          {!isImage && !isVideo && (
            <div className="text-center py-12">
              <FileIcon category={file.category} className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download to view
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {formatFileSize(file.size_bytes)} • {file.downloads} downloads
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FileIcon = ({ category, className }: { category: string; className?: string }) => {
  const iconClass = className || "w-6 h-6";
  switch (category) {
    case 'dataset': return <FileSpreadsheet className={iconClass} />;
    case 'report': return <FileText className={iconClass} />;
    case 'code': return <FileCode className={iconClass} />;
    case 'image': return <ImageIcon className={iconClass} />;
    case 'video': return <FileVideo className={iconClass} />;
    case 'archive': return <FileArchive className={iconClass} />;
    default: return <File className={iconClass} />;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const FileSharing: React.FC<FileSharingProps> = ({
    projectId,
    projectName
}) => {
    const { collaboration } = useServices();
    const [files, setFiles] = useState<SharedFile[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategories, setFilterCategories] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Fetch Files
    useEffect(() => {
        if (!projectId) return;
        fetchFiles();
    }, [projectId]);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const { data } = await collaboration.getFiles(projectId!);
            if (data) setFiles(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load files");
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'dataset': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
            case 'report': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
            case 'code': return 'bg-green-500/10 text-green-600 dark:text-green-400';
            case 'image': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
            case 'video': return 'bg-pink-500/10 text-pink-600 dark:text-pink-400';
            case 'archive': return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
            default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !projectId) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            const labId = '00000000-0000-0000-0000-000000000001';

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const { data, error } = await collaboration.uploadFile(file, projectId, labId);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (error) throw error;

            if (data) {
                setFiles([data, ...files]);
                toast.success(`${file.name} uploaded successfully`);
            }

            setTimeout(() => {
                setUploadProgress(0);
            }, 1000);
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload file");
        } finally {
            setUploading(false);
        }
    };

    const handlePreview = (file: SharedFile) => {
        setPreviewFile(file);
        setPreviewOpen(true);
    };

    const handleDownload = (file: SharedFile) => {
        toast.info(`Downloading ${file.name}...`);
        // Implement real download using signed URLs
    };

    const handleDelete = async (fileId: string) => {
        try {
            const { error } = await collaboration.deleteFile(fileId);
            if (error) throw error;

            setFiles(files.filter(f => f.id !== fileId));
            toast.success('File deleted successfully');
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete file");
        }
    };

    const toggleCategory = (category: string) => {
        setFilterCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const filteredFiles = files.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategories.length === 0 || filterCategories.includes(file.category);
        return matchesSearch && matchesCategory;
    });

    const categories = ['dataset', 'report', 'code', 'image', 'video', 'archive'];

    if (loading && files.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-background to-muted/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Upload className="w-5 h-5 text-primary" />
                                </div>
                                File Sharing
                                <Badge variant="secondary" className="text-sm">
                                    {files.length} files
                                </Badge>
                            </CardTitle>
                            {projectName && (
                                <CardDescription className="mt-2">
                                    Project: {projectName}
                                </CardDescription>
                            )}
                        </div>

                        <label htmlFor="file-upload">
                            <Button className="gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all" asChild disabled={uploading}>
                                <span>
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    Upload File
                                </span>
                            </Button>
                            <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </label>
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                        <div className="mt-4 space-y-2 animate-in slide-in-from-top-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Uploading...</span>
                                <span className="font-semibold">{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2" />
                        </div>
                    )}
                </CardHeader>

                <CardContent className="p-6">
                    {/* Search and Filter */}
                    <div className="flex gap-3 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 min-w-[120px]">
                                    <Filter className="w-4 h-4" />
                                    Filter
                                    {filterCategories.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 px-1.5 text-xs">
                                            {filterCategories.length}
                                        </Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {categories.map(category => (
                                    <DropdownMenuCheckboxItem
                                        key={category}
                                        checked={filterCategories.includes(category)}
                                        onCheckedChange={() => toggleCategory(category)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FileIcon category={category} className="w-4 h-4" />
                                            <span className="capitalize">{category}</span>
                                        </div>
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Files Grid */}
                    <div className={cn(
                        "gap-4",
                        viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "space-y-3"
                    )}>
                        {filteredFiles.map((file) => (
                            <Card
                                key={file.id}
                                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
                                onClick={() => handlePreview(file)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-4 relative">
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "p-3 rounded-xl shadow-sm transition-all group-hover:scale-110",
                                            getCategoryColor(file.category)
                                        )}>
                                            <FileIcon category={file.category} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm mb-1 truncate group-hover:text-primary transition-colors">
                                                {file.name}
                                            </h4>

                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                                <span>{formatFileSize(file.size_bytes)}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Download className="w-3 h-3" />
                                                    {file.downloads}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-5 h-5 ring-1 ring-background">
                                                    <AvatarImage src={file.uploader?.avatar_url} />
                                                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/5">
                                                        {file.uploader?.display_name?.[0] || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {file.uploader?.display_name || 'Unknown'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">•</span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePreview(file);
                                                }}>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Preview
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownload(file);
                                                }}>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(file.id);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {filteredFiles.length === 0 && (
                        <div className="text-center py-16 animate-in fade-in duration-300">
                            <div className="p-4 bg-muted/20 rounded-full w-fit mx-auto mb-4">
                                <Upload className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No files found</h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                {searchQuery || filterCategories.length > 0
                                    ? 'Try adjusting your search or filters'
                                    : 'Upload your first file to get started!'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* File Preview Modal */}
            <FilePreviewModal
                file={previewFile}
                open={previewOpen}
                onOpenChange={setPreviewOpen}
            />
        </>
    );
};
