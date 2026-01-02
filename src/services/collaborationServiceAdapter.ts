import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
    ICollaborationService,
    TeamMember,
    LeaderboardEntry,
    SharedProject,
    SharedFile,
    Comment,
    ActivityItem,
    ChatChannel,
    ChatMessage,
    DirectMessage,
    SharedCanvas,
    SharedList,
    ListItem,
    SaaSResource
} from "@/core/interfaces";
import { collaborationService } from "./CollaborationService";

/**
 * Adapter class that implements ICollaborationService using the specific collaborationService implementation.
 * This is kept to satisfy the IServiceContainer interface in ServiceProvider.
 */
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
        // ... (Logic copied from original file to avoid breaking changes, or delegate if possible)
        // Since the original implementation had complex logic in the class, we should ideally move that logic to the underlying service
        // For now, to keep it safe, I will copy the logic, but ideally this should be in CollaborationService.ts

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
            supabase.from('team_members').select('*'),
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
                id: member.user_id,
                name: member.display_name || 'Unknown',
                email: '',
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

    async createProject(project: any) {
        const { data, error } = await supabase
            .from('shared_projects')
            .insert(project)
            .select()
            .single();

        if (!error && data) {
            await this.createChannel({
                name: project.name.toLowerCase().replace(/\s+/g, '-'),
                display_name: project.name,
                type: 'project',
                lab_id: project.lab_id,
                description: `Discussion for project: ${project.name}`
            });

            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('collaboration_activity').insert({
                lab_id: project.lab_id,
                type: 'experiment',
                user_id: user?.id,
                entity_type: project.name,
                metadata: { projectId: data.id }
            });
        }

        return { data, error };
    }

    async getExperiment(experimentId: string) {
        const { data, error } = await supabase
            .from('experiments')
            .select(`id, title, status, created_at, user_id`)
            .eq('id', experimentId)
            .single();

        if (error) return { data: null, error };
        return { data, error: null };
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
        const { data: fileData } = await supabase.from('shared_files').select('storage_path').eq('id', fileId).single();
        if (fileData) {
            await supabase.storage.from('collaboration-files').remove([fileData.storage_path]);
        }
        return await supabase.from('shared_files').delete().eq('id', fileId);
    }

    async getComments(entityId: string, entityType: string) {
        return await collaborationService.getComments(entityId, entityType);
    }

    async addComment(entityId: string, entityType: string, content: string, parentId?: string) {
        return await collaborationService.addComment(entityId, entityType, content, parentId);
    }

    async toggleLikeComment(commentId: string) {
        return await collaborationService.toggleLikeComment(commentId);
    }

    async togglePinComment(commentId: string) {
        return await collaborationService.togglePinComment(commentId);
    }

    async deleteComment(commentId: string) {
        return await collaborationService.deleteComment(commentId);
    }

    async getActivities(labId: string) {
        return await collaborationService.getActivities(labId);
    }

    // === CHAT METHODS ===
    async getChannels(labId: string) {
        return await collaborationService.getChannels(labId);
    }

    async createChannel(channel: any) {
        return await collaborationService.createChannel(channel);
    }

    async getMessages(channelId: string) {
        return await collaborationService.getMessages(channelId);
    }

    async sendMessage(channelId: string, content: string, parentId?: string) {
        return await collaborationService.sendMessage(channelId, content, parentId);
    }

    async editMessage(messageId: string, content: string) {
        return await collaborationService.editMessage(messageId, content);
    }

    async deleteMessage(messageId: string) {
        return await collaborationService.deleteMessage(messageId);
    }

    async addReaction(messageId: string, emoji: string) {
        return await collaborationService.addReaction(messageId, emoji);
    }

    subscribeToChat(channelId: string, onMessage: (msg: any) => void, onUpdate: (msg: any) => void, onDelete: (id: string) => void): RealtimeChannel {
        return collaborationService.subscribeToChat(channelId, onMessage, onUpdate, onDelete);
    }

    subscribeToChannels(labId: string, onInsert: (ch: any) => void, onUpdate: (ch: any) => void, onDelete: (id: string) => void): RealtimeChannel {
        return collaborationService.subscribeToChannels(labId, onInsert, onUpdate, onDelete);
    }

    // Direct Messages
    async getDirectMessages(otherUserId: string) {
        return await collaborationService.getDirectMessages(otherUserId);
    }

    async getRecentConversations() {
        return await collaborationService.getRecentConversations();
    }

    async sendDirectMessage(recipientId: string, content: string) {
        return await collaborationService.sendDirectMessage(recipientId, content);
    }

    subscribeToDirectMessages(userId: string, onMessage: (msg: any) => void): RealtimeChannel {
        return collaborationService.subscribeToDirectMessages(userId, onMessage);
    }

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

    async acceptInvitation(token: string) {
        return await collaborationService.acceptInvitation(token);
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

    async getUnreadCounts(userId: string) {
        return await collaborationService.getUnreadCounts(userId);
    }
}
