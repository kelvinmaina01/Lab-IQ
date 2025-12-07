import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ChatMessage } from '@/types/collaboration';

export const useRealtimeChat = (channelId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!channelId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select(`
            *,
            user:user_id (
              id,
              email
            )
          `)
          .eq('channel_id', channelId)
          .is('deleted_at', null)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) throw error;

        if (isMounted && data) {
          // Map user data to display_name format
          const formattedMessages = data.map(msg => ({
            ...msg,
            user: msg.user ? {
              display_name: msg.user.email?.split('@')[0] || 'Unknown',
              avatar_url: undefined
            } : undefined
          }));
          setMessages(formattedMessages);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const realtimeChannel = supabase
      .channel(`chat:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          if (!isMounted) return;

          // Fetch user details for the new message
          const { data: userData } = await supabase
            .from('team_members')
            .select('display_name, avatar_url')
            .eq('user_id', payload.new.user_id)
            .single();

          const newMessage = {
            ...payload.new,
            user: userData ? {
              display_name: userData.display_name,
              avatar_url: userData.avatar_url
            } : undefined
          } as ChatMessage;

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          if (!isMounted) return;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } as ChatMessage : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          if (!isMounted) return;

          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    setChannel(realtimeChannel);

    return () => {
      isMounted = false;
      realtimeChannel.unsubscribe();
    };
  }, [channelId]);

  const sendMessage = useCallback(async (content: string, parentId?: string) => {
    if (!channelId) {
      throw new Error('No channel selected');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Extract mentions from content (simple @username parsing)
    const mentions = content.match(/@(\w+)/g)?.map(m => m.substring(1)) || [];

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        user_id: user.id,
        content,
        parent_id: parentId,
        mentions: mentions.length > 0 ? mentions : null
      });

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [channelId]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({
        content: newContent,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }, []);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get current message
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const reactions = message.reactions || {};
    const userReactions = reactions[emoji] || [];

    // Toggle reaction
    const newUserReactions = userReactions.includes(user.id)
      ? userReactions.filter(id => id !== user.id)
      : [...userReactions, user.id];

    const newReactions = {
      ...reactions,
      [emoji]: newUserReactions
    };

    // Remove emoji key if no users
    if (newUserReactions.length === 0) {
      delete newReactions[emoji];
    }

    const { error } = await supabase
      .from('chat_messages')
      .update({ reactions: newReactions })
      .eq('id', messageId);

    if (error) {
      console.error('Error adding reaction:', error);
    }
  }, [messages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction
  };
};
