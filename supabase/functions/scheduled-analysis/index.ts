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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting scheduled bottleneck analysis for all users...');

    // Get all users who have activity in the last 7 days
    const { data: activeUsers } = await supabase
      .from('activities')
      .select('user_id')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    const uniqueUserIds = [...new Set(activeUsers?.map(a => a.user_id) || [])];

    console.log(`Found ${uniqueUserIds.length} active users to analyze`);

    for (const userId of uniqueUserIds) {
      try {
        // Get user's session token
        const { data: { user } } = await supabase.auth.admin.getUserById(userId as string);
        
        if (!user) continue;

        // Call analyze-bottlenecks for this user
        const { data, error } = await supabase.functions.invoke('analyze-bottlenecks', {
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`
          },
          body: { user_id: userId }
        });

        if (error) {
          console.error(`Error analyzing bottlenecks for user ${userId}:`, error);
          continue;
        }

        if (data?.bottleneck) {
          // Create notification for user
          await supabase.from('notifications').insert({
            user_id: userId,
            title: 'New Bottleneck Detected',
            message: `AI has identified a critical workflow issue: ${data.bottleneck.title}`,
            type: 'warning',
            link: '/dashboard'
          });

          console.log(`Created bottleneck notification for user ${userId}`);
        }
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
      }
    }

    console.log('Scheduled analysis completed');

    return new Response(JSON.stringify({ 
      success: true,
      analyzed_users: uniqueUserIds.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scheduled-analysis function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});