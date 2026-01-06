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
    FileArchive,
    Database,
    TestTube,
    Zap,
    ExternalLink,
    Shield
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from 'sonner';
import { useServices } from '@/core/ServiceProvider';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface FileSharingProps {
    projectId?: string;
    projectName?: string;
}

// File preview modal component
const FilePreviewModal = ({ file, open, onOpenChange }: { file: SharedFile | null; open: boolean; onOpenChange: (open: boolean) => void }) => {
    if (!file) return null;

    const isImage = file.mime_type?.startsWith('image/');
    const isVideo = file.mime_type?.startsWith('video/');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] bg-background/95 backdrop-blur-2xl border-border/40">
                <DialogHeader className="p-4 border-b border-border/20">
                    <div className="flex items-center gap-4">
                        <div className={cn("p-2.5 rounded-xl", getCategoryColor(file.category))}>
                            <FileIcon category={file.category} className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                {file.name}
                            </DialogTitle> {/* Removed stray </Badge> tag */}
                            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Scientific Asset • {file.mime_type} • {formatFileSize(file.size_bytes)}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="relative flex-1 overflow-auto bg-muted/20 rounded-2xl p-8 min-h-[400px] flex items-center justify-center border border-border/20">
                    {isImage && (
                        <motion.img
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={file.storage_path}
                            alt={file.name}
                            className="max-w-full h-auto rounded-xl shadow-2xl border border-border/20"
                        />
                    )}
                    {isVideo && (
                        <video controls className="max-w-full h-auto rounded-xl shadow-2xl border border-border/20">
                            <source src={file.storage_path} type={file.mime_type} />
                            Your browser does not support video playback.
                        </video>
                    )}
                    {!isImage && !isVideo && (
                        <div className="text-center space-y-6">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                <FileIcon category={file.category} className="w-24 h-24 mx-auto relative text-primary/60" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight mb-2">No Visual Preview Available</h3>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">This scientific archive needs careful handling. Please download to analyze its contents.</p>
                                <Button className="rounded-xl px-8 h-11 font-black uppercase tracking-widest gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all">
                                    <Download className="w-4 h-4" /> Initialize Download
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-t border-border/20">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Authored By</p>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border">
                                <AvatarImage src={file.uploader?.avatar_url} />
                                <AvatarFallback>{file.uploader?.display_name?.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-black">{file.uploader?.display_name || 'System'}</span>
                        </div>
                    </div>
                    <div className="space-y-1 text-center">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Ingestion Date</p>
                        <p className="text-sm font-black italic">{format(new Date(file.created_at), 'MMM dd, yyyy • HH:mm')}</p>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="outline" className="rounded-xl border-border/40 hover:bg-primary/5 font-bold px-5">
                            <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                        <Button className="rounded-xl shadow-lg font-black uppercase tracking-[0.1em]" onClick={() => onOpenChange(false)}>
                            Resolve Context
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
        case 'dataset': return <Database className={iconClass} />;
        case 'report': return <FileText className={iconClass} />;
        case 'code': return <FileCode className={iconClass} />;
        case 'image': return <ImageIcon className={iconClass} />;
        case 'video': return <FileVideo className={iconClass} />;
        case 'archive': return <FileArchive className={iconClass} />;
        case 'experiment': return <TestTube className={iconClass} />;
        default: return <File className={iconClass} />;
    }
};

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'dataset': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'report': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        case 'code': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        case 'image': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
        case 'video': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
        case 'archive': return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
        case 'experiment': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
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

    const categories = ['dataset', 'report', 'code', 'experiment', 'image', 'video', 'archive'];

    if (loading && files.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-64 rounded-xl" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Action Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-muted/5 p-6 rounded-3xl border border-border/40 backdrop-blur-sm">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                        <Database className="h-7 w-7 text-primary animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                            Asset Core
                            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-[10px] font-black h-5 px-2">
                                {files.length} ACTIVE
                            </Badge>
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2 mt-1">
                            <Zap className="h-3 w-3 text-amber-500 fill-amber-500" /> Molecular Data Stream L4
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <label htmlFor="file-upload">
                        <Button className="rounded-2xl h-12 px-6 font-black uppercase tracking-widest gap-2 shadow-xl hover:shadow-primary/20 transition-all border border-primary/20" asChild disabled={uploading}>
                            <span>
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                Push to Repository
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
            </div>

            {/* Upload Progress Ribbon */}
            <AnimatePresence>
                {uploading && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 mb-6">
                            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-primary mb-2 px-1">
                                <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Transmitting Packets...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-1.5 bg-primary/10" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Browser Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search Research Assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 bg-background/50 border-border/40 rounded-2xl focus:ring-primary/20 text-[13px] font-medium"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-12 rounded-2xl gap-2 font-bold bg-background/50 border-border/40 px-5 text-[13px]">
                                <Filter className="w-4 h-4" />
                                Parameters
                                {filterCategories.length > 0 && (
                                    <Badge className="ml-1 px-1.5 text-[10px] font-black bg-primary text-primary-foreground h-5">
                                        {filterCategories.length}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-border/40 bg-background/95 backdrop-blur-xl">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-3 py-2">Filter Matrix</DropdownMenuLabel>
                            <DropdownMenuSeparator className="opacity-40" />
                            {categories.map(category => (
                                <DropdownMenuCheckboxItem
                                    key={category}
                                    className="rounded-xl px-3 py-2.5 text-[12px] font-bold focus:bg-primary/10 focus:text-primary transition-all mb-1 last:mb-0"
                                    checked={filterCategories.includes(category)}
                                    onCheckedChange={() => toggleCategory(category)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-1.5 rounded-lg", getCategoryColor(category))}>
                                            <FileIcon category={category} className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="capitalize tracking-tight">{category}</span>
                                    </div>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="h-12 flex items-center bg-muted/20 border border-border/40 rounded-2xl p-1 gap-1">
                        <Button
                            variant={viewMode === 'grid' ? "secondary" : "ghost"}
                            size="icon"
                            className="h-10 w-10 rounded-xl transition-all"
                            onClick={() => setViewMode('grid')}
                        >
                            <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? "secondary" : "ghost"}
                            size="icon"
                            className="h-10 w-10 rounded-xl transition-all"
                            onClick={() => setViewMode('list')}
                        >
                            <FileText className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Assets Matrix */}
            <div className={cn(
                "gap-6",
                viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"
            )}>
                {filteredFiles.map((file) => (
                    <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ y: -5 }}
                        className="group relative"
                    >
                        <Card
                            className="cursor-pointer overflow-hidden border-border/40 bg-background/50 hover:bg-background hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 rounded-3xl"
                            onClick={() => handlePreview(file)}
                        >
                            <div className={cn(
                                "absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity",
                                getCategoryColor(file.category).includes('blue') ? 'bg-blue-500' :
                                    getCategoryColor(file.category).includes('purple') ? 'bg-purple-500' :
                                        getCategoryColor(file.category).includes('emerald') ? 'bg-emerald-500' : 'bg-primary'
                            )} />

                            <CardContent className="p-6 relative">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={cn(
                                        "p-4 rounded-2xl shadow-sm transition-all group-hover:scale-110",
                                        getCategoryColor(file.category)
                                    )}>
                                        <FileIcon category={file.category} className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-1.5 h-4 border-muted-foreground/20">
                                                {file.category}
                                            </Badge>
                                            <span className="text-[10px] font-black text-muted-foreground/40 italic ml-auto">{formatFileSize(file.size_bytes)}</span>
                                        </div>
                                        <h4 className="font-black text-[15px] tracking-tight truncate group-hover:text-primary transition-colors">
                                            {file.name}
                                        </h4>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 py-4 border-y border-border/20 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="w-7 h-7 border ring-2 ring-background ring-offset-2 ring-offset-muted-foreground/10">
                                            <AvatarImage src={file.uploader?.avatar_url} />
                                            <AvatarFallback className="text-[10px] font-black bg-gradient-to-br from-primary/10 to-primary/5">
                                                {file.uploader?.display_name?.[0] || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black">{file.uploader?.display_name || 'System Operator'}</span>
                                            <span className="text-[9px] font-bold text-muted-foreground/60">{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-muted/30 rounded-full border border-border/40">
                                        <Download className="w-3 h-3 text-muted-foreground/60" />
                                        <span className="text-[10px] font-bold text-muted-foreground">{file.downloads}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <Shield className="h-3 w-3 text-emerald-500/50" />
                                        <span className="text-[9px] font-black text-muted-foreground/40 tracking-widest uppercase">Immutable Hash</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                            onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl border-border/40">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePreview(file); }} className="gap-2 rounded-lg py-2 cursor-pointer">
                                                    <Eye className="w-4 h-4" /> Preview
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="gap-2 rounded-lg py-2 cursor-pointer">
                                                    <Download className="w-4 h-4" /> Download
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="opacity-40" />
                                                <DropdownMenuItem
                                                    className="gap-2 rounded-lg py-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete Asset
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {filteredFiles.length === 0 && (
                <div className="text-center py-24 bg-muted/5 rounded-[40px] border border-dashed border-border/60">
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full" />
                        <div className="h-20 w-20 rounded-3xl bg-background border border-border/40 flex items-center justify-center relative shadow-xl">
                            <File className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                    </div>
                    <h3 className="text-xl font-black mb-2 tracking-tight">Zero Assets Detected</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto font-medium">
                        {searchQuery || filterCategories.length > 0
                            ? 'The current filter matrix returned no results. Adjust your parameters to locate the asset.'
                            : 'This repository is currently empty. Push your first scientific archive to the core.'}
                    </p>
                    {(searchQuery || filterCategories.length > 0) && (
                        <Button
                            variant="link"
                            className="mt-4 text-primary font-black uppercase text-[10px] tracking-widest"
                            onClick={() => { setSearchQuery(''); setFilterCategories([]); }}
                        >
                            Reset System Filters
                        </Button>
                    )}
                </div>
            )}

            {/* File Preview Modal */}
            <FilePreviewModal
                file={previewFile}
                open={previewOpen}
                onOpenChange={setPreviewOpen}
            />
        </div>
    );
};

// Re-using the same icons and more horizontal for consistency
import { MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
