import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Database,
    Search,
    Upload,
    FileText,
    Calendar,
    BarChart3,
    Filter,
    SortAsc,
    Eye,
    Download,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Clock,
    Shield,
    RefreshCw,
    Info,
    ChevronRight,
    ArrowUpRight
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getBrandInfo } from "@/lib/utils/branding";

interface Dataset {
    id: string;
    name: string;
    file_name: string;
    file_size: number;
    row_count: number;
    column_count: number;
    status: string;
    created_at: string;
    quality_score?: number;
    domain?: string;
    is_anonymized?: boolean;
    metadata?: any;
    dataset_quality?: Array<{
        overall_score: number;
    }>;
}

export default function Datasets() {
    const { toast } = useToast();
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "size">("newest");
    const [domainFilter, setDomainFilter] = useState<string>("all");
    const [availableDomains, setAvailableDomains] = useState<string[]>([]);

    useEffect(() => {
        fetchDatasets();
    }, []);

    const fetchDatasets = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('datasets')
                .select(`
          *,
          dataset_quality (overall_score)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const fetchedDatasets = (data || []) as Dataset[];
            setDatasets(fetchedDatasets);

            // Extract unique domains for the filter
            const domains = Array.from(new Set(fetchedDatasets.map(d => d.domain).filter(Boolean))) as string[];
            setAvailableDomains(domains);
        } catch (error) {
            console.error('Error fetching datasets:', error);
            toast({
                title: "Error loading datasets",
                description: "Could not load your datasets. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ready': return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'processing': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'error': return 'bg-red-500/10 text-red-600 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ready': return <CheckCircle2 className="w-4 h-4" />;
            case 'processing': return <Clock className="w-4 h-4 animate-spin" />;
            case 'error': return <AlertCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isNew = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
        return diffInHours < 24;
    };

    // Filter and sort datasets
    const filteredDatasets = datasets
        .filter(dataset =>
            (dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                dataset.file_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (domainFilter === 'all' || dataset.domain === domainFilter)
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'oldest':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'size':
                    return b.file_size - a.file_size;
                default:
                    return 0;
            }
        });

    return (
        <AuthGuard>
            <MainLayout>
                <main className="p-4 md:p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">Datasets</h1>
                            <p className="text-muted-foreground">
                                Manage and explore all your uploaded datasets
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" size="icon" onClick={fetchDatasets} disabled={loading} className={loading ? "animate-spin" : ""}>
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Link to="/upload">
                                <Button className="gap-2 bg-primary hover:bg-primary/90">
                                    <Upload className="w-4 h-4" />
                                    Upload New
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Card className="hover:border-primary/50 transition-colors cursor-help group">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Total Datasets</p>
                                                    <p className="text-2xl font-bold group-hover:text-primary transition-colors">{datasets.length}</p>
                                                </div>
                                                <Database className="w-8 h-8 text-primary opacity-50" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TooltipTrigger>
                                <TooltipContent>Total number of unique data sources uploaded</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Card className="hover:border-primary/50 transition-colors cursor-help group">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Total Rows</p>
                                                    <p className="text-2xl font-bold group-hover:text-primary transition-colors">
                                                        {datasets.reduce((sum, d) => sum + (d.row_count || 0), 0).toLocaleString()}
                                                    </p>
                                                </div>
                                                <BarChart3 className="w-8 h-8 text-primary opacity-50" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TooltipTrigger>
                                <TooltipContent>Aggregate row count across all datasets</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Card className="hover:border-primary/50 transition-colors cursor-help group">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Total Storage</p>
                                                    <p className="text-2xl font-bold group-hover:text-primary transition-colors">
                                                        {formatFileSize(datasets.reduce((sum, d) => sum + (d.file_size || 0), 0))}
                                                    </p>
                                                </div>
                                                <FileText className="w-8 h-8 text-primary opacity-50" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TooltipTrigger>
                                <TooltipContent>Total storage fingerprint of your data library</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Card className="hover:border-primary/50 transition-colors cursor-help group">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Health Verified</p>
                                                    <p className="text-2xl font-bold group-hover:text-green-600 transition-colors">
                                                        {datasets.filter(d => d.status === 'ready').length}
                                                    </p>
                                                </div>
                                                <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TooltipTrigger>
                                <TooltipContent>Datasets that have passed all quality and schema checks</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* Search and Filters */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search datasets..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        value={domainFilter}
                                        onChange={(e) => setDomainFilter(e.target.value)}
                                        className="px-4 py-2 border rounded-lg bg-background text-sm min-w-[140px]"
                                    >
                                        <option value="all">All Domains</option>
                                        {availableDomains.map(domain => (
                                            <option key={domain} value={domain}>{domain.charAt(0).toUpperCase() + domain.slice(1)}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="px-4 py-2 border rounded-lg bg-background text-sm"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="name">Name (A-Z)</option>
                                        <option value="size">Size (Largest)</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Datasets Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Card key={i} className="animate-pulse">
                                    <CardContent className="p-6">
                                        <div className="space-y-3">
                                            <div className="h-6 bg-muted rounded w-3/4"></div>
                                            <div className="h-4 bg-muted rounded w-full"></div>
                                            <div className="h-4 bg-muted rounded w-1/2"></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : filteredDatasets.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-semibold mb-2">
                                    {searchQuery ? 'No datasets found' : 'No datasets yet'}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchQuery
                                        ? 'Try adjusting your search query'
                                        : 'Upload your first dataset to get started'
                                    }
                                </p>
                                {!searchQuery && (
                                    <Link to="/upload">
                                        <Button className="gap-2">
                                            <Upload className="w-4 h-4" />
                                            Upload Dataset
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="datasets-grid">
                            <TooltipProvider>
                                {filteredDatasets.map((dataset) => {
                                    const qualityScore = dataset.quality_score || (dataset.dataset_quality && dataset.dataset_quality[0]?.overall_score);

                                    return (
                                        <Link key={dataset.id} to={`/dashboard/datasets/${dataset.id}`}>
                                            <Card className="h-full hover:shadow-xl transition-all hover:-translate-y-1.5 cursor-pointer border-border/50 group overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <CardHeader className="pb-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="p-2 w-fit bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                                                {dataset.metadata?.provider ? (
                                                                    <img
                                                                        src={getBrandInfo(dataset.metadata.provider)?.logoUrl || ""}
                                                                        className="w-6 h-6 object-contain"
                                                                        alt={dataset.metadata.provider}
                                                                    />
                                                                ) : (
                                                                    <Database className="w-6 h-6 text-primary" />
                                                                )}
                                                            </div>
                                                            {dataset.metadata?.provider && (
                                                                <span className="text-[10px] font-bold text-primary uppercase tracking-tighter mt-1">
                                                                    {getBrandInfo(dataset.metadata.provider)?.name || dataset.metadata.provider}
                                                                </span>
                                                            )}
                                                            <div className="flex items-center gap-1.5 mt-2">
                                                                {dataset.domain && (
                                                                    <Badge variant="secondary" className="text-[10px] w-fit uppercase font-semibold">
                                                                        {dataset.domain}
                                                                    </Badge>
                                                                )}
                                                                {dataset.is_anonymized && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            <Badge variant="outline" className="text-[10px] bg-blue-50/50 text-blue-600 border-blue-200">
                                                                                <Shield className="w-3 h-3" />
                                                                            </Badge>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>PHI-Safe / Anonymized</TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {isNew(dataset.created_at) && (
                                                                    <Badge className="text-[10px] bg-amber-500 text-white border-transparent">
                                                                        NEW
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`gap-1 pr-2 ${getStatusColor(dataset.status)}`}
                                                                    >
                                                                        {getStatusIcon(dataset.status)}
                                                                        {dataset.status}
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Dataset processing status</TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors">
                                                            {dataset.name}
                                                        </CardTitle>
                                                        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                                                    </div>
                                                    <CardDescription className="line-clamp-1 flex items-center gap-1">
                                                        <FileText className="w-3 h-3" />
                                                        {dataset.file_name}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-3 text-sm">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Rows</span>
                                                                <p className="font-bold text-base">{dataset.row_count?.toLocaleString() || 0}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cols</span>
                                                                <p className="font-bold text-base">{dataset.column_count || 0}</p>
                                                            </div>
                                                            <div className="space-y-1 text-right col-span-2 md:col-span-1">
                                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Quality</span>
                                                                <p className={`font-bold text-base ${qualityScore !== undefined ? (qualityScore > 80 ? 'text-green-600' : 'text-yellow-600') : 'text-muted-foreground'}`}>
                                                                    {qualityScore !== undefined ? `${Math.round(qualityScore)}%` : 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="pt-3 border-t flex items-center justify-between text-muted-foreground">
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <Calendar className="w-3 h-3" />
                                                                {formatDate(dataset.created_at)}
                                                            </div>
                                                            <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded italic">
                                                                {formatFileSize(dataset.file_size || 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </TooltipProvider>
                        </div>
                    )}
                </main>
            </MainLayout>
        </AuthGuard>
    );
}
