import { supabase } from "@/integrations/supabase/client";

export interface Channel {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  type: "general" | "project" | "announcement";
  is_private: boolean;
  lab_id: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateChannelInput {
  name: string;
  display_name?: string;
  description?: string;
  type?: "general" | "project" | "announcement";
  is_private?: boolean;
  lab_id: string;
}

export interface UpdateChannelInput {
  name?: string;
  display_name?: string;
  description?: string;
  type?: "general" | "project" | "announcement";
  is_private?: boolean;
}

export const channelService = {
  /**
   * Get all channels for a lab
   */
  async getChannels(labId: string) {
    const { data, error } = await supabase
      .from("chat_channels")
      .select("*")
      .eq("lab_id", labId)
      .order("created_at", { ascending: true });

    return { data: data as Channel[] | null, error };
  },

  /**
   * Get a specific channel by ID
   */
  async getChannel(channelId: string) {
    const { data, error } = await supabase
      .from("chat_channels")
      .select("*")
      .eq("id", channelId)
      .single();

    return { data: data as Channel | null, error };
  },

  /**
   * Create a new channel
   */
  async createChannel(input: CreateChannelInput) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        data: null,
        error: new Error("User not authenticated"),
      };
    }

    // Format channel name (lowercase, no spaces)
    const channelName = input.name.toLowerCase().replace(/\s+/g, "-");

    const { data, error } = await supabase
      .from("chat_channels")
      .insert({
        name: channelName,
        display_name: input.display_name || input.name,
        description: input.description || null,
        type: input.type || "general",
        is_private: input.is_private || false,
        lab_id: input.lab_id,
        created_by: user.id,
      })
      .select()
      .single();

    return { data: data as Channel | null, error };
  },

  /**
   * Update a channel
   */
  async updateChannel(channelId: string, updates: UpdateChannelInput) {
    const updateData: any = { ...updates };

    // Format channel name if provided
    if (updates.name) {
      updateData.name = updates.name.toLowerCase().replace(/\s+/g, "-");
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("chat_channels")
      .update(updateData)
      .eq("id", channelId)
      .select()
      .single();

    return { data: data as Channel | null, error };
  },

  /**
   * Delete a channel
   */
  async deleteChannel(channelId: string) {
    const { error } = await supabase
      .from("chat_channels")
      .delete()
      .eq("id", channelId);

    return { error };
  },

  /**
   * Archive a channel (soft delete)
   */
  async archiveChannel(channelId: string) {
    const { data, error } = await supabase
      .from("chat_channels")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", channelId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get channel members (for private channels)
   */
  async getChannelMembers(channelId: string) {
    const { data, error } = await supabase
      .from("channel_members")
      .select(
        `
        *,
        team_members (
          id,
          user_id,
          display_name,
          avatar_url,
          status
        )
      `
      )
      .eq("channel_id", channelId);

    return { data, error };
  },

  /**
   * Add a member to a private channel
   */
  async addChannelMember(channelId: string, teamMemberId: string) {
    const { data, error } = await supabase
      .from("channel_members")
      .insert({
        channel_id: channelId,
        team_member_id: teamMemberId,
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Remove a member from a channel
   */
  async removeChannelMember(channelId: string, teamMemberId: string) {
    const { error } = await supabase
      .from("channel_members")
      .delete()
      .eq("channel_id", channelId)
      .eq("team_member_id", teamMemberId);

    return { error };
  },

  /**
   * Check if user has access to a channel
   */
  async hasChannelAccess(channelId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { hasAccess: false, error: null };

    // Get the channel
    const { data: channel, error: channelError } = await supabase
      .from("chat_channels")
      .select("*, team_members!inner(*)")
      .eq("id", channelId)
      .eq("team_members.user_id", user.id)
      .single();

    if (channelError) {
      return { hasAccess: false, error: channelError };
    }

    // If channel is public, user has access if they're in the lab
    if (!channel.is_private) {
      return { hasAccess: true, error: null };
    }

    // If channel is private, check membership
    const { data: membership, error: memberError } = await supabase
      .from("channel_members")
      .select("*")
      .eq("channel_id", channelId)
      .eq("team_member_id", user.id)
      .single();

    return { hasAccess: !!membership, error: memberError };
  },

  /**
   * Get unread message count for a channel
   */
  async getUnreadCount(channelId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { count: 0, error: null };

    // Get user's team member record
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!teamMember) return { count: 0, error: null };

    // Get last read receipt
    const { data: receipt } = await supabase
      .from("chat_read_receipts")
      .select("last_read_at")
      .eq("channel_id", channelId)
      .eq("team_member_id", teamMember.id)
      .single();

    // Count messages after last read
    const lastReadAt = receipt?.last_read_at || new Date(0).toISOString();

    const { count, error } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("channel_id", channelId)
      .gt("created_at", lastReadAt);

    return { count: count || 0, error };
  },

  /**
   * Mark channel as read
   */
  async markAsRead(channelId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: new Error("Not authenticated") };

    // Get user's team member record
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!teamMember) return { error: new Error("Team member not found") };

    const { error } = await supabase.from("chat_read_receipts").upsert(
      {
        channel_id: channelId,
        team_member_id: teamMember.id,
        last_read_at: new Date().toISOString(),
      },
      {
        onConflict: "channel_id,team_member_id",
      }
    );

    return { error };
  },

  /**
   * Search channels by name
   */
  async searchChannels(labId: string, query: string) {
    const { data, error } = await supabase
      .from("chat_channels")
      .select("*")
      .eq("lab_id", labId)
      .or(`name.ilike.%${query}%,display_name.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(10);

    return { data: data as Channel[] | null, error };
  },
};
