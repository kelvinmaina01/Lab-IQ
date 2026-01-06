import { supabase } from '@/integrations/supabase/client';

export interface DataSourceConfig {
    host?: string;
    port?: string;
    database?: string;
    username?: string;
    password?: string;
    projectId?: string;
    dataset?: string;
    ssl?: boolean;
    ssh?: boolean;
    sshHost?: string;
    sshUser?: string;
    schema?: string;
    role?: string;
    clientId?: string;
    scopes?: string;
    fileName?: string;
}

export type DataSourceType = 'database' | 'warehouse' | 'clinical' | 'wearable' | 'cloud' | 'file' | 'file_stream';

export interface DataSource {
    id: string;
    name: string;
    type: DataSourceType;
    provider: string;
    config: DataSourceConfig;
    status: 'active' | 'error' | 'disconnected' | 'pending';
    last_sync_at?: string;
    created_at: string;
}

class DataSourceService {
    /**
     * Fetch all data sources for the current user
     */
    async getSources(): Promise<DataSource[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await (supabase
            .from('data_sources' as any) as any)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data as unknown) as DataSource[];
    }

    /**
     * Save or update a data source
     */
    async saveSource(
        name: string,
        type: DataSourceType,
        provider: string,
        config: DataSourceConfig
    ): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await (supabase
            .from('data_sources' as any) as any)
            .insert({
                user_id: user.id,
                name,
                type,
                provider,
                config,
                status: 'active'
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    }

    /**
     * Test a connection (Functional simulation for MVP, moving to backend proxy later)
     */
    async testConnection(provider: string, config: DataSourceConfig): Promise<boolean> {
        // In a real production app, this would call a backend edge function 
        // to perform an actual TCP/HTTP handshake.
        return new Promise((resolve) => {
            setTimeout(() => {
                // Logic: Require host for non-wearables
                if (!config.host && !['csv', 'hl7', 'googledrive', 'applehealth', 'fitbit', 'oura', 'dexcom', 'epic', 'cerner', 'fhir', 'biobank'].includes(provider)) {
                    resolve(false);
                }
                resolve(true);
            }, 2000);
        });
    }

    /**
     * Delete a source
     */
    async deleteSource(id: string): Promise<void> {
        const { error } = await (supabase
            .from('data_sources' as any) as any)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}

export const dataSourceService = new DataSourceService();
