import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, TrendingDown, Clock, Lock, RefreshCw, Loader2, Minus, Telescope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { labIQAI } from "@/lib/ai/LabIQAI";

interface PredictiveInsightCardProps {
  isPro: boolean;
  onUpgrade: () => void;
}

interface InsightData {
  estimatedDays: number;
  confidenceInterval: number;
  velocityScore: number;
  pipelineFlowScore: number;
  activeExperimentsCount: number;
  trend: 'up' | 'down' | 'stable';
  insight: string;
}

export const PredictiveInsightCard = ({ isPro, onUpgrade }: PredictiveInsightCardProps) => {
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Logic
  const fetchInsight = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Real Data
      const [experimentsResult, workflowsResult] = await Promise.allSettled([
        supabase.from('experiments').select('id, status, created_at, updated_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('workflows').select('id, status, updated_at').eq('user_id', user.id),
      ]);

      const experiments = experimentsResult.status === 'fulfilled' ? experimentsResult.value.data || [] : [];
      const workflows = workflowsResult.status === 'fulfilled' ? workflowsResult.value.data || [] : [];

      const activeExperiments = experiments.filter((e: any) => e.status === 'running' || e.status === 'pending').length;
      const completedExperiments = experiments.filter((e: any) => e.status === 'completed').length;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const experimentsLastWeek = experiments.filter((e: any) => new Date(e.updated_at) > oneWeekAgo && e.status === 'completed').length;
      const velocityScore = Math.min(100, (experimentsLastWeek * 20));

      const successfulWorkflows = workflows.filter((w: any) => w.status === 'completed' || w.status === 'active').length;
      const pipelineFlowScore = workflows.length > 0
        ? Math.round((successfulWorkflows / workflows.length) * 100)
        : 100;

      // 2. Base Heuristic Calculation
      const dailyVelocity = experimentsLastWeek / 7;
      let estimatedDays = activeExperiments > 0
        ? (dailyVelocity > 0 ? activeExperiments / dailyVelocity : 7)
        : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (experimentsLastWeek > 2) trend = 'up';
      if (experimentsLastWeek === 0 && completedExperiments > 0) trend = 'down';

      let insightText = activeExperiments > 0
        ? `Based on a velocity of ${experimentsLastWeek} experiments/week, pending work should clear in ~${Math.round(estimatedDays)} days.`
        : "Pipeline is clear. Ready to ingest new datasets.";

      // 3. AI Enhancement (The "Advanced Intelligence" Layer)
      // Only invoke if Pro and AI is available
      if (labIQAI.isAvailable() && activeExperiments > 0) {
        try {
          // Context construction
          const context = `
            Active Experiments: ${activeExperiments}
            Weekly Velocity: ${experimentsLastWeek}
            Workflow Success Rate: ${pipelineFlowScore}%
            Estimated Days (Linear): ${estimatedDays.toFixed(1)}
            Trend: ${trend}
            `;

          // Ask AI for a more nuanced ETA explanation
          const aiResponse = await labIQAI.quickInsight.process(context, 'eta');

          if (aiResponse.success && aiResponse.content) {
            insightText = aiResponse.content;
          }

          // Could also ask for Risk Factors if needed using another call, 
          // but let's keep it snappy for the dashboard widget.
        } catch (e) {
          console.warn("AI Insight generation failed, falling back to heuristic text.", e);
        }
      }

      setInsight({
        estimatedDays: Math.round(estimatedDays * 10) / 10,
        confidenceInterval: dailyVelocity > 0 ? 1.5 : 3.0,
        velocityScore,
        pipelineFlowScore,
        activeExperimentsCount: activeExperiments,
        trend,
        insight: insightText
      });

    } catch (error) {
      console.error('Error fetching insight:', error);
      setInsight({
        estimatedDays: 0,
        confidenceInterval: 0,
        velocityScore: 0,
        pipelineFlowScore: 0,
        activeExperimentsCount: 0,
        trend: 'stable',
        insight: 'System standby.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isPro) fetchInsight();
    else setLoading(false);
  }, [isPro, fetchInsight]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-rose-500" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Telescope className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              Predictive Intelligence
              {isPro && <Brain className="w-3 h-3 text-primary animate-pulse" />}
            </h3>
            <p className="text-xs text-muted-foreground">Operational Forecast</p>
          </div>
        </div>
        {isPro ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 bg-background/50">
              {getTrendIcon(insight?.trend || 'stable')}
              {insight?.activeExperimentsCount} Active
            </Badge>
            <Button size="sm" variant="ghost" onClick={() => fetchInsight(true)} disabled={refreshing} className="h-8 w-8 p-0">
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        ) : (
          <Badge variant="outline" className="gap-1"><Lock className="w-3 h-3" /> Pro</Badge>
        )}
      </div>

      {isPro ? (
        loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-12 bg-muted/50 rounded" />
            <div className="h-20 bg-muted/50 rounded" />
          </div>
        ) : insight ? (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{insight.estimatedDays > 0 ? `${insight.estimatedDays} days` : "Standby"}</span>
              <span className="text-sm text-muted-foreground">{insight.estimatedDays > 0 ? "to completion" : "System Ready"}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Experiment Velocity</span>
                <span className="font-medium text-emerald-600">{insight.velocityScore}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pipeline Flow</span>
                <span className="font-medium text-blue-600">{insight.pipelineFlowScore}%</span>
              </div>
            </div>

            <div className="pt-3 border-t border-dashed">
              <div className="flex items-start gap-2">
                <Brain className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">{insight.insight}</p>
              </div>
            </div>
          </div>
        ) : null
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Unlock predictive intelligence to forecast experiment completion and resource needs.</p>
          <Button onClick={onUpgrade} variant="outline" size="sm" className="w-full">Upgrade to Pro</Button>
        </div>
      )}
    </Card>
  );
};
