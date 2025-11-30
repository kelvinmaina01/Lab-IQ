import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { TrendingUp, TrendingDown, Activity, Award, AlertCircle, CheckCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from "@/hooks/use-toast";

const Insights = () => {
  const [bottlenecksData, setBottlenecksData] = useState<any[]>([]);
  const [predictiveData, setPredictiveData] = useState<any[]>([]);
  const [activityTrends, setActivityTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch bottlenecks over time
      const { data: bottlenecks } = await supabase
        .from('bottlenecks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // Fetch predictive insights over time
      const { data: insights } = await supabase
        .from('predictive_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // Fetch activities over time
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // Process bottlenecks data for charts
      const bottlenecksGrouped = bottlenecks?.reduce((acc: any, b: any) => {
        const week = new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const existing = acc.find((item: any) => item.week === week);
        if (existing) {
          existing.count += 1;
          existing.avgImpact = (existing.avgImpact + b.impact_score) / 2;
          if (b.resolved_at) existing.resolved += 1;
        } else {
          acc.push({
            week,
            count: 1,
            avgImpact: b.impact_score,
            resolved: b.resolved_at ? 1 : 0
          });
        }
        return acc;
      }, []) || [];

      // Process predictive insights for velocity trends
      const velocityTrends = insights?.map((i: any) => ({
        date: new Date(i.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        velocity: i.velocity_score,
        pipelineFlow: i.pipeline_flow_score,
        experiments: i.active_experiments_count,
      })) || [];

      // Process activities for trend analysis
      const activitiesGrouped = activities?.reduce((acc: any, a: any) => {
        const day = new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const existing = acc.find((item: any) => item.day === day);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({ day, count: 1 });
        }
        return acc;
      }, []) || [];

      setBottlenecksData(bottlenecksGrouped);
      setPredictiveData(velocityTrends);
      setActivityTrends(activitiesGrouped.slice(-14)); // Last 14 days
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary metrics
  const totalBottlenecks = bottlenecksData.reduce((sum, d) => sum + d.count, 0);
  const resolvedBottlenecks = bottlenecksData.reduce((sum, d) => sum + d.resolved, 0);
  const resolutionRate = totalBottlenecks > 0 ? ((resolvedBottlenecks / totalBottlenecks) * 100).toFixed(1) : '0';
  const avgVelocity = predictiveData.length > 0 
    ? (predictiveData.reduce((sum, d) => sum + d.velocity, 0) / predictiveData.length).toFixed(1)
    : '0';
  const totalActivities = activityTrends.reduce((sum, d) => sum + d.count, 0);

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-analytics', {
        body: { format }
      });

      if (error) throw error;

      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lab-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lab-analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }

      toast({
        title: "Export Complete",
        description: `Analytics exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="md:ml-64 pb-16 md:pb-0">
          <TopBar />
          
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Lab Analytics</h1>
                <p className="text-muted-foreground">Track trends in efficiency, velocity, and bottleneck resolution</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('json')}
                  disabled={exporting}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Avg Lab Velocity</p>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold mb-1">{avgVelocity}%</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  +5% from last period
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Bottlenecks Resolved</p>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold mb-1">{resolvedBottlenecks}</p>
                <p className="text-xs text-muted-foreground">{resolutionRate}% resolution rate</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Activities</p>
                  <Award className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold mb-1">{totalActivities}</p>
                <p className="text-xs text-muted-foreground">Last 14 days</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Active Bottlenecks</p>
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold mb-1">{totalBottlenecks - resolvedBottlenecks}</p>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Lab Velocity Trend */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Lab Velocity Trend</h2>
                  <Badge variant="secondary">Last 30 days</Badge>
                </div>
                {predictiveData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={predictiveData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="velocity" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Velocity Score"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pipelineFlow" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        name="Pipeline Flow"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No velocity data available yet
                  </div>
                )}
              </Card>

              {/* Bottleneck Analysis */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Bottleneck Analysis</h2>
                  <Badge variant="secondary">Weekly</Badge>
                </div>
                {bottlenecksData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bottlenecksData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="week" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="hsl(var(--destructive))" name="Detected" />
                      <Bar dataKey="resolved" fill="hsl(var(--primary))" name="Resolved" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No bottleneck data available yet
                  </div>
                )}
              </Card>
            </div>

            {/* Activity Heatmap */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Daily Activity Trend</h2>
                <Badge variant="secondary">Last 14 days</Badge>
              </div>
              {activityTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={activityTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Activities" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No activity data available yet
                </div>
              )}
            </Card>
          </div>
        </div>
        <MobileNav />
      </div>
    </AuthGuard>
  );
};

export default Insights;