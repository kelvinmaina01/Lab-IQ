import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fetch real dataset context
async function getDatasetContext(datasetId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch dataset with schema and quality info
  const { data: dataset, error: datasetError } = await supabase
    .from('datasets')
    .select(`
      id,
      name,
      row_count,
      file_type,
      dataset_columns (
        column_name,
        data_type,
        non_null_count,
        unique_count
      ),
      dataset_quality (
        missing_values,
        duplicate_rows,
        outlier_count,
        validation_errors
      )
    `)
    .eq('id', datasetId)
    .single();

  if (datasetError) {
    console.error('Error fetching dataset:', datasetError);
    return null;
  }

  // Fetch sample rows (first 100)
  const { data: sampleRows, error: rowsError } = await supabase
    .from('dataset_rows')
    .select('data')
    .eq('dataset_id', datasetId)
    .limit(100);

  if (rowsError) {
    console.error('Error fetching rows:', rowsError);
  }

  // Build context string
  const columns = dataset.dataset_columns || [];
  const quality = dataset.dataset_quality?.[0] || {};

  const contextParts = [
    `Dataset Name: ${dataset.name}`,
    `Total Rows: ${dataset.row_count}`,
    `File Type: ${dataset.file_type}`,
    `\nColumns (${columns.length}):`,
    ...columns.map((col: any) =>
      `- ${col.column_name} (${col.data_type}): ${col.non_null_count} non-null, ${col.unique_count} unique`
    ),
    `\nData Quality:`,
    `- Missing Values: ${quality.missing_values || 0}`,
    `- Duplicate Rows: ${quality.duplicate_rows || 0}`,
    `- Outliers Detected: ${quality.outlier_count || 0}`,
    `- Validation Errors: ${quality.validation_errors || 0}`,
  ];

  if (sampleRows && sampleRows.length > 0) {
    contextParts.push(`\nSample Data (first ${sampleRows.length} rows):`);
    contextParts.push(JSON.stringify(sampleRows.slice(0, 5).map(r => r.data), null, 2));
  }

  return contextParts.join('\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode = 'analysis', datasetId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('AI Assistant request:', { mode, messageCount: messages?.length, datasetId });

    // Fetch real dataset context if datasetId provided
    let datasetContext = '';
    if (datasetId) {
      const context = await getDatasetContext(datasetId);
      if (context) {
        datasetContext = `\n\nACTUAL DATASET CONTEXT:\n${context}\n\nIMPORTANT: Use this real data for your analysis. Generate insights based on the actual values shown above. Use REAL column names from the dataset.`;
      } else {
        datasetContext = '\n\nNote: Dataset context could not be loaded. Ask the user to select a dataset.';
      }
    }

    // Define system prompts based on mode
    const systemPrompts = {
      analysis: `You are LabIQ's AI data analyst assistant. You help scientists analyze laboratory data.
${datasetId ? datasetContext : 'Guide the user to select a dataset first before performing analysis.'}

CRITICAL: You MUST respond with valid JSON only. ${datasetId ? 'Analyze the ACTUAL dataset provided above. Use real column names and real patterns from the data' : ''}

Response Format (JSON only):
{
  "sections": [
    { "type": "heading", "content": "Analysis Title" },
    { "type": "paragraph", "content": "Your explanation..." },
    { "type": "list", "title": "Key Findings", "items": ["Finding 1"] },
    { "type": "chart", "chartType": "bar", "title": "Title", "data": { "labels": ["A"], "values": [45] } },
    { "type": "insight", "content": "Key insight" }
  ]
}

Available section types:
- "heading","paragraph","list","chart","insight"

Always return valid JSON. Never use markdown formatting.`,

      automl: `You are LabIQ's AutoML assistant.
${datasetId ? datasetContext : 'Guide the user to select a dataset first.'}

CRITICAL: Respond with valid JSON only. ${datasetId ? 'Reference ACTUAL columns from the dataset above.' : ''}

Response Format same as analysis mode.`,

      educator: `You are LabIQ's educational assistant.

CRITICAL: Respond with valid JSON only.

Response Format same as analysis mode.`
    };

    const systemPrompt = (systemPrompts as any)[mode] || systemPrompts.analysis;

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    });

  } catch (error) {
    console.error('Error in ai-data-assistant:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});