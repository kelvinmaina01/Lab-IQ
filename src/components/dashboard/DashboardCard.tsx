/**
 * DashboardCard - Renders individual pinned dashboard items with visualizations
 * Supports charts, metrics, insights, and tables
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import {
  MoreVertical,
  Star,
  StarOff,
  Copy,
  Trash2,
  Download,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  FlaskConical,
  BarChart3,
  FileText,
  Lightbulb,
  Table,
} from "lucide-react";
import { PinnedDashboard, DashboardType, DashboardSource } from "@/lib/services/dashboardService";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  dashboard: PinnedDashboard;
  onToggleFavorite: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (dashboard: PinnedDashboard) => void;
  onClick?: (dashboard: PinnedDashboard) => void;
  onDrillDown?: (dashboard: PinnedDashboard) => void;
}

const CHART_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export const DashboardCard = ({
  dashboard,
  onToggleFavorite,
  onDuplicate,
  onDelete,
  onExport,
  onClick,
  onDrillDown,
  className
}: DashboardCardProps & { className?: string }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getSourceIcon = (source: DashboardSource) => {
    switch (source) {
      case "ai_assistant":
        return <Brain className="w-3 h-3" />;
      case "experiment":
        return <FlaskConical className="w-3 h-3" />;
      case "report":
        return <FileText className="w-3 h-3" />;
      case "workflow":
        return <BarChart3 className="w-3 h-3" />;
      default:
        return <Lightbulb className="w-3 h-3" />;
    }
  };

  const getTypeIcon = (type: DashboardType) => {
    switch (type) {
      case "chart":
        return <BarChart3 className="w-4 h-4" />;
      case "metric":
        return <TrendingUp className="w-4 h-4" />;
      case "table":
        return <Table className="w-4 h-4" />;
      case "insight":
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend?: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderChart = () => {
    const { config, data } = dashboard;
    const chartType = config.chartType || "bar";
    const colors = config.colors || CHART_COLORS;

    if (!data.labels || !data.datasets || data.datasets.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No chart data available
        </div>
      );
    }

    const chartData = data.labels.map((label, index) => {
      const point: Record<string, any> = { name: label };
      data.datasets?.forEach((dataset) => {
        point[dataset.label] = dataset.data[index];
      });
      return point;
    });

    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              {config.showLegend && <Legend />}
              {data.datasets?.map((dataset, idx) => (
                <Line
                  key={dataset.label}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              {config.showLegend && <Legend />}
              {data.datasets?.map((dataset, idx) => (
                <Area
                  key={dataset.label}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={colors[idx % colors.length]}
                  fill={`${colors[idx % colors.length]}40`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
      case "donut":
        const pieData = data.labels.map((label, idx) => ({
          name: label,
          value: data.datasets?.[0]?.data[idx] || 0,
        }));
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={chartType === "donut" ? "40%" : 0}
                outerRadius="70%"
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case "bar":
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              {config.showLegend && <Legend />}
              {data.datasets?.map((dataset, idx) => (
                <Bar
                  key={dataset.label}
                  dataKey={dataset.label}
                  fill={colors[idx % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderMetric = () => {
    const { data } = dashboard;
    const change = data.change || 0;
    const isPositive = change > 0;

    return (
      <div className="flex flex-col items-center justify-center h-full space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{data.value}</span>
          {data.unit && <span className="text-lg text-muted-foreground">{data.unit}</span>}
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon(data.trend)}
          <span
            className={cn(
              "text-sm font-medium",
              isPositive ? "text-green-500" : change < 0 ? "text-red-500" : "text-muted-foreground"
            )}
          >
            {isPositive ? "+" : ""}
            {change.toFixed(1)}%
          </span>
          {data.previousValue && (
            <span className="text-xs text-muted-foreground">
              from {data.previousValue}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderInsight = () => {
    const { data } = dashboard;

    return (
      <div className="space-y-3 h-full overflow-hidden">
        {/* Only show brief summary on the card */}
        {data.summary && (
          <p className="text-sm text-foreground line-clamp-3">{data.summary}</p>
        )}
        {data.keyPoints && data.keyPoints.length > 0 && (
          <ul className="space-y-1">
            {data.keyPoints.slice(0, 3).map((point, idx) => (
              <li key={idx} className="text-xs flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span className="line-clamp-1">{point}</span>
              </li>
            ))}
            {data.keyPoints.length > 3 && (
              <li className="text-xs text-muted-foreground pl-3">+ {data.keyPoints.length - 3} more points</li>
            )}
          </ul>
        )}
      </div>
    );
  };

  const renderTable = () => {
    const { data } = dashboard;

    if (!data.columns || !data.rows || data.rows.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          No table data available
        </div>
      );
    }

    return (
      <div className="overflow-auto h-full">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              {data.columns.slice(0, 4).map((col) => (
                <th key={col} className="text-left py-1 px-2 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.slice(0, 5).map((row, idx) => (
              <tr key={idx} className="border-b border-muted/30">
                {data.columns?.slice(0, 4).map((col) => (
                  <td key={col} className="py-1 px-2 truncate max-w-[100px]">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    switch (dashboard.type) {
      case "chart":
        return renderChart();
      case "metric":
        return renderMetric();
      case "insight":
        return renderInsight();
      case "table":
        return renderTable();
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {dashboard.data.content || "No content available"}
          </div>
        );
    }
  };

  const layout = dashboard.config.layout || { width: 1, height: 1 };
  const colSpan = `col-span-${layout.width}`;
  const minHeight = layout.height === 2 ? "min-h-[400px]" : "min-h-[200px]";

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200 cursor-pointer group",
        colSpan,
        minHeight,
        isHovered && "shadow-lg ring-1 ring-primary/20",
        className // Allow overriding classes
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(dashboard)}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getTypeIcon(dashboard.type)}
            <h3 className="font-semibold text-sm truncate">{dashboard.title}</h3>
            {dashboard.is_favorite && (
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] py-0 h-4">
              {getSourceIcon(dashboard.source)}
              <span className="ml-1">{dashboard.source.replace("_", " ")}</span>
            </Badge>
            {dashboard.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] py-0 h-4">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions dropdown */}
        <div className="flex items-center gap-1">
          {/* Drill Down Button - Show on hover or always if relevant */}
          {onDrillDown && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 transition-opacity",
                isHovered ? "opacity-100" : "opacity-0"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onDrillDown(dashboard);
              }}
              title="Drill Down"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onToggleFavorite(dashboard.id)}>
                {dashboard.is_favorite ? (
                  <>
                    <StarOff className="mr-2 h-4 w-4" />
                    Remove from favorites
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Add to favorites
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(dashboard.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport(dashboard)}>
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </DropdownMenuItem>
              {onDrillDown && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDrillDown(dashboard)}>
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Drill Down
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(dashboard.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content area */}
      <div className="px-4 pb-4 h-[calc(100%-80px)]">{renderContent()}</div>

      {/* Timestamp footer */}
      <div className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
        {new Date(dashboard.created_at).toLocaleDateString()}
      </div>
    </Card>
  );
};

