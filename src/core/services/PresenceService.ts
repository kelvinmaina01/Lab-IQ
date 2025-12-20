import { supabase } from "@/integrations/supabase/client";
import { TeamMember } from "@/core/interfaces";
import { RealtimeChannel } from "@supabase/supabase-js";

export class PresenceService {
    async getTeamMembers(labId: string): Promise<TeamMember[]> {
        const { data, error } = await supabase
            .from('team_members' as any)
            .select('*')
            .eq('lab_id', labId)
            .order('display_name', { ascending: true });

        if (error) throw error;
        return (data as any) as TeamMember[];
    }

    async updateStatus(userId: string, status: 'online' | 'away' | 'busy' | 'offline', statusMessage?: string): Promise<void> {
        const { error } = await supabase
            .from('team_members' as any)
            .update({
                status,
                status_message: statusMessage || null,
                last_active: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) throw error;
    }

    subscribeToPresence(labId: string, onSync: (users: any[]) => void): RealtimeChannel {
        const channel = supabase.channel(`presence:${labId}`);

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const users = Object.values(state).flat();
                onSync(users);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                // Handle joins
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                // Handle leaves
            });

        return channel;
    }

    async trackPresence(channel: RealtimeChannel, payload: any): Promise<void> {
        await channel.track(payload);
    }
}
