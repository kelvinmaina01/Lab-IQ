import { supabase } from "@/integrations/supabase/client";
import { ChatChannel, ChatMessage } from "@/core/interfaces";
import { RealtimeChannel } from "@supabase/supabase-js";

export class MessagingService {
    async getChannels(labId: string): Promise<ChatChannel[]> {
        const { data, error } = await supabase
            .from('chat_channels')
            .select('*')
            .eq('lab_id', labId)
            .eq('is_archived', false)
            .order('display_name', { ascending: true });

        if (error) throw error;
        return data as ChatChannel[];
    }

    async createChannel(params: any): Promise<ChatChannel> {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('chat_channels')
            .insert({
                ...params,
                created_by: userData.user.id,
            })
            .select()
            .single();

        if (error) throw error;
        return data as ChatChannel;
    }

    async getMessages(channelId: string, limit = 50): Promise<ChatMessage[]> {
        const { data, error } = await supabase
            .from('chat_messages')
            .select(`
                *,
                user:team_members!chat_messages_user_id_fkey(*)
            `)
            .eq('channel_id', channelId)
            .is('parent_id', null)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return (data as ChatMessage[]).reverse();
    }

    async sendMessage(params: {
        channelId: string;
        content: string;
        parentId?: string;
        mentions?: string[];
        attachments?: any[];
        metadata?: any;
    }): Promise<ChatMessage> {
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                channel_id: params.channelId,
                user_id: userData.user?.id,
                content: params.content,
                parent_id: params.parentId,
                mentions: params.mentions || [],
                attachments: params.attachments || [],
                metadata: params.metadata || {}
            })
            .select(`*, user:team_members!chat_messages_user_id_fkey(*)`)
            .single();

        if (error) throw error;
        return data as ChatMessage;
    }

    subscribeToChat(channelId: string, onUpdate: (payload: any) => void): RealtimeChannel {
        return supabase
            .channel(`chat:${channelId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'chat_messages',
                filter: `channel_id=eq.${channelId}`
            }, onUpdate)
            .subscribe();
    }

    async addReaction(messageId: string, emoji: string, userId: string): Promise<void> {
        const { data: msg } = await supabase.from('chat_messages').select('reactions').eq('id', messageId).single();
        const reactions = msg?.reactions || {};
        const userReactions = reactions[emoji] || [];

        const newReactions = userReactions.includes(userId)
            ? userReactions.filter((id: string) => id !== userId)
            : [...userReactions, userId];

        const updated = { ...reactions, [emoji]: newReactions };
        if (newReactions.length === 0) delete updated[emoji];

        await supabase.from('chat_messages').update({ reactions: updated }).eq('id', messageId);
    }

    // Direct Messages
    async getRecentConversations(userId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('direct_messages')
            .select('sender_id, recipient_id')
            .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        const uniqueUserIds = new Set<string>();
        data.forEach(dm => {
            if (dm.sender_id !== userId) uniqueUserIds.add(dm.sender_id);
            if (dm.recipient_id !== userId) uniqueUserIds.add(dm.recipient_id);
        });

        return Array.from(uniqueUserIds);
    }

    async getDirectMessages(myId: string, otherUserId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('direct_messages')
            .select(`*, user:team_members!direct_messages_recipient_id_fkey(*)`)
            .or(`and(sender_id.eq.${myId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${myId})`)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    }

    async sendDirectMessage(senderId: string, recipientId: string, content: string): Promise<any> {
        const { data, error } = await supabase
            .from('direct_messages')
            .insert({ sender_id: senderId, recipient_id: recipientId, content })
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // Typing Indicators
    async startTyping(channelId: string, memberId: string): Promise<void> {
        await supabase.from('typing_indicators').upsert({
            channel_id: channelId,
            team_member_id: memberId,
            is_typing: true,
            expires_at: new Date(Date.now() + 5000).toISOString()
        });
    }

    async stopTyping(channelId: string, memberId: string): Promise<void> {
        await supabase.from('typing_indicators').delete().eq('channel_id', channelId).eq('team_member_id', memberId);
    }

    // Comments
    async getComments(entityId: string, entityType: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('comments')
            .select(`*, user:team_members!comments_user_id_fkey(*)`)
            .eq('entity_id', entityId)
            .eq('entity_type', entityType);
        if (error) throw error;
        return data;
    }

    // Channel Membership
    async joinChannel(channelId: string, userId: string, labId: string): Promise<void> {
        // Get team_member_id for this user in this lab
        const { data: member } = await supabase
            .from('team_members')
            .select('id')
            .eq('user_id', userId)
            .eq('lab_id', labId)
            .single();

        if (!member) throw new Error('User is not a member of this lab');

        // Insert into channel_members with team_member_id
        const { error } = await supabase
            .from('channel_members')
            .insert({
                channel_id: channelId,
                team_member_id: member.id,
                user_id: userId
            });

        if (error && !error.message.includes('duplicate')) throw error;
    }

    async leaveChannel(channelId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('channel_members')
            .delete()
            .eq('channel_id', channelId)
            .eq('user_id', userId);

        if (error) throw error;
    }

    async getChannelMembers(channelId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('channel_members')
            .select(`
                *,
                team_member:team_members!channel_members_team_member_id_fkey(
                    *,
                    user:auth.users(*)
                )
            `)
            .eq('channel_id', channelId);

        if (error) throw error;
        return data || [];
    }

    async isUserChannelMember(channelId: string, userId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('channel_members')
            .select('id')
            .eq('channel_id', channelId)
            .eq('user_id', userId)
            .single();

        return !error && !!data;
    }

    // Unread Count Tracking
    async getUnreadCount(channelId: string, userId: string): Promise<number> {
        // Get user's last read message
        const { data: membership } = await supabase
            .from('channel_members')
            .select('last_read_at, last_read_message_id')
            .eq('channel_id', channelId)
            .eq('user_id', userId)
            .single();

        if (!membership) return 0;

        // Count messages after last read
        const { count, error } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channelId)
            .neq('user_id', userId) // Don't count own messages
            .is('deleted_at', null);

        if (membership.last_read_at) {
            const query = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('channel_id', channelId)
                .neq('user_id', userId)
                .is('deleted_at', null)
                .gt('created_at', membership.last_read_at);

            return query.count || 0;
        }

        return count || 0;
    }

    async markChannelAsRead(channelId: string, userId: string): Promise<void> {
        // Get latest message in channel
        const { data: latestMessage } = await supabase
            .from('chat_messages')
            .select('id, created_at')
            .eq('channel_id', channelId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!latestMessage) return;

        // Update last read timestamp
        await supabase
            .from('channel_members')
            .update({
                last_read_at: latestMessage.created_at,
                last_read_message_id: latestMessage.id
            })
            .eq('channel_id', channelId)
            .eq('user_id', userId);
    }

    async markDirectMessageAsRead(messageId: string): Promise<void> {
        await supabase
            .from('direct_messages')
            .update({ is_read: true })
            .eq('id', messageId);
    }

    async getUnreadDirectMessageCount(userId: string): Promise<number> {
        const { count } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', userId)
            .eq('is_read', false);

        return count || 0;
    }
}
