/**
 * 🎣 COLLABORATION HOOKS
 * Production-ready hooks for real-time collaboration
 * Features: Auto-reconnect, error handling, cleanup, caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { collaborationService } from '@/core/services/CollaborationService';
import {
  TeamMember,
  ChatChannel,
  ChatMessage,
  Notification,
  SharedFile,
  SharedProject,
} from '@/core/interfaces';
import { useToast } from './use-toast';

// ============================================
// REAL-TIME CHAT HOOK
// ============================================

interface UseRealtimeChatOptions {
  channelId: string | null;
  autoLoad?: boolean;
  pageSize?: number;
}

export function useRealtimeChat(options: UseRealtimeChatOptions) {
  const { channelId, autoLoad = true, pageSize = 50 } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!channelId) return;

    setLoading(true);
    setError(null);

    try {
      const fetchedMessages = await collaborationService.getMessages({
        channelId,
        limit: pageSize,
      });
      setMessages(fetchedMessages);
      setHasMore(fetchedMessages.length === pageSize);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load messages'));
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }, [channelId, pageSize]);

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!channelId || !hasMore || loading || messages.length === 0) return;

    setLoading(true);

    try {
      const oldestMessage = messages[0];
      const olderMessages = await collaborationService.getMessages({
        channelId,
        limit: pageSize,
        before: oldestMessage.created_at,
      });

      setMessages(prev => [...olderMessages, ...prev]);
      setHasMore(olderMessages.length === pageSize);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more messages'));
      console.error('Failed to load more messages:', err);
    } finally {
      setLoading(false);
    }
  }, [channelId, hasMore, loading, messages, pageSize]);

  // Send message
  const sendMessage = useCallback(async (params: {
    content: string;
    parentId?: string;
    mentions?: string[];
    attachments?: any[];
  }) => {
    if (!channelId) return;

    try {
      const message = await collaborationService.sendMessage({
        channelId,
        ...params,
      });

      // Optimistic update (will be confirmed by real-time subscription)
      setMessages(prev => [...prev, message]);
      return message;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'));
      throw err;
    }
  }, [channelId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!channelId) return;

    // Load initial messages
    if (autoLoad) {
      loadMessages();
    }

    // Subscribe to real-time updates
    const unsubscribe = collaborationService.subscribeToChannel(channelId, {
      onMessage: (message) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      },
      onMessageUpdate: (message) => {
        setMessages(prev =>
          prev.map(m => (m.id === message.id ? message : m))
        );
      },
      onMessageDelete: (messageId) => {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      },
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [channelId, autoLoad, loadMessages]);

  return {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    loadMore,
    reload: loadMessages,
  };
}

// ============================================
// PRESENCE HOOK
// ============================================

export function usePresence(labId: string | null) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!labId) return;

    // Start presence tracking
    collaborationService.startPresenceTracking(labId);

    // Load initial members
    collaborationService.getTeamMembers(labId).then(members => {
      setMembers(members);
      setOnlineCount(members.filter(m => m.status === 'online').length);
      setLoading(false);
    });

    // Subscribe to presence updates
    const unsubscribe = collaborationService.subscribeToPresence(labId, (updatedMembers) => {
      setMembers(updatedMembers);
      setOnlineCount(updatedMembers.filter(m => m.status === 'online').length);
    });

    return () => {
      unsubscribe();
      collaborationService.stopPresenceTracking();
    };
  }, [labId]);

  return { members, onlineCount, loading };
}

// ============================================
// TYPING INDICATOR HOOK
// ============================================

export function useTypingIndicator(channelId: string | null) {
  const [typingUsers, setTypingUsers] = useState<TeamMember[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Start typing
  const startTyping = useCallback(() => {
    if (!channelId) return;

    collaborationService.setTyping(channelId, true);

    // Auto-stop after 5 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      collaborationService.setTyping(channelId, false);
    }, 5000);
  }, [channelId]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!channelId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    collaborationService.setTyping(channelId, false);
  }, [channelId]);

  // Poll for typing users every 2 seconds
  useEffect(() => {
    if (!channelId) return;

    const interval = setInterval(async () => {
      const users = await collaborationService.getTypingUsers(channelId);
      setTypingUsers(users);
    }, 2000);

    return () => {
      clearInterval(interval);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [channelId]);

  return { typingUsers, startTyping, stopTyping };
}

// ============================================
// CHANNELS HOOK
// ============================================

export function useChannels(labId: string | null) {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadChannels = useCallback(async () => {
    if (!labId) return;

    setLoading(true);
    setError(null);

    try {
      const fetchedChannels = await collaborationService.getChannels(labId);
      setChannels(fetchedChannels);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load channels'));
      console.error('Failed to load channels:', err);
    } finally {
      setLoading(false);
    }
  }, [labId]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const createChannel = useCallback(async (params: {
    name: string;
    display_name: string;
    description?: string;
    type: 'public' | 'private' | 'project';
    project_id?: string;
  }) => {
    if (!labId) return;

    try {
      const channel = await collaborationService.createChannel({
        labId,
        ...params,
      });
      setChannels(prev => [...prev, channel]);
      return channel;
    } catch (err) {
      throw err;
    }
  }, [labId]);

  return { channels, loading, error, createChannel, reload: loadChannels };
}

// ============================================
// NOTIFICATIONS HOOK
// ============================================

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);

    try {
      const fetchedNotifications = await collaborationService.getNotifications(userId);
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Subscribe to new notifications
  useEffect(() => {
    if (!userId) return;

    loadNotifications();

    const unsubscribe = collaborationService.subscribeToNotifications(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
      });
    });

    return unsubscribe;
  }, [userId, loadNotifications, toast]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await collaborationService.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      await collaborationService.markAllNotificationsAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    reload: loadNotifications,
  };
}

// ============================================
// FILE SHARING HOOK
// ============================================

export function useFiles(channelId: string | null) {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadFiles = useCallback(async () => {
    if (!channelId) return;

    setLoading(true);

    try {
      const fetchedFiles = await collaborationService.getChannelFiles(channelId);
      setFiles(fetchedFiles);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const uploadFile = useCallback(async (file: File, labId: string, category?: string) => {
    if (!channelId) return;

    setUploading(true);

    try {
      const uploadedFile = await collaborationService.uploadFile({
        channelId,
        labId,
        file,
        category,
      });
      setFiles(prev => [uploadedFile, ...prev]);
      return uploadedFile;
    } catch (err) {
      console.error('Failed to upload file:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [channelId]);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      await collaborationService.deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error('Failed to delete file:', err);
      throw err;
    }
  }, []);

  return { files, loading, uploading, uploadFile, deleteFile, reload: loadFiles };
}

// ============================================
// PROJECTS HOOK
// ============================================

export function useProjects(labId: string | null) {
  const [projects, setProjects] = useState<SharedProject[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    if (!labId) return;

    setLoading(true);

    try {
      const fetchedProjects = await collaborationService.getProjects(labId);
      setProjects(fetchedProjects);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, [labId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = useCallback(async (params: {
    name: string;
    description?: string;
    visibility?: 'public' | 'private' | 'team';
  }) => {
    if (!labId) return;

    try {
      const project = await collaborationService.createProject({
        labId,
        ...params,
      });
      setProjects(prev => [project, ...prev]);
      return project;
    } catch (err) {
      console.error('Failed to create project:', err);
      throw err;
    }
  }, [labId]);

  return { projects, loading, createProject, reload: loadProjects };
}

// ============================================
// AI FEATURES HOOK
// ============================================

export function useAICollaboration(channelId: string | null) {
  const [summary, setSummary] = useState('');
  const [smartReply, setSmartReply] = useState('');
  const [generating, setGenerating] = useState(false);

  const generateSummary = useCallback(async () => {
    if (!channelId) return;

    setGenerating(true);

    try {
      const generatedSummary = await collaborationService.generateChannelSummary(channelId);
      setSummary(generatedSummary);
      return generatedSummary;
    } catch (err) {
      console.error('Failed to generate summary:', err);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, [channelId]);

  const getSmartReply = useCallback(async (messageId: string) => {
    setGenerating(true);

    try {
      const reply = await collaborationService.getSmartReply(messageId);
      setSmartReply(reply);
      return reply;
    } catch (err) {
      console.error('Failed to generate smart reply:', err);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, []);

  return {
    summary,
    smartReply,
    generating,
    generateSummary,
    getSmartReply,
  };
}
