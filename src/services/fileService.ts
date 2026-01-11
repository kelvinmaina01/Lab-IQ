import { supabase } from '@/integrations/supabase/client';


const STORAGE_BUCKET = 'lab-iq-files';

export const fileService = {
  // Upload file to Supabase Storage and save metadata
  async uploadFile(
    file: File,
    projectId: string,
    category: 'dataset' | 'report' | 'code' | 'image' | 'document' | 'other',
    description?: string,
    tags?: string[]
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's lab ID
    const labId = await this.getUserLabId(user.id);
    if (!labId) throw new Error('User not part of any lab');

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${projectId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Save metadata to database
    const { data: fileData, error: dbError } = await supabase
      .from('shared_files')
      .insert({
        name: file.name,
        storage_path: filePath,
        size_bytes: file.size,
        mime_type: file.type,
        category,
        description,
        tags,
        uploaded_by: user.id,
        project_id: projectId,
        lab_id: labId
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      throw dbError;
    }

    // Log activity
    await this.logFileActivity(labId, user.id, 'file_upload', fileData.id, {
      file_name: file.name,
      project_id: projectId
    });

    return { data: fileData as SharedFile };
  },

  // Get files for a project
  async getProjectFiles(projectId: string) {
    const { data, error } = await supabase
      .from('shared_files')
      .select(`
        *,
        uploader:uploaded_by(display_name, avatar_url)
      `)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    return { data: data as SharedFile[] | null, error };
  },

  // Get file by ID
  async getFile(fileId: string) {
    const { data, error } = await supabase
      .from('shared_files')
      .select(`
        *,
        uploader:uploaded_by(display_name, avatar_url)
      `)
      .eq('id', fileId)
      .is('deleted_at', null)
      .single();

    return { data: data as SharedFile | null, error };
  },

  // Download file (get signed URL)
  async downloadFile(fileId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get file metadata
    const { data: fileData, error } = await supabase
      .from('shared_files')
      .select('*')
      .eq('id', fileId)
      .is('deleted_at', null)
      .single();

    if (error || !fileData) {
      throw error || new Error('File not found');
    }

    // Get signed URL (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(fileData.storage_path, 3600);

    if (urlError) throw urlError;

    // Log download activity
    await supabase.from('file_access_log').insert({
      file_id: fileId,
      user_id: user.id,
      action: 'download'
    });

    // Increment download count
    await supabase
      .from('shared_files')
      .update({ downloads: fileData.downloads + 1 })
      .eq('id', fileId);

    return { url: urlData?.signedUrl, file: fileData as SharedFile };
  },

  // Delete file
  async deleteFile(fileId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get file metadata
    const { data: fileData, error: fetchError } = await supabase
      .from('shared_files')
      .select('storage_path, uploaded_by, lab_id')
      .eq('id', fileId)
      .single();

    if (fetchError || !fileData) {
      throw fetchError || new Error('File not found');
    }

    // Check if user is the uploader (can be extended with permissions check)
    if (fileData.uploaded_by !== user.id) {
      throw new Error('You do not have permission to delete this file');
    }

    // Soft delete in database first
    const { error: dbError } = await supabase
      .from('shared_files')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', fileId);

    if (dbError) throw dbError;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileData.storage_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Don't throw - file is already soft deleted in DB
    }

    // Log activity
    await supabase.from('file_access_log').insert({
      file_id: fileId,
      user_id: user.id,
      action: 'delete'
    });

    return { success: true };
  },

  // Search files
  async searchFiles(projectId: string, query: string, category?: string) {
    let queryBuilder = supabase
      .from('shared_files')
      .select(`
        *,
        uploader:uploaded_by(display_name, avatar_url)
      `)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .ilike('name', `%${query}%`);

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    const { data, error } = await queryBuilder.order('created_at', { ascending: false });

    return { data: data as SharedFile[] | null, error };
  },

  // Get files by category
  async getFilesByCategory(projectId: string, category: string) {
    const { data, error } = await supabase
      .from('shared_files')
      .select(`
        *,
        uploader:uploaded_by(display_name, avatar_url)
      `)
      .eq('project_id', projectId)
      .eq('category', category)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    return { data: data as SharedFile[] | null, error };
  },

  // Helper: Get user's lab ID
  async getUserLabId(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('team_members')
      .select('lab_id')
      .eq('user_id', userId)
      .single();

    return data?.lab_id || null;
  },

  // Helper: Log file activity
  async logFileActivity(
    labId: string,
    userId: string,
    type: 'file_upload' | 'file_download',
    fileId: string,
    metadata: Record<string, any>
  ) {
    console.log('File shared:', { fileId, userIds: userId }); // Assuming userIds should be userId based on context
  }
};
