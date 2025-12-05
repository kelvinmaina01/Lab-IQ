import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export interface Report {
    id: string;
    title: string;
    description: string;
    type: string;
    format: string;
    status: 'draft' | 'processing' | 'published' | 'failed';
    compliance_standard?: string;
    created_at: string;
    author_id: string;
    dataset_id?: string;
    config?: any;
    // UI mapped fields
    author?: string;
    size?: string;
    created?: string;
    compliance?: string;
}

export const reportService = {
    /**
     * Fetch all reports for the current user
     */
    async getReports(): Promise<Report[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching reports:", error);
            return [];
        }

        return data.map(report => ({
            ...report,
            author: 'You', // In a real app with profiles table, we'd join that
            size: '2.4 MB', // Placeholder for demo
            created: new Date(report.created_at).toLocaleDateString(),
            compliance: report.compliance_standard || 'Internal'
        }));
    },

    /**
     * Create a new report
     */
    async createReport(config: any): Promise<Report | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        let compliance = "Internal";
        if (config.type === 'compliance') compliance = "FDA 21 CFR";
        if (config.type === 'technical') compliance = "ISO 17025";
        if (config.type === 'executive') compliance = "GDPR";

        const newReport = {
            user_id: user.id,
            title: config.title,
            description: config.description,
            type: config.type.charAt(0).toUpperCase() + config.type.slice(1),
            format: config.format.toUpperCase(),
            status: 'processing', // Start as processing
            compliance_standard: compliance,
            dataset_id: config.dataSourceId || null,
            config: config
        };

        const { data, error } = await supabase
            .from('reports')
            .insert(newReport)
            .select()
            .single();

        if (error) {
            console.error("Error creating report:", error);
            throw error;
        }

        // SIMULATION: Trigger a "process" that finishes in 5 seconds
        setTimeout(async () => {
            await supabase
                .from('reports')
                .update({ status: 'published' })
                .eq('id', data.id);
        }, 5000);

        return data;
    },

    /**
     * Delete a report
     */
    async deleteReport(id: string) {
        return await supabase.from('reports').delete().eq('id', id);
    },

    /**
     * Subscribe to real-time updates
     */
    subscribeDocs(onUpdate: () => void) {
        const channel = supabase
            .channel('public:reports')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reports' },
                (payload: RealtimePostgresChangesPayload<Report>) => {
                    onUpdate();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
};
