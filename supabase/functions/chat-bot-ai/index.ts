
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

        // Try Groq first (preferred), fallback to Grok, then Gemini
        const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
        const GROK_API_KEY = Deno.env.get("GROK_API_KEY");
        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

        if (!GROQ_API_KEY && !GROK_API_KEY && !GEMINI_API_KEY) {
            throw new Error("Missing AI API keys. Configure GROQ_API_KEY, GROK_API_KEY, or GEMINI_API_KEY");
        }

        // Initialize Supabase Client (Service Role)
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch channel context for better responses
        const { data: channel } = await supabase
            .from('chat_channels')
            .select('display_name, description, type')
            .eq('id', channelId)
            .single();

        // Construct Enhanced System Prompt
        const systemPrompt = `You are LabAI, an expert scientific research assistant integrated into Lab-IQ collaboration platform.

**Your Role:**
- Provide precise, scientifically accurate information
- Help with data analysis, experimental design, and statistical insights
- Assist with protocol recommendations and result interpretation
- Generate research insights and best practices
- Support biotech, clinical, pharmaceutical, and chemistry research

**Current Context:**
- Channel: #${channel?.display_name || 'unknown'} (${channel?.type || 'general'})
- Channel Description: ${channel?.description || 'No description'}
- You have access to Lab-IQ features: datasets, experiments, reports, workflows

**Response Guidelines:**
- Be concise but thorough
- Use markdown formatting for clarity
- Cite sources when applicable
- Provide actionable recommendations
- If you need more information, ask clarifying questions

Respond as a collaborative research partner.`;

        let aiMessage = "";

        // 2. Try Groq API first (preferred for speed and quality)
        if (GROQ_API_KEY) {
            try {
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${GROQ_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: "mixtral-8x7b-32768",
                        messages: [
                            { role: "system", content: systemPrompt },
                            ...(history || []),
                            { role: "user", content: message }
                        ],
                        temperature: 0.7,
                        max_tokens: 1000,
                    }),
                });

                const aiData = await response.json();
                aiMessage = aiData.choices?.[0]?.message?.content;
            } catch (error) {
                console.error("Groq API failed:", error);
            }
        }

        // Fallback to Grok if Groq fails
        if (!aiMessage && GROK_API_KEY) {
            try {
                const response = await fetch("https://api.x.ai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${GROK_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: "grok-beta",
                        messages: [
                            { role: "system", content: systemPrompt },
                            ...(history || []),
                            { role: "user", content: message }
                        ],
                        stream: false,
                    }),
                });

                const aiData = await response.json();
                aiMessage = aiData.choices?.[0]?.message?.content;
            } catch (error) {
                console.error("Grok API failed:", error);
            }
        }

        // Final fallback to Gemini
        if (!aiMessage && GEMINI_API_KEY) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }] }],
                            generationConfig: {
                                maxOutputTokens: 1000,
                                temperature: 0.7
                            }
                        })
                    }
                );

                const aiData = await response.json();
                aiMessage = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
            } catch (error) {
                console.error("Gemini API failed:", error);
            }
        }

        if (!aiMessage) {
            aiMessage = "I'm experiencing technical difficulties. Please try again in a moment.";
        }

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
