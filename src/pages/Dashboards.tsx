/**
 * Dashboards Page - Production-grade pinned dashboards management
 * Features: Real-time sync, AI auto-pinning, data visualization, filtering
 */

import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutDashboard,
  Plus,
  Search,
  Filter,
  Star,
  RefreshCw,
  Download,
  Grid3X3,
  List,
  Brain,
  FlaskConical,
  BarChart3,
  Lightbulb,
  TrendingUp,
  Table,
  Loader2,
  Sparkles,
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import {
  dashboardService,
  PinnedDashboard,
  DashboardType,
  DashboardSource,
  CreateDashboardInput,
} from "@/lib/services/dashboardService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type FilterCategory = "all" | string;

const DASHBOARD_TYPES: { value: DashboardType; label: string; icon: React.ReactNode }[] = [
  { value: "chart", label: "Chart", icon: <BarChart3 className="w-4 h-4" /> },
  { value: "metric", label: "Metric", icon: <TrendingUp className="w-4 h-4" /> },
  { value: "insight", label: "Insight", icon: <Lightbulb className="w-4 h-4" /> },
  { value: "table", label: "Table", icon: <Table className="w-4 h-4" /> },
  { value: "summary", label: "Summary", icon: <Brain className="w-4 h-4" /> },
];

const SOURCES: { value: DashboardSource | "all"; label: string }[] = [
  { value: "all", label: "All Sources" },
  { value: "ai_assistant", label: "AI Assistant" },
  { value: "experiment", label: "Experiments" },
  { value: "report", label: "Reports" },
  { value: "workflow", label: "Workflows" },
  { value: "manual", label: "Manual" },
  { value: "system", label: "System" },
];

