import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, AlertCircle, Target, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NextAction {
  id: string;
  priority: string;
  title: string;
  description: string;
  impact_percentage: number;
  icon: string;
  completed_at: string | null;
}

const iconMap: Record<string, any> = {
  Zap,
  AlertCircle,
  Target
};

export const NextActionsPanel = () => {
  const [actions, setActions] = useState<NextAction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('next_actions')
        .select('*')
        .eq('user_id', user.id)
        .is('completed_at', null)
        .order('priority', { ascending: true })
        .order('impact_percentage', { ascending: false })
        .limit(3);

      if (error) throw error;

      if (data && data.length > 0) {
        setActions(data);
      } else {
        // Create default actions if none exist
        const defaultActions = [
          {
            user_id: user.id,
            priority: "critical",
            title: "Review queued preprocessing jobs",
            description: "7 experiments waiting for QC validation - unblocks 2.3 days of work",
            impact_percentage: 18,
            icon: "Zap"
          },
          {
            user_id: user.id,
            priority: "high",
            title: "Approve Model Training #51 parameters",
            description: "Dataset ready, awaiting hyperparameter confirmation to start training",
            impact_percentage: 12,
            icon: "AlertCircle"
          },
          {
            user_id: user.id,
            priority: "medium",
            title: "Schedule team sync on Experiment A-47",
            description: "Results show 94.2% accuracy - ready for stakeholder review",
            impact_percentage: 8,
            icon: "Target"
          }
        ];

        await supabase.from('next_actions').insert(defaultActions);
        
        const { data: newData } = await supabase
          .from('next_actions')
          .select('*')
          .eq('user_id', user.id)
          .is('completed_at', null)
          .order('priority', { ascending: true })
          .limit(3);

        if (newData) setActions(newData);
      }
    } catch (error) {
      console.error('Error fetching actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAction = async (actionId: string) => {
    try {
      const { error } = await supabase
        .from('next_actions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', actionId);

      if (error) throw error;

      toast({
        title: "Action completed",
        description: "Great work! This action has been marked as complete.",
      });

      fetchActions();
    } catch (error) {
      console.error('Error completing action:', error);
      toast({
        title: "Error",
        description: "Failed to complete action.",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Auto-Prioritized Next Actions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Top 3 actions that unblock highest delta this week
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Zap className="w-3 h-3" />
          AI Ranked
        </Badge>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-20 bg-muted rounded-lg animate-pulse" />
          <div className="h-20 bg-muted rounded-lg animate-pulse" />
          <div className="h-20 bg-muted rounded-lg animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>All caught up! No pending actions.</p>
            </div>
          ) : (
            actions.map((action) => {
              const Icon = iconMap[action.icon] || Zap;
              const colorClass = getPriorityColor(action.priority);
              
              return (
                <div 
                  key={action.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg bg-background flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{action.title}</h3>
                      <Badge 
                        variant={action.priority === "critical" ? "destructive" : "outline"}
                        className="text-xs"
                      >
                        +{action.impact_percentage}% velocity
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>

                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="flex-shrink-0"
                    onClick={() => handleCompleteAction(action.id)}
                  >
                    Complete
                    <CheckCircle2 className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}
    </Card>
  );
};
