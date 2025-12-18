/**
 * 🤝 LAB IQ COLLABORATION SERVICE
 * Slack-like collaboration for Lab IQ
 * Handles real-time chat, presence, file sharing, and team management
 */

import { supabase } from '../supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface TeamMember {
  id: string;
  user_id: string;
  lab_id: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  display_name: string | null;
  title: string | null;
  status: 'online' | 'away' | 'busy' | 'offline';
  status_message: string | null;
  status_emoji: string | null;
  last_active: string;
  preferences: {
    notifications: {
      mentions: boolean;
      directMessages: boolean;
      channelMessages: boolean;
      emailDigest: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    soundEnabled: boolean;
  };
  timezone: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatChannel {
  id: string;
  lab_id: string;
  name: string;
  display_name: string;
  description: string | null;
  type: 'public' | 'private' | 'direct' | 'project';
  project_id: string | null;
  dataset_id: string | null;
  created_by: string | null;
  is_archived: boolean;
  is_default: boolean;
  topic: string | null;
  pinned_message_ids: string[];
  settings: {
    allowThreads: boolean;
    allowReactions: boolean;
    allowFileUploads: boolean;
    retentionDays: number | null;
    slowModeSeconds: number;
  };
  member_count: number;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string | null;
  parent_id: string | null;
  thread_id: string | null;
  content: string;
  content_type: 'text' | 'code' | 'file' | 'system';
  formatted_content: any;
  mentions: string[];
  mentioned_channels: string[];
  attachments: FileAttachment[];
  metadata: Record<string, any>;
  is_edited: boolean;
  is_deleted: boolean;
  is_pinned: boolean;
  is_system_message: boolean;
  reply_count: number;
  reply_users: string[];
  last_reply_at: string | null;
  reactions: Record<string, string[]>; // emoji -> user_ids
  reaction_count: number;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;

  // Populated fields
  user?: TeamMember;
  thread_replies?: ChatMessage[];
}

export interface FileAttachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  thumbnail_path?: string;
  download_url?: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  formatted_content: any;
  attachments: FileAttachment[];
  is_read: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  reactions: Record<string, string[]>;
  edited_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;

  // Populated fields
  sender?: TeamMember;
  recipient?: TeamMember;
}

export interface SharedProject {
  id: string;
  lab_id: string;
  name: string;
  description: string | null;
  owner_id: string | null;
  status: 'active' | 'archived' | 'completed';
  visibility: 'public' | 'private' | 'team';
  experiment_ids: string[];
  dataset_ids: string[];
  protocol_ids: string[];
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  due_date: string | null;
  completion_percentage: number;
  member_count: number;
  message_count: number;
  file_count: number;
  default_channel_id: string | null;
  archived_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'mention' | 'reply' | 'dm' | 'channel_invite' | 'project_invite' | 'file_shared' | 'reaction' | 'system';
  title: string;
  message: string | null;
  channel_id: string | null;
  message_id: string | null;
  project_id: string | null;
  actor_id: string | null;
  metadata: Record<string, any>;
  is_read: boolean;
  is_archived: boolean;
  read_at: string | null;
  created_at: string;

  // Populated fields
  actor?: TeamMember;
}

export interface TypingIndicator {
  user_id: string;
  channel_id: string;
  user?: TeamMember;
}

// ============================================
// COLLABORATION SERVICE CLASS
// ============================================

class CollaborationService {
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();
  private presenceInterval: NodeJS.Timeout | null = null;

  // ============================================
  // TEAM MANAGEMENT
  // ============================================

  async getTeamMembers(labId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('lab_id', labId)
      .order('display_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async inviteTeamMember(params: {
    email: string;
    labId: string;
    role: 'admin' | 'member' | 'guest';
    message?: string;
  }) {
    const { email, labId, role, message } = params;

    // Generate invitation token
    const invitationToken = crypto.randomUUID();

    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        email,
        lab_id: labId,
        role,
        invitation_token: invitationToken,
        message,
        invited_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Send email invitation
    // await this.sendInvitationEmail(email, invitationToken);

    return data;
  }

