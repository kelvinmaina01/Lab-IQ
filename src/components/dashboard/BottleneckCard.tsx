import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingDown, RefreshCw, CheckCircle2, Clock } from "lucide-react";

interface BottleneckData {
  title: string;
  description: string;
  impact_score: number;
  suggested_action: string;
  days_blocked: string;
}

// Sample bottlenecks that rotate
const sampleBottlenecks: BottleneckData[] = [
  {
    title: "Data preprocessing queue",
    description: "7 pending experiments waiting for quality control validation, blocking 2.3 days of downstream work.",
    impact_score: 18,
    suggested_action: "Assign additional reviewer or enable auto-QC for standard protocols",
    days_blocked: "2.3 days"
  },
  {
    title: "ML model training backlog",
    description: "5 AutoML jobs queued due to limited GPU resources, causing 1.5 day delay in results delivery.",
    impact_score: 15,
    suggested_action: "Scale GPU instances or optimize model training schedule",
    days_blocked: "1.5 days"
  },
  {
    title: "Data ingestion rate limit",
    description: "3 device streams hitting API rate limits, causing 30% data loss during peak hours.",
    impact_score: 22,
    suggested_action: "Implement data buffering or upgrade to Pro tier for higher limits",
    days_blocked: "ongoing"
  },
  {
    title: "Report generation delay",
    description: "Weekly reports taking 4+ hours to generate due to complex queries on large datasets.",
    impact_score: 12,
    suggested_action: "Optimize database indexes or pre-aggregate common metrics",
    days_blocked: "0.5 days"
  }
];

export const BottleneckCard = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const bottleneck = sampleBottlenecks[currentIndex];

  const runAIAnalysis = async () => {
    setAnalyzing(true);

    // Simulate AI analysis
    setTimeout(() => {
      // Rotate to next bottleneck
      setCurrentIndex((prev) => (prev + 1) % sampleBottlenecks.length);
      setAnalyzing(false);
    }, 1500);
  };

  return (
    <Card className="p-6 relative overflow-hidden border-orange-500/20 hover:shadow-lg transition-all">
      {/* Top bar with title and actions */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-orange-500 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Active Bottleneck</h3>
            <p className="text-xs text-muted-foreground">AI-identified workflow limiter</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 border-orange-500/50 text-orange-500">
            <TrendingDown className="w-3 h-3" />
            -{bottleneck.impact_score}% flow
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={runAIAnalysis}
            disabled={analyzing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analyzing...' : 'Re-analyze'}
          </Button>
        </div>
      </div>

      {/* Bottleneck description */}
      <div className="space-y-4">
        <div className="p-4 bg-orange-500/5 rounded-lg border border-orange-500/10">
          <p className="text-sm font-medium mb-2 text-orange-700 dark:text-orange-400">
            {bottleneck.title}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {bottleneck.description}
          </p>
        </div>

        {/* Impact stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Clock className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Time Blocked</p>
              <p className="text-sm font-semibold">{bottleneck.days_blocked}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <TrendingDown className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Impact Score</p>
              <p className="text-sm font-semibold">{bottleneck.impact_score}%</p>
            </div>
          </div>
        </div>

        {/* Suggested action */}
        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
              AI Recommendation
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {bottleneck.suggested_action}
            </p>
          </div>
        </div>

        {/* Action button */}
        <Button variant="outline" className="w-full gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Mark as Resolved
        </Button>
      </div>

      {/* Bottom indicator */}
      <div className="flex items-center justify-center gap-1 mt-4 pt-4 border-t">
        {sampleBottlenecks.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 rounded-full transition-all ${idx === currentIndex ? 'w-6 bg-orange-500' : 'w-1.5 bg-muted'
              }`}
          />
        ))}
      </div>
    </Card>
  );
};
