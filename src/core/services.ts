import { supabase } from "@/integrations/supabase/client";
import {
    IAuthService,
    IStorageService,
    IMLService,
    ICollaborationService,
    UserProfile,
    TeamMember,
    LeaderboardEntry,
    SharedProject,
    SharedFile,
    Comment,
    ActivityItem
} from "./interfaces";
import { RealtimeChannel } from "@supabase/supabase-js";

// === Auth Service Implementation ===
export class SupabaseAuthService implements IAuthService {
    async signIn(email: string) {
        return await supabase.auth.signInWithOtp({ email });
    }

    async signOut() {
        return await supabase.auth.signOut();
    }

    async getUser(): Promise<UserProfile | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        return {
            id: user.id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
        };
    }

    async getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    }
}

// === Storage Service Implementation ===
export class SupabaseStorageService implements IStorageService {
    async uploadFile(bucket: string, path: string, file: File) {
        const { data, error } = await supabase.storage.from(bucket).upload(path, file);
        if (error) return { path: "", error };
        return { path: data.path, error: null };
    }

    getPublicUrl(bucket: string, path: string): string {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }
}

// === ML Service Implementation ===
export class PythonMLService implements IMLService {
    private baseUrl = "http://localhost:8002/api/ml";

    async startAutoML(datasetId: string, options: any) {
        const response = await fetch(`${this.baseUrl}/automl`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataset_id: datasetId, ...options })
        });
        const data = await response.json();
        return { jobId: datasetId };
    }

    async getJobStatus(datasetId: string) {
        const response = await fetch(`${this.baseUrl}/pipeline-status/${datasetId}`);
        if (!response.ok) throw new Error("Failed to fetch status");
        return await response.json();
    }

    async generateInsights(datasetId: string, data: any[]) {
        const response = await fetch(`${this.baseUrl}/insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataset_id: datasetId, data })
        });
        return await response.json();
    }
}

// === Collaboration Service Implementation ===
// Import from the new optimized service
import { collaborationService } from './services/CollaborationService';

export class SupabaseCollaborationService implements ICollaborationService {

    async getTeamMembers(labId: string) {
        try {
            const teamMembers = await collaborationService.getTeamMembers(labId);
            return { data: teamMembers, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    async upsertTeamMember(member: Partial<TeamMember> & { lab_id: string }) {
        try {
            const teamMember = await collaborationService.upsertTeamMember(member);
            return { data: teamMember, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    async getTeamMember(userId: string, labId: string) {
        return await collaborationService.getTeamMember(userId, labId);
    }

    async updateStatus(status: 'online' | 'away' | 'busy' | 'offline', statusMessage?: string) {
        try {
            await collaborationService.updateStatus(status, statusMessage);
            return { error: null };
        } catch (error) {
            return { error };
        }
    }

    async inviteMember(email: string, role: string, labId: string) {
        try {
            await collaborationService.inviteMember(email, role, labId);

            // [ADVANCED] Integration: Log activity for invite
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('collaboration_activity').insert({
                    lab_id: labId,
                    user_id: user.id,
                    action_type: 'invite',
                    description: `Invited ${email} as ${role}`,
                    metadata: { email, role }
                });
            }

            return { error: null };
        } catch (error: any) {
            return { error };
        }
    }

    subscribeToPresence(labId: string, onSync: (users: any[]) => void): RealtimeChannel {
        return collaborationService.subscribeToPresence(labId, onSync);
    }

    async getLeaderboard(timeRange: string): Promise<LeaderboardEntry[]> {
        const now = new Date();
        let startTime = new Date(0).toISOString();
        if (timeRange === 'weekly') {
            const date = new Date();
            date.setDate(now.getDate() - 7);
            startTime = date.toISOString();
        } else if (timeRange === 'monthly') {
            const date = new Date();
            date.setDate(now.getDate() - 30);
            startTime = date.toISOString();
        }

        const [membersRes, experimentsRes, datasetsRes, snapshotsRes] = await Promise.all([
            supabase.from('team_members').select('*'), // Changed from profiles to team_members
            supabase.from('experiments').select('user_id, created_at').gte('created_at', startTime),
            supabase.from('datasets').select('user_id, created_at').gte('created_at', startTime),
            supabase.from('leaderboard_snapshots')
                .select('user_id, rank')
                .eq('snapshot_date', new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0])
        ]);

        if (membersRes.error) throw membersRes.error;

        const members = membersRes.data || [];
        const experiments = experimentsRes.data || [];
        const datasets = datasetsRes.data || [];
        const snapshots = snapshotsRes.data || [];
        const snapshotMap = new Map(snapshots.map(s => [s.user_id, s.rank]));

        const leaderboardData = members.map(member => {
            const userExperiments = experiments.filter(e => e.user_id === member.user_id).length;
            const userDatasets = datasets.filter(d => d.user_id === member.user_id).length;
            const userComments = 0;
            const userFiles = 0;

            const score = (userDatasets * 10) + (userExperiments * 20) + (userComments * 2) + (userFiles * 5);

            const badges = [];
            if (score > 1000) badges.push('🏆');
            if (userExperiments > 10) badges.push('⚡');
            if (userDatasets > 10) badges.push('📚');

            return {
                id: member.user_id, // Use user_id as the stats key
                name: member.display_name || 'Unknown',
                email: '', // email might not be in team_members, but let's leave empty or fetch if needed
                avatar: member.avatar_url,
                stats: {
                    datasetsUploaded: userDatasets,
                    experimentsCreated: userExperiments,
                    modelsTrained: 0,
                    commentsPosted: userComments,
                    filesShared: userFiles
                },
                totalScore: score,
                rank: 0,
                trend: 'same' as const,
                streak: 0,
                badges
            };
        });

        leaderboardData.sort((a, b) => b.totalScore - a.totalScore);

        return leaderboardData.map((entry, index) => {
            const currentRank = index + 1;
            const yesterdayRank = snapshotMap.get(entry.id);

            let trend: 'up' | 'down' | 'same' = 'same';
            if (yesterdayRank) {
                if (currentRank < yesterdayRank) trend = 'up';
                else if (currentRank > yesterdayRank) trend = 'down';
            }

            return {
                ...entry,
                rank: currentRank,
                trend
            };
        });
    }

    async getProjects(labId: string) {
        const { data, error } = await supabase
            .from('shared_projects')
            .select('*')
            .eq('lab_id', labId)
            .order('updated_at', { ascending: false });

        if (error) return { data: null, error };

        const projects = data.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            owner_id: p.owner_id,
            lab_id: p.lab_id,
            status: p.status,
            members: 0,
            owner: 'Team Lead',
            lastUpdate: new Date(p.updated_at).toLocaleDateString()
        }));

        return { data: projects, error: null };
    }

    async getProject(projectId: string) {
        const { data, error } = await supabase
            .from('shared_projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error || !data) return { data: null, error };

        const project: SharedProject = {
            id: data.id,
            name: data.name,
            description: data.description,
            owner_id: data.owner_id,
            lab_id: data.lab_id,
            status: data.status,
            members: 0,
            owner: 'Team Lead',
            lastUpdate: new Date(data.updated_at).toLocaleDateString()
        };

        return { data: project, error: null };
    }

    async getExperiment(experimentId: string) {
        // Fetch experiment details for link unfurling
        const { data, error } = await supabase
            .from('experiments')
            .select(`
                id, 
                title, 
                status, 
                created_at,
                user_id
            `)
            .eq('id', experimentId)
            .single();

        if (error) return { data: null, error };

        // We might want to fetch user name too, but basic info is fine for now
        return { data, error: null };
    }

    async createProject(project: any) {
        const { data, error } = await supabase
            .from('shared_projects')
            .insert(project)
            .select()
            .single();

        // [ADVANCED] Auto-create a channel for this project
        if (!error && data) {
            await this.createChannel({
                name: project.name.toLowerCase().replace(/\s+/g, '-'),
                display_name: project.name,
                type: 'project',
                lab_id: project.lab_id,
                description: `Discussion for project: ${project.name}`
            });
            // [ADVANCED] Log activity
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('collaboration_activity').insert({
                lab_id: project.lab_id,
                type: 'experiment', // Using 'experiment' broadly for project creation for now
                user_id: user?.id,
                entity_type: project.name,
                metadata: { projectId: data.id }
            });
        }

        return { data, error };
    }

    async getFiles(projectId: string) {
        const { data, error } = await supabase
            .from('shared_files')
            .select('*, u:uploaded_by(email)')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) return { data: null, error };

        const files = data.map(f => ({
            id: f.id,
            name: f.name,
            type: f.mime_type,
            size: `${(f.size_bytes / 1024 / 1024).toFixed(2)} MB`,
            uploadedBy: (f.u as any)?.email.split('@')[0] || 'Unknown',
            uploadedByAvatar: '',
            uploadedAt: new Date(f.created_at).toLocaleDateString(),
            downloads: f.downloads || 0,
            category: f.category,
            url: ''
        }));

        return { data: files, error: null };
    }

    async uploadFile(file: File, projectId: string, labId: string) {
        const path = `${labId}/${projectId}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('collaboration-files')
            .upload(path, file);

        if (uploadError) return { data: null, error: uploadError };

        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('shared_files')
            .insert({
                name: file.name,
                storage_path: path,
                size_bytes: file.size,
                mime_type: file.type,
                project_id: projectId,
                lab_id: labId,
                uploaded_by: user?.id
            })
            .select()
            .single();

        if (!error && data) {
            // [ADVANCED] Log activity
            await supabase.from('collaboration_activity').insert({
                lab_id: labId,
                type: 'upload',
                user_id: user?.id,
                entity_type: file.name,
                metadata: { fileId: data.id }
            });
        }

        return { data, error };
    }

    async deleteFile(fileId: string) {
        // First get the path to delete from storage
        const { data: fileData } = await supabase.from('shared_files').select('storage_path').eq('id', fileId).single();
        if (fileData) {
            await supabase.storage.from('collaboration-files').remove([fileData.storage_path]);
        }
        return await supabase.from('shared_files').delete().eq('id', fileId);
    }

    async getComments(entityId: string, entityType: string) {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                user:user_id(email, user_metadata),
                likes:comment_likes(count)
            `)
            .eq('entity_id', entityId)
            .eq('entity_type', entityType)
            .order('created_at', { ascending: false });

        if (error) return { data: null, error };

        const comments = data.map(c => ({
            id: c.id,
            user: (c.user as any)?.email?.split('@')[0] || 'User',
            avatar: (c.user as any)?.user_metadata?.avatar_url,
            content: c.content,
            timestamp: new Date(c.created_at).toLocaleTimeString(),
            likes: c.likes[0]?.count || 0,
            isLiked: false,
            isPinned: c.is_pinned,
            replies: [],
            parentId: c.parent_id
        }));

        const rootComments = comments.filter((c: any) => !c.parentId);
        // Basic threading logic could be expanded here

        return { data: rootComments, error: null };
    }

    // [UPDATED] With Mention parsing
    async addComment(entityId: string, entityType: string, content: string, parentId?: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // basic mention parsing
        const mentions = content.match(/@([\w\s]+)/g)?.map(m => m.substring(1)) || [];

        const { data, error } = await supabase
            .from('comments')
            .insert({
                entity_id: entityId,
                entity_type: entityType,
                user_id: user.id,
                content,
                parent_id: parentId,
                is_pinned: false
                // we could store mentions in a processed column, or just log activity
            })
            .select()
            .single();

        if (!error && data) {
            // Log activity
            // For comments, we'll log activity only for top-level comments to avoid noise
            if (!parentId) {
                await supabase.from('collaboration_activity').insert({
                    lab_id: '00000000-0000-0000-0000-000000000001', // TODO: Need to pass labId context to comments
                    type: 'comment',
                    user_id: user?.id,
                    entity_type: entityType,
                    metadata: { commentId: data.id }
                });
            }

            // Handle Mentions - Insert Activity for mentioned users
            // In a real app, we'd look up IDs. Here we assume we have a way or just log a generic mention.
            // For MVP: We will just log that a mention happened.
            if (mentions.length > 0) {
                await supabase.from('collaboration_activity').insert({
                    lab_id: '00000000-0000-0000-0000-000000000001', // TODO: Need to pass labId context to comments
                    type: 'mention', // Use a specific type for mentions
                    user_id: user?.id,
                    entity_type: entityType,
                    metadata: { commentId: data.id, mentionedUsers: mentions }
                });
            }
        }

        if (error) return { data: null, error };

        // Construct return object
        // We need to re-fetch or map user.
        return {
            data: {
                id: data.id,
                user: 'Me',
                avatar: user.user_metadata?.avatar_url,
                content: data.content,
                timestamp: 'Just now',
                likes: 0,
                isLiked: false,
                isPinned: false
            } as Comment,
            error: null
        };
    }

    async toggleLikeComment(commentId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'No user' };

        const { data } = await supabase.from('comment_likes')
            .select('*').eq('comment_id', commentId).eq('user_id', user.id).single();

        if (data) {
            return await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
        } else {
            return await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id });
        }
    }

    async togglePinComment(commentId: string) {
        // Requires admin check (omitted for brevity)
        return { error: null };
    }

    async deleteComment(commentId: string) {
        return await supabase.from('comments').delete().eq('id', commentId);
    }

    async getActivities(labId: string) {
        const { data, error } = await supabase
            .from('collaboration_activity')
            .select('*, user:user_id(email)')
            .eq('lab_id', labId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) return { data: null, error };

        const activities = data.map(a => ({
            id: a.id,
            type: a.type,
            user: (a.user as any)?.email?.split('@')[0] || 'System',
            userAvatar: '',
            action: a.type === 'upload' ? 'uploaded' : a.type === 'comment' ? 'commented on' : a.type === 'invite' ? 'invited' : 'acted on',
            target: a.entity_type,
            timestamp: new Date(a.created_at).toLocaleTimeString()
        }));

        return { data: activities, error: null };
    }

    // === CHAT METHODS ===

    async getChannels(labId: string) {
        const { data, error } = await supabase
            .from("chat_channels")
            .select("*")
            .eq("lab_id", labId)
            .order("created_at", { ascending: true });

        return { data, error };
    }

    async createChannel(channel: any) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('chat_channels')
            .insert({ ...channel, created_by: user?.id })
            .select()
            .single();
        return { data, error };
    }

    async getMessages(channelId: string) {
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

        // Map user data
        const mappedData = data?.map(msg => ({
            ...msg,
            user: msg.user ? {
                display_name: msg.user.email?.split('@')[0] || 'Unknown',
                avatar_url: undefined,
                email: msg.user.email
            } : undefined
        }));

        return { data: mappedData, error };
    }

    async sendMessage(channelId: string, content: string, parentId?: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
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

        // [AI INTEGRATION] Check for @LabAI mention
        if (!error && content.toLowerCase().includes('@labai')) {
            this.processAIMessage(channelId, content, user.id);
        }

        return { error };
    }

    private async processAIMessage(channelId: string, userContent: string, userId: string) {
        // [AI INTEGRATION] Securely invoke Edge Function
        // This function acts as a proxy to Grok/xAI, keeping keys safe on server.
        const { data, error } = await supabase.functions.invoke('chat-bot-ai', {
            body: {
                message: userContent,
                channelId,
                userId,
                history: [
                    // Optionally pass recent chat history context here
                    // For now, we start fresh or rely on what AI knows
                ]
            }
        });

        if (error) {
            console.error("AI Service Error:", error);
            // Optionally insert an error message system chat
        } else {
            console.log("AI Response processed securely.");
        }
    }

    async editMessage(messageId: string, content: string) {
        const { error } = await supabase
            .from('chat_messages')
            .update({
                content: content,
                edited_at: new Date().toISOString()
            })
            .eq('id', messageId);
        return { error };
    }

    async deleteMessage(messageId: string) {
        const { error } = await supabase
            .from('chat_messages')
            .update({
                deleted_at: new Date().toISOString()
            })
            .eq('id', messageId);
        return { error };
    }

    async addReaction(messageId: string, emoji: string) {
        // Logic to get current reactions, toggle, and update
        // This is complex to do transactionally in client code, better in Edge Function or Postgres Function
        // wrapper for simplicity:
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: "No user" };

        const { data: msg } = await supabase.from('chat_messages').select('reactions').eq('id', messageId).single();
        if (!msg) return { error: "Message not found" };

        const reactions = msg.reactions || {};
        const userReactions = reactions[emoji] || [];

        const newUserReactions = userReactions.includes(user.id)
            ? userReactions.filter((id: string) => id !== user.id)
            : [...userReactions, user.id];

        const newReactions = { ...reactions, [emoji]: newUserReactions };
        if (newUserReactions.length === 0) delete newReactions[emoji];

        const { error } = await supabase.from('chat_messages').update({ reactions: newReactions }).eq('id', messageId);
        return { error };
    }

    subscribeToChat(channelId: string, onMessage: (msg: any) => void, onUpdate: (msg: any) => void, onDelete: (id: string) => void): RealtimeChannel {
        return collaborationService.subscribeToChat(channelId, onMessage, onUpdate, onDelete);
    }

    subscribeToChannels(labId: string, onInsert: (ch: any) => void, onUpdate: (ch: any) => void, onDelete: (id: string) => void): RealtimeChannel {
        return collaborationService.subscribeToChannels(labId, onInsert, onUpdate, onDelete);
    }

    // Direct Messages
    async getDirectMessages(otherUserId: string) {
        try {
            const data = await collaborationService.getDirectMessages(otherUserId);
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    async sendDirectMessage(recipientId: string, content: string) {
        try {
            const data = await collaborationService.sendDirectMessage(recipientId, content);
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    subscribeToDirectMessages(userId: string, onMessage: (msg: any) => void): RealtimeChannel {
        return collaborationService.subscribeToDirectMessages(userId, onMessage);
    }

    // Search
    async searchEverything(query: string, labId: string) {
        return await collaborationService.searchEverything(query, labId);
    }

    async startTyping(channelId: string) {
        return await collaborationService.startTyping(channelId);
    }

    async stopTyping(channelId: string) {
        return await collaborationService.stopTyping(channelId);
    }

    subscribeToTyping(channelId: string, onTypingStart: (user: string) => void, onTypingStop: (user: string) => void): RealtimeChannel {
        return collaborationService.subscribeToTyping(channelId, onTypingStart, onTypingStop);
    }

    // Canvases
    async getCanvases(labId: string) {
        return await collaborationService.getCanvases(labId);
    }

    async createCanvas(title: string, labId: string) {
        return await collaborationService.createCanvas(title, labId);
    }

    async updateCanvas(id: string, content: any) {
        return await collaborationService.updateCanvas(id, content);
    }

    // Lists
    async getLists(labId: string) {
        return await collaborationService.getLists(labId);
    }

    async createList(title: string, labId: string) {
        return await collaborationService.createList(title, labId);
    }

    async addListItem(listId: string, content: string) {
        return await collaborationService.addListItem(listId, content);
    }

    async toggleListItem(itemId: string, isCompleted: boolean) {
        return await collaborationService.toggleListItem(itemId, isCompleted);
    }

    // Scientific Resources & Deep Sync
    async shareResource(resourceId: string, resourceType: string, channelId: string) {
        return await collaborationService.shareResource(resourceId, resourceType, channelId);
    }

    async getSharedResources(labId: string, type?: string) {
        return await collaborationService.getSharedResources(labId, type);
    }

    async getLabResources(labId: string, type: 'dataset' | 'report' | 'experiment') {
        return await collaborationService.getLabResources(labId, type);
    }

    // NEW METHODS - Notifications
    async getNotifications(userId: string) {
        return await collaborationService.getNotifications(userId);
    }

    async markNotificationAsRead(notificationId: string) {
        return await collaborationService.markNotificationAsRead(notificationId);
    }

    async markAllNotificationsAsRead() {
        return await collaborationService.markAllNotificationsAsRead();
    }

    subscribeToNotifications(userId: string, onNotification: (notification: any) => void): RealtimeChannel {
        return collaborationService.subscribeToNotifications(userId, onNotification);
    }

    // NEW METHODS - Unread Counts
    async getUnreadCount(channelId: string, userId: string): Promise<number> {
        return await collaborationService.getUnreadCount(channelId, userId);
    }

    async markChannelAsRead(channelId: string, userId: string) {
        return await collaborationService.markChannelAsRead(channelId, userId);
    }

    async markDirectMessageAsRead(messageId: string) {
        return await collaborationService.markDirectMessageAsRead(messageId);
    }

    async getUnreadDirectMessageCount(userId: string): Promise<number> {
        return await collaborationService.getUnreadDirectMessageCount(userId);
    }

    // NEW METHODS - Channel Membership
    async joinChannel(channelId: string, userId: string, labId: string) {
        return await collaborationService.joinChannel(channelId, userId, labId);
    }

    async leaveChannel(channelId: string, userId: string) {
        return await collaborationService.leaveChannel(channelId, userId);
    }

    async getChannelMembers(channelId: string) {
        return await collaborationService.getChannelMembers(channelId);
    }

    async isUserChannelMember(channelId: string, userId: string): Promise<boolean> {
        return await collaborationService.isUserChannelMember(channelId, userId);
    }
}

