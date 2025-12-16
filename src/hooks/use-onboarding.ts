import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const LOCAL_STORAGE_KEY = 'onboarding_completed';

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Check localStorage for non-authenticated users
        const localOnboardingComplete = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!localOnboardingComplete) {
          setIsFirstVisit(true);
        }
        setLoading(false);
        return;
      }

      // Check if user has completed onboarding
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('onboarding_completed, onboarding_completed_at')
        .eq('user_id', user.id)
        .maybeSingle();

      // Handle table not existing (PGRST205) or other schema errors (406)
      if (error?.code === 'PGRST205' || error?.code === '406' || error?.message?.includes('schema cache')) {
        setTableExists(false);
        // Fall back to localStorage only
        const localOnboardingComplete = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!localOnboardingComplete) {
          setIsFirstVisit(true);
        }
        setLoading(false);
        return;
      }

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.warn('Onboarding status check warning:', error.message);
      }

      // Check localStorage as fallback
      const localOnboardingComplete = localStorage.getItem(LOCAL_STORAGE_KEY);

      const hasCompletedOnboarding = preferences?.onboarding_completed || localOnboardingComplete === 'true';

      // Don't auto-show tour - let user start it manually
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
    // Always save to localStorage first
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    setShowOnboarding(false);
    setIsFirstVisit(false);

    if (!tableExists) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Save to database
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
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setIsFirstVisit(true);
    setShowOnboarding(true);

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
    resetOnboarding
  };
};
