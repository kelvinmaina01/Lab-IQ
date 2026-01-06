import { supabase } from '@/integrations/supabase/client';

export type TeamRole = 'owner' | 'editor' | 'viewer';

export interface TeamMember {
    id: string;
    description: string; // Used as name/email proxy in V1
    role: TeamRole;
    avatar_url?: string;
    joined_at: string;
}

export interface Comment {
    id: string;
    target_id: string; // ID of dataset, experiment, etc.
    target_type: 'dataset' | 'experiment' | 'dashboard';
    content: string;
    author_id: string;
    created_at: string;
}

class TeamService {
    private static instance: TeamService;

    private constructor() { }

    public static getInstance(): TeamService {
        if (!TeamService.instance) {
            TeamService.instance = new TeamService();
        }
        return TeamService.instance;
    }

    /**
     * Get team members
     * For V1, we simulate a team or fetch from a 'profiles' table if it existed.
     * We'll return mock data combined with current user.
     */
    public async getMembers(): Promise<TeamMember[]> {
        const { data: { user } } = await supabase.auth.getUser();

        const members: TeamMember[] = [
            {
                id: 'member-1',
                description: 'Dr. Emily Chen',
                role: 'editor',
                joined_at: new Date().toISOString()
            },
            {
                id: 'member-2',
                description: 'Mark Johnson (Lab Admin)',
                role: 'viewer',
                joined_at: new Date().toISOString()
            }
        ];

        if (user) {
            members.unshift({
                id: user.id,
                description: user.email || 'You',
                role: 'owner',
                joined_at: new Date().toISOString()
            });
        }

        return members;
    }

    /**
     * Invite a new member
     */
    public async inviteMember(email: string, role: TeamRole): Promise<void> {
        // V1: Simulation
        console.log(`Invited ${email} as ${role}`);
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    /**
     * Add a comment to an item
     */
    public async addComment(targetId: string, targetType: Comment['target_type'], content: string): Promise<Comment> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const comment: Comment = {
            id: crypto.randomUUID(),
            target_id: targetId,
            target_type: targetType,
            content,
            author_id: user.id,
            created_at: new Date().toISOString()
        };

        // In real app, save to 'comments' table
        console.log('Comment added:', comment);

        return comment;
    }

    /**
     * Get comments for an item
     */
    public async getComments(targetId: string): Promise<Comment[]> {
        // V1: Return empty or mock
        return [];
    }
}

export const teamService = TeamService.getInstance();
