import { supabase } from '@/integrations/supabase/client';
import { TeamMember, TeamInvitation } from '@/types/collaboration';

export const teamService = {
  // Get team members for a specific lab
  async getTeamMembers(labId: string) {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('lab_id', labId)
      .order('display_name');

    return { data: data as TeamMember[] | null, error };
  },

  // Get current user's team member record
  async getCurrentUserTeamMember() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return { data: data as TeamMember | null, error };
  },

  // Create or update team member
  async upsertTeamMember(member: Partial<TeamMember>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('team_members')
      .upsert({
        user_id: user.id,
        ...member,
        last_active: new Date().toISOString()
      })
      .select()
      .single();

    return { data: data as TeamMember | null, error };
  },

  // Invite team member
  async inviteMember(email: string, role: 'admin' | 'researcher' | 'analyst' | 'viewer', labId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate a unique token
    const token = crypto.randomUUID();

    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        email,
        role,
        lab_id: labId,
        invited_by: user.id,
        invitation_token: token
      })
      .select()
      .single();

    if (!error && data) {
      // TODO: Send invitation email via Edge Function
      // await supabase.functions.invoke('send-team-invitation', {
      //   body: { email, token, invitedBy: user.email }
      // });
      console.log('Invitation created with token:', token);
    }

    return { data: data as TeamInvitation | null, error };
  },

  // Get pending invitations for a lab
  async getPendingInvitations(labId: string) {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('lab_id', labId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    return { data: data as TeamInvitation[] | null, error };
  },

  // Accept invitation
  async acceptInvitation(token: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get invitation
    const { data: invitation, error: invError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    if (invError || !invitation) {
      return { data: null, error: invError || new Error('Invitation not found') };
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return { data: null, error: new Error('Invitation expired') };
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (updateError) {
      return { data: null, error: updateError };
    }

    // Add user to team
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        user_id: user.id,
        lab_id: invitation.lab_id,
        role: invitation.role,
        display_name: user.email?.split('@')[0] || 'Unknown',
        status: 'online'
      })
      .select()
      .single();

    return { data: data as TeamMember | null, error };
  },

  // Update member status (online/offline/away/busy)
  async updateStatus(status: 'online' | 'away' | 'offline' | 'busy') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('team_members')
      .update({
        status,
        last_active: new Date().toISOString()
      })
      .eq('user_id', user.id);

    return { error };
  },

  // Update member presence (heartbeat every 30s)
  async updatePresence() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('team_members')
      .update({ last_active: new Date().toISOString() })
      .eq('user_id', user.id);

    return { error };
  },

  // Remove team member
  async removeMember(memberId: string) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    return { error };
  },

  // Update member role
  async updateMemberRole(memberId: string, role: 'admin' | 'researcher' | 'analyst' | 'viewer') {
    const { data, error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('id', memberId)
      .select()
      .single();

    return { data: data as TeamMember | null, error };
  }
};
