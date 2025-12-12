import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Activity, Target, Users, FileText, Clock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [experimentTypeData, setExperimentTypeData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Experiments
      const { data: experiments, error: expError } = await supabase
        .from('experiments')
        .select('*')
        .eq('user_id', user.id);

      if (expError) console.warn('Experiments table:', expError.message);

      // 2. Fetch Datasets
      const { data: datasets, error: dsError } = await supabase
        .from('datasets')
        .select('*')
        .eq('user_id', user.id);

      if (dsError) console.warn('Datasets table:', dsError.message);

      // 3. Fetch Reports (integrated)
      const { data: reports, error: repError } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id);

      if (repError) console.warn('Reports table:', repError.message);

      // 4. Fetch Workflows
      const { data: workflows, error: wfError } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', user.id);

      if (wfError) console.warn('Workflows table:', wfError.message);

      // 5. Fetch ML Models
      const { data: models, error: mlError } = await supabase
        .from('ml_models')
        .select('*')
        .eq('user_id', user.id);

      if (mlError) console.warn('ML Models table:', mlError.message);

      // --- Process Metrics (all connected systems) ---
      const totalExperiments = experiments?.length || 0;
      const successCount = experiments?.filter(e => e.status === 'completed').length || 0;
      const successRate = totalExperiments > 0 ? ((successCount / totalExperiments) * 100).toFixed(1) : "0";

      // Calculate workflow success rate
      const totalWorkflowRuns = workflows?.reduce((sum, w) => sum + (w.successful_runs || 0) + (w.failed_runs || 0), 0) || 0;
      const successfulWorkflowRuns = workflows?.reduce((sum, w) => sum + (w.successful_runs || 0), 0) || 0;
      const workflowSuccessRate = totalWorkflowRuns > 0 ? ((successfulWorkflowRuns / totalWorkflowRuns) * 100).toFixed(0) : "N/A";

      setMetrics([
        {
          title: "Total Experiments",
          value: totalExperiments.toString(),
          change: `${successCount} completed`,
          trend: successCount > 0 ? "up" : "neutral",
          icon: Activity,
          color: "text-blue-500"
        },
        {
          title: "Success Rate",
          value: `${successRate}%`,
          change: `${successCount}/${totalExperiments}`,
          trend: parseFloat(successRate) >= 50 ? "up" : "down",
          icon: Target,
          color: "text-green-500"
        },
        {
          title: "Active Datasets",
          value: (datasets?.length || 0).toString(),
          change: "Ready for analysis",
          trend: "up",
          icon: Users,
          color: "text-purple-500"
        },
        {
          title: "Reports Generated",
          value: (reports?.length || 0).toString(),
          change: reports?.length ? "View all" : "Create first",
          trend: reports?.length ? "up" : "neutral",
          icon: FileText,
          color: "text-orange-500"
        },
      ]);

      // --- Process Recent Activity ---
      const activity = experiments?.slice(0, 5).map(e => ({
        id: e.id,
        action: `Experiment: ${e.title}`,
        user: "You", // Single user for now
        time: new Date(e.created_at).toLocaleDateString(),
        status: e.status
      })) || [];
      setRecentActivity(activity);

      // --- Process Type Distribution ---
      const typeCounts: Record<string, number> = {};
      experiments?.forEach(e => {
        typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
      });

      const typeData = Object.keys(typeCounts).map((type, index) => ({
        name: type,
        value: typeCounts[type],
        color: ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B"][index % 4]
      }));
      setExperimentTypeData(typeData);

      // --- Process Performance Over Time (Mocked structure with real counts if possible) ---
      // For now, we'll keep the chart structure but use real data if we had historical timestamps
      // This is a simplified version
      setPerformanceData([
        { date: "Current", experiments: totalExperiments, success: successCount, pending: experiments?.filter(e => e.status === 'pending').length || 0, failed: experiments?.filter(e => e.status === 'failed').length || 0 }
      ]);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <MainLayout>
        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Track performance, usage, and insights across your lab</p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <Card key={metric.title} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-muted ${metric.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span>{metric.change}</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-1">{metric.value}</h3>
                      <p className="text-sm text-muted-foreground">{metric.title}</p>
                    </Card>
                  );
                })}
              </div>

              {/* Charts */}
              <Tabs defaultValue="distribution" className="mb-8" data-tour="analytics-charts">
                <TabsList className="mb-4">
                  <TabsTrigger value="distribution">Distribution</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="distribution">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Experiment Type Distribution</h3>
                    <div className="h-[350px]">
                      {experimentTypeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={experimentTypeData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {experimentTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No data available
                        </div>
                      )}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="performance">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Experiment Status</h3>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="success" fill="#10B981" name="Success" />
                          <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                          <Bar dataKey="failed" fill="#EF4444" name="Failed" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Recent Activity */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div className="flex items-center gap-4">
                          {activity.status === "completed" ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-orange-500" />
                          )}
                          <div>
                            <p className="font-medium">{activity.action}</p>
                            <p className="text-sm text-muted-foreground">{activity.user}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={activity.status === "completed" ? "default" : "secondary"}>
                            {activity.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{activity.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activity found
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

export default Analytics;
