import { RealtimeChannel } from "@supabase/supabase-js";

export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    role?: string;
}

export interface TeamMember {
    id: string;
    user_id: string;
    lab_id: string;
    role: 'admin' | 'researcher' | 'analyst' | 'viewer';
    display_name: string;
    status: 'online' | 'offline' | 'away' | 'busy';
    last_active: string;
    avatar_url?: string;
}

export interface LeaderboardEntry {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    stats: {
        datasetsUploaded: number;
        experimentsCreated: number;
        modelsTrained: number;
        commentsPosted: number;
        filesShared: number;
    };
    totalScore: number;
    rank: number;
    trend: 'up' | 'down' | 'same';
    streak: number;
    badges: string[];
}

export interface IAuthService {
    signIn(email: string): Promise<{ data: any; error: any }>;
    signOut(): Promise<{ error: any }>;
    getUser(): Promise<UserProfile | null>;
    getSession(): Promise<any>;
}

export interface IStorageService {
    uploadFile(bucket: string, path: string, file: File): Promise<{ path: string; error: any }>;
    getPublicUrl(bucket: string, path: string): string;
}

export interface IMLService {
    startAutoML(datasetId: string, options: any): Promise<{ jobId: string }>;
    getJobStatus(jobId: string): Promise<any>;
    generateInsights(datasetId: string, data: any[]): Promise<any>;
}

export interface SharedProject {
    id: string;
    name: string;
    description: string;
    owner_id: string;
    lab_id: string;
    status: 'active' | 'archived' | 'completed';
    members: number;
    lastUpdate: string;
}

export interface SharedFile {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadedBy: string;
    uploadedByAvatar: string;
    uploadedAt: string;
    downloads: number;
    category: 'dataset' | 'report' | 'code' | 'image' | 'other';
    url: string;
}

export interface Comment {
    id: string;
    user: string;
    avatar: string;
    content: string;
    timestamp: string;
    likes: number;
    isLiked: boolean;
    isPinned: boolean;
    replies?: Comment[];
}

export interface ActivityItem {
    id: string;
    type: 'upload' | 'comment' | 'share' | 'invite' | 'experiment' | 'success' | 'warning' | 'automation';
    user: string;
    userAvatar: string;
    action: string;
    target?: string;
    timestamp: string;
    metadata?: any;
}

export interface Notification {
    id: string;
    user_id: string;
    type: 'mention' | 'reply' | 'reaction' | 'system';
    title: string;
    content: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export interface DirectMessage {
    id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
    reactions?: Record<string, string[]>;
    user?: {
        display_name: string;
        avatar_url?: string;
    };
}

export interface SharedCanvas {
    id: string;
    title: string;
    content: any;
    lab_id: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface SharedList {
    id: string;
    title: string;
    description?: string;
    lab_id: string;
    created_by: string;
    created_at: string;
    items?: ListItem[];
}

export interface ListItem {
    id: string;
    list_id: string;
    content: string;
    is_completed: boolean;
    assigned_to?: string;
    due_date?: string;
    created_at: string;
}

export interface SaaSResource {
    id: string;
    type: 'dataset' | 'report' | 'experiment' | 'protocol' | 'inventory';
    name: string;
    description?: string;
    url?: string;
    metadata?: any;
    created_at: string;
    owner_id: string;
}

export interface ICollaborationService {
    getTeamMembers(labId: string): Promise<{ data: TeamMember[] | null; error: any }>;
    getTeamMember(userId: string, labId: string): Promise<TeamMember | null>;
    upsertTeamMember(member: Partial<TeamMember>): Promise<{ data: TeamMember | null; error: any }>;
    inviteMember(email: string, role: string, labId: string): Promise<{ error: any }>;
    getLeaderboard(timeRange: string): Promise<LeaderboardEntry[]>;
    subscribeToPresence(labId: string, onSync: (users: any[]) => void): RealtimeChannel;
    updateStatus(status: 'online' | 'away' | 'busy' | 'offline', statusMessage?: string): Promise<{ error: any }>;

    // Projects
    getProjects(labId: string): Promise<{ data: SharedProject[] | null; error: any }>;
    getProject(projectId: string): Promise<{ data: SharedProject | null; error: any }>;
    createProject(project: Partial<SharedProject>): Promise<{ data: SharedProject | null; error: any }>;

    // Experiments
    getExperiment(experimentId: string): Promise<{ data: any | null; error: any }>;

    // Files
    getFiles(projectId: string): Promise<{ data: SharedFile[] | null; error: any }>;
    uploadFile(file: File, projectId: string, labId: string): Promise<{ data: SharedFile | null; error: any }>;
    deleteFile(fileId: string): Promise<{ error: any }>;

