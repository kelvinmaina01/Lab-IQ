import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROVIDERS: Record<string, any> = {
    google: {
        auth_url: "https://accounts.google.com/o/oauth2/v2/auth",
        token_url: "https://oauth2.googleapis.com/token",
        scopes: "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly",
    },
    microsoft: {
        auth_url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        token_url: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        scopes: "https://graph.microsoft.com/Files.Read.All",
    },
    epic: {
        auth_url: "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize",
        token_url: "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token",
        scopes: "patient/*.read",
    }
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // 1. Initial Redirect
    if (path === "init") {
        const { provider, userId, redirectUrl } = await req.json();
        const config = PROVIDERS[provider];

        if (!config) return new Response("Provider not supported", { status: 400 });

        const state = crypto.randomUUID();
        // In production, store state in DB to verify on callback

        const authUrl = new URL(config.auth_url);
        authUrl.searchParams.set("client_id", Deno.env.get(`${provider.toUpperCase()}_CLIENT_ID`) || "");
        authUrl.searchParams.set("redirect_uri", redirectUrl || Deno.env.get("OAUTH_CALLBACK_URL") || "");
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", config.scopes);
        authUrl.searchParams.set("state", `${provider}:${userId}:${state}`);
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");

        return new Response(JSON.stringify({ url: authUrl.toString() }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 2. Callback Handler
    if (path === "callback") {
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state"); // format: provider:userId:uuid

        if (!code || !state) return new Response("Missing code or state", { status: 400 });

        const [provider, userId] = state.split(":");
        const config = PROVIDERS[provider];

        // Exchange code for tokens
        const resp = await fetch(config.token_url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: Deno.env.get(`${provider.toUpperCase()}_CLIENT_ID`) || "",
                client_secret: Deno.env.get(`${provider.toUpperCase()}_CLIENT_SECRET`) || "",
                code,
                grant_type: "authorization_code",
                redirect_uri: Deno.env.get("OAUTH_CALLBACK_URL") || "",
            }),
        });

        const tokens = await resp.json();

        if (tokens.error) {
            console.error("Token exchange error:", tokens);
            return new Response(`Token exchange failed: ${tokens.error_description}`, { status: 500 });
        }

        // Save tokens to DB
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { error } = await supabaseClient
            .from("data_sources")
            .upsert({
                user_id: userId,
                provider,
                type: "cloud",
                name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Connection`,
                config: {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expires_at: Date.now() + (tokens.expires_in * 1000),
                },
                status: "active",
            }, { onConflict: "user_id,provider" });

        if (error) {
            console.error("DB Save Error:", error);
            return new Response("Failed to save connection", { status: 500 });
        }

        // Redirect back to app
        const appUrl = Deno.env.get("APP_URL") || "http://localhost:5173";
        return Response.redirect(`${appUrl}/upload?success=true&provider=${provider}`);
    }

    return new Response("Not Found", { status: 404 });
});
