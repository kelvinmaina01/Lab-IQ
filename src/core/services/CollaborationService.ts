import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  TeamMember,
  ChatChannel,
  ChatMessage,
  DirectMessage,
  SharedProject,
  Notification,
  SharedFile,
  SharedCanvas,
  SharedList,
  ListItem,
  SaaSResource
} from '@/core/interfaces';

// Domain Sub-Services
import { MessagingService } from './MessagingService';
import { PresenceService } from './PresenceService';
import { ResourceService } from './ResourceService';
import { AICollaborationService } from './AICollaborationService';

// ============================================
// MAIN COLLABORATION SERVICE (FACADE)
// ============================================

export class CollaborationService {
  private messaging: MessagingService;
  private presence: PresenceService;
  private resources: ResourceService;
  private ai: AICollaborationService;

  constructor() {
    this.messaging = new MessagingService();
    this.presence = new PresenceService();
    this.resources = new ResourceService();
    this.ai = new AICollaborationService();
  }

  // ============================================
  // TEAM & PRESENCE (Delegated)
  // ============================================

  async getTeamMembers(labId: string): Promise<{ data: TeamMember[] | null; error: any }> {
    try {
      const data = await this.presence.getTeamMembers(labId);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getTeamMember(userId: string, labId: string): Promise<TeamMember | null> {
    const members = await this.presence.getTeamMembers(labId);
    return members.find(m => m.user_id === userId) || null;
  }

  async upsertTeamMember(member: Partial<TeamMember>): Promise<{ data: TeamMember | null; error: any }> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('team_members' as any)
        .upsert({ ...member, user_id: userData.user.id, last_active: new Date().toISOString() })
        .select()
        .single();

      if (error) return { data: null, error };
      return { data: (data as unknown) as TeamMember, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async updateStatus(status: 'online' | 'away' | 'busy' | 'offline', statusMessage?: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await this.presence.updateStatus(user.id, status, statusMessage);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async getLeaderboard(timeRange: string): Promise<any[]> {
    // TODO: Implement leaderboard logic
    return [];
  }

  subscribeToPresence(labId: string, onSync: (users: any[]) => void): RealtimeChannel {
    return this.presence.subscribeToPresence(labId, onSync);
  }

  // ============================================
  // MESSAGING (Delegated)
  // ============================================

  async getChannels(labId: string): Promise<{ data: ChatChannel[] | null; error: any }> {
    try {
      const data = await this.messaging.getChannels(labId);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async createChannel(channel: Partial<ChatChannel>): Promise<{ data: ChatChannel | null; error: any }> {
    try {
      const data = await this.messaging.createChannel(channel);

      // Log activity
      if (data && channel.lab_id) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('collaboration_activity').insert({
          lab_id: channel.lab_id,
          user_id: user?.id,
          action_type: 'channel_created',
          description: `created channel #${data.display_name || data.name}`,
          metadata: { channelId: data.id, channelName: data.display_name || data.name, isPrivate: data.is_private }
        });
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getMessages(channelId: string): Promise<{ data: ChatMessage[] | null; error: any }> {
    try {
      const data = await this.messaging.getMessages(channelId);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async sendMessage(channelId: string, content: string, parentId?: string): Promise<{ error: any }> {
    try {
      const message = await this.messaging.sendMessage({ channelId, content, parentId });

      // Log activity
      const { data: channel } = await supabase.from('chat_channels').select('display_name, lab_id').eq('id', channelId).single();
      if (channel) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('collaboration_activity').insert({
          lab_id: channel.lab_id,
          user_id: user?.id,
          action_type: 'message',
          description: `sent a message in #${channel.display_name || 'channel'}`,
          metadata: { channelId, channelName: channel.display_name, preview: content.substring(0, 100) }
        });
      }

      // AI Trigger
      if (content.toLowerCase().includes('@labai')) {
        await supabase.functions.invoke('chat-bot-ai', {
          body: { message: content, channelId, userId: message.user_id }
        });

        // Log AI interaction
        if (channel) {
          await supabase.from('collaboration_activity').insert({
            lab_id: channel.lab_id,
            user_id: null, // System action
            action_type: 'automation',
            description: `@LabAI was asked: ${content.replace('@labai', '').trim().substring(0, 100)}`,
            metadata: { channelId, aiTriggered: true }
          });
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async editMessage(messageId: string, content: string): Promise<{ error: any }> {
    try {
      await supabase.from('chat_messages').update({ content, edited_at: new Date().toISOString() }).eq('id', messageId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async deleteMessage(messageId: string): Promise<{ error: any }> {
    try {
      await supabase.from('chat_messages').update({ deleted_at: new Date().toISOString() }).eq('id', messageId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  subscribeToChat(channelId: string, onMessage: (msg: ChatMessage) => void, onUpdate: (msg: ChatMessage) => void, onDelete: (id: string) => void): RealtimeChannel {
    return this.messaging.subscribeToChat(channelId, (payload) => {
      if (payload.eventType === 'INSERT') onMessage(payload.new);
      if (payload.eventType === 'UPDATE') onUpdate(payload.new);
      if (payload.eventType === 'DELETE') onDelete(payload.old.id);
    });
  }

  subscribeToChannels(labId: string, onInsert: (ch: ChatChannel) => void, onUpdate: (ch: ChatChannel) => void, onDelete: (id: string) => void): RealtimeChannel {
    return supabase
      .channel(`channels:${labId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_channels',
        filter: `lab_id=eq.${labId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') onInsert(payload.new as ChatChannel);
        if (payload.eventType === 'UPDATE') onUpdate(payload.new as ChatChannel);
        if (payload.eventType === 'DELETE') onDelete(payload.old.id);
      })
      .subscribe();
  }

  async addReaction(messageId: string, emoji: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");
      await this.messaging.addReaction(messageId, emoji, user.id);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async getDirectMessages(otherUserId: string): Promise<{ data: DirectMessage[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const data = await this.messaging.getDirectMessages(user.id, otherUserId);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async sendDirectMessage(recipientId: string, content: string): Promise<{ data: DirectMessage | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const data = await this.messaging.sendDirectMessage(user.id, recipientId, content);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  subscribeToDirectMessages(userId: string, onMessage: (msg: DirectMessage) => void): RealtimeChannel {
    return supabase
      .channel(`dms:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `or(sender_id.eq.${userId},recipient_id.eq.${userId})`
      }, (payload) => onMessage(payload.new as DirectMessage))
      .subscribe();
  }

  async startTyping(channelId: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Not authenticated') };
      const { data: member } = await supabase.from('team_members' as any).select('id').eq('user_id', user.id).limit(1).single();
      if (member) await this.messaging.startTyping(channelId, (member as any).id);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async stopTyping(channelId: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Not authenticated') };
      const { data: member } = await supabase.from('team_members' as any).select('id').eq('user_id', user.id).limit(1).single();
      if (member) await this.messaging.stopTyping(channelId, (member as any).id);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  subscribeToTyping(channelId: string, onTypingStart: (user: string) => void, onTypingStop: (user: string) => void): RealtimeChannel {
    return supabase
      .channel(`typing:${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (payload.new.is_typing) onTypingStart(payload.new.team_member_id);
          else onTypingStop(payload.new.team_member_id);
        }
        if (payload.eventType === 'DELETE') onTypingStop(payload.old.team_member_id);
      })
      .subscribe();
  }

  async searchEverything(query: string, labId: string): Promise<any> {
    // Basic search implementation
    const { data: channels } = await supabase.from('chat_channels' as any).select('*').eq('lab_id', labId).ilike('display_name', `%${query}%`);
    const { data: messages } = await supabase.from('chat_messages' as any).select('*').ilike('content', `%${query}%`).limit(20);
    return { channels: channels || [], messages: messages || [], files: [], projects: [] };
  }

  // ============================================
  // SCIENTIFIC RESOURCES (New & Delegated)
  // ============================================

  async shareResource(resourceId: string, resourceType: string, channelId: string): Promise<{ error: any }> {
    const { data: channel } = await supabase.from('chat_channels' as any).select('lab_id').eq('id', channelId).single();
    if (!channel) throw new Error("Channel not found");

    const { error } = await this.resources.shareResource({
      labId: (channel as any).lab_id,
      channelId,
      resourceId,
      resourceType: resourceType as any
    });

    if (!error) {
      await this.messaging.sendMessage({
        channelId,
        content: `Shared a ${resourceType}: [View Resource]`,
        metadata: { resourceId, resourceType, isResourceCard: true }
      });
    }

    return { error };
  }

  async getSharedResources(labId: string, type?: string): Promise<{ data: SaaSResource[] | null; error: any }> {
    return this.resources.getSharedResources(labId, type);
  }

  async getLabResources(labId: string, type: 'dataset' | 'report' | 'experiment'): Promise<{ data: any[] | null; error: any }> {
    return this.resources.getLabResources(labId, type);
  }

  async getFiles(projectId: string): Promise<{ data: SharedFile[] | null; error: any }> {
    try {
      const files = await this.resources.getFiles(projectId);
      return { data: files as any, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async uploadFile(file: File, projectId: string, labId: string): Promise<{ data: SharedFile | null; error: any }> {
    try {
      const data = await this.resources.uploadFile(file, projectId, labId);

      // Log activity
      if (data) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('collaboration_activity').insert({
          lab_id: labId,
          user_id: user?.id,
          action_type: 'file_upload',
          description: `uploaded file: ${file.name}`,
          metadata: { fileName: file.name, fileSize: file.size, fileType: file.type, projectId }
        });
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async deleteFile(fileId: string): Promise<{ error: any }> {
    try {
      await this.resources.deleteFile(fileId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async getExperiment(experimentId: string): Promise<{ data: any | null; error: any }> {
    return this.resources.getExperiment(experimentId);
  }

  // ============================================
  // COMMENTS (Delegated)
  // ============================================

  async getComments(entityId: string, entityType: string): Promise<{ data: any[] | null; error: any }> {
    try {
      const comments = await this.messaging.getComments(entityId, entityType);
      return { data: comments, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async addComment(entityId: string, entityType: string, content: string, parentId?: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('comments' as any)
        .insert({
          entity_id: entityId,
          entity_type: entityType,
          user_id: user.id,
          content,
          parent_id: parentId
        })
        .select()
        .single();

      if (error) return { data: null, error };
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async toggleLikeComment(commentId: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: comment } = await supabase.from('comments' as any).select('likes').eq('id', commentId).single();
      const likes = comment?.likes || [];
      const newLikes = likes.includes(user.id)
        ? likes.filter((id: string) => id !== user.id)
        : [...likes, user.id];

      await supabase.from('comments' as any).update({ likes: newLikes }).eq('id', commentId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async togglePinComment(commentId: string): Promise<{ error: any }> {
    try {
      const { data: comment } = await supabase.from('comments' as any).select('is_pinned').eq('id', commentId).single();
      await supabase.from('comments' as any).update({ is_pinned: !comment?.is_pinned }).eq('id', commentId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async deleteComment(commentId: string): Promise<{ error: any }> {
    try {
      await supabase.from('comments' as any).update({ deleted_at: new Date().toISOString() }).eq('id', commentId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // ============================================
  // PROJECTS
  // ============================================

  async getProjects(labId: string): Promise<{ data: SharedProject[] | null; error: any }> {
    return (await supabase.from('shared_projects' as any).select('*').eq('lab_id', labId)) as unknown as { data: SharedProject[] | null; error: any };
  }

  async getProject(projectId: string): Promise<{ data: SharedProject | null; error: any }> {
    return await supabase.from('shared_projects' as any).select('*').eq('id', projectId).single() as unknown as { data: SharedProject | null; error: any };
  }

  async createProject(project: Partial<SharedProject>): Promise<{ data: SharedProject | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from('shared_projects' as any).insert({ ...project, owner_id: user?.id }).select().single();
  }

  // ============================================
  // ACTIVITIES
  // ============================================

  async getActivities(labId: string): Promise<{ data: any[] | null; error: any }> {
    return await supabase
      .from('collaboration_activity' as any)
      .select('*')
      .eq('lab_id', labId)
      .order('created_at', { ascending: false })
      .limit(50) as unknown as { data: any[] | null; error: any };
  }

  // ============================================
  // OTHER METHODS (Inline proxied)
  // ============================================

  async getCanvases(labId: string): Promise<{ data: SharedCanvas[] | null; error: any }> {
    return (await supabase.from('shared_canvases' as any).select('*').eq('lab_id', labId)) as unknown as { data: SharedCanvas[] | null; error: any };
  }

  async createCanvas(title: string, labId: string): Promise<{ data: SharedCanvas | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from('shared_canvases' as any).insert({ title, lab_id: labId, created_by: user?.id }).select().single();
  }

  async updateCanvas(id: string, content: any): Promise<{ error: any }> {
    return supabase.from('shared_canvases' as any).update({ content, updated_at: new Date().toISOString() }).eq('id', id);
  }

  async getLists(labId: string): Promise<{ data: SharedList[] | null; error: any }> {
    return (await supabase.from('shared_lists' as any).select('*, items:list_items(*)').eq('lab_id', labId)) as unknown as { data: SharedList[] | null; error: any };
  }

  async createList(title: string, labId: string): Promise<{ data: SharedList | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from('shared_lists' as any).insert({ title, lab_id: labId, created_by: user?.id }).select().single();
  }

  async addListItem(listId: string, content: string): Promise<{ data: ListItem | null; error: any }> {
    return supabase.from('list_items' as any).insert({ list_id: listId, content }).select().single();
  }

  async toggleListItem(itemId: string, isCompleted: boolean): Promise<{ error: any }> {
    return supabase.from('list_items' as any).update({ is_completed: isCompleted }).eq('id', itemId);
  }

  async inviteMember(email: string, role: string, labId: string): Promise<{ error: any }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      const invitationToken = crypto.randomUUID();

      // Insert invitation
      const { error: inviteError } = await supabase.from('team_invitations').insert({
        email,
        lab_id: labId,
        role,
        invited_by: user.user?.id,
        invitation_token: invitationToken,
        token: invitationToken  // Also fill the 'token' column
      });

      if (inviteError) {
        console.error('Failed to create invitation:', inviteError);
        return { error: inviteError };
      }

      // Log activity
      await supabase.from('collaboration_activity').insert({
        lab_id: labId,
        user_id: user.user?.id,
        action_type: 'invite',
        description: `invited ${email} to join as ${role}`,
        metadata: { email, role, invitationToken }
      });

      // Send email invitation via Edge Function
      try {
        // Get inviter's display name
        const { data: inviterProfile } = await supabase
          .from('team_members')
          .select('display_name')
          .eq('user_id', user.user?.id)
          .eq('lab_id', labId)
          .single();

        const inviterName = inviterProfile?.display_name || user.user?.email?.split('@')[0] || 'Team Member';

        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-team-invitation', {
          body: {
            email,
            inviterName,
            labId,
            role,
            invitationToken
          }
        });

        if (emailError) {
          console.error('Email sending error:', emailError);
          throw emailError;
        }

        console.log('Email sent successfully:', emailResult);
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the invitation if email fails - invitation is still created in DB
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // ============================================
  // CHANNEL MEMBERSHIP MANAGEMENT
  // ============================================

  async joinChannel(channelId: string, userId: string, labId: string): Promise<{ error: any }> {
    try {
      await this.messaging.joinChannel(channelId, userId, labId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async leaveChannel(channelId: string, userId: string): Promise<{ error: any }> {
    try {
      await this.messaging.leaveChannel(channelId, userId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async getChannelMembers(channelId: string): Promise<{ data: any[] | null; error: any }> {
    try {
      const data = await this.messaging.getChannelMembers(channelId);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async isUserChannelMember(channelId: string, userId: string): Promise<boolean> {
    return this.messaging.isUserChannelMember(channelId, userId);
  }

  // ============================================
  // UNREAD COUNT TRACKING
  // ============================================

  async getUnreadCount(channelId: string, userId: string): Promise<number> {
    return this.messaging.getUnreadCount(channelId, userId);
  }

  async markChannelAsRead(channelId: string, userId: string): Promise<{ error: any }> {
    try {
      await this.messaging.markChannelAsRead(channelId, userId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async markDirectMessageAsRead(messageId: string): Promise<{ error: any }> {
    try {
      await this.messaging.markDirectMessageAsRead(messageId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async getUnreadDirectMessageCount(userId: string): Promise<number> {
    return this.messaging.getUnreadDirectMessageCount(userId);
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async getNotifications(userId: string): Promise<{ data: Notification[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) return { data: null, error };
      return { data: data as Notification[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  async markAllNotificationsAsRead(): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Not authenticated') };

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  subscribeToNotifications(userId: string, onNotification: (notification: Notification) => void): RealtimeChannel {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => onNotification(payload.new as Notification));

    channel.subscribe();
    return channel;
  }
}

export const collaborationService = new CollaborationService();
