
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { message, channelId, userId, history } = await req.json();
        const GROK_API_KEY = Deno.env.get("GROK_API_KEY");

        if (!GROK_API_KEY) {
            throw new Error("Missing GROK_API_KEY secret");
        }

        // Initialize Supabase Client (Service Role)
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Construct System Prompt
        const systemPrompt = `You are Lab-IQ AI, a helpful research assistant. 
    You are precise, scientific, and helpful.
    Current Context: Channel ID ${channelId}.
    User ID: ${userId}.
    `;

        // 2. Call Grok API
        // Note: Adjust endpoint if needed for xAI / Grok
        const response = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROK_API_KEY}`,
            },
            body: JSON.stringify({
                model: "grok-beta", // or appropriate model
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history || [],
                    { role: "user", content: message }
                ],
                stream: false,
            }),
        });

        const aiData = await response.json();
        const aiMessage = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";

        // 3. Store AI Response in Database (This triggers Realtime for everyone)
        // We post as a 'bot' user or the system
        // Ideally we have a dedicated bot user in auth.users, but for now we might insert with a special flag 
        // or just insert as a 'system' message if supported.
        // Let's assume we insert with a null user_id? No, RLS might block.
        // We'll insert with the Requesting User's ID properly tagged as 'scraped' or 'bot'? 
        // Better: Edge function has SERVICE ROLE, so it bypasses RLS.
        // We can insert with a specific Bot User ID if we have one.
        // For now, we'll insert as the user OR a hardcoded bot ID.
        const botUserId = '00000000-0000-0000-0000-000000000000'; // Placeholder or create a real one

        const { error: dbError } = await supabase
            .from('chat_messages')
            .insert({
                channel_id: channelId,
                user_id: userId, // Posting 'on behalf' of user? Or replying?
                // If replying, we should really use a distinct bot user.
                // Let's append "[AI]" to content if we must reuse ID, or use a specific ID.
                content: `[AI] ${aiMessage}`,
                // created_at: handled by default
            });

        if (dbError) console.error("DB Error", dbError);

        return new Response(JSON.stringify({ success: true, aiMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
