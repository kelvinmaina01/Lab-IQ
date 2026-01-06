/**
 * Dashboards Page - PromptBI-Style Layout
 * 
 * Structure:
 * - Left sidebar: List of saved dashboards
 * - Top row: Horizontal scrolling metric cards
 * - Main area: Tables, charts, and insights
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard,
  Star,
  StarOff,
  Trash2,
  MoreVertical,
  Search,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  FileText,
  Calendar,
  Grid,
  Database,
  List,
  Copy,
  Rocket,
  Loader2,
  Sparkles,
  Presentation as PresentationIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client"; // Added
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { toast } from "sonner";
import {
  dashboardService,
  PinnedDashboard,
  DashboardType,
  DashboardSource
} from "@/lib/services/dashboardService";
import { DashboardSourceFilter, FilterSource } from "@/components/dashboard/DashboardSourceFilter";
import { CollapsibleDashboardCard } from "@/components/dashboard/CollapsibleDashboardCard";
import { PresentationGenerator } from "@/components/presentation/PresentationGenerator";
import { PresentationViewer } from "@/components/presentation/PresentationViewer";
import { Presentation } from "@/lib/services/presentationService";
import { overviewService } from "@/lib/services/overviewService";
import { OverviewDisplay } from "@/components/overview/OverviewDisplay";
import { OverviewGenerationLoading } from "@/components/overview/OverviewGenerationLoading";
import { cn } from "@/lib/utils";
import { promptBIService, ChartConfig } from "@/lib/services/promptBIService";
import { ChartRenderer } from "@/components/ai/ChartRenderer";
import { DrillDownPanel } from "@/components/dashboard/DrillDownPanel";

// =============================================================================
// CHART COLORS
// =============================================================================

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

// =============================================================================
// METRIC CARD COMPONENT (Horizontal Scroll)
// =============================================================================

interface MetricCardProps {
  dashboard: PinnedDashboard;
  isSelected?: boolean;
  onClick?: () => void;
}

function MetricCard({ dashboard, isSelected, onClick }: MetricCardProps) {
  const { data } = dashboard;

  // Format large numbers like PromptBI (431.9K, 261.4M, etc.)
  const formatValue = (val: number | string | undefined): string => {
    if (val === undefined || val === null) return '—';
    if (typeof val === 'string') return val;
    if (Math.abs(val) >= 1000000000) return `${(val / 1000000000).toFixed(1)}B`;
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toLocaleString();
  };

  return (
    <Card
      className={`min-w-[180px] max-w-[200px] bg-white dark:bg-card border border-border/50 cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 ${isSelected ? 'ring-2 ring-primary border-primary' : ''
        }`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        {/* Label - PromptBI style: truncated descriptive text */}
        <p className="text-sm text-muted-foreground font-medium truncate mb-3" title={dashboard.title}>
          {dashboard.title}
        </p>

        {/* Large Value - PromptBI style: bold, large font */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            {formatValue(data.value)}
          </span>
          {data.unit && (
            <span className="text-sm text-muted-foreground ml-1">{data.unit}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// SIDEBAR ITEM COMPONENT
// =============================================================================

interface SidebarItemProps {
  dashboard: PinnedDashboard;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

function SidebarItem({ dashboard, isSelected, onSelect, onToggleFavorite, onDelete }: SidebarItemProps) {
  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isSelected
        ? 'bg-primary/10 text-primary'
        : 'hover:bg-muted'
        }`}
      onClick={onSelect}
    >
      <FileText className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 text-sm truncate">{dashboard.title}</span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        >
          {dashboard.is_favorite ? (
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          ) : (
            <StarOff className="h-3 w-3" />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN CONTENT RENDERER
// =============================================================================

interface MainContentProps {
  dashboard: PinnedDashboard | null;
  allDashboards: PinnedDashboard[];
  viewMode: 'grid' | 'list';
  onDuplicate: (d: PinnedDashboard) => void;
  onExport: (d: PinnedDashboard) => void;
  onDelete: (d: PinnedDashboard) => void;
  onAnalyze: (d: PinnedDashboard) => void;
}

function MainContent({ dashboard, allDashboards, viewMode, onDuplicate, onExport, onDelete, onAnalyze }: MainContentProps) {
  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <LayoutDashboard className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Select a Dashboard</h3>
        <p className="text-muted-foreground max-w-md">
          Choose a dashboard from the sidebar or create a new analysis with AI.
        </p>
        <Button className="mt-6" asChild>
          <a href="/insights">
            <Brain className="h-4 w-4 mr-2" /> Start AI Analysis
          </a>
        </Button>
      </div>
    );
  }

  // Categorize dashboards
  const metrics = allDashboards.filter(d => d.type === 'metric');
  const charts = allDashboards.filter(d => d.type === 'chart');
  const tables = allDashboards.filter(d => d.type === 'table');
  const insights = allDashboards.filter(d => d.type === 'insight');

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/* PAGE HEADER - PromptBI Style */}
      {/* ============================================================ */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-foreground">{dashboard.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date(dashboard.created_at).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </p>
      </div>

      {/* ============================================================ */}
      {/* METRICS ROW - PromptBI Style Horizontal Scroll */}
      {/* ============================================================ */}
      {metrics.length > 0 && (
        <div className="relative">
          {/* Left Arrow */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background shadow-md border hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>

          <ScrollArea className="w-full px-10">
            <div className="flex gap-4 py-2">
              {metrics.map(metric => (
                <MetricCard key={metric.id} dashboard={metric} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Right Arrow */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background shadow-md border hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ============================================================ */}
      {/* DATA TABLES - PromptBI Style with Proper Labels */}
      {/* ============================================================ */}
      {/* ============================================================ */}
      {/* DATA TABLES - PromptBI Style with Proper Labels */}
      {/* ============================================================ */}
      {tables.length > 0 && (
        <div className="space-y-6">
          {tables.map((table, idx) => (
            <CollapsibleDashboardCard
              key={table.id}
              id={table.id}
              title={table.title || `Table ${idx + 1}`}
              description={table.description}
              source={table.source}
              isFavorite={table.is_favorite}
              onDuplicate={() => onDuplicate(table)}
              onExport={() => onExport(table)}
              onDelete={() => onDelete(table)}
              onAnalyze={() => onAnalyze(table)}
            >
              {renderTable(table)}
            </CollapsibleDashboardCard>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* CHARTS - PromptBI Style with Legends */}
      {/* ============================================================ */}
      {/* ============================================================ */}
      {/* CHARTS - PromptBI Style with Legends */}
      {/* ============================================================ */}
      {charts.length > 0 && (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-6"}>
          {charts.map(chart => (
            <CollapsibleDashboardCard
              key={chart.id}
              id={chart.id}
              title={chart.title}
              description={chart.description}
              source={chart.source}
              isFavorite={chart.is_favorite}
              onDuplicate={() => onDuplicate(chart)}
              onExport={() => onExport(chart)}
              onDelete={() => onDelete(chart)}
              className="overflow-hidden"
            >
              {/* Legend Row - PromptBI Style */}
              {chart.data.datasets && chart.data.datasets.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-4 text-xs">
                  {chart.data.labels?.slice(0, 6).map((label, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              )}
              {renderChart(chart)}
            </CollapsibleDashboardCard>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* INSIGHTS - PromptBI Style with "Why This Matters" and "Key Trends" */}
      {/* ============================================================ */}
      {/* ============================================================ */}
      {/* INSIGHTS - PromptBI Style with "Why This Matters" and "Key Trends" */}
      {/* ============================================================ */}
      {insights.length > 0 && (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}>
          {insights.map(insight => (
            <CollapsibleDashboardCard
              key={insight.id}
              id={insight.id}
              title={insight.title}
              description={insight.description}
              source={insight.source}
              isFavorite={insight.is_favorite}
              onDuplicate={() => onDuplicate(insight)}
              onExport={() => onExport(insight)}
              onDelete={() => onDelete(insight)}
            >
              <div className="space-y-6">
                {/* Why This Matters Section */}
                {insight.data.summary && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Why This Matters</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {insight.data.summary}
                    </p>
                  </div>
                )}

                {/* Key Trends Section */}
                {insight.data.keyPoints && insight.data.keyPoints.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Key Trends</h4>
                    <ul className="space-y-2">
                      {insight.data.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          <span className="text-muted-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations Section */}
                {insight.data.recommendations && insight.data.recommendations.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-foreground mb-3">Recommendations</h4>
                    <ul className="space-y-2">
                      {insight.data.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CollapsibleDashboardCard>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* SELECTED DASHBOARD DETAIL */}
      {/* ============================================================ */}
      {dashboard.type !== 'metric' && !insights.includes(dashboard) && !tables.includes(dashboard) && !charts.includes(dashboard) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{dashboard.title}</CardTitle>
            {dashboard.description && (
              <CardDescription>{dashboard.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {renderDashboardContent(dashboard)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function renderDashboardContent(dashboard: PinnedDashboard) {
  switch (dashboard.type) {
    case 'chart':
      return renderChart(dashboard);
    case 'metric':
      return renderMetric(dashboard);
    case 'table':
      return renderTable(dashboard);
    case 'insight':
      return renderInsight(dashboard);
    default:
      return <p className="text-muted-foreground">No content available</p>;
  }
}

function renderChart(dashboard: PinnedDashboard) {
  const { data, config } = dashboard;
  if (!data.labels || !data.datasets?.length) {
    return <div className="text-muted-foreground text-sm">No chart data</div>;
  }

  const chartData = data.labels.map((label, i) => ({
    name: label,
    ...data.datasets!.reduce((acc, ds, dsIdx) => ({
      ...acc,
      [`value${dsIdx}`]: ds.data[i]
    }), {})
  }));

  const colors = config?.colors || CHART_COLORS;

  switch (config?.chartType) {
    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={250}>
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value0"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
      );
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value0" fill={colors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case 'area':
      return (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="value0" stroke={colors[0]} fill={colors[0]} fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      );
    default:
      return (
        <ResponsiveContainer width="100%" height={250}>
          <RechartsLineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            {data.datasets!.map((ds, idx) => (
              <Line
                key={idx}
                type="monotone"
                dataKey={`value${idx}`}
                name={ds.label}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      );
  }
}

function renderMetric(dashboard: PinnedDashboard) {
  const { data } = dashboard;
  const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;
  const trendColor = data.trend === 'up' ? 'text-green-500' : data.trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <div className="text-center py-8">
      <div className="text-5xl font-bold">
        {data.value}{data.unit && <span className="text-xl ml-2">{data.unit}</span>}
      </div>
      {data.change !== undefined && (
        <div className={`flex items-center justify-center gap-2 mt-3 ${trendColor}`}>
          <TrendIcon className="h-5 w-5" />
          <span className="text-lg">{data.change > 0 ? '+' : ''}{data.change}%</span>
        </div>
      )}
      {data.summary && (
        <p className="text-muted-foreground mt-4">{data.summary}</p>
      )}
    </div>
  );
}

function renderTable(dashboard: PinnedDashboard) {
  const { data } = dashboard;
  if (!data.rows?.length) {
    return <div className="text-muted-foreground text-sm">No table data</div>;
  }

  const columns = data.columns || Object.keys(data.rows[0]);

  // Format column headers nicely (Production Date, Offshore Region, etc.)
  const formatColumnHeader = (col: string) => {
    return col
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  };

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        {/* PromptBI-style header: light background, medium font weight */}
        <thead>
          <tr className="border-b bg-muted/30">
            {columns.map(col => (
              <th
                key={col}
                className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
              >
                {formatColumnHeader(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.slice(0, 10).map((row, i) => (
            <tr
              key={i}
              className="border-b border-border/50 hover:bg-muted/20 transition-colors"
            >
              {columns.map(col => (
                <td key={col} className="px-4 py-3 text-foreground whitespace-nowrap">
                  {String(row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.rows.length > 10 && (
        <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t">
          Showing 10 of {data.rows.length} rows
        </div>
      )}
    </div>
  );
}

function renderInsight(dashboard: PinnedDashboard) {
  const { data } = dashboard;
  return (
    <div className="space-y-4">
      {data.summary && (
        <p className="text-foreground">{data.summary}</p>
      )}
      {data.keyPoints && data.keyPoints.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Key Points:</h4>
          <ul className="space-y-2">
            {data.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <ChevronRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <h4 className="font-medium">Recommendations:</h4>
          <ul className="space-y-2">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-primary/90">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

interface EmptyStateProps {
  onRefresh: () => void;
  onCreate: () => void;
}

function EmptyState({ onRefresh, onCreate }: EmptyStateProps) {
  /* New Demo Handler */
  const [loadingDemo, setLoadingDemo] = useState(false);
  const handleRunDemo = async () => {
    setLoadingDemo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { demoService } = await import('@/lib/services/demoService');
      await demoService.runDemoPipeline(user.id);
      toast.success("Demo Pipeline Completed", { description: "Created Dataset, Experiment, Workflow, Model, Report & Dashboards!" });
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Demo Failed", { description: "Could not generate demo data." });
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="bg-primary/5 p-6 rounded-full mb-6">
        <LayoutDashboard className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No dashboards yet</h3>
      <p className="text-muted-foreground max-w-sm mb-8">
        Create your first dashboard or generate a demo pipeline to explore the platform's capabilities.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={onCreate} className="gap-2 w-full">
          <Plus className="w-4 h-4" />
          Create Dashboard
        </Button>
        <Button onClick={handleRunDemo} variant="outline" className="gap-2 w-full" disabled={loadingDemo}>
          {loadingDemo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          Run Full Automation Demo
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARDS PAGE
// =============================================================================

export default function Dashboards() {
  const [dashboards, setDashboards] = useState<PinnedDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [sourceFilter, setSourceFilter] = useState<FilterSource>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedDatasetFilter, setSelectedDatasetFilter] = useState<string | null>(null);

  // Drill Down State
  const [drillDownDashboard, setDrillDownDashboard] = useState<PinnedDashboard | null>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

  const handleDrillDown = (dashboard: PinnedDashboard) => {
    setDrillDownDashboard(dashboard);
    setIsDrillDownOpen(true);
  };

  // AI Analysis State
  const [isAIAnalysisOpen, setIsAIAnalysisOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingChart, setIsGeneratingChart] = useState(false);
  const [generatedChart, setGeneratedChart] = useState<{ config: ChartConfig, explanation: string } | null>(null);

  const handleGenerateChart = async () => {
    if (!aiPrompt) return;
    setIsGeneratingChart(true);
    try {
      // Use selected dataset or default
      const datasetId = selectedDatasetFilter || 'current';
      const result = await promptBIService.generateChartConfig({
        datasetId,
        prompt: aiPrompt
      });

      setGeneratedChart(result);
      toast.success("Chart Generated", { description: "AI has created the visualization." });
    } catch (error) {
      console.error(error);
      toast.error("Generation Failed");
    } finally {
      setIsGeneratingChart(false);
    }
  };

  const handleSaveAIChart = async () => {
    if (!generatedChart) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create dummy data matching the config (In real app, we'd query data based on config)
      // For V1 demo, create data based on axes
      const labels = ['A', 'B', 'C', 'D', 'E'];
      const data = labels.map((l) => ({
        [generatedChart.config.xAxis]: l,
        [generatedChart.config.yAxis[0]]: Math.floor(Math.random() * 100)
      }));

      // In real scenario we'd query database. 
      // Here we assume generatedChart.config is enough metadata

      const newDashboard: Partial<PinnedDashboard> = {
        title: generatedChart.config.title,
        description: generatedChart.config.description,
        type: 'chart',
        source: 'ai_generated',
        data: {
          title: generatedChart.config.title,
          labels: labels,
          datasets: [{
            label: 'Value',
            data: data.map(d => d[generatedChart.config.yAxis[0]]),
            backgroundColor: CHART_COLORS,
            borderColor: CHART_COLORS
          }]
        },
        // Store the config for ChartRenderer re-use if we saved it as metadata
        // For now, simpler dashboardService expects specific data shape
      };

      // Use dashboardService to save
      // For now, promptBIService just generates config, not full dashboard record
      // We'd need to adapt.
      // Let's just create a quick dashboard entry.
      // Or simply close the dialog and say "Saved" (mock interaction for demo flow)

      // Real save:
      await dashboardService.pinDashboard(user.id, newDashboard as any);

      toast.success("Saved to Dashboard");
      setIsAIAnalysisOpen(false);
      setGeneratedChart(null);
      setAiPrompt("");
      fetchDashboards();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save");
    }
  };

  // Extract unique datasets
  const uniqueDatasets = useMemo(() => {
    const datasets = new Set<string>();
    dashboards.forEach(d => {
      const name = d.data?.context?.datasetName || d.data?.metadata?.dataset_name;
      if (name) datasets.add(name);
    });
    return Array.from(datasets).sort();
  }, [dashboards]);

  // Filter and Sort Dashboards
  const filteredDashboards = useMemo(() => {
    let filtered = dashboards;

    // Source Filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(d => d.source === sourceFilter);
    }

    // Dataset Filter
    if (selectedDatasetFilter) {
      filtered = filtered.filter(d => {
        const name = d.data?.context?.datasetName || d.data?.metadata?.dataset_name;
        return name === selectedDatasetFilter;
      });
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.title.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query)
      );
    }

    // Sort: Dataset Name first (if viewing all), then Time
    return filtered.sort((a, b) => {
      // If we are already filtering by one dataset, just sort by time
      if (selectedDatasetFilter) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      // Otherwise group by dataset first
      const nameA = a.data?.context?.datasetName || a.data?.metadata?.dataset_name || 'General';
      const nameB = b.data?.context?.datasetName || b.data?.metadata?.dataset_name || 'General';

      if (nameA !== nameB) return nameA.localeCompare(nameB);

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [dashboards, sourceFilter, searchQuery, selectedDatasetFilter]);

  // Group for display
  const groupedDashboards = useMemo(() => {
    const groups: Record<string, PinnedDashboard[]> = {};
    filteredDashboards.forEach(d => {
      const name = d.data?.context?.datasetName || d.data?.metadata?.dataset_name || 'General';
      if (!groups[name]) groups[name] = [];
      groups[name].push(d);
    });
    return groups;
  }, [filteredDashboards]);

  // New Dashboard Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDashboard, setNewDashboard] = useState({
    title: "",
    description: "",
    type: "metric" as DashboardType,
    category: "general",
    value: "",
    unit: ""
  });
  const [isCreating, setIsCreating] = useState(false);

  // Presentation State
  const [isPresentationGeneratorOpen, setIsPresentationGeneratorOpen] = useState(false);
  const [activePresentation, setActivePresentation] = useState<Presentation | null>(null);

  // Overview Generation State
  const [isGeneratingOverview, setIsGeneratingOverview] = useState(false);
  const [activeOverview, setActiveOverview] = useState<any>(null);

  const navigate = useNavigate();

  // Fetch dashboards
  useEffect(() => {
    fetchDashboards();

    const unsubscribe = dashboardService.subscribeToUpdates((updated) => {
      setDashboards(updated);
      setLastUpdated(new Date());
    });

    return () => unsubscribe();
  }, []);

  const fetchDashboards = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getDashboards();
      setDashboards(data);
      if (data.length > 0 && !selectedDashboardId) {
        setSelectedDashboardId(data[0].id);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      toast.error('Failed to load dashboards');
    } finally {
      setLoading(false);
    }
  };



  // Calculate source counts for filter badges
  const sourceCounts = useMemo(() => {
    const counts: Partial<Record<FilterSource, number>> = {};
    dashboards.forEach(d => {
      counts[d.source] = (counts[d.source] || 0) + 1;
    });
    return counts;
  }, [dashboards]);

  // Get selected dashboard
  const selectedDashboard = useMemo(() => {
    return dashboards.find(d => d.id === selectedDashboardId) || null;
  }, [dashboards, selectedDashboardId]);

  // Handlers
  const handleToggleFavorite = async (id: string) => {
    const success = await dashboardService.toggleFavorite(id);
    if (success) {
      toast.success('Updated favorites');
      fetchDashboards();
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('demo-')) {
      toast.info("Demo dashboards can't be removed");
      return;
    }
    const success = await dashboardService.deleteDashboard(id);
    if (success) {
      toast.success('Dashboard removed');
      if (selectedDashboardId === id) {
        setSelectedDashboardId(null);
      }
      fetchDashboards();
    }
  };

  const handleRefresh = () => {
    fetchDashboards();
    toast.success('Dashboards refreshed');
  };



  const handleCreateDashboard = async () => {
    if (!newDashboard.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsCreating(true);
    try {
      const result = await dashboardService.createDashboard({
        title: newDashboard.title,
        description: newDashboard.description || undefined,
        type: newDashboard.type,
        category: newDashboard.category,
        data: {
          value: newDashboard.value || 0,
          unit: newDashboard.unit || undefined,
          summary: newDashboard.description
        }
      });

      if (result) {
        toast.success('Dashboard created');
        setIsCreateModalOpen(false);
        setNewDashboard({
          title: "",
          description: "",
          type: "metric",
          category: "general",
          value: "",
          unit: ""
        });
        fetchDashboards();
      }
    } catch (error) {
      console.error('Error creating dashboard:', error);
      toast.error('Failed to create dashboard');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDuplicate = async (dashboard: PinnedDashboard) => {
    try {
      await dashboardService.createDashboard({
        title: `${dashboard.title} (Copy)`,
        description: dashboard.description,
        type: dashboard.type,
        category: dashboard.category,
        data: dashboard.data,
        source: dashboard.source,
        config: dashboard.config
      });
      toast.success('Dashboard duplicated');
      fetchDashboards();
    } catch (error) {
      toast.error('Failed to duplicate');
    }
  };

  const handleExport = (dashboard: PinnedDashboard) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dashboard, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${dashboard.title.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Exported to JSON');
  };

  // Generate AI Overview - NO DIALOG, AI GOES INTO ACTION!
  const handleGenerateOverview = async () => {
    if (filteredDashboards.length === 0) {
      toast.error('No dashboards to generate overview from. Pin some insights first!');
      return;
    }

    setIsGeneratingOverview(true);
    setActiveOverview(null);

    try {
      // AI creates comprehensive overview
      const overview = await overviewService.generateOverview({
        dashboards: filteredDashboards
      });

      setActiveOverview(overview);
      toast.success('Overview generated successfully!', {
        description: `Created from ${filteredDashboards.length} insights`
      });
    } catch (error) {
      console.error('Error generating overview:', error);
      toast.error('Failed to generate overview', {
        description: 'The AI encountered an issue. Please try again.'
      });
    } finally {
      setIsGeneratingOverview(false);
    }
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
      <div className="flex h-[calc(100vh-4rem)] relative">
        {/* Left Sidebar - Collapsible */}
        <aside className={cn(
          "border-r bg-card/50 flex flex-col transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "w-0 overflow-hidden" : "w-72"
        )}>
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              Dashboards
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Pinned insights from your analysis
            </p>
          </div>

          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Dataset Filter */}
          <div className="px-3 py-2 border-b">
            <div className="mb-2 px-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Datasets
              </span>
              {selectedDatasetFilter && (
                <Button
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-transparent text-muted-foreground"
                  onClick={() => setSelectedDatasetFilter(null)}
                  title="Clear filter"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
              <Button
                variant={selectedDatasetFilter === null ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start text-xs h-7 px-2 font-normal",
                  selectedDatasetFilter === null && "bg-secondary/50 font-medium"
                )}
                onClick={() => setSelectedDatasetFilter(null)}
              >
                <LayoutDashboard className="h-3.5 w-3.5 mr-2 opacity-70" />
                All Datasets
              </Button>
              {uniqueDatasets.map(ds => (
                <Button
                  key={ds}
                  variant={selectedDatasetFilter === ds ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs h-7 px-2 font-normal truncate",
                    selectedDatasetFilter === ds && "bg-secondary/50 font-medium"
                  )}
                  onClick={() => setSelectedDatasetFilter(ds)}
                  title={ds}
                >
                  <Database className="h-3.5 w-3.5 mr-2 opacity-70 text-primary" />
                  <span className="truncate">{ds}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Dashboard List */}
          <ScrollArea className="flex-1 p-2">
            {filteredDashboards.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No dashboards found
              </div>
            ) : (
              <div className="space-y-1">
                {filteredDashboards.map(d => (
                  <SidebarItem
                    key={d.id}
                    dashboard={d}
                    isSelected={selectedDashboardId === d.id}
                    onSelect={() => setSelectedDashboardId(d.id)}
                    onToggleFavorite={() => handleToggleFavorite(d.id)}
                    onDelete={() => handleDelete(d.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Sidebar Footer */}
          <div className="p-3 border-t space-y-2">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> New Dashboard
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Dashboard</DialogTitle>
                  <DialogDescription>
                    Add a custom metric or insight.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Monthly Active Users"
                      value={newDashboard.title}
                      onChange={(e) => setNewDashboard({ ...newDashboard, title: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="What does this metric represent?"
                      value={newDashboard.description}
                      onChange={(e) => setNewDashboard({ ...newDashboard, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="value">Value</Label>
                      <Input
                        id="value"
                        placeholder="e.g., 1,234"
                        value={newDashboard.value}
                        onChange={(e) => setNewDashboard({ ...newDashboard, value: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        placeholder="e.g., users, %"
                        value={newDashboard.unit}
                        onChange={(e) => setNewDashboard({ ...newDashboard, unit: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newDashboard.category}
                      onValueChange={(val) => setNewDashboard({ ...newDashboard, category: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="experiments">Experiments</SelectItem>
                        <SelectItem value="models">Models</SelectItem>
                        <SelectItem value="quality">Quality</SelectItem>
                        <SelectItem value="ai_insights">AI Insights</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateDashboard} disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button asChild className="w-full" size="sm">
              <a href="/insights">
                <Brain className="h-4 w-4 mr-2" /> AI Analysis
              </a>
            </Button>
          </div>
        </aside>

        {/* Collapse/Expand Toggle */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute top-4 z-20 h-8 w-8 rounded-r-lg border-l-0 bg-background shadow-md hover:bg-muted transition-all",
            isSidebarCollapsed ? "left-0" : "left-[280px]"
          )}
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Source Filter Tabs */}
          {dashboards.length > 0 && (
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <DashboardSourceFilter
                activeFilter={sourceFilter}
                onFilterChange={setSourceFilter}
                counts={sourceCounts}
              />
              <div className="flex items-center gap-3">
                {/* View All Overviews Button */}
                <Button
                  asChild
                  variant="outline"
                  className="gap-2"
                >
                  <a href="/overview">
                    <FileText className="h-4 w-4" />
                    View All Overviews
                  </a>
                </Button>

                {/* Generate Overview Button - AI Goes Into Action! */}
                {filteredDashboards.length > 0 && (
                  <Button
                    onClick={handleGenerateOverview}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Overview
                  </Button>
                )}

                <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/50">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setViewMode('list')}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {filteredDashboards.length === 0 && !loading ? (
            <EmptyState onRefresh={fetchDashboards} onCreate={() => setIsCreateModalOpen(true)} />
          ) : filteredDashboards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-muted-foreground">No dashboards match the current filter.</p>
              <Button
                variant="link"
                onClick={() => setSourceFilter('all')}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            Object.entries(groupedDashboards).map(([datasetName, items]) => (
              <div key={datasetName} className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Only show header if we are viewing ALL datasets and have real names */}
                {!selectedDatasetFilter && items.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                    <Database className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold tracking-tight">
                      {datasetName === 'General' ? 'General Analysis' : datasetName}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      ({items.length} insights)
                    </span>
                  </div>
                )}

                <div className={cn(
                  "grid gap-4 transition-all",
                  viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                )}>
                  {items.map(dashboard => (
                    <CollapsibleDashboardCard
                      key={dashboard.id}
                      title={dashboard.title}
                      description={dashboard.description || ''}
                      source={dashboard.source}
                      isFavorite={dashboard.isFavorite}
                      onToggleFavorite={() => handleToggleFavorite(dashboard.id)}
                      onDelete={() => handleDelete(dashboard.id)}
                      onDuplicate={() => handleDuplicate(dashboard)}
                      onExport={() => handleExport(dashboard)}
                      onAnalyze={() => handleDrillDown(dashboard)}
                      data={dashboard.data}
                      className="h-fit"
                    >
                      <div className="p-1">
                        {dashboard.type === 'chart' && (
                          <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              {dashboard.config.chartType === 'line' ? (
                                <LineChart data={dashboard.data.datasets?.[0]?.data.map((val: any, i: number) => ({
                                  name: dashboard.data.labels?.[i],
                                  value: val
                                })) || []}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                  <Tooltip />
                                  <RechartsLine
                                    type="monotone"
                                    dataKey="value"
                                    stroke={dashboard.config.colors?.[0] || 'hsl(var(--primary))'}
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: dashboard.config.colors?.[0] || 'hsl(var(--primary))' }}
                                    activeDot={{ r: 6 }}
                                  />
                                </LineChart>
                              ) : dashboard.config.chartType === 'pie' ? (
                                <RechartsPieChart>
                                  <Pie
                                    data={dashboard.data.datasets?.[0]?.data.map((val: any, i: number) => ({
                                      name: dashboard.data.labels?.[i],
                                      value: val
                                    })) || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                  >
                                    {dashboard.data.datasets?.[0]?.data.map((_: any, index: number) => (
                                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </RechartsPieChart>
                              ) : (
                                <BarChart data={dashboard.data.datasets?.[0]?.data.map((val: any, i: number) => ({
                                  name: dashboard.data.labels?.[i],
                                  value: val
                                })) || []}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                  <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                                  <Bar
                                    dataKey="value"
                                    fill={dashboard.config.colors?.[0] || 'hsl(var(--primary))'}
                                    radius={[4, 4, 0, 0]}
                                  />
                                </BarChart>
                              )}
                            </ResponsiveContainer>
                          </div>
                        )}

                        {dashboard.type === 'metric' && (
                          <div className="flex flex-col items-center justify-center p-4 text-center">
                            <div className="text-4xl font-bold tracking-tight text-primary">
                              {dashboard.data.value}
                              {dashboard.data.unit && <span className="text-lg ml-1 text-muted-foreground">{dashboard.data.unit}</span>}
                            </div>
                            {dashboard.data.trend && (
                              <div className={cn(
                                "flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full",
                                dashboard.data.trend === 'up' ? "bg-emerald-500/10 text-emerald-500" :
                                  dashboard.data.trend === 'down' ? "bg-rose-500/10 text-rose-500" :
                                    "bg-blue-500/10 text-blue-500"
                              )}>
                                {dashboard.data.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {dashboard.data.change}%
                              </div>
                            )}
                            {dashboard.data.summary && (
                              <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                                {dashboard.data.summary}
                              </p>
                            )}
                          </div>
                        )}

                        {dashboard.type === 'insight' && (
                          <div className="space-y-4">
                            {dashboard.data.summary && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {dashboard.data.summary}
                              </p>
                            )}
                            {dashboard.data.keyPoints && (
                              <div className="space-y-2">
                                {dashboard.data.keyPoints.slice(0, 3).map((point: string, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-xs text-secondary-foreground/80">
                                    <span className="mt-1 h-1 w-1 rounded-full bg-primary shrink-0" />
                                    {point}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {dashboard.type === 'table' && renderTable(dashboard)}
                      </div>
                    </CollapsibleDashboardCard>
                  ))}
                </div>
              </div>
            ))
          )}
        </main>
      </div>

      {/* Presentation Generator Dialog */}
      <PresentationGenerator
        open={isPresentationGeneratorOpen}
        onOpenChange={setIsPresentationGeneratorOpen}
        dashboards={filteredDashboards}
        onPresentationCreated={(presentation) => {
          setActivePresentation(presentation);
        }}
      />

      {/* Presentation Viewer */}
      {activePresentation && (
        <PresentationViewer
          presentation={activePresentation}
          onClose={() => setActivePresentation(null)}
          onEdit={() => {
            // TODO: Implement edit mode
            toast.info('Edit mode coming soon!');
          }}
        />
      )}

      {/* Overview Generation Loading - Beautiful Animations! */}
      {isGeneratingOverview && (
        <div className="absolute inset-0 z-50">
          <OverviewGenerationLoading
            dashboardCount={filteredDashboards.length}
            hasModels={filteredDashboards.some(d => d.source === 'experiment')}
            hasExperiments={filteredDashboards.some(d => d.category === 'experiments')}
          />
        </div>
      )}

      {/* Overview Display - Beautiful Data Overview! */}
      {activeOverview && !isGeneratingOverview && (
        <div className="absolute inset-0 z-50">
          <OverviewDisplay
            overview={activeOverview}
            onClose={() => setActiveOverview(null)}
            onExport={() => {
              toast.info('Export coming soon!');
            }}
          />
        </div>
      )}
      {/* Drill Down Panel */}
      <DrillDownPanel
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        dashboardItem={drillDownDashboard}
      />
    </MainLayout>
  );
}
