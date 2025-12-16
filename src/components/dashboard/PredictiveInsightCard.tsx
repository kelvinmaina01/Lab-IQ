/**
 * Predictive Insight Card
 * AI-powered ETA predictions and trend analysis
 * Uses the LabIQAI service for intelligent forecasting
 */

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, TrendingDown, Clock, Lock, RefreshCw, Loader2, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { labIQAI } from "@/lib/ai/LabIQAI";

// =============================================================================
// TYPES
// =============================================================================

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

// =============================================================================
// COMPONENT
// =============================================================================

export const PredictiveInsightCard = ({ isPro, onUpgrade }: PredictiveInsightCardProps) => {
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsight = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch real data for prediction
      const [experimentsResult, datasetsResult, workflowsResult] = await Promise.allSettled([
        supabase.from('experiments').select('id, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('datasets').select('id, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('workflows').select('id, status').eq('user_id', user.id),
      ]);

      const experiments = experimentsResult.status === 'fulfilled' ? experimentsResult.value.data || [] : [];
      const datasets = datasetsResult.status === 'fulfilled' ? datasetsResult.value.data || [] : [];
      const workflows = workflowsResult.status === 'fulfilled' ? workflowsResult.value.data || [] : [];

      const activeExperiments = experiments.filter((e: any) => e.status === 'running' || e.status === 'pending').length;
      const completedExperiments = experiments.filter((e: any) => e.status === 'completed').length;
      const successfulWorkflows = workflows.filter((w: any) => w.status === 'completed').length;

      // Calculate velocity based on recent activity
      const recentExperiments = experiments.filter((e: any) => {
        const created = new Date(e.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created > weekAgo;
      }).length;

      const velocityScore = Math.min(100, recentExperiments * 15 + completedExperiments * 5);
      const pipelineFlowScore = workflows.length > 0
        ? Math.round((successfulWorkflows / workflows.length) * 100)
        : 85;

      // Build historical data for prediction (simulate based on counts)
      const historicalData: { date: string; value: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        historicalData.push({
          date: date.toISOString().split('T')[0],
          value: Math.max(0, completedExperiments - i + Math.random() * 2)
        });
      }

      // Calculate basic insight without AI
      let estimatedDays = Math.max(1, 7 - velocityScore / 15);
      let confidenceInterval = Math.max(0.5, 3 - velocityScore / 40);
      let trend: 'up' | 'down' | 'stable' = velocityScore > 50 ? 'up' : velocityScore < 30 ? 'down' : 'stable';
      let insightText = `Based on ${activeExperiments} active experiments and current workflow efficiency.`;

      // Use AI for enhanced prediction if available
      if (labIQAI.isAvailable() && historicalData.length > 0) {
        try {
          const aiResponse = await labIQAI.predictive.process(
            historicalData,
            'experiment completion rate',
            'week'
          );

          if (aiResponse.success && aiResponse.computedData?.predictions?.[0]) {
            const prediction = aiResponse.computedData.predictions[0];
            trend = prediction.trend;
            confidenceInterval = Math.round((1 - prediction.confidence) * 5 * 10) / 10;

            // Extract insight from sections
            const paragraphSection = aiResponse.sections?.find(s => s.type === 'paragraph');
            if (paragraphSection?.content) {
              insightText = paragraphSection.content;
            }
          }

          if (aiResponse.computedData?.trends?.[0]) {
            const trendData = aiResponse.computedData.trends[0];
            if (trendData.direction === 'increasing') {
              estimatedDays = Math.max(1, estimatedDays * 0.8);
            } else if (trendData.direction === 'decreasing') {
              estimatedDays = estimatedDays * 1.2;
            }
          }
        } catch (aiError) {
          console.warn('AI prediction enhancement failed:', aiError);
        }
      }

      setInsight({
        estimatedDays: Math.round(estimatedDays * 10) / 10,
        confidenceInterval: Math.round(confidenceInterval * 10) / 10,
        velocityScore,
        pipelineFlowScore,
        activeExperimentsCount: activeExperiments,
        trend,
        insight: insightText
      });
    } catch (error) {
      console.error('Error fetching insight:', error);
      // Set default values on error
      setInsight({
        estimatedDays: 4.2,
        confidenceInterval: 1.3,
        velocityScore: 23,
        pipelineFlowScore: 94,
        activeExperimentsCount: 0,
        trend: 'stable',
        insight: 'Unable to calculate prediction. Please check your data.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isPro) {
      fetchInsight();
    } else {
      setLoading(false);
    }
  }, [isPro, fetchInsight]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getVelocityLabel = (score: number) => {
    if (score >= 70) return { label: 'High', color: 'text-green-500' };
    if (score >= 40) return { label: 'Moderate', color: 'text-yellow-500' };
    return { label: 'Low', color: 'text-red-500' };
  };

  const getPipelineLabel = (score: number) => {
    if (score >= 90) return { label: 'Optimal', color: 'text-green-500' };
    if (score >= 70) return { label: 'Good', color: 'text-blue-500' };
    if (score >= 50) return { label: 'Fair', color: 'text-yellow-500' };
    return { label: 'Needs Attention', color: 'text-red-500' };
  };

  return (
    <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Predictive Insight ETA</h3>
            <p className="text-xs text-muted-foreground">AI-powered projection</p>
          </div>
        </div>
        {isPro ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              {getTrendIcon(insight?.trend || 'stable')}
              Active
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fetchInsight(true)}
              disabled={refreshing}
              className="h-8 w-8 p-0"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        ) : (
          <Badge variant="outline" className="gap-1">
            <Lock className="w-3 h-3" />
            Pro
          </Badge>
        )}
      </div>

      {isPro ? (
        loading ? (
          <div className="space-y-4">
            <div className="h-12 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="h-6 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ) : insight ? (
          <div className="space-y-4">
            {/* Main Prediction */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{insight.estimatedDays} days</span>
              <span className="text-sm text-muted-foreground">until next breakthrough</span>
            </div>

            {/* Metrics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Experimental velocity</span>
                <span className={`font-medium ${getVelocityLabel(insight.velocityScore).color}`}>
                  {getVelocityLabel(insight.velocityScore).label} (+{insight.velocityScore}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Data pipeline flow</span>
                <span className={`font-medium ${getPipelineLabel(insight.pipelineFlowScore).color}`}>
                  {getPipelineLabel(insight.pipelineFlowScore).label} ({insight.pipelineFlowScore}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confidence interval</span>
                <span className="font-medium">±{insight.confidenceInterval} days</span>
              </div>
            </div>

            {/* AI Insight */}
            <div className="pt-3 border-t">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {insight.insight}
                </p>
              </div>
            </div>
          </div>
        ) : null
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Unlock AI-powered predictions to estimate when your next major insight will arrive based on experimental velocity and data flow patterns.
          </p>
          <Button onClick={onUpgrade} variant="outline" size="sm" className="w-full">
            Upgrade to Pro
          </Button>
        </div>
      )}
    </Card>
  );
};
