import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SubscriptionTier = 'free' | 'pro' | 'student';

export interface SubscriptionLimits {
  tier: SubscriptionTier;
  storage_limit_mb: number;
  max_datasets: number;
  max_experiments: number;
  max_automations: number;
  max_collaborators: number;
  ai_requests_per_month: number;
  student_verified: boolean;
}

export interface UsageStats {
  storage_used_mb: number;
  ai_requests_used: number;
  datasets_count: number;
  experiments_count: number;
  automations_count: number;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionLimits | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      
      const { data, error } = await supabase
        .from('usage_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUsage(data || {
        storage_used_mb: 0,
        ai_requests_used: 0,
        datasets_count: 0,
        experiments_count: 0,
        automations_count: 0,
      });
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSubscription(), fetchUsage()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  const checkLimit = (type: keyof SubscriptionLimits, currentCount: number): boolean => {
    if (!subscription) return false;
    const limit = subscription[type];
    if (typeof limit === 'number' && currentCount >= limit) {
      toast({
        title: "Limit Reached",
        description: `You've reached your ${type.replace(/_/g, ' ')} limit. Upgrade to Pro for more!`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const isPro = subscription?.tier === 'pro' || subscription?.tier === 'student';

  return {
    subscription,
    usage,
    loading,
    checkLimit,
    isPro,
    refetch: () => {
      fetchSubscription();
      fetchUsage();
    }
  };
};
