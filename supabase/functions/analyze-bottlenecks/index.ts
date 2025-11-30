import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's experiments and datasets
    const { data: experiments } = await supabase
      .from('models')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: datasets } = await supabase
      .from('datasets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Prepare context for AI analysis
    const analysisContext = {
      experiments_count: experiments?.length || 0,
      datasets_count: datasets?.length || 0,
      recent_activities_count: activities?.length || 0,
      experiment_statuses: experiments?.map(e => e.status) || [],
      dataset_sizes: datasets?.map(d => d.file_size_mb) || [],
    };

    console.log('Analyzing workflow for user:', user.id, analysisContext);

    // Call Lovable AI to analyze bottlenecks
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an AI lab workflow analyst. Analyze the provided lab data and identify the single most critical bottleneck affecting productivity. Be specific and actionable.'
          },
          {
            role: 'user',
            content: `Analyze this lab workflow data and identify the primary bottleneck:
            
Experiments: ${analysisContext.experiments_count}
Datasets: ${analysisContext.datasets_count}
Recent Activities: ${analysisContext.recent_activities_count}
Experiment Statuses: ${analysisContext.experiment_statuses.join(', ')}

Provide a JSON response with:
{
  "title": "Brief bottleneck title (max 6 words)",
  "description": "One sentence describing the bottleneck and its impact",
  "impact_score": number between 1-50,
  "suggested_action": "One specific actionable recommendation"
}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "identify_bottleneck",
            description: "Identify the primary workflow bottleneck",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                impact_score: { type: "number" },
                suggested_action: { type: "string" }
              },
              required: ["title", "description", "impact_score", "suggested_action"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "identify_bottleneck" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI gateway error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const bottleneckData = JSON.parse(toolCall.function.arguments);

    // Mark existing bottlenecks as resolved
    await supabase
      .from('bottlenecks')
      .update({ resolved_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('resolved_at', null);

    // Insert new bottleneck
    const { data: newBottleneck, error: insertError } = await supabase
      .from('bottlenecks')
      .insert({
        user_id: user.id,
        title: bottleneckData.title,
        description: bottleneckData.description,
        impact_score: bottleneckData.impact_score,
        suggested_action: bottleneckData.suggested_action,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting bottleneck:', insertError);
      throw insertError;
    }

    console.log('Bottleneck detected and saved:', newBottleneck);

    // Send email notification for critical bottlenecks (impact >= 30)
    if (bottleneckData.impact_score >= 30 && user.email) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            to: user.email,
            subject: `⚠️ Critical Bottleneck Detected: ${bottleneckData.title}`,
            type: 'critical_bottleneck',
            data: {
              bottleneckTitle: bottleneckData.title,
              bottleneckDescription: bottleneckData.description,
              impactScore: bottleneckData.impact_score,
              suggestedAction: bottleneckData.suggested_action
            }
          })
        });
        console.log('Critical bottleneck email notification sent');
      } catch (emailError) {
        console.error('Failed to send critical bottleneck email:', emailError);
        // Don't fail the analysis if email fails
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      bottleneck: newBottleneck 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-bottlenecks function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});