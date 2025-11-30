import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingDown, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BottleneckData {
  title: string;
  description: string;
  impact_score: number;
  suggested_action: string | null;
}

export const BottleneckCard = () => {
  const [bottleneck, setBottleneck] = useState<BottleneckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBottleneck();
  }, []);

  const runAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-bottlenecks', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      if (data?.bottleneck) {
        setBottleneck(data.bottleneck);
        toast({
          title: "Analysis Complete",
          description: "AI has identified a new bottleneck in your workflow.",
        });
      }
    } catch (error: any) {
      console.error('Error running AI analysis:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze workflow. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchBottleneck = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bottlenecks')
        .select('*')
        .eq('user_id', user.id)
        .is('resolved_at', null)
        .order('impact_score', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBottleneck(data);
      } else {
        // Create a default bottleneck if none exists
        const defaultBottleneck = {
          user_id: user.id,
          title: "Data preprocessing queue",
          description: "7 pending experiments waiting for quality control validation, blocking 2.3 days of downstream work.",
          impact_score: 18,
          suggested_action: "Assign additional reviewer or enable auto-QC for standard protocols"
        };

        await supabase.from('bottlenecks').insert(defaultBottleneck);
        setBottleneck(defaultBottleneck);
      }
    } catch (error) {
      console.error('Error fetching bottleneck:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 relative overflow-hidden border-orange-500/20">
        <div className="space-y-4">
          <div className="h-16 bg-muted rounded animate-pulse" />
          <div className="h-12 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  if (!bottleneck) return null;

  return (
    <Card className="p-6 relative overflow-hidden border-orange-500/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Bottleneck of the Week</h3>
            <p className="text-xs text-muted-foreground">AI-identified limiter</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 border-orange-500/50 text-orange-500">
            <TrendingDown className="w-3 h-3" />
            -{bottleneck.impact_score}% flow
          </Badge>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={runAIAnalysis}
            disabled={analyzing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analyzing...' : 'Re-analyze'}
          </Button>
        </div>
      </div>

      <p className="text-sm leading-relaxed mb-4">
        <span className="font-medium">{bottleneck.title}:</span> {bottleneck.description}
      </p>

      {bottleneck.suggested_action && (
        <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded-lg">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Suggested action:</span> {bottleneck.suggested_action}
          </div>
        </div>
      )}
    </Card>
  );
};
