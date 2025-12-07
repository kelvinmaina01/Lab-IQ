import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
    User
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface SharedFile {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadedBy: string;
    uploadedByAvatar: string;
    uploadedAt: string;
    downloads: number;
    category: 'dataset' | 'report' | 'code' | 'image' | 'other';
}

interface FileSharingProps {
    projectId?: string;
    projectName?: string;
}

export const FileSharing: React.FC<FileSharingProps> = ({
    projectId,
    projectName
}) => {
    const [files, setFiles] = useState<SharedFile[]>([
        {
            id: '1',
            name: 'protein_analysis_v3.csv',
            type: 'text/csv',
            size: '2.4 MB',
            uploadedBy: 'Dr. Sarah Chen',
            uploadedByAvatar: '/placeholder.svg',
            uploadedAt: '2 hours ago',
            downloads: 12,
            category: 'dataset'
        },
        {
            id: '2',
            name: 'monthly_report_november.pdf',
            type: 'application/pdf',
            size: '856 KB',
            uploadedBy: 'John Smith',
            uploadedByAvatar: '/placeholder.svg',
            uploadedAt: '1 day ago',
            downloads: 8,
            category: 'report'
        },
        {
            id: '3',
            name: 'data_pipeline.py',
            type: 'text/x-python',
            size: '45 KB',
            uploadedBy: 'Emma Wilson',
            uploadedByAvatar: '/placeholder.svg',
            uploadedAt: '3 days ago',
            downloads: 5,
            category: 'code'
        },
        {
            id: '4',
            name: 'experiment_results.xlsx',
            type: 'application/vnd.ms-excel',
            size: '1.2 MB',
            uploadedBy: 'Dr. Mike Ross',
            uploadedByAvatar: '/placeholder.svg',
            uploadedAt: '5 days ago',
            downloads: 15,
            category: 'dataset'
        }
    ]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const getFileIcon = (category: string) => {
        switch (category) {
            case 'dataset':
                return FileSpreadsheet;
            case 'report':
                return FileText;
            case 'code':
                return FileCode;
            case 'image':
                return ImageIcon;
            default:
                return File;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'dataset':
                return 'bg-blue-500/10 text-blue-500';
            case 'report':
                return 'bg-purple-500/10 text-purple-500';
            case 'code':
                return 'bg-green-500/10 text-green-500';
            case 'image':
                return 'bg-orange-500/10 text-orange-500';
            default:
                return 'bg-gray-500/10 text-gray-500';
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);

        // Simulate upload progress
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setUploading(false);

                    // Add file to list
                    const newFile: SharedFile = {
                        id: Date.now().toString(),
                        name: file.name,
                        type: file.type,
                        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                        uploadedBy: 'You',
                        uploadedByAvatar: '/placeholder.svg',
                        uploadedAt: 'Just now',
                        downloads: 0,
                        category: 'other'
                    };

                    setFiles([newFile, ...files]);
                    toast.success(`${file.name} uploaded successfully`);
                    return 0;
                }
                return prev + 10;
            });
        }, 200);
    };

    const handleDownload = (file: SharedFile) => {
        setFiles(files.map(f =>
            f.id === file.id ? { ...f, downloads: f.downloads + 1 } : f
        ));
        toast.success(`Downloading ${file.name}`);
    };

    const handleDelete = (fileId: string) => {
        setFiles(files.filter(f => f.id !== fileId));
        toast.success('File deleted successfully');
    };

    const filteredFiles = files.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || file.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <Card>
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5 text-primary" />
                            File Sharing
                            <Badge variant="secondary">{files.length} files</Badge>
                        </CardTitle>
                        {projectName && (
                            <CardDescription className="mt-1">
                                Project: {projectName}
                            </CardDescription>
                        )}
                    </div>

                    <label htmlFor="file-upload">
                        <Button className="gap-2 cursor-pointer" asChild>
                            <span>
                                <Upload className="w-4 h-4" />
                                Upload File
                            </span>
                        </Button>
                        <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </label>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {/* Upload Progress */}
                {uploading && (
                    <div className="mb-6 p-4 bg-muted/50 rounded-lg animate-in fade-in-50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Uploading...</span>
                            <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                    </div>
                )}

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
                            <Button variant="outline" className="gap-2">
                                <Filter className="w-4 h-4" />
                                Filter
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setFilterCategory('all')}>
                                All Files
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterCategory('dataset')}>
                                Datasets
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterCategory('report')}>
                                Reports
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterCategory('code')}>
                                Code Files
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterCategory('image')}>
                                Images
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Files Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFiles.map((file) => {
                        const FileIcon = getFileIcon(file.category);
                        return (
                            <Card
                                key={file.id}
                                className="group hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-3 rounded-lg ${getCategoryColor(file.category)}`}>
                                            <FileIcon className="w-6 h-6" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm mb-1 truncate">
                                                {file.name}
                                            </h4>

                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                                <span>{file.size}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Download className="w-3 h-3" />
                                                    {file.downloads}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-5 h-5">
                                                    <AvatarImage src={file.uploadedByAvatar} />
                                                    <AvatarFallback className="text-xs">
                                                        {file.uploadedBy[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-muted-foreground">
                                                    {file.uploadedBy}
                                                </span>
                                                <span className="text-xs text-muted-foreground">•</span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {file.uploadedAt}
                                                </span>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleDownload(file)}>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Preview
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(file.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {filteredFiles.length === 0 && (
                    <div className="text-center py-12">
                        <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground">
                            {searchQuery || filterCategory !== 'all'
                                ? 'No files match your search'
                                : 'No files uploaded yet. Upload your first file to get started!'}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
