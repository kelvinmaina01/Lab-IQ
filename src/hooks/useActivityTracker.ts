import { supabase } from "@/integrations/supabase/client";

export const useActivityTracker = () => {
  const trackActivity = async (action: string, item: string, icon: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('activities').insert({
        user_id: user.id,
        action,
        item,
        icon
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  return { trackActivity };
};
