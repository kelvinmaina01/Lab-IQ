import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.info('[LabAI] Bot function started');

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log('[LabAI] Received bot request');
        const { message, channelId, userId, history } = await req.json();

        console.log('[LabAI] Request details:', {
            userId,
            channelId,
            messageLength: message?.length || 0,
            hasHistory: Array.isArray(history) && history.length > 0,
        });

        // Try Groq first (preferred), fallback to Grok, then Gemini
        const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
        const GROK_API_KEY = Deno.env.get("GROK_API_KEY");
        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

        if (!GROQ_API_KEY && !GROK_API_KEY && !GEMINI_API_KEY) {
            console.error('[LabAI] No API keys configured');
            throw new Error("AI service not configured. Please contact administrator.");
        }

        // Initialize Supabase Client (Service Role)
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch channel context for better responses
        console.log('[LabAI] Fetching channel context...');
        const { data: channel } = await supabase
            .from('chat_channels')
            .select('display_name, description, type')
            .eq('id', channelId)
            .single();

        console.log('[LabAI] Channel:', channel?.display_name);

        // Enhanced scientific system prompt
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
- Be concise but thorough (2-4 paragraphs)
- Use markdown formatting for clarity
- Cite sources when applicable
- Provide actionable recommendations
- If you need more information, ask clarifying questions
- Use bullet points for lists
- Include relevant equations or formulas when helpful

Respond as a collaborative research partner.`;

        let aiMessage = "";
        let modelUsed = "";

        // 1. Try Groq API first (preferred for speed and quality)
        if (GROQ_API_KEY) {
            try {
                console.log('[LabAI] Attempting GROQ API...');
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${GROQ_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile", // Latest and best model
                        messages: [
                            { role: "system", content: systemPrompt },
                            ...(history || []),
                            { role: "user", content: message }
                        ],
                        temperature: 0.7,
                        max_tokens: 1024,
                        top_p: 0.9,
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('[LabAI] GROQ API error:', errorText);
                    throw new Error(`GROQ API failed: ${response.status}`);
                }

                const aiData = await response.json();
                aiMessage = aiData.choices?.[0]?.message?.content;
                modelUsed = "llama-3.3-70b-versatile";
                console.log('[LabAI] ✅ GROQ response received');
            } catch (error) {
                console.error("[LabAI] Groq API failed:", error);
            }
        }

        // 2. Fallback to Grok if Groq fails
        if (!aiMessage && GROK_API_KEY) {
            try {
                console.log('[LabAI] Attempting Grok API...');
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
                modelUsed = "grok-beta";
                console.log('[LabAI] ✅ Grok response received');
            } catch (error) {
                console.error("[LabAI] Grok API failed:", error);
            }
        }

        // 3. Final fallback to Gemini
        if (!aiMessage && GEMINI_API_KEY) {
            try {
                console.log('[LabAI] Attempting Gemini API...');
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }] }],
                            generationConfig: {
                                maxOutputTokens: 1024,
                                temperature: 0.7
                            }
                        })
                    }
                );

                const aiData = await response.json();
                aiMessage = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
                modelUsed = "gemini-pro";
                console.log('[LabAI] ✅ Gemini response received');
            } catch (error) {
                console.error("[LabAI] Gemini API failed:", error);
            }
        }

        if (!aiMessage) {
            console.error('[LabAI] ❌ All AI providers failed');
            aiMessage = "I'm experiencing technical difficulties. Please try again in a moment or contact support if this persists.";
            modelUsed = "fallback";
        }

        console.log('[LabAI] Storing response in database...');

        // Store AI Response in Database using is_bot and bot_metadata columns
        const { error: dbError } = await supabase
            .from('chat_messages')
            .insert({
                channel_id: channelId,
                user_id: userId,
                content: aiMessage,
                is_bot: true, // Use the existing is_bot column
                bot_metadata: { // Use the existing bot_metadata JSONB column
                    model: modelUsed,
                    role: "scientific_assistant",
                    timestamp: new Date().toISOString(),
                    provider: GROQ_API_KEY ? "groq" : GROK_API_KEY ? "grok" : "gemini"
                }
            });

        if (dbError) {
            console.error("[LabAI] DB Error:", dbError);
        } else {
            console.log('[LabAI] ✅ Response stored in database');
        }

        console.log('[LabAI] ✅ Request completed successfully');
        return new Response(JSON.stringify({
            success: true,
            aiMessage,
            model: modelUsed
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("[LabAI] ❌ Error:", error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error occurred"
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});


