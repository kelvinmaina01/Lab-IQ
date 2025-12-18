export interface TeamMember {
  id: string;
  user_id: string;
  lab_id: string;
  role: 'admin' | 'researcher' | 'analyst' | 'viewer';
  status: 'online' | 'away' | 'offline' | 'busy';
  display_name: string;
  avatar_url?: string;
  last_active: string;
  settings: {
    notifications: boolean;
    email_digest: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: 'admin' | 'researcher' | 'analyst' | 'viewer';
  invited_by: string;
  lab_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invitation_token: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  mentions?: string[];
  attachments?: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  reactions?: Record<string, string[]>; // { emoji: [user_ids] }
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
  user?: {
    display_name: string;
    avatar_url?: string;
  };
}

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  lab_id: string;
  type: 'project' | 'general' | 'private' | 'direct';
  project_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface SharedFile {
  id: string;
  name: string;
  storage_path: string;
  size_bytes: number;
  mime_type?: string;
  category: 'dataset' | 'report' | 'code' | 'image' | 'document' | 'other';
  uploaded_by: string;
  project_id: string;
  lab_id: string;
  version: number;
  parent_id?: string;
  description?: string;
  tags?: string[];
  downloads: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
  uploader?: {
    display_name: string;
    avatar_url?: string;
  };
}

export interface SharedProject {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  lab_id: string;
  status: 'active' | 'archived' | 'completed';
  visibility: 'private' | 'team' | 'public';
  created_at: string;
  updated_at: string;
  archived_at?: string;
  metadata?: Record<string, any>;
  owner?: {
    display_name: string;
    avatar_url?: string;
  };
  member_count?: number;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
  added_by: string;
  added_at: string;
}

export interface CollaborationActivity {
  id: string;
  lab_id: string;
  user_id: string;
  type: 'message' | 'file_upload' | 'file_download' | 'member_invite' | 'member_join' | 'project_create' | 'project_update' | 'task_assign' | 'comment';
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  user?: {
    display_name: string;
    avatar_url?: string;
  };
}

export interface TypingIndicator {
  channel_id: string;
  user_id: string;
  started_at: string;
  user?: {
    display_name: string;
  };
}

export interface ReadReceipt {
  channel_id: string;
  user_id: string;
  last_read_message_id: string;
  read_at: string;
}
