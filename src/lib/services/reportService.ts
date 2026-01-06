import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { eventBus, EventTypes, ReportPayload } from '@/lib/events';

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


        // Call Real ML Backend for Report Generation
        try {
            const mlResponse = await fetch('http://localhost:8002/api/ml/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template: config.type, // e.g., 'technical', 'executive'
                    format: config.format,
                    title: config.title,
                    dataset_id: config.dataSourceId,
                    data: {
                        // Pass known metadata if available, otherwise backend handles it
                        description: config.description,
                        modules: config.modules
                    }
                })
            });

            if (!mlResponse.ok) {
                console.error("ML Service report generation failed");
                // Don't throw, just mark as failed in DB
                await supabase
                    .from('reports')
                    .update({ status: 'failed' })
                    .eq('id', data.id);
            } else {
                const result = await mlResponse.json();

                // Update with success and file path
                await supabase
                    .from('reports')
                    .update({
                        status: 'published',
                        // Store the file path or URL if we had a column for it. 
                        // For now we assume the frontend can derive it or we store it in config/metadata
                        config: { ...config, downloadUrl: result.url }
                    })
                    .eq('id', data.id);

                // Emit event
                eventBus.emit<ReportPayload>(
                    EventTypes.REPORT_GENERATED,
                    {
                        reportId: data.id,
                        title: config.title,
                        reportType: config.type,
                        format: config.format,
                        status: 'published',
                    },
                    {
                        source: 'reportService',
                        userId: user.id,
                        metadata: { datasetId: config.dataSourceId, downloadUrl: result.url },
                    }
                );
            }
        } catch (e) {
            console.error("Failed to connect to ML report service", e);
            await supabase
                .from('reports')
                .update({ status: 'failed' })
                .eq('id', data.id);
        }

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
