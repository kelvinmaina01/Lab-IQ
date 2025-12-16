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
import { useServices } from '@/core/ServiceProvider';
import { SharedFile } from '@/core/interfaces';
import { Loader2 } from 'lucide-react';



interface FileSharingProps {
    projectId?: string;
    projectName?: string;
}

export const FileSharing: React.FC<FileSharingProps> = ({
    projectId,
    projectName
}) => {
    const { collaboration } = useServices(); // Use Service
    const [files, setFiles] = useState<SharedFile[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

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

    const getFileIcon = (category: string) => {
        switch (category) {
            case 'dataset': return FileSpreadsheet;
            case 'report': return FileText;
            case 'code': return FileCode;
            case 'image': return ImageIcon;
            default: return File;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'dataset': return 'bg-blue-500/10 text-blue-500';
            case 'report': return 'bg-purple-500/10 text-purple-500';
            case 'code': return 'bg-green-500/10 text-green-500';
            case 'image': return 'bg-orange-500/10 text-orange-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !projectId) return;

        setUploading(true);
        setUploadProgress(0); // Indeterminate for now

        try {
            // Hardcoded labId for consistency with Collaboration.tsx 
            // Ideally passed as prop or context
            const labId = '00000000-0000-0000-0000-000000000001';

            const { data, error } = await collaboration.uploadFile(file, projectId, labId);

            if (error) throw error;

            if (data) {
                setFiles([data, ...files]);
                toast.success(`${file.name} uploaded successfully`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload file");
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDownload = (file: SharedFile) => {
        // Implement real download later using signed URLs
        toast.info(`Downloading ${file.name}... (Simulated)`);
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

    const filteredFiles = files.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || file.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading && files.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Loading files...</div>;
    }

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
                        <Button className="gap-2 cursor-pointer" asChild disabled={uploading}>
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
