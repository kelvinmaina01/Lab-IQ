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
    Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Dataset {
    id: string;
    name: string;
    file_name: string;
    file_size: number;
    row_count: number;
    column_count: number;
    status: string;
    created_at: string;
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
          dataset_quality (overall_score)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDatasets(data || []);
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

    // Filter and sort datasets
    const filteredDatasets = datasets
        .filter(dataset =>
            dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dataset.file_name.toLowerCase().includes(searchQuery.toLowerCase())
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
                        <Link to="/upload">
                            <Button className="gap-2">
                                <Upload className="w-4 h-4" />
                                Upload New
                            </Button>
                        </Link>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Datasets</p>
                                        <p className="text-2xl font-bold">{datasets.length}</p>
                                    </div>
                                    <Database className="w-8 h-8 text-primary opacity-50" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Rows</p>
                                        <p className="text-2xl font-bold">
                                            {datasets.reduce((sum, d) => sum + (d.row_count || 0), 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <BarChart3 className="w-8 h-8 text-primary opacity-50" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Storage</p>
                                        <p className="text-2xl font-bold">
                                            {formatFileSize(datasets.reduce((sum, d) => sum + (d.file_size || 0), 0))}
                                        </p>
                                    </div>
                                    <FileText className="w-8 h-8 text-primary opacity-50" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ready</p>
                                        <p className="text-2xl font-bold">
                                            {datasets.filter(d => d.status === 'ready').length}
                                        </p>
                                    </div>
                                    <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredDatasets.map((dataset) => (
                                <Link key={dataset.id} to={`/dashboard/datasets/${dataset.id}`}>
                                    <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                                        <CardHeader>
                                            <div className="flex items-start justify-between mb-2">
                                                <Database className="w-8 h-8 text-primary" />
                                                <Badge
                                                    variant="outline"
                                                    className={`gap-1 ${getStatusColor(dataset.status)}`}
                                                >
                                                    {getStatusIcon(dataset.status)}
                                                    {dataset.status}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-lg line-clamp-1">
                                                {dataset.name}
                                            </CardTitle>
                                            <CardDescription className="line-clamp-1">
                                                {dataset.file_name}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center justify-between text-muted-foreground">
                                                    <span>Rows:</span>
                                                    <span className="font-medium text-foreground">
                                                        {dataset.row_count?.toLocaleString() || 0}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-muted-foreground">
                                                    <span>Columns:</span>
                                                    <span className="font-medium text-foreground">
                                                        {dataset.column_count || 0}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-muted-foreground">
                                                    <span>Size:</span>
                                                    <span className="font-medium text-foreground">
                                                        {formatFileSize(dataset.file_size || 0)}
                                                    </span>
                                                </div>
                                                {dataset.dataset_quality && dataset.dataset_quality[0] && (
                                                    <div className="flex items-center justify-between text-muted-foreground">
                                                        <span>Quality:</span>
                                                        <span className="font-medium text-green-600">
                                                            {Math.round(dataset.dataset_quality[0].overall_score)}%
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(dataset.created_at)}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </main>
            </MainLayout>
        </AuthGuard>
    );
}
