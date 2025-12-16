import { useEffect, useState, useCallback } from 'react';
import { useServices } from "@/core/ServiceProvider";
import { ChatMessage } from '@/core/interfaces';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useRealtimeChat = (channelId: string | null) => {
  const { collaboration, auth } = useServices();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load current user for optimistic UI
  useEffect(() => {
    const loadUser = async () => {
      const user = await auth.getUser();
      if (user) setCurrentUser(user);
    };
    loadUser();
  }, [auth]);
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
        const { data, error } = await collaboration.getMessages(channelId);
        if (error) throw error;
        if (isMounted && data) {
          setMessages(data);
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
    const realtimeChannel = collaboration.subscribeToChat(
      channelId,
      (newMsg) => setMessages((prev) => [...prev, newMsg]),
      (updatedMsg) => setMessages((prev) => prev.map((msg) => msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } as ChatMessage : msg)),
      (deletedId) => setMessages((prev) => prev.filter((msg) => msg.id !== deletedId))
    );

    setChannel(realtimeChannel);

    return () => {
      isMounted = false;
      realtimeChannel.unsubscribe();
    };
  }, [channelId]);

  const sendMessage = useCallback(async (content: string, parentId?: string) => {
    if (!channelId) throw new Error('No channel selected');

    // [OPTIMISTIC UI] Create temp message
    const tempId = `temp-${Date.now()}`;

    if (!currentUser) {
      // Fallback or wait? Let's just wait or not do optimistic if not ready
      // But for UX, we proceed with placeholder? No, better safe.
      // Actually, we can just proceed.
    }

    const tempMessage: ChatMessage = {
      id: tempId,
      content,
      user_id: currentUser?.id || 'me',
      channel_id: channelId,
      created_at: new Date().toISOString(),
      user: {
        display_name: currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Me',
        email: currentUser?.email,
        avatar_url: currentUser?.avatar_url
      }
    };

    // 1. Optimistic Update
    setMessages(prev => [...prev, tempMessage]);

    try {
      const { error } = await collaboration.sendMessage(channelId, content, parentId);
      if (error) throw error;

      // 2. Success - Remove temp message so real one (via subscription) takes over
      // We delay slightly to ensure no flicker, or just remove immediately.
      // Realtime latency is usually <100ms.
      setMessages(prev => prev.filter(m => m.id !== tempId));

    } catch (err) {
      // 3. Error - Revert
      console.error("Failed to send", err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      throw err;
    }
  }, [channelId, collaboration, currentUser]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    const { error } = await collaboration.editMessage(messageId, newContent);
    if (error) throw error;
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    const { error } = await collaboration.deleteMessage(messageId);
    if (error) throw error;
  }, []);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    const { error } = await collaboration.addReaction(messageId, emoji);
    if (error) console.error('Error adding reaction:', error);
  }, []);

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
