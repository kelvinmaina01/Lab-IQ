import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Sparkles, 
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const DataAnalysisPanel = () => {
  const [analyzing, setAnalyzing] = useState(false);

  // Mock analysis data
  const analysisData = {
    summary: {
      totalSamples: 1247,
      features: 24,
      outliers: 18,
      correlations: 12
    },
    trends: [
      { name: "Week 1", value: 450, predicted: 420 },
      { name: "Week 2", value: 520, predicted: 510 },
      { name: "Week 3", value: 480, predicted: 490 },
      { name: "Week 4", value: 630, predicted: 580 },
      { name: "Week 5", value: 710, predicted: 670 },
    ],
    insights: [
      {
        type: "trend",
        severity: "high",
        title: "Strong Upward Trend Detected",
        description: "Data shows a 35% increase over the last 4 weeks. This trend is statistically significant (p < 0.01).",
        confidence: 94
      },
      {
        type: "correlation",
        severity: "medium",
        title: "Strong Correlation Found",
        description: "Temperature and reaction rate show a correlation coefficient of 0.87, indicating a strong positive relationship.",
        confidence: 87
      },
      {
        type: "outlier",
        severity: "warning",
        title: "18 Outliers Detected",
        description: "Found 18 data points beyond 2 standard deviations. Review recommended for samples: S-105, S-234, S-567.",
        confidence: 92
      },
      {
        type: "pattern",
        severity: "low",
        title: "Cyclical Pattern Identified",
        description: "Data exhibits a 7-day cyclical pattern with peak values occurring on Thursdays.",
        confidence: 78
      }
    ],
    statistics: {
      mean: 524.3,
      median: 518.0,
      stdDev: 87.6,
      variance: 7673.8,
      skewness: 0.23,
      kurtosis: -0.45
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-green-500";
      case "medium":
        return "text-blue-500";
      case "warning":
        return "text-orange-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <ArrowUpRight className="w-4 h-4" />;
      case "medium":
        return <TrendingUp className="w-4 h-4" />;
      case "warning":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Samples</p>
              <p className="text-2xl font-bold">{analysisData.summary.totalSamples}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-primary/20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Features</p>
              <p className="text-2xl font-bold">{analysisData.summary.features}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500/20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Outliers</p>
              <p className="text-2xl font-bold">{analysisData.summary.outliers}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500/20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Correlations</p>
              <p className="text-2xl font-bold">{analysisData.summary.correlations}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500/20" />
          </div>
        </Card>
      </div>

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends & Predictions</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* AI Insights */}
        <TabsContent value="insights">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 pr-4">
              {analysisData.insights.map((insight, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getSeverityColor(insight.severity)} bg-current/10`}>
                      {getSeverityIcon(insight.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <Badge variant="outline">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {insight.description}
                      </p>
                      <Progress value={insight.confidence} className="h-1" />
                    </div>
                  </div>
                </Card>
              ))}

              <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-2">AI Suggestions</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Consider increasing sample size for weeks showing high variance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Investigate temperature correlation further with controlled experiments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Review data collection protocol for Thursday peaks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Run additional statistical tests on identified outliers</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Trends & Predictions */}
        <TabsContent value="trends">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-primary" />
              Trend Analysis with Predictions
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analysisData.trends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  name="Actual"
                />
                <Area 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="hsl(var(--accent))" 
                  fill="hsl(var(--accent))"
                  fillOpacity={0.1}
                  strokeDasharray="5 5"
                  name="Predicted"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Forecast:</span> Based on current trends, 
                we predict values to reach approximately 750-780 by Week 6, with a 85% confidence interval.
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Statistics */}
        <TabsContent value="statistics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(analysisData.statistics).map(([key, value]) => (
              <Card key={key} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-2xl font-bold mt-1">{value.toFixed(2)}</p>
                  </div>
                  <PieChart className="w-8 h-8 text-primary/20" />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};