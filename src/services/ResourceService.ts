import { supabase } from "@/integrations/supabase/client";
import { SaaSResource } from "@/core/interfaces";

export class ResourceService {
    /**
     * Shares a native LabIQ Health resource (Dataset, Report, Experiment) into a collaboration channel.
     */
    async shareResource(params: {
        labId: string;
        channelId: string;
        resourceId: string;
        resourceType: 'dataset' | 'report' | 'experiment' | 'protocol';
        metadata?: any;
    }): Promise<{ error: any }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
            .from('shared_resources' as any)
            .insert({
                lab_id: params.labId,
                channel_id: params.channelId,
                resource_id: params.resourceId,
                resource_type: params.resourceType,
                shared_by: user.id,
                metadata: params.metadata || {}
            });

        return { error };
    }

    /**
     * Fetches all resources shared within a specific lab/channel context.
     */
    async getSharedResources(labId: string, type?: string): Promise<{ data: SaaSResource[] | null; error: any }> {
        let query = supabase
            .from('shared_resources' as any)
            .select('*')
            .eq('lab_id', labId);

        if (type) {
            query = query.eq('resource_type', type);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) return { data: null, error };

        // Map to SaaSResource interface
        const mapped: SaaSResource[] = (data as any[]).map(item => ({
            id: item.resource_id, // Map to the actual resource ID
            type: item.resource_type as any,
            name: item.metadata?.name || 'Scientific Resource',
            description: item.metadata?.description,
            created_at: item.created_at,
            owner_id: item.shared_by,
            metadata: item.metadata
        }));

        return { data: mapped, error: null };
    }

    /**
     * Fetches native LabIQ Health resources (not yet shared) to allow selection.
     * This achieves the "Deep Integration" by querying core SaaS tables.
     */
    async getLabResources(labId: string, type: 'dataset' | 'report' | 'experiment'): Promise<{ data: any[] | null; error: any }> {
        const tableMap = {
            dataset: 'datasets',
            report: 'reports',
            experiment: 'experiments'
        };

        const { data, error } = await supabase
            .from(tableMap[type] as any)
            .select('*')
            .limit(50);

        return { data, error };
    }

    async getExperiment(experimentId: string) {
        return supabase.from('experiments' as any).select('*').eq('id', experimentId).single();
    }

    // The following methods are stubs to remove collaboration file storage dependency.
    // Original methods for getFiles, uploadFile, deleteFile have been replaced.

    async getFiles(projectId: string): Promise<any[]> {
        console.log('Collaboration file fetching disabled');
        return [];
    }

    async uploadFile(file: File, projectId: string, labId: string): Promise<any> {
        console.log('Collaboration file upload disabled');
        return { success: true, message: 'Upload functionality disabled' };
    }

    async deleteFile(fileId: string): Promise<void> {
        const { data } = await supabase.from('shared_files' as any).select('storage_path').eq('id', fileId).single();
        if (data) {
            await supabase.storage.from('collaboration-files').remove([data.storage_path]);
        }
        await supabase.from('shared_files' as any).delete().eq('id', fileId);
    }
}
