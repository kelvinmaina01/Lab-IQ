import { useState, useEffect } from 'react';
import { useServices } from '@/core/ServiceProvider';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadCounts = (labId: string | null, userId: string | null) => {
  const { collaboration } = useServices();
  const [channelUnreadCounts, setChannelUnreadCounts] = useState<Record<string, number>>({});
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!labId || !userId) return;

    loadUnreadCounts();

    // Subscribe to new channel messages
    const messageSub = supabase
      .channel('unread-count-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        // If message is in one of our channels and not from us, refresh
        if (payload.new.user_id !== userId) {
          loadUnreadCounts();
        }
      })
      .subscribe();

    // Subscribe to new DMs
    const dmSub = supabase
      .channel('unread-count-dms')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `recipient_id=eq.${userId}`
      }, () => {
        loadUnreadCounts();
      })
      .subscribe();

    return () => {
      messageSub.unsubscribe();
      dmSub.unsubscribe();
    };
  }, [labId, userId]);

  const loadUnreadCounts = async () => {
    if (!labId || !userId) return;

    try {
      // Load channels
      const { data: channels } = await collaboration.getChannels(labId);
      if (!channels) return;

      // Get unread count for each channel
      const counts: Record<string, number> = {};
      let total = 0;

      for (const channel of channels) {
        const count = await collaboration.getUnreadCount(channel.id, userId);
        counts[channel.id] = count;
        total += count;
      }

      setChannelUnreadCounts(counts);

      // Get DM unread count
      const dmCount = await collaboration.getUnreadDirectMessageCount(userId);
      setDmUnreadCount(dmCount);

      setTotalUnread(total + dmCount);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  const markChannelAsRead = async (channelId: string) => {
    if (!userId) return;

    await collaboration.markChannelAsRead(channelId, userId);
    setChannelUnreadCounts(prev => ({ ...prev, [channelId]: 0 }));
    setTotalUnread(prev => Math.max(0, prev - (channelUnreadCounts[channelId] || 0)));
  };

  const markDmAsRead = async (messageId: string) => {
    await collaboration.markDirectMessageAsRead(messageId);
    setDmUnreadCount(prev => Math.max(0, prev - 1));
    setTotalUnread(prev => Math.max(0, prev - 1));
  };

  return {
    channelUnreadCounts,
    dmUnreadCount,
    totalUnread,
    markChannelAsRead,
    markDmAsRead,
    refresh: loadUnreadCounts
  };
};
