import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Check if user has completed onboarding
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('onboarding_completed, onboarding_completed_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking onboarding status:', error);
      }

      // Check localStorage as fallback
      const localOnboardingComplete = localStorage.getItem('onboarding_completed');

      const hasCompletedOnboarding = preferences?.onboarding_completed || localOnboardingComplete === 'true';

      if (!hasCompletedOnboarding) {
        setIsFirstVisit(true);
        setShowOnboarding(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error in checkOnboardingStatus:', error);
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
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Save to database
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
      }

      // Save to localStorage as backup
      localStorage.setItem('onboarding_completed', 'true');

      setShowOnboarding(false);
      setIsFirstVisit(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still save locally even if database fails
      localStorage.setItem('onboarding_completed', 'true');
      setShowOnboarding(false);
    }
  };

  const resetOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('user_preferences')
          .update({
            onboarding_completed: false,
            onboarding_completed_at: null
          })
          .eq('user_id', user.id);
      }

      localStorage.removeItem('onboarding_completed');

      setIsFirstVisit(true);
      setShowOnboarding(true);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
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
