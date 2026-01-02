/**
 * Subscription Hook (Legacy compatibility wrapper)
 * Wraps the new use-subscription hook for backward compatibility
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise' | 'student';

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

// Plan defaults matching the pricing page
const PLAN_DEFAULTS: Record<string, SubscriptionLimits> = {
  free: {
    tier: 'free',
    storage_limit_mb: 100,
    max_datasets: 5,
    max_experiments: 10,
    max_automations: 3,
    max_collaborators: 1,
    ai_requests_per_month: 100,
    student_verified: false,
  },
  pro: {
    tier: 'pro',
    storage_limit_mb: 10240, // 10 GB
    max_datasets: 100,
    max_experiments: -1, // unlimited
    max_automations: -1, // unlimited
    max_collaborators: 5,
    ai_requests_per_month: 10000,
    student_verified: false,
  },
  team: {
    tier: 'team',
    storage_limit_mb: 51200, // 50 GB
    max_datasets: 500,
    max_experiments: -1,
    max_automations: -1,
    max_collaborators: 25,
    ai_requests_per_month: -1, // unlimited
    student_verified: false,
  },
  enterprise: {
    tier: 'enterprise',
    storage_limit_mb: -1, // unlimited
    max_datasets: -1,
    max_experiments: -1,
    max_automations: -1,
    max_collaborators: -1,
    ai_requests_per_month: -1,
    student_verified: false,
  },
  student: {
    tier: 'student',
    storage_limit_mb: 10240,
    max_datasets: 100,
    max_experiments: -1,
    max_automations: -1,
    max_collaborators: 5,
    ai_requests_per_month: 10000,
    student_verified: true,
  },
};

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionLimits | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscription(PLAN_DEFAULTS.free);
        return;
      }

      // Check for student verification in user metadata
      const isStudentVerified = user.user_metadata?.student_verified === true;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205' && error.code !== '42P01') {
        console.warn('Subscription fetch error:', error.message);
      }

      if (data) {
        // Map from new schema (plan) to old schema (tier)
        const plan = data.plan || 'free';
        const defaults = PLAN_DEFAULTS[plan] || PLAN_DEFAULTS.free;

        setSubscription({
          tier: isStudentVerified ? 'student' : plan as SubscriptionTier,
          storage_limit_mb: data.storage_limit_mb || defaults.storage_limit_mb,
          max_datasets: data.datasets_limit || defaults.max_datasets,
          max_experiments: defaults.max_experiments,
          max_automations: defaults.max_automations,
          max_collaborators: data.team_members_limit || defaults.max_collaborators,
          ai_requests_per_month: defaults.ai_requests_per_month,
          student_verified: isStudentVerified,
        });
      } else {
        // No subscription found - use free tier (or student if verified)
        setSubscription(isStudentVerified ? PLAN_DEFAULTS.student : PLAN_DEFAULTS.free);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(PLAN_DEFAULTS.free);
    }
  };

  const fetchUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUsage({
          storage_used_mb: 0,
          ai_requests_used: 0,
          datasets_count: 0,
          experiments_count: 0,
          automations_count: 0,
        });
        return;
      }

      // Get actual counts from database
      const [datasetsResult, experimentsResult, workflowsResult] = await Promise.all([
        supabase.from('datasets').select('id, file_size', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('experiments').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('workflows').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      // Calculate total storage from file_size (in bytes) and convert to MB
      let totalStorageMB = 0;
      if (datasetsResult.data && datasetsResult.data.length > 0) {
        const totalBytes = datasetsResult.data.reduce((sum, dataset) => {
          const fileSize = dataset.file_size || 0;
          return sum + fileSize;
        }, 0);
        totalStorageMB = Math.round((totalBytes / (1024 * 1024)) * 100) / 100; // Convert to MB with 2 decimals
      }

      setUsage({
        storage_used_mb: totalStorageMB,
        ai_requests_used: 0, // Would need a tracking table
        datasets_count: datasetsResult.count || 0,
        experiments_count: experimentsResult.count || 0,
        automations_count: workflowsResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching usage:', error);
      setUsage({
        storage_used_mb: 0,
        ai_requests_used: 0,
        datasets_count: 0,
        experiments_count: 0,
        automations_count: 0,
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSubscription(), fetchUsage()]);
      setLoading(false);
    };

    loadData();

    // Listen for auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      loadData();
    });

    return () => {
      authSub.unsubscribe();
    };
  }, []);

  const checkLimit = (type: keyof SubscriptionLimits, currentCount: number): boolean => {
    if (!subscription) return false;
    const limit = subscription[type];
    if (typeof limit === 'number' && limit !== -1 && currentCount >= limit) {
      toast({
        title: "Limit Reached",
        description: `You've reached your ${type.replace(/_/g, ' ')} limit. Upgrade to Pro for more!`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const isPro = subscription?.tier === 'pro' || subscription?.tier === 'team' ||
    subscription?.tier === 'enterprise' || subscription?.tier === 'student';
  const isTeam = subscription?.tier === 'team' || subscription?.tier === 'enterprise';
  const isEnterprise = subscription?.tier === 'enterprise';

  return {
    subscription,
    usage,
    loading,
    checkLimit,
    isPro,
    isTeam,
    isEnterprise,
    refetch: () => {
      fetchSubscription();
      fetchUsage();
    }
  };
};
