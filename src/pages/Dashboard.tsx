import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Database, Brain, FlaskConical, Activity, BarChart3, Zap, ArrowRight, Wifi, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import MetricCard from "@/components/MetricCard";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useSubscription } from "@/hooks/useSubscription";
import { UsageCard } from "@/components/UsageCard";
import { Badge } from "@/components/ui/badge";
import { PredictiveInsightCard } from "@/components/dashboard/PredictiveInsightCard";
import { BottleneckCard } from "@/components/dashboard/BottleneckCard";
import { LabProfileSelector } from "@/components/dashboard/LabProfileSelector";
import { NextActionsPanel } from "@/components/dashboard/NextActionsPanel";
import { ProUnlocksDrawer } from "@/components/dashboard/ProUnlocksDrawer";
import { CommandCenterCard } from "@/components/dashboard/CommandCenterCard"; // New Component
import { MainLayout } from "@/components/layout/MainLayout";

const Dashboard = () => {
  const navigate = useNavigate();
  const { subscription, usage, loading, isPro } = useSubscription();

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
        // Create default activities if absolute zero (fresh account)
        const defaultActivities = [
          { user_id: user.id, action: "System Initialized", item: "LabIQ Account Created", icon: "Database" },
        ];
        // We only insert if truly empty to avoid spam in real usage
        if (!data || data.length === 0) {
          await supabase.from('activities').insert(defaultActivities);
          fetchActivities();
        }
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
            <p className="text-muted-foreground">Loading Command Center...</p>
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
            <h1 className="text-4xl font-bold mb-2">Command Center</h1>
            <p className="text-muted-foreground">Operational status and health signals</p>
          </div>
          <div className="flex items-center gap-3">
            {!isPro && <ProUnlocksDrawer onUpgrade={() => navigate('/pricing')} />}
            <LabProfileSelector />
          </div>
        </div>

        {/* Top Row: Command Center & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          <CommandCenterCard />
          <div className="lg:col-span-4 space-y-6">
            <NextActionsPanel />
          </div>
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PredictiveInsightCard isPro={isPro} onUpgrade={() => navigate('/pricing')} />
          <BottleneckCard />
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total Datasets"
            value={usage?.datasets_count || 0}
            description={`${subscription?.max_datasets || 5} limit`}
            icon={Database}
            trend="Files stored"
            iconColor="text-blue-500"
          />
          <MetricCard
            title="Active Experiments"
            value={usage?.experiments_count || 0}
            description={`${subscription?.max_experiments || 10} limit`}
            icon={FlaskConical}
            trend="Running/Complete"
            iconColor="text-purple-500"
          />
          <MetricCard
            title="AI Requests"
            value={usage?.ai_requests_used || 0}
            description={`${subscription?.ai_requests_per_month || 100} / mo`}
            icon={Brain}
            trend="Intelligence usage"
            iconColor="text-green-500"
          />
          <MetricCard
            title="Automations"
            value={usage?.automations_count || 0}
            description={`${subscription?.max_automations || 3} limit`}
            icon={Zap}
            trend="Active workflows"
            iconColor="text-orange-500"
          />
        </div>

        {/* Quick Access & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Left Col: Special Features & Usage */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/device-streams">
                <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-primary/20 hover:border-primary/40 bg-gradient-to-br from-background to-primary/5 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Wifi className="w-6 h-6 text-primary" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Live Device Streams</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Real-time IoT monitoring
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {isPro ? "Pro Feature" : "1 stream"}
                  </Badge>
                </Card>
              </Link>

              <Link to="/data-anonymization">
                <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-accent/20 hover:border-accent/40 bg-gradient-to-br from-background to-accent/5 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-accent/10">
                      <Shield className="w-6 h-6 text-accent" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Data Anonymization</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    PII/PHI detection pipeline
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {isPro ? "Enterprise" : "Pro"}
                  </Badge>
                </Card>
              </Link>
            </div>

            {/* Usage Stats (Horizontal) */}
            <div className="grid grid-cols-3 gap-4">
              <UsageCard title="Storage" used={usage?.storage_used_mb || 0} limit={subscription?.storage_limit_mb || 200} unit="MB" onUpgrade={() => navigate('/pricing')} isPro={isPro} />
              <UsageCard title="AI Ops" used={usage?.ai_requests_used || 0} limit={subscription?.ai_requests_per_month || 100} unit="req" onUpgrade={() => navigate('/pricing')} isPro={isPro} />
              <UsageCard title="Datasets" used={usage?.datasets_count || 0} limit={subscription?.max_datasets || 5} unit="files" onUpgrade={() => navigate('/pricing')} isPro={isPro} />
            </div>
          </div>

          {/* Right Col: Recent Activity */}
          <div className="lg:col-span-5">
            <Card className="p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Activity Feed</h2>
                <Badge variant="secondary" className="gap-1">
                  <Activity className="w-3 h-3" />
                  Live
                </Badge>
              </div>
              {loadingActivities ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="hidden md:block w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none mb-1">{activity.action}</p>
                          <p className="text-xs text-muted-foreground truncate">{activity.item}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 text-right">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>

      </MainLayout>
    </AuthGuard>
  );
};

export default Dashboard;
