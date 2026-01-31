import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { sourceId, userId } = await req.json();

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Get Source Info
        const { data: source, error: sourceError } = await supabaseClient
            .from("data_sources")
            .select("*")
            .eq("id", sourceId)
            .single();

        if (sourceError || !source) throw new Error("Source not found");

        const { provider, config } = source;
        let accessToken = config.access_token;

        // 2. Token Refresh Logic (Simplified for brevity)
        if (Date.now() > (config.expires_at || 0)) {
            console.log("Refreshing token for", provider);
            // Call provider token refresh endpoint...
            // For now, we assume tokens are valid for this proof of concept
        }

        // 3. Provider Specific Ingestion
        let ingestedData = [];
        if (provider === "googledrive") {
            const resp = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType='text/csv'&pageSize=5`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const driveData = await resp.json();
            ingestedData = driveData.files || [];
        } else if (provider === "onedrive") {
            const resp = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root/children`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const driveData = await resp.json();
            ingestedData = driveData.value || [];
        }

        // 4. Create Dataset Entry
        const { data: dataset, error: datasetError } = await supabaseClient
            .from("datasets")
            .insert({
                user_id: userId,
                name: `Cloud Import: ${provider} - ${new Date().toLocaleDateString()}`,
                status: "completed",
                row_count: ingestedData.length,
                file_type: "json",
            })
            .select("id")
            .single();

        if (datasetError) throw datasetError;

        // 5. Store Metadata
        await supabaseClient
            .from("dataset_metadata")
            .insert({
                dataset_id: dataset.id,
                user_id: userId,
                metadata: {
                    cloud_provider: provider,
                    source_id: sourceId,
                    imported_files: ingestedData.map((f: any) => f.name || f.id)
                }
            });

        return new Response(JSON.stringify({
            success: true,
            message: `Successfully ingested ${ingestedData.length} files from ${provider}`,
            datasetId: dataset.id
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Cloud Sync Error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Sync failed" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