  async updateTeamMemberStatus(params: {
    userId: string;
    status: 'online' | 'away' | 'busy' | 'offline';
    statusMessage?: string;
    statusEmoji?: string;
  }) {
    const { userId, status, statusMessage, statusEmoji } = params;

    const { data, error } = await supabase
      .from('team_members')
      .update({
        status,
        status_message: statusMessage || null,
        status_emoji: statusEmoji || null,
        last_active: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removeTeamMember(memberId: string) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  }

  // ============================================
  // CHANNELS
  // ============================================

  async getChannels(labId: string, includeArchived = false): Promise<ChatChannel[]> {
    let query = supabase
      .from('chat_channels')
      .select('*')
      .eq('lab_id', labId);

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query.order('display_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getChannel(channelId: string): Promise<ChatChannel | null> {
    const { data, error } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (error) throw error;
    return data;
  }

  async createChannel(params: {
    labId: string;
    name: string;
    displayName: string;
    description?: string;
    type: 'public' | 'private' | 'project';
    projectId?: string;
  }): Promise<ChatChannel> {
    const { labId, name, displayName, description, type, projectId } = params;
    const user = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('chat_channels')
      .insert({
        lab_id: labId,
        name: name.toLowerCase().replace(/\s+/g, '-'),
        display_name: displayName,
        description,
        type,
        project_id: projectId,
        created_by: user.data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-join creator to channel
    await this.joinChannel(data.id, user.data.user!.id);

    return data;
  }

  async updateChannel(channelId: string, updates: Partial<ChatChannel>) {
    const { data, error } = await supabase
      .from('chat_channels')
      .update(updates)
      .eq('id', channelId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async archiveChannel(channelId: string) {
    return this.updateChannel(channelId, { is_archived: true });
  }

  async joinChannel(channelId: string, userId: string) {
    const { error } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channelId,
        user_id: userId,
      });

    if (error && !error.message.includes('duplicate')) throw error;

    // Increment member count
    await supabase.rpc('increment_channel_member_count', { channel_id: channelId });
  }

  async leaveChannel(channelId: string, userId: string) {
    const { error } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', userId);

    if (error) throw error;

    // Decrement member count
    await supabase.rpc('decrement_channel_member_count', { channel_id: channelId });
  }

  async getChannelMembers(channelId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('channel_members')
      .select(`
        user_id,
        team_members (*)
      `)
      .eq('channel_id', channelId);

    if (error) throw error;
    return data?.map((m: any) => m.team_members).filter(Boolean) || [];
  }

  // ============================================
  // MESSAGES
  // ============================================

  async getMessages(params: {
    channelId: string;
    limit?: number;
    before?: string;
    after?: string;
  }): Promise<ChatMessage[]> {
    const { channelId, limit = 50, before, after } = params;

    let query = supabase
      .from('chat_messages')
      .select(`
        *,
        user:team_members!chat_messages_user_id_fkey(*)
      `)
      .eq('channel_id', channelId)
      .is('parent_id', null) // Only root messages, not thread replies
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }
    if (after) {
      query = query.gt('created_at', after);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).reverse(); // Oldest first
  }

  async getThreadReplies(parentMessageId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:team_members!chat_messages_user_id_fkey(*)
      `)
      .eq('parent_id', parentMessageId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async sendMessage(params: {
    channelId: string;
    content: string;
    parentId?: string;
    mentions?: string[];
    attachments?: FileAttachment[];
    metadata?: Record<string, any>;
  }): Promise<ChatMessage> {
    const { channelId, content, parentId, mentions, attachments, metadata } = params;
    const user = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        user_id: user.data.user?.id,
        parent_id: parentId,
        thread_id: parentId || null,
        content,
        mentions: mentions || [],
        attachments: attachments || [],
        metadata: metadata || {},
      })
      .select(`
        *,
        user:team_members!chat_messages_user_id_fkey(*)
      `)
      .single();

    if (error) throw error;

    // Create notifications for mentions
    if (mentions && mentions.length > 0) {
      await this.createMentionNotifications(data, mentions);
    }

    return data;
  }

  async editMessage(messageId: string, content: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        content,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteMessage(messageId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        content: '[deleted]',
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addReaction(messageId: string, emoji: string) {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    // Get current reactions
    const { data: message } = await supabase
      .from('chat_messages')
      .select('reactions')
      .eq('id', messageId)
      .single();

    const reactions = message?.reactions || {};

    // Add user to emoji array
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }
    if (!reactions[emoji].includes(userId)) {
      reactions[emoji].push(userId);
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        reactions,
        reaction_count: Object.values(reactions).flat().length,
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removeReaction(messageId: string, emoji: string) {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    // Get current reactions
    const { data: message } = await supabase
      .from('chat_messages')
      .select('reactions')
      .eq('id', messageId)
      .single();

    const reactions = message?.reactions || {};

    // Remove user from emoji array
    if (reactions[emoji]) {
      reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        reactions,
        reaction_count: Object.values(reactions).flat().length,
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async pinMessage(messageId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({ is_pinned: true })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async unpinMessage(messageId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({ is_pinned: false })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============================================
  // DIRECT MESSAGES
  // ============================================

  async getDirectMessages(params: {
    otherUserId: string;
    limit?: number;
  }): Promise<DirectMessage[]> {
    const { otherUserId, limit = 50 } = params;
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    const { data, error } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender:team_members!direct_messages_sender_id_fkey(*),
        recipient:team_members!direct_messages_recipient_id_fkey(*)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .or(`sender_id.eq.${otherUserId},recipient_id.eq.${otherUserId}`)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async sendDirectMessage(params: {
    recipientId: string;
    content: string;
    attachments?: FileAttachment[];
  }): Promise<DirectMessage> {
    const { recipientId, content, attachments } = params;
    const user = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.data.user?.id,
        recipient_id: recipientId,
        content,
        attachments: attachments || [],
      })
      .select(`
        *,
        sender:team_members!direct_messages_sender_id_fkey(*),
        recipient:team_members!direct_messages_recipient_id_fkey(*)
      `)
      .single();

    if (error) throw error;

    // Create notification
    await this.createDirectMessageNotification(data);

    return data;
  }

  async markDirectMessageAsRead(messageId: string) {
    const { error } = await supabase
      .from('direct_messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) throw error;
  }

  // ============================================
  // FILE SHARING
  // ============================================

  async uploadFile(params: {
    channelId: string;
    file: File;
    category?: string;
  }): Promise<FileAttachment> {
    const { channelId, file, category } = params;
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    // Generate file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${channelId}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('collaboration-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('collaboration-files')
      .getPublicUrl(filePath);

    // Save metadata to database
    const { data, error } = await supabase
      .from('shared_files')
      .insert({
        lab_id: channelId, // TODO: Get actual lab_id
        channel_id: channelId,
        uploaded_by: userId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_category: category,
        storage_path: filePath,
        download_url: urlData.publicUrl,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      file_name: data.file_name,
      file_type: data.file_type,
      file_size: data.file_size,
      storage_path: data.storage_path,
      download_url: data.download_url,
    };
  }

  async getChannelFiles(channelId: string) {
    const { data, error } = await supabase
      .from('shared_files')
      .select('*')
      .eq('channel_id', channelId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async deleteFile(fileId: string) {
    // Get file info
    const { data: file } = await supabase
      .from('shared_files')
      .select('storage_path')
      .eq('id', fileId)
      .single();

    if (file) {
      // Delete from storage
      await supabase.storage
        .from('collaboration-files')
        .remove([file.storage_path]);
    }

    // Mark as deleted in database
    const { error } = await supabase
      .from('shared_files')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', fileId);

    if (error) throw error;
  }

  // ============================================
  // PROJECTS
  // ============================================

  async getProjects(labId: string): Promise<SharedProject[]> {
    const { data, error } = await supabase
      .from('shared_projects')
      .select('*')
      .eq('lab_id', labId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createProject(params: {
    labId: string;
    name: string;
    description?: string;
    visibility?: 'public' | 'private' | 'team';
  }): Promise<SharedProject> {
    const { labId, name, description, visibility = 'private' } = params;
    const user = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('shared_projects')
      .insert({
        lab_id: labId,
        name,
        description,
        visibility,
        owner_id: user.data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as project member
    await supabase
      .from('project_members')
      .insert({
        project_id: data.id,
        user_id: user.data.user?.id,
        role: 'owner',
      });

    // Create default channel for project
    await this.createChannel({
      labId,
      name: `project-${name.toLowerCase().replace(/\s+/g, '-')}`,
      displayName: `# ${name}`,
      description: `Discussion for ${name}`,
      type: 'project',
      projectId: data.id,
    });

    return data;
  }

  async addProjectMember(projectId: string, userId: string, role: 'admin' | 'member' | 'viewer' = 'member') {
    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role,
      });

    if (error && !error.message.includes('duplicate')) throw error;
  }

