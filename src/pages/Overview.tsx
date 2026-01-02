/**
 * Overview Page - AI-Generated Data Overviews Hub
 * 
 * A dedicated page for viewing, managing, and generating comprehensive
 * AI-powered data overviews from pinned dashboard collections.
 */

import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Search,
    Sparkles,
    Plus,
    LayoutDashboard,
    Calendar,
    TrendingUp,
    FileText,
    Trash2,
    Download,
    Share2,
    Eye,
    Filter,
    RefreshCw,
    Database
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { OverviewDisplay } from '@/components/overview/OverviewDisplay';
import { OverviewGenerationLoading } from '@/components/overview/OverviewGenerationLoading';
import { overviewService, DataOverview } from '@/lib/services/overviewService';
import { dashboardService, PinnedDashboard } from '@/lib/services/dashboardService';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export default function Overview() {
    const [overviews, setOverviews] = useState<DataOverview[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOverview, setSelectedOverview] = useState<DataOverview | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'recent' | 'title' | 'dataset'>('recent');

    // For creating new overviews
    const [availableDashboards, setAvailableDashboards] = useState<PinnedDashboard[]>([]);
    const [selectedDatasetFilter, setSelectedDatasetFilter] = useState<string | null>(null);

    // Load overviews from localStorage (in a real app, this would be from Supabase)
    useEffect(() => {
        loadOverviews();
        loadDashboards();
    }, []);

    const loadOverviews = async () => {
        setLoading(true);
        try {
            // For now, load from localStorage
            const stored = localStorage.getItem('lab-iq-overviews');
            if (stored) {
                const parsed = JSON.parse(stored);
                setOverviews(parsed);
            }
        } catch (error) {
            console.error('Error loading overviews:', error);
            toast.error('Failed to load overviews');
        } finally {
            setLoading(false);
        }
    };

    const loadDashboards = async () => {
        try {
            const dashboards = await dashboardService.getDashboards();
            setAvailableDashboards(dashboards);
        } catch (error) {
            console.error('Error loading dashboards:', error);
        }
    };

    const saveOverviews = (data: DataOverview[]) => {
        try {
            localStorage.setItem('lab-iq-overviews', JSON.stringify(data));
            setOverviews(data);
        } catch (error) {
            console.error('Error saving overviews:', error);
            toast.error('Failed to save overviews');
        }
    };

    // Extract unique datasets from available dashboards
    const uniqueDatasets = useMemo(() => {
        const datasets = new Set<string>();
        availableDashboards.forEach(d => {
            const name = d.data?.context?.datasetName || d.data?.metadata?.dataset_name;
            if (name) datasets.add(name);
        });
        return Array.from(datasets).sort();
    }, [availableDashboards]);

    // Filter and sort overviews
    const filteredOverviews = useMemo(() => {
        let filtered = overviews;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(o =>
                o.title.toLowerCase().includes(query) ||
                o.dataset_name.toLowerCase().includes(query) ||
                o.overview_text.toLowerCase().includes(query)
            );
        }

        // Sort
        const sorted = [...filtered];
        if (sortBy === 'recent') {
            sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (sortBy === 'title') {
            sorted.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === 'dataset') {
            sorted.sort((a, b) => a.dataset_name.localeCompare(b.dataset_name));
        }

        return sorted;
    }, [overviews, searchQuery, sortBy]);

    // Group by dataset
    const groupedOverviews = useMemo(() => {
        const groups: Record<string, DataOverview[]> = {};
        filteredOverviews.forEach(o => {
            const name = o.dataset_name || 'General';
            if (!groups[name]) groups[name] = [];
            groups[name].push(o);
        });
        return groups;
    }, [filteredOverviews]);

    const handleGenerateOverview = async () => {
        let dashboardsToUse = availableDashboards;

        // Filter by selected dataset if applicable
        if (selectedDatasetFilter) {
            dashboardsToUse = availableDashboards.filter(d => {
                const name = d.data?.context?.datasetName || d.data?.metadata?.dataset_name;
                return name === selectedDatasetFilter;
            });
        }

        if (dashboardsToUse.length === 0) {
            toast.error('No dashboards available', {
                description: 'Please pin some insights first or select a different dataset.'
            });
            return;
        }

        setIsGenerating(true);
        setIsCreateDialogOpen(false);

        try {
            const overview = await overviewService.generateOverview({
                dashboards: dashboardsToUse
            });

            // Save to storage
            const updated = [overview, ...overviews];
            saveOverviews(updated);

            // Show it immediately
            setSelectedOverview(overview);

            toast.success('Overview generated successfully!', {
                description: `Created from ${dashboardsToUse.length} insights`
            });
        } catch (error) {
            console.error('Error generating overview:', error);
            toast.error('Failed to generate overview');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteOverview = (id: string) => {
        const updated = overviews.filter(o => o.id !== id);
        saveOverviews(updated);
        toast.success('Overview deleted');
        if (selectedOverview?.id === id) {
            setSelectedOverview(null);
        }
    };

    const handleExportOverview = (overview: DataOverview) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(overview, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${overview.title.replace(/\s+/g, '_')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast.success('Overview exported');
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex h-[calc(100vh-4rem)]">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="border-b bg-card/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Sparkles className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">Data Overviews</h1>
                                    <p className="text-sm text-muted-foreground">
                                        AI-generated comprehensive analysis from your pinned insights
                                    </p>
                                </div>
                            </div>
                            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30">
                                        <Sparkles className="h-4 w-4" />
                                        Generate New Overview
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Generate Data Overview</DialogTitle>
                                        <DialogDescription>
                                            Create an AI-powered comprehensive overview from your pinned dashboards.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Dataset Filter (Optional)</label>
                                            <Select value={selectedDatasetFilter || 'all'} onValueChange={(val) => setSelectedDatasetFilter(val === 'all' ? null : val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All datasets" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Datasets</SelectItem>
                                                    {uniqueDatasets.map(ds => (
                                                        <SelectItem key={ds} value={ds}>{ds}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                {selectedDatasetFilter
                                                    ? `Will use dashboards from "${selectedDatasetFilter}"`
                                                    : `Will use all ${availableDashboards.length} pinned dashboards`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleGenerateOverview} className="gap-2">
                                            <Sparkles className="h-4 w-4" />
                                            Generate Overview
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search overviews..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recent">Most Recent</SelectItem>
                                    <SelectItem value="title">Title (A-Z)</SelectItem>
                                    <SelectItem value="dataset">Dataset</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" onClick={loadOverviews} title="Refresh">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <ScrollArea className="flex-1 p-6">
                        {filteredOverviews.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <div className="bg-primary/5 p-6 rounded-full mb-6">
                                    <FileText className="h-12 w-12 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No overviews yet</h3>
                                <p className="text-muted-foreground max-w-sm mb-8">
                                    {searchQuery
                                        ? 'No overviews match your search query.'
                                        : 'Generate your first AI-powered data overview from your pinned insights.'
                                    }
                                </p>
                                {!searchQuery && (
                                    <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                                        <Sparkles className="h-4 w-4" />
                                        Generate Your First Overview
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(groupedOverviews).map(([datasetName, items]) => (
                                    <div key={datasetName} className="space-y-4">
                                        {sortBy === 'dataset' && items.length > 0 && (
                                            <div className="flex items-center gap-2 pb-2 border-b">
                                                <Database className="h-5 w-5 text-primary" />
                                                <h2 className="text-lg font-semibold tracking-tight">
                                                    {datasetName}
                                                </h2>
                                                <span className="text-sm text-muted-foreground">
                                                    ({items.length} {items.length === 1 ? 'overview' : 'overviews'})
                                                </span>
                                            </div>
                                        )}
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {items.map((overview) => (
                                                <Card
                                                    key={overview.id}
                                                    className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                                                    onClick={() => setSelectedOverview(overview)}
                                                >
                                                    <CardHeader
                                                        className="pb-3"
                                                        style={{
                                                            background: `linear-gradient(135deg, ${overview.theme_color}15 0%, transparent 100%)`
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                                                                    {overview.title}
                                                                </CardTitle>
                                                                <CardDescription className="mt-1 flex items-center gap-2 text-xs">
                                                                    <Database className="h-3 w-3" />
                                                                    {overview.dataset_name}
                                                                </CardDescription>
                                                            </div>
                                                            <Badge
                                                                variant="outline"
                                                                className="shrink-0"
                                                                style={{ borderColor: overview.theme_color, color: overview.theme_color }}
                                                            >
                                                                AI
                                                            </Badge>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="space-y-3">
                                                        {/* Preview Text */}
                                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                            {overview.overview_text}
                                                        </p>

                                                        {/* Stats */}
                                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                                                            <div className="text-center">
                                                                <div className="text-lg font-bold text-primary">
                                                                    {overview.overall_insights.length}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">Insights</div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-lg font-bold text-primary">
                                                                    {overview.featured_charts.length}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">Charts</div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-lg font-bold text-primary">
                                                                    {overview.dashboard_ids.length}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">Sources</div>
                                                            </div>
                                                        </div>

                                                        {/* Date */}
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(overview.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-2 pt-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="flex-1 gap-1"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedOverview(overview);
                                                                }}
                                                            >
                                                                <Eye className="h-3 w-3" />
                                                                View
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleExportOverview(overview);
                                                                }}
                                                                title="Export"
                                                            >
                                                                <Download className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toast.info('Sharing coming soon!');
                                                                }}
                                                                title="Share"
                                                            >
                                                                <Share2 className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-destructive hover:bg-destructive/10"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteOverview(overview.id);
                                                                }}
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {/* AI Generating Overlay */}
                {isGenerating && (
                    <div className="absolute inset-0 z-50">
                        <OverviewGenerationLoading
                            dashboardCount={
                                selectedDatasetFilter
                                    ? availableDashboards.filter(d => {
                                        const name = d.data?.context?.datasetName || d.data?.metadata?.dataset_name;
                                        return name === selectedDatasetFilter;
                                    }).length
                                    : availableDashboards.length
                            }
                        />
                    </div>
                )}

                {/* Overview Display */}
                {selectedOverview && !isGenerating && (
                    <div className="absolute inset-0 z-50">
                        <OverviewDisplay
                            overview={selectedOverview}
                            onClose={() => setSelectedOverview(null)}
                            onExport={() => handleExportOverview(selectedOverview)}
                        />
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
