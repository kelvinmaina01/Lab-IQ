import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TypingIndicator } from '@/types/collaboration';

export const useTypingIndicator = (channelId: string | null) => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Subscribe to typing events
  useEffect(() => {
    if (!channelId) return;

    const channel = supabase
      .channel(`typing:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_typing',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          const userId = payload.new.user_id;

          // Fetch user name
          const { data: userData } = await supabase
            .from('team_members')
            .select('display_name')
            .eq('user_id', userId)
            .single();

          if (userData) {
            setTypingUsers((prev) => [...new Set([...prev, userData.display_name])]);

            // Remove after 3 seconds
            setTimeout(() => {
              setTypingUsers((prev) => prev.filter((name) => name !== userData.display_name));
            }, 3000);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_typing',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          const userId = payload.old.user_id;

          const { data: userData } = await supabase
            .from('team_members')
            .select('display_name')
            .eq('user_id', userId)
            .single();

          if (userData) {
            setTypingUsers((prev) => prev.filter((name) => name !== userData.display_name));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [channelId]);

  // Emit typing event
  const startTyping = useCallback(async () => {
    if (!channelId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Insert typing indicator
    await supabase
      .from('chat_typing')
      .upsert({
        channel_id: channelId,
        user_id: user.id,
        started_at: new Date().toISOString()
      });

    // Auto-remove after 3 seconds
    const timeout = setTimeout(async () => {
      await supabase
        .from('chat_typing')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', user.id);
    }, 3000);

    setTypingTimeout(timeout);
  }, [channelId, typingTimeout]);

  const stopTyping = useCallback(async () => {
    if (!channelId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }

    await supabase
      .from('chat_typing')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', user.id);
  }, [channelId, typingTimeout]);

  return { typingUsers, startTyping, stopTyping };
};
