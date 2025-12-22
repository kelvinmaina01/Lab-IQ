import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const LOCAL_STORAGE_KEY = 'onboarding_completed';
const TOUR_TRIGGER_KEY = 'onboarding_trigger';

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);

  // Check for tour trigger from other components
  const checkTourTrigger = useCallback(() => {
    const trigger = localStorage.getItem(TOUR_TRIGGER_KEY);
    if (trigger === 'start') {
      localStorage.removeItem(TOUR_TRIGGER_KEY);
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    checkOnboardingStatus();
    checkTourTrigger();

    // Listen for storage events from other tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOUR_TRIGGER_KEY && e.newValue === 'start') {
        localStorage.removeItem(TOUR_TRIGGER_KEY);
        setShowOnboarding(true);
      }
    };

    // Also use a custom event for same-tab communication
    const handleTourStart = () => {
      setShowOnboarding(true);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('labiq-start-tour', handleTourStart);

    // Check periodically for trigger (fallback for same-tab)
    const interval = setInterval(checkTourTrigger, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('labiq-start-tour', handleTourStart);
      clearInterval(interval);
    };
  }, [checkTourTrigger]);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const localOnboardingComplete = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!localOnboardingComplete) {
          setIsFirstVisit(true);
        }
        setLoading(false);
        return;
      }

      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('onboarding_completed, onboarding_completed_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error?.code === 'PGRST205' || error?.code === '406' || error?.message?.includes('schema cache')) {
        setTableExists(false);
        const localOnboardingComplete = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!localOnboardingComplete) {
          setIsFirstVisit(true);
        }
        setLoading(false);
        return;
      }

      if (error && error.code !== 'PGRST116') {
        console.warn('Onboarding status check warning:', error.message);
      }

      const localOnboardingComplete = localStorage.getItem(LOCAL_STORAGE_KEY);
      const hasCompletedOnboarding = preferences?.onboarding_completed || localOnboardingComplete === 'true';

      if (!hasCompletedOnboarding) {
        setIsFirstVisit(true);
      }

      setLoading(false);
    } catch (error) {
      console.warn('Error in checkOnboardingStatus, using localStorage fallback');
      const localOnboardingComplete = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!localOnboardingComplete) {
        setIsFirstVisit(true);
      }
      setLoading(false);
    }
  };

  const startOnboarding = () => {
    setShowOnboarding(true);
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
  };

  const completeOnboarding = async () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    setShowOnboarding(false);
    setIsFirstVisit(false);

    if (!tableExists) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error?.code === 'PGRST205' || error?.code === '406') {
          setTableExists(false);
        }
      }
    } catch (error) {
      console.warn('Error completing onboarding in DB, saved locally');
    }
  };

  const resetOnboarding = async () => {
    // Clear completion status
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setIsFirstVisit(true);

    // Set trigger for App.tsx to pick up
    localStorage.setItem(TOUR_TRIGGER_KEY, 'start');

    // Also dispatch custom event for immediate same-tab response
    window.dispatchEvent(new CustomEvent('labiq-start-tour'));

    if (!tableExists) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('user_preferences')
          .update({
            onboarding_completed: false,
            onboarding_completed_at: null
          })
          .eq('user_id', user.id);

        if (error?.code === 'PGRST205' || error?.code === '406') {
          setTableExists(false);
        }
      }
    } catch (error) {
      console.warn('Error resetting onboarding in DB');
    }
  };

  return {
    showOnboarding,
    isFirstVisit,
    loading,
    startOnboarding,
    closeOnboarding,
    completeOnboarding,
    resetOnboarding,
    isTourAvailable: !loading && tableExists
  };
};
