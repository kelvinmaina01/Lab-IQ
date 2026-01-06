export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      action_assignments: {
        Row: {
          action_id: string
          assigned_by: string
          assigned_to_email: string
          created_at: string
          id: string
          notes: string | null
        }
        Insert: {
          action_id: string
          assigned_by: string
          assigned_to_email: string
          created_at?: string
          id?: string
          notes?: string | null
        }
        Update: {
          action_id?: string
          assigned_by?: string
          assigned_to_email?: string
          created_at?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_assignments_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "next_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          action: string
          created_at: string
          icon: string
          id: string
          item: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          icon: string
          id?: string
          item: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          icon?: string
          id?: string
          item?: string
          user_id?: string
        }
        Relationships: []
      }
      analyses: {
        Row: {
          created_at: string
          dataset_id: string | null
          id: string
          question: string
          response: string
          result_data: Json | null
          result_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dataset_id?: string | null
          id?: string
          question: string
          response: string
          result_data?: Json | null
          result_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          dataset_id?: string | null
          id?: string
          question?: string
          response?: string
          result_data?: Json | null
          result_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      },
      team_members: {
        Row: {
          id: string
          user_id: string
          lab_id: string | null
          role: string
          display_name: string | null
          status: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lab_id?: string | null
          role: string
          display_name?: string | null
          status?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lab_id?: string | null
          role?: string
          display_name?: string | null
          status?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      chat_channels: {
        Row: {
          id: string
          lab_id: string
          name: string
          display_name: string
          type: string
          description: string | null
          created_by: string | null
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lab_id: string
          name: string
          display_name: string
          type: string
          description?: string | null
          created_by?: string | null
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lab_id?: string
          name?: string
          display_name?: string
          type?: string
          description?: string | null
          created_by?: string | null
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      },
      ml_models: {
        Row: {
          id: string
          user_id: string
          name: string
          model_type: string
          status: string
          metrics: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          model_type: string
          status?: string
          metrics?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          model_type?: string
          status?: string
          metrics?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      },
      shared_files: {
        Row: {
          id: string
          lab_id: string
          channel_id: string | null
          message_id: string | null
          uploaded_by: string | null
          file_name: string
          file_type: string
          file_size: number
          file_category: string | null
          storage_path: string
          thumbnail_path: string | null
          download_url: string | null
          experiment_id: string | null
          dataset_id: string | null
          is_result_file: boolean | null
          metadata: Json | null
          download_count: number | null
          version: number | null
          parent_file_id: string | null
          is_deleted: boolean | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lab_id: string
          channel_id?: string | null
          message_id?: string | null
          uploaded_by?: string | null
          file_name: string
          file_type: string
          file_size: number
          file_category?: string | null
          storage_path: string
          thumbnail_path?: string | null
          download_url?: string | null
          experiment_id?: string | null
          dataset_id?: string | null
          is_result_file?: boolean | null
          metadata?: Json | null
          download_count?: number | null
          version?: number | null
          parent_file_id?: string | null
          is_deleted?: boolean | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lab_id?: string
          channel_id?: string | null
          message_id?: string | null
          uploaded_by?: string | null
          file_name?: string
          file_type?: string
          file_size?: number
          file_category?: string | null
          storage_path?: string
          thumbnail_path?: string | null
          download_url?: string | null
          experiment_id?: string | null
          dataset_id?: string | null
          is_result_file?: boolean | null
          metadata?: Json | null
          download_count?: number | null
          version?: number | null
          parent_file_id?: string | null
          is_deleted?: boolean | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      },,
      team_invitations: {
        Row: {
          id: string
          email: string
          lab_id: string
          role: string
          invited_by: string | null
          invitation_token: string
          status: string | null
          message: string | null
          expires_at: string | null
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          lab_id: string
          role: string
          invited_by?: string | null
          invitation_token: string
          status?: string | null
          message?: string | null
          expires_at?: string | null
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          lab_id?: string
          role?: string
          invited_by?: string | null
          invitation_token?: string
          status?: string | null
          message?: string | null
          expires_at?: string | null
          accepted_at?: string | null
          created_at?: string
        }
        Relationships: []
      },,
      channel_members: {
        Row: {
          channel_id: string
          user_id: string
          role: string | null
          notification_level: string | null
          is_muted: boolean | null
          is_starred: boolean | null
          last_read_at: string | null
          last_read_message_id: string | null
          unread_count: number | null
          joined_at: string | null
        }
        Insert: {
          channel_id: string
          user_id: string
          role?: string | null
          notification_level?: string | null
          is_muted?: boolean | null
          is_starred?: boolean | null
          last_read_at?: string | null
          last_read_message_id?: string | null
          unread_count?: number | null
          joined_at?: string | null
        }
        Update: {
          channel_id?: string
          user_id?: string
          role?: string | null
          notification_level?: string | null
          is_muted?: boolean | null
          is_starred?: boolean | null
          last_read_at?: string | null
          last_read_message_id?: string | null
          unread_count?: number | null
          joined_at?: string | null
        }
        Relationships: [
           {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          }
        ]
      },,
      chat_messages: {
        Row: {
          id: string
          channel_id: string
          user_id: string | null
          parent_id: string | null
          thread_id: string | null
          content: string
          content_type: string | null
          formatted_content: Json | null
          mentions: string[] | null
          mentioned_channels: string[] | null
          attachments: Json | null
          metadata: Json | null
          is_edited: boolean | null
          is_deleted: boolean | null
          is_pinned: boolean | null
          is_system_message: boolean | null
          reply_count: number | null
          reply_users: string[] | null
          last_reply_at: string | null
          reactions: Json | null
          reaction_count: number | null
          edited_at: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          user_id?: string | null
          parent_id?: string | null
          thread_id?: string | null
          content: string
          content_type?: string | null
          formatted_content?: Json | null
          mentions?: string[] | null
          mentioned_channels?: string[] | null
          attachments?: Json | null
          metadata?: Json | null
          is_edited?: boolean | null
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          is_system_message?: boolean | null
          reply_count?: number | null
          reply_users?: string[] | null
          last_reply_at?: string | null
          reactions?: Json | null
          reaction_count?: number | null
          edited_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string | null
          parent_id?: string | null
          thread_id?: string | null
          content?: string
          content_type?: string | null
          formatted_content?: Json | null
          mentions?: string[] | null
          mentioned_channels?: string[] | null
          attachments?: Json | null
          metadata?: Json | null
          is_edited?: boolean | null
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          is_system_message?: boolean | null
          reply_count?: number | null
          reply_users?: string[] | null
          last_reply_at?: string | null
          reactions?: Json | null
          reaction_count?: number | null
          edited_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
           {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          }
        ]
      },,
      direct_messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          content: string
          formatted_content: Json | null
          attachments: Json | null
          is_read: boolean | null
          is_edited: boolean | null
          is_deleted: boolean | null
          reactions: Json | null
          edited_at: string | null
          read_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          content: string
          formatted_content?: Json | null
          attachments?: Json | null
          is_read?: boolean | null
          is_edited?: boolean | null
          is_deleted?: boolean | null
          reactions?: Json | null
          edited_at?: string | null
          read_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          formatted_content?: Json | null
          attachments?: Json | null
          is_read?: boolean | null
          is_edited?: boolean | null
          is_deleted?: boolean | null
          reactions?: Json | null
          edited_at?: string | null
          read_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      },,
      activity_feed: {
        Row: {
          id: string
          lab_id: string
          actor_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          channel_id: string | null
          project_id: string | null
          description: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          lab_id: string
          actor_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          channel_id?: string | null
          project_id?: string | null
          description: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          lab_id?: string
          actor_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          channel_id?: string | null
          project_id?: string | null
          description?: string
          metadata?: Json | null
          created_at?: string
        }
         Relationships: []
      },,
      shared_projects: {
        Row: {
          id: string
          lab_id: string
          name: string
          description: string | null
          owner_id: string | null
          status: string | null
          visibility: string | null
          experiment_ids: string[] | null
          dataset_ids: string[] | null
          protocol_ids: string[] | null
          tags: string[] | null
          priority: string | null
          due_date: string | null
          completion_percentage: number | null
          member_count: number | null
          message_count: number | null
          file_count: number | null
          default_channel_id: string | null
          archived_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lab_id: string
          name: string
          description?: string | null
          owner_id?: string | null
          status?: string | null
          visibility?: string | null
          experiment_ids?: string[] | null
          dataset_ids?: string[] | null
          protocol_ids?: string[] | null
          tags?: string[] | null
          priority?: string | null
          due_date?: string | null
          completion_percentage?: number | null
          member_count?: number | null
          message_count?: number | null
          file_count?: number | null
          default_channel_id?: string | null
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lab_id?: string
          name?: string
          description?: string | null
          owner_id?: string | null
          status?: string | null
          visibility?: string | null
          experiment_ids?: string[] | null
          dataset_ids?: string[] | null
          protocol_ids?: string[] | null
          tags?: string[] | null
          priority?: string | null
          due_date?: string | null
          completion_percentage?: number | null
          member_count?: number | null
          message_count?: number | null
          file_count?: number | null
          default_channel_id?: string | null
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_projects_default_channel_id_fkey"
            columns: ["default_channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          }
        ]
      },,
      project_members: {
        Row: {
          project_id: string
          user_id: string
          role: string | null
          can_edit: boolean | null
          can_invite: boolean | null
          notification_level: string | null
          is_starred: boolean | null
          joined_at: string | null
        }
        Insert: {
          project_id: string
          user_id: string
          role?: string | null
          can_edit?: boolean | null
          can_invite?: boolean | null
          notification_level?: string | null
          is_starred?: boolean | null
          joined_at?: string | null
        }
        Update: {
          project_id?: string
          user_id?: string
          role?: string | null
          can_edit?: boolean | null
          can_invite?: boolean | null
          notification_level?: string | null
          is_starred?: boolean | null
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_projects"
            referencedColumns: ["id"]
          }
        ]
      },,
      typing_indicators: {
        Row: {
          id: string
          channel_id: string | null
          user_id: string | null
          is_typing: boolean | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          channel_id?: string | null
          user_id?: string | null
          is_typing?: boolean | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          channel_id?: string | null
          user_id?: string | null
          is_typing?: boolean | null
          expires_at?: string | null
          created_at?: string
        }
        Relationships: [
           {
            foreignKeyName: "typing_indicators_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          }
        ]
      },,
      user_presence: {
        Row: {
          user_id: string
          status: string | null
          last_seen: string | null
          active_channel_id: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          status?: string | null
          last_seen?: string | null
          active_channel_id?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          status?: string | null
          last_seen?: string | null
          active_channel_id?: string | null
          updated_at?: string
        }
        Relationships: [
           {
            foreignKeyName: "user_presence_active_channel_id_fkey"
            columns: ["active_channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          }
        ]
      },,
      bookmarks: {
        Row: {
          id: string
          user_id: string
          item_type: string
          item_id: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_type: string
          item_id: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_type?: string
          item_id?: string
          note?: string | null
          created_at?: string
        }
        Relationships: []
      },,
      bottleneck_comments: {
        Row: {
          bottleneck_id: string
          comment: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          bottleneck_id: string
          comment: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          bottleneck_id?: string
          comment?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bottleneck_comments_bottleneck_id_fkey"
            columns: ["bottleneck_id"]
            isOneToOne: false
            referencedRelation: "bottlenecks"
            referencedColumns: ["id"]
          },
        ]
      }
      bottlenecks: {
        Row: {
          created_at: string
          description: string
          id: string
          impact_score: number
          resolved_at: string | null
          suggested_action: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          impact_score: number
          resolved_at?: string | null
          suggested_action?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          impact_score?: number
          resolved_at?: string | null
          suggested_action?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      dataset_metadata: {
        Row: {
          created_at: string
          data_quality_score: number | null
          dataset_id: string
          feature_tags: Json | null
          id: string
          lineage_info: Json | null
          missingness_percentage: number | null
          pii_classification: string | null
          schema_info: Json
          source_origin: string | null
          uploaded_by: string | null
          version: number
        }
        Insert: {
          created_at?: string
          data_quality_score?: number | null
          dataset_id: string
          feature_tags?: Json | null
          id?: string
          lineage_info?: Json | null
          missingness_percentage?: number | null
          pii_classification?: string | null
          schema_info?: Json
          source_origin?: string | null
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          data_quality_score?: number | null
          dataset_id?: string
          feature_tags?: Json | null
          id?: string
          lineage_info?: Json | null
          missingness_percentage?: number | null
          pii_classification?: string | null
          schema_info?: Json
          source_origin?: string | null
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "dataset_metadata_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_columns: {
        Row: {
          column_index: number
          column_name: string
          created_at: string
          data_type: string
          dataset_id: string
          id: string
          nullable: boolean | null
          sample_values: Json | null
          stats: Json | null
          unique_values_count: number | null
        }
        Insert: {
          column_index: number
          column_name: string
          created_at?: string
          data_type: string
          dataset_id: string
          id?: string
          nullable?: boolean | null
          sample_values?: Json | null
          stats?: Json | null
          unique_values_count?: number | null
        }
        Update: {
          column_index?: number
          column_name?: string
          created_at?: string
          data_type?: string
          dataset_id?: string
          id?: string
          nullable?: boolean | null
          sample_values?: Json | null
          stats?: Json | null
          unique_values_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dataset_columns_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          }
        ]
      }
      dataset_quality: {
        Row: {
          accuracy_score: number | null
          completeness_score: number | null
          consistency_score: number | null
          created_at: string
          dataset_id: string
          duplicate_rows_count: number | null
          id: string
          issues: Json | null
          missing_values_count: number | null
          outliers_count: number | null
          overall_score: number | null
        }
        Insert: {
          accuracy_score?: number | null
          completeness_score?: number | null
          consistency_score?: number | null
          created_at?: string
          dataset_id: string
          duplicate_rows_count?: number | null
          id?: string
          issues?: Json | null
          missing_values_count?: number | null
          outliers_count?: number | null
          overall_score?: number | null
        }
        Update: {
          accuracy_score?: number | null
          completeness_score?: number | null
          consistency_score?: number | null
          created_at?: string
          dataset_id?: string
          duplicate_rows_count?: number | null
          id?: string
          issues?: Json | null
          missing_values_count?: number | null
          outliers_count?: number | null
          overall_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dataset_quality_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          }
        ]
      }
      dataset_rows: {
        Row: {
          created_at: string
          data: Json
          dataset_id: string
          id: string
          row_index: number
        }
        Insert: {
          created_at?: string
          data: Json
          dataset_id: string
          id?: string
          row_index: number
        }
        Update: {
          created_at?: string
          data?: Json
          dataset_id?: string
          id?: string
          row_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "dataset_rows_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          }
        ]
      }
      datasets: {
        Row: {
          column_count: number | null
          created_at: string
          description: string | null
          error_message: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          name: string
          row_count: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          column_count?: number | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          name: string
          row_count?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          column_count?: number | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          name?: string
          row_count?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      device_streams: {
        Row: {
          config: Json
          created_at: string
          id: string
          last_data_received: string | null
          name: string
          status: string
          stream_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          last_data_received?: string | null
          name: string
          status?: string
          stream_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          last_data_received?: string | null
          name?: string
          status?: string
          stream_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lab_profiles: {
        Row: {
          created_at: string
          id: string
          profile_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      models: {
        Row: {
          algorithm: string | null
          created_at: string
          dataset_id: string | null
          feature_importance: Json | null
          id: string
          metrics: Json | null
          model_type: string
          name: string
          status: string
          training_summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          algorithm?: string | null
          created_at?: string
          dataset_id?: string | null
          feature_importance?: Json | null
          id?: string
          metrics?: Json | null
          model_type: string
          name: string
          status?: string
          training_summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          algorithm?: string | null
          created_at?: string
          dataset_id?: string | null
          feature_importance?: Json | null
          id?: string
          metrics?: Json | null
          model_type?: string
          name?: string
          status?: string
          training_summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      next_actions: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string
          icon: string
          id: string
          impact_percentage: number
          priority: string
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description: string
          icon?: string
          id?: string
          impact_percentage: number
          priority: string
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string
          icon?: string
          id?: string
          impact_percentage?: number
          priority?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          bottleneck_threshold: number
          created_at: string
          data_quality_threshold: number
          email_on_action_assignment: boolean
          email_on_bottleneck_detection: boolean
          email_on_data_quality_issues: boolean
          email_on_experiment_complete: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bottleneck_threshold?: number
          created_at?: string
          data_quality_threshold?: number
          email_on_action_assignment?: boolean
          email_on_bottleneck_detection?: boolean
          email_on_data_quality_issues?: boolean
          email_on_experiment_complete?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bottleneck_threshold?: number
          created_at?: string
          data_quality_threshold?: number
          email_on_action_assignment?: boolean
          email_on_bottleneck_detection?: boolean
          email_on_data_quality_issues?: boolean
          email_on_experiment_complete?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pinned_insights: {
        Row: {
          analysis_id: string | null
          created_at: string
          dashboard_position: number | null
          id: string
          model_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          created_at?: string
          dashboard_position?: number | null
          id?: string
          model_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          created_at?: string
          dashboard_position?: number | null
          id?: string
          model_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_insights_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_insights_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      predictive_insights: {
        Row: {
          active_experiments_count: number
          confidence_interval: number
          created_at: string
          estimated_days: number
          id: string
          pipeline_flow_score: number
          user_id: string
          velocity_score: number
        }
        Insert: {
          active_experiments_count: number
          confidence_interval: number
          created_at?: string
          estimated_days: number
          id?: string
          pipeline_flow_score: number
          user_id: string
          velocity_score: number
        }
        Update: {
          active_experiments_count?: number
          confidence_interval?: number
          created_at?: string
          estimated_days?: number
          id?: string
          pipeline_flow_score?: number
          user_id?: string
          velocity_score?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          ai_requests_per_month: number
          created_at: string
          id: string
          max_automations: number
          max_collaborators: number
          max_datasets: number
          max_experiments: number
          storage_limit_mb: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          student_verified: boolean | null
          subscription_ends_at: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_requests_per_month?: number
          created_at?: string
          id?: string
          max_automations?: number
          max_collaborators?: number
          max_datasets?: number
          max_experiments?: number
          storage_limit_mb?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          student_verified?: boolean | null
          subscription_ends_at?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_requests_per_month?: number
          created_at?: string
          id?: string
          max_automations?: number
          max_collaborators?: number
          max_datasets?: number
          max_experiments?: number
          storage_limit_mb?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          student_verified?: boolean | null
          subscription_ends_at?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_stats: {
        Row: {
          ai_requests_used: number | null
          automations_count: number | null
          created_at: string
          datasets_count: number | null
          experiments_count: number | null
          id: string
          month: string
          storage_used_mb: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_requests_used?: number | null
          automations_count?: number | null
          created_at?: string
          datasets_count?: number | null
          experiments_count?: number | null
          id?: string
          month: string
          storage_used_mb?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_requests_used?: number | null
          automations_count?: number | null
          created_at?: string
          datasets_count?: number | null
          experiments_count?: number | null
          id?: string
          month?: string
          storage_used_mb?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tier: {
        Args: { user_id_param: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      has_pro_access: { Args: { user_id_param: string }; Returns: boolean }
    }
    Enums: {
      subscription_tier: "free" | "pro" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      subscription_tier: ["free", "pro", "student"],
    },
  },
} as const