    // Comments
    getComments(entityId: string, entityType: string): Promise<{ data: Comment[] | null; error: any }>;
    addComment(entityId: string, entityType: string, content: string, parentId?: string): Promise<{ data: Comment | null; error: any }>;
    toggleLikeComment(commentId: string): Promise<{ error: any }>;
    togglePinComment(commentId: string): Promise<{ error: any }>;
    deleteComment(commentId: string): Promise<{ error: any }>;

    // Activity
    getActivities(labId: string): Promise<{ data: ActivityItem[] | null; error: any }>;

    // Chat
    getChannels(labId: string): Promise<{ data: ChatChannel[] | null; error: any }>;
    createChannel(channel: Partial<ChatChannel>): Promise<{ data: ChatChannel | null; error: any }>;
    getMessages(channelId: string): Promise<{ data: ChatMessage[] | null; error: any }>;
    sendMessage(channelId: string, content: string, parentId?: string): Promise<{ error: any }>;
    editMessage(messageId: string, content: string): Promise<{ error: any }>;
    deleteMessage(messageId: string): Promise<{ error: any }>;
    addReaction(messageId: string, emoji: string): Promise<{ error: any }>;
    subscribeToChat(channelId: string, onMessage: (msg: ChatMessage) => void, onUpdate: (msg: ChatMessage) => void, onDelete: (id: string) => void): RealtimeChannel;
    subscribeToChannels(labId: string, onInsert: (ch: ChatChannel) => void, onUpdate: (ch: ChatChannel) => void, onDelete: (id: string) => void): RealtimeChannel;

    // Direct Messages
    getDirectMessages(otherUserId: string): Promise<{ data: DirectMessage[] | null; error: any }>;
    getRecentConversations(): Promise<{ data: string[] | null; error: any }>;
    sendDirectMessage(recipientId: string, content: string): Promise<{ data: DirectMessage | null; error: any }>;
    subscribeToDirectMessages(userId: string, onMessage: (msg: DirectMessage) => void): RealtimeChannel;

    // Search
    searchEverything(query: string, labId: string): Promise<{
        messages: ChatMessage[];
        channels: ChatChannel[];
        files: SharedFile[];
        projects: SharedProject[];
        canvases: SharedCanvas[];
        lists: SharedList[];
    }>;

    // Typing Indicators
    startTyping(channelId: string): Promise<{ error: any }>;
    stopTyping(channelId: string): Promise<{ error: any }>;
    subscribeToTyping(channelId: string, onTypingStart: (user: string) => void, onTypingStop: (user: string) => void): RealtimeChannel;

    // Canvases
    getCanvases(labId: string): Promise<{ data: SharedCanvas[] | null; error: any }>;
    createCanvas(title: string, labId: string): Promise<{ data: SharedCanvas | null; error: any }>;
    updateCanvas(id: string, content: any): Promise<{ error: any }>;

    // Lists
    getLists(labId: string): Promise<{ data: SharedList[] | null; error: any }>;
    createList(title: string, labId: string): Promise<{ data: SharedList | null; error: any }>;
    addListItem(listId: string, content: string): Promise<{ data: ListItem | null; error: any }>;
    toggleListItem(itemId: string, isCompleted: boolean): Promise<{ error: any }>;

    // Scientific Resources & Deep Sync
    getSharedResources(labId: string, type?: string): Promise<{ data: SaaSResource[] | null; error: any }>;
    shareResource(resourceId: string, resourceType: string, channelId: string): Promise<{ error: any }>;
    getLabResources(labId: string, type: 'dataset' | 'report' | 'experiment'): Promise<{ data: any[] | null; error: any }>;
    acceptInvitation(token: string): Promise<{ error: any }>;
}

export interface ChatChannel {
    id: string;
    name: string;
    display_name: string;
    description?: string;
    type: "general" | "project" | "announcement" | "private" | "direct";
    is_private: boolean;
    unread_count?: number;
    created_at: string;
    lab_id: string;
    created_by: string;
}

export interface ChatMessage {
    id: string;
    content: string;
    user_id: string;
    channel_id: string;
    created_at: string;
    edited_at?: string;
    deleted_at?: string;
    parent_id?: string;
    reactions?: Record<string, string[]>;
    mentions?: string[];
    user?: {
        display_name: string;
        avatar_url?: string;
        email?: string;
    };
}

export interface IServiceContainer {
    auth: IAuthService;
    storage: IStorageService;
    ml: IMLService;
    collaboration: ICollaborationService;
}
