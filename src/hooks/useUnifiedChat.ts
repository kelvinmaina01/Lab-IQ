import { useEffect, useState, useCallback, useMemo } from 'react';
import { useServices } from "@/core/ServiceProvider";
import { ChatMessage, DirectMessage } from '@/core/interfaces';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

export const useUnifiedChat = (id: string | null, type: 'channel' | 'dm') => {
    const { collaboration, auth } = useServices();
    const [messages, setMessages] = useState<(ChatMessage | DirectMessage)[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Load current user
    useEffect(() => {
        const loadUser = async () => {
            const user = await auth.getUser();
            if (user) setCurrentUser(user);
        };
        loadUser();
    }, [auth]);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            setMessages([]);
            return;
        }

        let isMounted = true;
        setLoading(true);
        setMessages([]);

        const loadInitialData = async () => {
            try {
                let data;
                let err;

                if (type === 'channel') {
                    const res = await collaboration.getMessages(id);
                    data = res.data;
                    err = res.error;
                } else {
                    const res = await collaboration.getDirectMessages(id);
                    data = res.data;
                    err = res.error;
                }

                if (err) throw err;
                if (isMounted && data) {
                    setMessages(data);
                }
            } catch (err) {
                console.error(`Error fetching ${type} messages:`, err);
                if (isMounted) setError(err as Error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadInitialData();

        // Subscriptions
        let realtimeChannel: RealtimeChannel;

        if (type === 'channel') {
            realtimeChannel = collaboration.subscribeToChat(
                id,
                (newMsg) => setMessages((prev) => [...prev, newMsg]),
                (updatedMsg) => setMessages((prev) => prev.map((msg) => msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg)),
                (deletedId) => setMessages((prev) => prev.filter((msg) => msg.id !== deletedId))
            );
        } else {
            // For DMs, we subscribe to our own user ID to get incoming DMs from anyone, 
            // but we filter for the specific 'otherUserId' (id)
            const currentUserId = currentUser?.id;
            if (currentUserId) {
                realtimeChannel = collaboration.subscribeToDirectMessages(currentUserId, (newDm) => {
                    if (newDm.sender_id === id) {
                        setMessages((prev) => [...prev, newDm]);
                    }
                });
            }
        }

        return () => {
            isMounted = false;
            if (realtimeChannel) realtimeChannel.unsubscribe();
        };
    }, [id, type, currentUser?.id]);

    const sendMessage = useCallback(async (content: string, parentId?: string) => {
        if (!id) return;

        const tempId = `temp-${Date.now()}`;
        const tempMessage: any = {
            id: tempId,
            content,
            created_at: new Date().toISOString(),
            user: {
                display_name: currentUser?.display_name || currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Me',
                avatar_url: currentUser?.avatar_url
            }
        };

        if (type === 'channel') {
            tempMessage.channel_id = id;
            tempMessage.user_id = currentUser?.id;
        } else {
            tempMessage.sender_id = currentUser?.id;
            tempMessage.recipient_id = id;
        }

        setMessages(prev => [...prev, tempMessage]);

        try {
            let result;
            if (type === 'channel') {
                result = await collaboration.sendMessage(id, content, parentId);
            } else {
                result = await collaboration.sendDirectMessage(id, content);
            }

            if (result.error) throw result.error;

            // If we're lucky, the real message comes back through RT quickly.
            // If not, we could replace the temp message here, but RT usually handles it.
        } catch (err) {
            console.error("Failed to send", err);
            setMessages(prev => prev.filter(m => m.id !== tempId));
            toast.error("Failed to send message");
            throw err;
        }
    }, [id, type, collaboration, currentUser]);

    const addReaction = useCallback(async (messageId: string, emoji: string) => {
        if (type === 'channel') {
            await collaboration.addReaction(messageId, emoji);
        }
        // DM reactions implementation could be added here
    }, [id, type, collaboration]);

    return {
        messages,
        loading,
        error,
        sendMessage,
        addReaction
    };
};
