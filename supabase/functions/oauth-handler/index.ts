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
        scopes: "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/adwords",
    },
    googledrive: { provider: 'google' },
    googlesheets: { provider: 'google' },
    googleads: { provider: 'google' },
    microsoft: {
        auth_url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        token_url: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        scopes: "https://graph.microsoft.com/Files.Read.All https://graph.microsoft.com/Sites.Read.All",
    },
    onedrive: { provider: 'microsoft' },
    sharepoint: { provider: 'microsoft' },
    epic: {
        auth_url: "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize",
        token_url: "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token",
        scopes: "patient/*.read",
    },
    cerner: {
        auth_url: "https://authorization.cerner.com/tenants/ec2458f2-1e24-41c8-b71b-0e701af7583d/protocols/oauth2/profiles/smart-v1/personas/patient/authorize",
        token_url: "https://authorization.cerner.com/tenants/ec2458f2-1e24-41c8-b71b-0e701af7583d/protocols/oauth2/profiles/smart-v1/personas/patient/token",
        scopes: "patient/*.read",
    }
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    const actionHeader = req.headers.get('x-action');

    // Helper to get robust redirect URI for the provider
    const getProviderRedirectUri = () => {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        return `${supabaseUrl}/functions/v1/oauth-handler/callback`;
    };

    // 1. Initial Redirect
    if (path === "init" || actionHeader === "init") {
        const { provider: rawProvider, userId, host } = await req.json();
        const providerConfig = PROVIDERS[rawProvider];

        if (!providerConfig) return new Response("Provider not supported", { status: 400 });

        const provider = providerConfig.provider || rawProvider;
        const config = providerConfig.provider ? PROVIDERS[provider] : providerConfig;

        const state = crypto.randomUUID();
        const authUrl = new URL(config.auth_url);

        authUrl.searchParams.set("client_id", Deno.env.get(`${provider.toUpperCase()}_CLIENT_ID`) || "");
        authUrl.searchParams.set("redirect_uri", getProviderRedirectUri());
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", config.scopes);
        authUrl.searchParams.set("state", `${rawProvider}:${userId}:${state}`);
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");

        // Clinical systems (SMART on FHIR) require an 'aud' (audience) parameter
        if ((provider === 'epic' || provider === 'cerner') && host) {
            authUrl.searchParams.set("aud", host);
        }

        return new Response(JSON.stringify({ url: authUrl.toString() }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 2. Callback Handler
    if (path === "callback") {
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state"); // format: rawProvider:userId:uuid

        if (!code || !state) return new Response("Missing code or state", { status: 400 });

        const [rawProvider, userId] = state.split(":");
        const providerConfig = PROVIDERS[rawProvider];
        const provider = providerConfig.provider || rawProvider;
        const config = providerConfig.provider ? PROVIDERS[provider] : providerConfig;

        // Exchange code for tokens
        const resp = await fetch(config.token_url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: Deno.env.get(`${provider.toUpperCase()}_CLIENT_ID`) || "",
                client_secret: Deno.env.get(`${provider.toUpperCase()}_CLIENT_SECRET`) || "",
                code,
                grant_type: "authorization_code",
                redirect_uri: getProviderRedirectUri(),
            }),
        });

        const tokens = await resp.json();

        if (tokens.error) {
            console.error("Token exchange error:", tokens);
            return new Response(`Token exchange failed: ${tokens.error_description || tokens.error}`, { status: 500 });
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
                provider: rawProvider,
                type: "cloud",
                name: `${rawProvider.charAt(0).toUpperCase() + rawProvider.slice(1)} Connection`,
                config: {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expires_at: tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : null,
                },
                status: "active",
            }, { onConflict: "user_id,provider" });

        if (error) {
            console.error("DB Save Error:", error);
            return new Response("Failed to save connection", { status: 500 });
        }

        // Redirect back to app
        const appUrl = Deno.env.get("APP_URL") || Deno.env.get("OAUTH_CALLBACK_URL")?.replace('/upload', '') || "http://localhost:5173";
        return Response.redirect(`${appUrl}/upload?success=true&provider=${rawProvider}`);
    }

    return new Response("Not Found", { status: 404 });
});
