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

    const { format = 'csv' } = await req.json();

    // Fetch all analytics data
    const [bottlenecks, insights, activities] = await Promise.all([
      supabase.from('bottlenecks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('predictive_insights').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('activities').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ]);

    if (format === 'csv') {
      // Generate CSV
      let csv = 'Report Type,Date,Title,Description,Value,Status\n';

      // Add bottlenecks
      bottlenecks.data?.forEach(b => {
        csv += `Bottleneck,${b.created_at},"${b.title}","${b.description}",${b.impact_score},${b.resolved_at ? 'Resolved' : 'Active'}\n`;
      });

      // Add insights
      insights.data?.forEach(i => {
        csv += `Insight,${i.created_at},Predictive Analysis,Velocity: ${i.velocity_score}% | Pipeline: ${i.pipeline_flow_score}%,${i.estimated_days},Active\n`;
      });

      // Add activities
      activities.data?.slice(0, 50).forEach(a => {
        csv += `Activity,${a.created_at},"${a.action}","${a.item}",,-\n`;
      });

      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="lab-analytics-${new Date().toISOString().split('T')[0]}.csv"`
        },
      });
    } else {
      // Return JSON for PDF generation on client
      return new Response(JSON.stringify({
        bottlenecks: bottlenecks.data,
        insights: insights.data,
        activities: activities.data,
        generated_at: new Date().toISOString(),
        user_id: user.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in export-analytics function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});