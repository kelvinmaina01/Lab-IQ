import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConnectionConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password?: string;
    ssl?: boolean;
}

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { provider, config } = await req.json();
        console.log(`Connection test request for ${provider} at ${config.host}`);

        if (provider === "postgresql") {
            // Use Deno Postgres Driver
            const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
            const client = new Client({
                user: config.username,
                database: config.database,
                hostname: config.host,
                port: config.port || 5432,
                password: config.password,
                tls: { enabled: config.ssl !== false },
            });

            await client.connect();
            // Fetch some basic metadata to prove it works
            const result = await client.queryObject`SELECT current_database(), current_user, version()`;
            await client.end();

            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Successfully connected to PostgreSQL",
                    metadata: result.rows[0]
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (provider === "mysql") {
            // Use Deno MySQL Driver
            const { Client } = await import("https://deno.land/x/mysql@v2.12.1/mod.ts");
            const client = await new Client().connect({
                hostname: config.host,
                username: config.username,
                db: config.database,
                port: config.port || 3306,
                password: config.password,
            });

            const result = await client.execute("SELECT DATABASE(), USER(), VERSION()");
            await client.close();

            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Successfully connected to MySQL",
                    metadata: result.rows?.[0]
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (provider === "sqlserver") {
            // SQL Server usually requires TDS protocol. 
            // For now, we'll return a 501 until we verify Tedious compatibility in Edge environment
            // Or we can use a generic fetch if it's an HTTP-based DB like Snowflake/BigQuery
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "SQL Server driver is coming soon to Edge Functions. Please use Postgres or MySQL for real-time sync currently."
                }),
                { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: false, error: `Unsupported provider: ${provider}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Connection error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Handshake failed. Check host and credentials."
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