  async removeProjectMember(projectId: string, userId: string) {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async getNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select(`
        *,
        actor:team_members!notifications_actor_id_fkey(*)
      `)
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async markNotificationAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) throw error;
  }

  async markAllNotificationsAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }

  private async createMentionNotifications(message: ChatMessage, mentionedUserIds: string[]) {
    const notifications = mentionedUserIds.map(userId => ({
      user_id: userId,
      type: 'mention' as const,
      title: 'You were mentioned',
      message: message.content.substring(0, 100),
      channel_id: message.channel_id,
      message_id: message.id,
      actor_id: message.user_id,
    }));

    await supabase.from('notifications').insert(notifications);
  }

  private async createDirectMessageNotification(dm: DirectMessage) {
    await supabase.from('notifications').insert({
      user_id: dm.recipient_id,
      type: 'dm',
      title: 'New direct message',
      message: dm.content.substring(0, 100),
      actor_id: dm.sender_id,
    });
  }

  // ============================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================

  subscribeToChannel(channelId: string, callbacks: {
    onMessage?: (message: ChatMessage) => void;
    onMessageUpdate?: (message: ChatMessage) => void;
    onMessageDelete?: (messageId: string) => void;
    onTyping?: (indicators: TypingIndicator[]) => void;
  }) {
    const channelKey = `channel:${channelId}`;

    // Unsubscribe if already subscribed
    if (this.realtimeChannels.has(channelKey)) {
      this.realtimeChannels.get(channelKey)?.unsubscribe();
    }

    const channel = supabase.channel(channelKey)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          if (callbacks.onMessage) {
            callbacks.onMessage(payload.new as ChatMessage);
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          if (callbacks.onMessageUpdate) {
            callbacks.onMessageUpdate(payload.new as ChatMessage);
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          if (callbacks.onMessageDelete) {
            callbacks.onMessageDelete(payload.old.id);
          }
        }
      )
      .subscribe();

    this.realtimeChannels.set(channelKey, channel);

    return () => {
      channel.unsubscribe();
      this.realtimeChannels.delete(channelKey);
    };
  }

  subscribeToPresence(labId: string, callback: (members: TeamMember[]) => void) {
    const channelKey = `presence:${labId}`;

    if (this.realtimeChannels.has(channelKey)) {
      this.realtimeChannels.get(channelKey)?.unsubscribe();
    }

    const channel = supabase.channel(channelKey)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `lab_id=eq.${labId}`
        },
        async () => {
          // Refetch all members when presence changes
          const members = await this.getTeamMembers(labId);
          callback(members);
        }
      )
      .subscribe();

    this.realtimeChannels.set(channelKey, channel);

    return () => {
      channel.unsubscribe();
      this.realtimeChannels.delete(channelKey);
    };
  }

  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const channelKey = `notifications:${userId}`;

    if (this.realtimeChannels.has(channelKey)) {
      this.realtimeChannels.get(channelKey)?.unsubscribe();
    }

    const channel = supabase.channel(channelKey)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    this.realtimeChannels.set(channelKey, channel);

    return () => {
      channel.unsubscribe();
      this.realtimeChannels.delete(channelKey);
    };
  }

  // ============================================
  // TYPING INDICATORS
  // ============================================

  async setTyping(channelId: string, isTyping: boolean) {
    const user = await supabase.auth.getUser();

    if (isTyping) {
      await supabase
        .from('typing_indicators')
        .upsert({
          channel_id: channelId,
          user_id: user.data.user?.id,
          is_typing: true,
          expires_at: new Date(Date.now() + 5000).toISOString(),
        });
    } else {
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', user.data.user?.id);
    }
  }

  async getTypingUsers(channelId: string): Promise<TypingIndicator[]> {
    const { data, error } = await supabase
      .from('typing_indicators')
      .select(`
        *,
        user:team_members!typing_indicators_user_id_fkey(*)
      `)
      .eq('channel_id', channelId)
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;
    return data || [];
  }

  // ============================================
  // PRESENCE TRACKING
  // ============================================

  startPresenceTracking() {
    // Update presence every 30 seconds
    this.presenceInterval = setInterval(async () => {
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.data.user.id,
            status: 'online',
            last_seen: new Date().toISOString(),
          });
      }
    }, 30000);

    // Set initial presence
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('user_presence')
          .upsert({
            user_id: data.user.id,
            status: 'online',
            last_seen: new Date().toISOString(),
          });
      }
    });
  }

  stopPresenceTracking() {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }

    // Set status to offline
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('user_presence')
          .update({ status: 'offline' })
          .eq('user_id', data.user.id);
      }
    });
  }

  // ============================================
  // SEARCH
  // ============================================

  async searchMessages(params: {
    labId: string;
    query: string;
    channelId?: string;
    limit?: number;
  }): Promise<ChatMessage[]> {
    const { labId, query, channelId, limit = 20 } = params;

    let rpcQuery = supabase.rpc('search_messages', {
      search_query: query,
      p_lab_id: labId,
      p_channel_id: channelId,
      p_limit: limit,
    });

    const { data, error } = await rpcQuery;

    if (error) throw error;
    return data || [];
  }

  // ============================================
  // CLEANUP
  // ============================================

  cleanup() {
    // Unsubscribe from all channels
    this.realtimeChannels.forEach(channel => channel.unsubscribe());
    this.realtimeChannels.clear();

    // Stop presence tracking
    this.stopPresenceTracking();
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();
export default collaborationService;
