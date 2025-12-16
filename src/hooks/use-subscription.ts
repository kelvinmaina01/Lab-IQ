/**
 * Subscription Hook
 * Manages user subscription state and plan limits
 * Synchronized with Pricing page plans
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PlanType = 'free' | 'pro' | 'team' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trialing';

export interface SubscriptionFeatures {
  aiModels: number;
  analysisModes: number;
  apiAccess: boolean;
  prioritySupport: boolean;
  phoneSupport: boolean;
  dedicatedManager: boolean;
  customIntegrations: boolean;
  sso: boolean;
  realTimeInsights: boolean;
  realTimeChat: boolean;
  commentsAndTasks: boolean;
  versionHistory: boolean;
  auditLogs: boolean;
  advancedVisualizations: boolean;
  exportToPdf: boolean;
  workflowAutomation: boolean;
  customReports: boolean;
}

export interface Subscription {
  plan: PlanType;
  status: SubscriptionStatus;
  datasetsLimit: number;
  storageLimitMb: number;
  fileSizeLimitMb: number;
  teamMembersLimit: number;
  features: SubscriptionFeatures;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

// Plan pricing (synced with Pricing.tsx)
export const PLAN_PRICING = {
  free: { monthly: 0, annual: 0 },
  pro: { monthly: 49, annual: 39 },
  team: { monthly: 149, annual: 119 },
  enterprise: { monthly: null, annual: null }
} as const;

// Plan limits and features (single source of truth)
export const PLAN_LIMITS: Record<PlanType, Subscription> = {
  free: {
    plan: 'free',
    status: 'active',
    datasetsLimit: 5,
    storageLimitMb: 100,
    fileSizeLimitMb: 10,
    teamMembersLimit: 1,
    features: {
      aiModels: 3,
      analysisModes: 1,
      apiAccess: false,
      prioritySupport: false,
      phoneSupport: false,
      dedicatedManager: false,
      customIntegrations: false,
      sso: false,
      realTimeInsights: false,
      realTimeChat: false,
      commentsAndTasks: false,
      versionHistory: false,
      auditLogs: false,
      advancedVisualizations: false,
      exportToPdf: false,
      workflowAutomation: false,
      customReports: false
    },
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false
  },
  pro: {
    plan: 'pro',
    status: 'active',
    datasetsLimit: 100,
    storageLimitMb: 10240, // 10 GB
    fileSizeLimitMb: 50,
    teamMembersLimit: 5,
    features: {
      aiModels: 16,
      analysisModes: 3,
      apiAccess: true,
      prioritySupport: true,
      phoneSupport: false,
      dedicatedManager: false,
      customIntegrations: false,
      sso: false,
      realTimeInsights: true,
      realTimeChat: true,
      commentsAndTasks: true,
      versionHistory: true,
      auditLogs: false,
      advancedVisualizations: true,
      exportToPdf: true,
      workflowAutomation: true,
      customReports: true
    },
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false
  },
  team: {
    plan: 'team',
    status: 'active',
    datasetsLimit: 500,
    storageLimitMb: 51200, // 50 GB
    fileSizeLimitMb: 100,
    teamMembersLimit: 25,
    features: {
      aiModels: 16,
      analysisModes: 3,
      apiAccess: true,
      prioritySupport: true,
      phoneSupport: true,
      dedicatedManager: false,
      customIntegrations: true,
      sso: false,
      realTimeInsights: true,
      realTimeChat: true,
      commentsAndTasks: true,
      versionHistory: true,
      auditLogs: true,
      advancedVisualizations: true,
      exportToPdf: true,
      workflowAutomation: true,
      customReports: true
    },
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false
  },
  enterprise: {
    plan: 'enterprise',
    status: 'active',
    datasetsLimit: -1, // unlimited
    storageLimitMb: -1, // unlimited
    fileSizeLimitMb: 200,
    teamMembersLimit: -1, // unlimited
    features: {
      aiModels: -1, // unlimited/custom
      analysisModes: -1, // all + custom
      apiAccess: true,
      prioritySupport: true,
      phoneSupport: true,
      dedicatedManager: true,
      customIntegrations: true,
      sso: true,
      realTimeInsights: true,
      realTimeChat: true,
      commentsAndTasks: true,
      versionHistory: true,
      auditLogs: true,
      advancedVisualizations: true,
      exportToPdf: true,
      workflowAutomation: true,
      customReports: true
    },
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false
  }
};

// Feature descriptions for UI
export const FEATURE_DESCRIPTIONS: Record<keyof SubscriptionFeatures, { name: string; description: string; requiredPlan: PlanType }> = {
  aiModels: { name: 'AI Models', description: 'Number of AI models available for analysis', requiredPlan: 'free' },
  analysisModes: { name: 'Analysis Modes', description: 'Analysis, Educator, and Prediction modes', requiredPlan: 'free' },
  apiAccess: { name: 'API Access', description: 'Programmatic access to Lab-IQ APIs', requiredPlan: 'pro' },
  prioritySupport: { name: 'Priority Support', description: '24-hour response time', requiredPlan: 'pro' },
  phoneSupport: { name: 'Phone Support', description: 'Direct phone support line', requiredPlan: 'team' },
  dedicatedManager: { name: 'Dedicated Manager', description: 'Personal account manager', requiredPlan: 'enterprise' },
  customIntegrations: { name: 'Custom Integrations', description: 'Connect your existing tools', requiredPlan: 'team' },
  sso: { name: 'SSO/SAML', description: 'Single sign-on integration', requiredPlan: 'enterprise' },
  realTimeInsights: { name: 'Real-time Insights', description: 'Live AI-powered data analysis', requiredPlan: 'pro' },
  realTimeChat: { name: 'Real-time Chat', description: 'Team chat within datasets', requiredPlan: 'pro' },
  commentsAndTasks: { name: 'Comments & Tasks', description: 'Collaborate with threaded comments', requiredPlan: 'pro' },
  versionHistory: { name: 'Version History', description: 'Track changes over time', requiredPlan: 'pro' },
  auditLogs: { name: 'Audit Logs', description: 'Complete activity tracking', requiredPlan: 'team' },
  advancedVisualizations: { name: 'Advanced Visualizations', description: 'Interactive charts and dashboards', requiredPlan: 'pro' },
  exportToPdf: { name: 'Export to PDF', description: 'Generate PDF reports', requiredPlan: 'pro' },
  workflowAutomation: { name: 'Workflow Automation', description: 'Automate data pipelines', requiredPlan: 'pro' },
  customReports: { name: 'Custom Reports', description: 'Create tailored reports', requiredPlan: 'pro' }
};

const DEFAULT_FREE_SUBSCRIPTION = PLAN_LIMITS.free;

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription>(DEFAULT_FREE_SUBSCRIPTION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();

    // Listen for auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription();
    });

    return () => {
      authSub.unsubscribe();
    };
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setSubscription(DEFAULT_FREE_SUBSCRIPTION);
        setLoading(false);
        return;
      }

      const { data, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Table doesn't exist or other errors - use defaults
      if (subError?.code === 'PGRST205' || subError?.code === '42P01') {
        setSubscription(DEFAULT_FREE_SUBSCRIPTION);
        setLoading(false);
        return;
      }

      if (subError && subError.code !== 'PGRST116') {
        console.warn('Subscription fetch warning:', subError.message);
      }

      if (data && data.plan) {
        const planDefaults = PLAN_LIMITS[data.plan as PlanType] || PLAN_LIMITS.free;
        setSubscription({
          plan: data.plan as PlanType,
          status: data.status as SubscriptionStatus || 'active',
          datasetsLimit: data.datasets_limit ?? planDefaults.datasetsLimit,
          storageLimitMb: data.storage_limit_mb ?? planDefaults.storageLimitMb,
          fileSizeLimitMb: planDefaults.fileSizeLimitMb,
          teamMembersLimit: data.team_members_limit ?? planDefaults.teamMembersLimit,
          features: { ...planDefaults.features, ...(data.features || {}) },
          currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
          cancelAtPeriodEnd: data.cancel_at_period_end || false
        });
      } else {
        setSubscription(DEFAULT_FREE_SUBSCRIPTION);
      }
    } catch (err: any) {
      console.warn('Error fetching subscription:', err?.message);
      setError(err?.message);
      setSubscription(DEFAULT_FREE_SUBSCRIPTION);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const isPro = subscription.plan === 'pro' || subscription.plan === 'team' || subscription.plan === 'enterprise';
  const isTeam = subscription.plan === 'team' || subscription.plan === 'enterprise';
  const isEnterprise = subscription.plan === 'enterprise';
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  // Check if user can use a specific feature
  const canUseFeature = (feature: keyof SubscriptionFeatures): boolean => {
    const value = subscription.features[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    return false;
  };

  // Get the required plan for a feature
  const getRequiredPlan = (feature: keyof SubscriptionFeatures): PlanType => {
    return FEATURE_DESCRIPTIONS[feature]?.requiredPlan || 'pro';
  };

  // Check if limit has been reached
  const hasReachedLimit = (type: 'datasets' | 'storage' | 'teamMembers' | 'fileSize', currentUsage: number): boolean => {
    let limit: number;
    switch (type) {
      case 'datasets':
        limit = subscription.datasetsLimit;
        break;
      case 'storage':
        limit = subscription.storageLimitMb;
        break;
      case 'teamMembers':
        limit = subscription.teamMembersLimit;
        break;
      case 'fileSize':
        limit = subscription.fileSizeLimitMb;
        break;
    }
    // -1 means unlimited
    if (limit === -1) return false;
    return currentUsage >= limit;
  };

  // Get usage percentage
  const getUsagePercentage = (type: 'datasets' | 'storage' | 'teamMembers', currentUsage: number): number => {
    let limit: number;
    switch (type) {
      case 'datasets':
        limit = subscription.datasetsLimit;
        break;
      case 'storage':
        limit = subscription.storageLimitMb;
        break;
      case 'teamMembers':
        limit = subscription.teamMembersLimit;
        break;
    }
    if (limit === -1) return 0; // unlimited
    return Math.min(100, (currentUsage / limit) * 100);
  };

  // Get formatted limit display
  const getFormattedLimit = (type: 'datasets' | 'storage' | 'teamMembers'): string => {
    let limit: number;
    switch (type) {
      case 'datasets':
        limit = subscription.datasetsLimit;
        break;
      case 'storage':
        limit = subscription.storageLimitMb;
        if (limit === -1) return 'Unlimited';
        if (limit >= 1024) return `${(limit / 1024).toFixed(0)} GB`;
        return `${limit} MB`;
      case 'teamMembers':
        limit = subscription.teamMembersLimit;
        break;
    }
    if (limit === -1) return 'Unlimited';
    return limit.toString();
  };

  return {
    subscription,
    loading,
    error,
    isPro,
    isTeam,
    isEnterprise,
    isActive,
    canUseFeature,
    getRequiredPlan,
    hasReachedLimit,
    getUsagePercentage,
    getFormattedLimit,
    refresh: fetchSubscription
  };
};
