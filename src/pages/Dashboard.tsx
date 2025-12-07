import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Database, Brain, FlaskConical, Award, Activity, BarChart3, Zap, Info, Wifi, Shield, ArrowRight, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import MetricCard from "@/components/MetricCard";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useSubscription } from "@/hooks/useSubscription";
import { UsageCard } from "@/components/UsageCard";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { Badge } from "@/components/ui/badge";
import { PredictiveInsightCard } from "@/components/dashboard/PredictiveInsightCard";
import { BottleneckCard } from "@/components/dashboard/BottleneckCard";
import { LabProfileSelector } from "@/components/dashboard/LabProfileSelector";
import { NextActionsPanel } from "@/components/dashboard/NextActionsPanel";
import { ProUnlocksDrawer } from "@/components/dashboard/ProUnlocksDrawer";
import { ModelPerformanceWidget } from "@/components/dashboard/ModelPerformanceWidget";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MainLayout } from "@/components/layout/MainLayout";
import { useOnboarding } from "@/hooks/use-onboarding";

const Dashboard = () => {
  const { subscription, usage, loading, isPro } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { resetOnboarding } = useOnboarding();

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data && data.length > 0) {
        const iconMap: Record<string, any> = {
          Database,
          FlaskConical,
          Brain,
          BarChart3,
          Zap
        };

        const activities = data.map(activity => ({
          id: activity.id,
          action: activity.action,
          item: activity.item,
          time: formatTimeAgo(activity.created_at),
          icon: iconMap[activity.icon] || Database
        }));

        setRecentActivities(activities);
      } else {
        // Create default activities
        const defaultActivities = [
          { user_id: user.id, action: "Dataset uploaded", item: "cancer_research_2024.csv", icon: "Database" },
          { user_id: user.id, action: "Experiment completed", item: "Model Training #47", icon: "FlaskConical" },
          { user_id: user.id, action: "AI Analysis generated", item: "Correlation Analysis", icon: "Brain" },
          { user_id: user.id, action: "Report exported", item: "Monthly Summary", icon: "BarChart3" },
          { user_id: user.id, action: "Automation triggered", item: "Data Pipeline #3", icon: "Zap" },
        ];

        await supabase.from('activities').insert(defaultActivities);
        fetchActivities();
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <MainLayout>
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold mb-2">Mission Control</h1>
            <p className="text-muted-foreground">Real-time pulse of your research lab with predictive insights</p>
          </div>
          <div className="flex items-center gap-3">
            {!isPro && <ProUnlocksDrawer onUpgrade={() => setUpgradeOpen(true)} />}
            <LabProfileSelector />
          </div>
        </div>

        {/* Key Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PredictiveInsightCard isPro={isPro} onUpgrade={() => setUpgradeOpen(true)} />
          <BottleneckCard />
        </div>

        {/* Model Performance Widget (New) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ModelPerformanceWidget />
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-tour="dashboard-stats">
          <MetricCard
            title="Total Datasets"
            value={usage?.datasets_count || 0}
            description={`${subscription?.max_datasets || 5} maximum`}
            icon={Database}
            trend="+2 from last week"
            iconColor="text-blue-500"
          />
          <MetricCard
            title="Active Experiments"
            value={usage?.experiments_count || 0}
            description={`${subscription?.max_experiments || 10} maximum`}
            icon={FlaskConical}
            trend="+1 running"
            iconColor="text-purple-500"
          />
          <MetricCard
            title="AI Requests"
            value={usage?.ai_requests_used || 0}
            description={`${subscription?.ai_requests_per_month || 100} per month`}
            icon={Brain}
            trend="+12 this week"
            iconColor="text-green-500"
          />
          <MetricCard
            title="Automations"
            value={usage?.automations_count || 0}
            description={`${subscription?.max_automations || 3} maximum`}
            icon={Zap}
            trend="All active"
            iconColor="text-orange-500"
          />
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <UsageCard
            title="Storage Used"
            used={usage?.storage_used_mb || 0}
            limit={subscription?.storage_limit_mb || 200}
            unit="MB"
            onUpgrade={() => setUpgradeOpen(true)}
            isPro={isPro}
          />
          <UsageCard
            title="AI Requests"
            used={usage?.ai_requests_used || 0}
            limit={subscription?.ai_requests_per_month || 100}
            unit="requests"
            onUpgrade={() => setUpgradeOpen(true)}
            isPro={isPro}
          />
          <UsageCard
            title="Datasets"
            used={usage?.datasets_count || 0}
            limit={subscription?.max_datasets || 5}
            unit="datasets"
            onUpgrade={() => setUpgradeOpen(true)}
            isPro={isPro}
          />
        </div>

        {/* Quick Access - Device Streams & Data Anonymization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Link to="/device-streams">
            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-primary/20 hover:border-primary/40 bg-gradient-to-br from-background to-primary/5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Wifi className="w-6 h-6 text-primary" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Device Streams</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Real-time monitoring of connected IoT laboratory devices with live metrics and alerts
              </p>
              <Badge variant="secondary" className="text-xs">
                {isPro ? "Pro Feature" : "1 stream on free"}
              </Badge>
            </Card>
          </Link>

          <Link to="/data-anonymization">
            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-accent/20 hover:border-accent/40 bg-gradient-to-br from-background to-accent/5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Data Anonymization</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Automated PII/PHI detection and GDPR-compliant data processing pipelines
              </p>
              <Badge variant="secondary" className="text-xs">
                {isPro ? "Enterprise Ready" : "Pro Feature"}
              </Badge>
            </Card>
          </Link>
        </div>

        {/* Recent Activity & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <Badge variant="secondary" className="gap-1">
                <Activity className="w-3 h-3" />
                Live
              </Badge>
            </div>
            {loadingActivities ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.item}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">Lab Efficiency Score</h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs font-semibold mb-1">Formula Breakdown:</p>
                    <p className="text-xs mb-2">
                      Score = (Model Accuracy × 0.3) + (Processing Speed × 0.25) + (Data Quality × 0.25) + (Team Collaboration × 0.2)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Normalized against {isPro ? "industry" : "baseline"} benchmarks
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Model Accuracy</span>
                  <span className="text-sm text-muted-foreground">94.2%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '94.2%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Processing Speed</span>
                  <span className="text-sm text-muted-foreground">87.5%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '87.5%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Data Quality</span>
                  <span className="text-sm text-muted-foreground">91.8%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: '91.8%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Team Collaboration</span>
                  <span className="text-sm text-muted-foreground">96.3%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: '96.3%' }} />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">92% Lab Efficiency</p>
                    {isPro && <Badge variant="secondary" className="text-xs">Top 15%</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isPro ? "Above industry average (78%)" : "Great performance this week"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Auto-Prioritized Actions */}
        <NextActionsPanel />

        <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />

        {/* Tour CTA Button - Floating */}
        <Button
          onClick={resetOnboarding}
          className="fixed bottom-6 right-6 z-50 gap-2 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 animate-in slide-in-from-bottom duration-500"
          size="sm"
        >
          <Bot className="w-4 h-4" />
          Take a Tour
        </Button>
      </MainLayout>
    </AuthGuard>
  );
};

export default Dashboard;
