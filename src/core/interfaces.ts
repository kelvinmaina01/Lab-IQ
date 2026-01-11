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



export interface IServiceContainer {
    auth: IAuthService;
    storage: IStorageService;
    ml: IMLService;

}