export default function Dashboards() {
  const [dashboards, setDashboards] = useState<PinnedDashboard[]>([]);
  const [filteredDashboards, setFilteredDashboards] = useState<PinnedDashboard[]>([]);
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [selectedSource, setSelectedSource] = useState<DashboardSource | "all">("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDashboard, setNewDashboard] = useState<Partial<CreateDashboardInput>>({
    title: "",
    description: "",
    type: "insight",
    category: "general",
    tags: [],
  });
  const [creating, setCreating] = useState(false);

  const { toast } = useToast();

  // Fetch dashboards
  const fetchDashboards = useCallback(async () => {
    try {
      const data = await dashboardService.getDashboards();
      setDashboards(data);
      const cats = await dashboardService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Error fetching dashboards:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  // Initial load and real-time subscription
  useEffect(() => {
    fetchDashboards();

    // Subscribe to real-time updates
    const unsubscribe = dashboardService.subscribeToUpdates((updatedDashboards) => {
      setDashboards(updatedDashboards);
    });

    return () => unsubscribe();
  }, [fetchDashboards]);

  // Filter dashboards
  useEffect(() => {
    let filtered = [...dashboards];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(query) ||
          d.description?.toLowerCase().includes(query) ||
          d.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((d) => d.category === selectedCategory);
    }

    // Source
    if (selectedSource !== "all") {
      filtered = filtered.filter((d) => d.source === selectedSource);
    }

    // Favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter((d) => d.is_favorite);
    }

    setFilteredDashboards(filtered);
  }, [dashboards, searchQuery, selectedCategory, selectedSource, showFavoritesOnly]);

  // Actions
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboards();
  };

  const handleToggleFavorite = async (id: string) => {
    const success = await dashboardService.toggleFavorite(id);
    if (success) {
      fetchDashboards();
      toast({ title: "Updated", description: "Favorite status updated" });
    }
  };

  const handleDuplicate = async (id: string) => {
    const duplicated = await dashboardService.duplicateDashboard(id);
    if (duplicated) {
      fetchDashboards();
      toast({ title: "Duplicated", description: "Dashboard duplicated successfully" });
    }
  };

  const handleDelete = async (id: string) => {
    const success = await dashboardService.deleteDashboard(id);
    if (success) {
      fetchDashboards();
      toast({ title: "Deleted", description: "Dashboard removed" });
    }
  };

  const handleExport = (dashboard: PinnedDashboard) => {
    const json = dashboardService.exportDashboard(dashboard);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-${dashboard.title.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Dashboard exported as JSON" });
  };

  const handleCreate = async () => {
    if (!newDashboard.title) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const created = await dashboardService.createDashboard({
        title: newDashboard.title,
        description: newDashboard.description,
        type: newDashboard.type || "insight",
        source: "manual",
        category: newDashboard.category || "general",
        tags: newDashboard.tags || [],
        data: {
          summary: newDashboard.description || "Custom dashboard",
          keyPoints: [],
          recommendations: [],
        },
      });

      if (created) {
        fetchDashboards();
        setShowCreateDialog(false);
        setNewDashboard({ title: "", description: "", type: "insight", category: "general", tags: [] });
        toast({ title: "Created", description: "Dashboard created successfully" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create dashboard", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // Stats
  const stats = {
    total: dashboards.length,
    favorites: dashboards.filter((d) => d.is_favorite).length,
    aiGenerated: dashboards.filter((d) => d.source === "ai_assistant").length,
    charts: dashboards.filter((d) => d.type === "chart").length,
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading dashboards...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-primary" />
              Pinned Dashboards
            </h1>
            <p className="text-muted-foreground mt-1">
              Your AI-powered insights and visualizations in one place
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Dashboard
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Dashboards</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <LayoutDashboard className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Favorites</p>
                <p className="text-2xl font-bold">{stats.favorites}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Generated</p>
                <p className="text-2xl font-bold">{stats.aiGenerated}</p>
              </div>
              <Sparkles className="w-8 h-8 text-violet-500 opacity-50" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Visualizations</p>
                <p className="text-2xl font-bold">{stats.charts}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search dashboards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>
                  {cat.name} ({cat.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedSource}
            onValueChange={(v) => setSelectedSource(v as DashboardSource | "all")}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((source) => (
                <SelectItem key={source.value} value={source.value}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="icon"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Star className={cn("w-4 h-4", showFavoritesOnly && "fill-current")} />
          </Button>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dashboards Grid */}
        {filteredDashboards.length === 0 ? (
          <Card className="p-12 text-center">
            <LayoutDashboard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No dashboards found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== "all" || selectedSource !== "all"
                ? "Try adjusting your filters"
                : "Create your first dashboard or let the AI Assistant generate insights"}
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Dashboard
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/ai-assistant")}>
                <Brain className="w-4 h-4 mr-2" />
                Ask AI Assistant
              </Button>
            </div>
          </Card>
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-4"
            )}
          >
            {filteredDashboards.map((dashboard) => (
              <DashboardCard
                key={dashboard.id}
                dashboard={dashboard}
                onToggleFavorite={handleToggleFavorite}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onExport={handleExport}
              />
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Dashboard</DialogTitle>
              <DialogDescription>
                Create a custom dashboard to track your insights and metrics
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="My Dashboard"
                  value={newDashboard.title}
                  onChange={(e) => setNewDashboard({ ...newDashboard, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this dashboard tracks..."
                  value={newDashboard.description}
                  onChange={(e) =>
                    setNewDashboard({ ...newDashboard, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newDashboard.type}
                    onValueChange={(v) =>
                      setNewDashboard({ ...newDashboard, type: v as DashboardType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DASHBOARD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {type.icon}
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newDashboard.category}
                    onValueChange={(v) => setNewDashboard({ ...newDashboard, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="experiments">Experiments</SelectItem>
                      <SelectItem value="samples">Samples</SelectItem>
                      <SelectItem value="models">Models</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                      <SelectItem value="workflows">Workflows</SelectItem>
                      <SelectItem value="ai_insights">AI Insights</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Dashboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
