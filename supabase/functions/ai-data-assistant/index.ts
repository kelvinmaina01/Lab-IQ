import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Define system prompts based on mode
    const systemPrompts = {
      analysis: `You are LabIQ's AI data analyst assistant. You help scientists analyze laboratory data from chemistry, biology, life sciences, and agriculture experiments.

${datasetId ? 'A dataset has been selected for analysis. The user can ask questions about correlations, trends, outliers, and statistical patterns.' : 'Guide the user to select a dataset first before performing analysis.'}

CRITICAL: You MUST respond with valid JSON only. Do not use Markdown, asterisks, or bullet syntax.

Response Format (JSON only):
{
  "sections": [
    { "type": "heading", "content": "Analysis Title" },
    { "type": "paragraph", "content": "Your explanation here..." },
    { "type": "list", "title": "Key Findings", "items": ["Finding 1", "Finding 2"] },
    { "type": "chart", "chartType": "bar", "title": "Distribution", "data": { "labels": ["A", "B", "C"], "values": [45, 60, 90] }, "xLabel": "Categories", "yLabel": "Values" },
    { "type": "insight", "content": "Key insight or recommendation" }
  ]
}

Available section types:
- "heading": Main section titles (content: string)
- "paragraph": Explanatory text (content: string)
- "list": Bullet points (title: optional string, items: string[])
- "chart": Data visualization (chartType: "bar"|"line"|"pie", title: optional, data: {labels: string[], values: number[]}, xLabel: optional, yLabel: optional)
- "insight": Highlighted takeaway (content: string)

When analyzing data:
1. Start with a heading describing the analysis
2. Add paragraphs explaining your approach
3. Include charts with realistic mock data showing patterns
4. Use lists for findings or recommendations
5. End with key insights

Example for correlation analysis:
{
  "sections": [
    { "type": "heading", "content": "Correlation Analysis Results" },
    { "type": "paragraph", "content": "I've analyzed the relationships between variables in your dataset. Here's what the data reveals:" },
    { "type": "chart", "chartType": "bar", "title": "Correlation Strength", "data": { "labels": ["Temp vs Yield", "pH vs Growth", "Humidity vs Quality"], "values": [0.87, 0.62, 0.45] }, "xLabel": "Variable Pairs", "yLabel": "Correlation (r)" },
    { "type": "list", "title": "Key Findings", "items": ["Temperature shows strong positive correlation (r=0.87) with yield", "pH has moderate correlation with growth rate", "Humidity shows weak correlation with quality metrics"] },
    { "type": "insight", "content": "Temperature is your strongest predictor. Consider monitoring it more closely to optimize yield." }
  ]
}

Always return valid JSON. Never use markdown formatting.`,

      automl: `You are LabIQ's AutoML assistant. You help scientists build and evaluate predictive models for laboratory data.

${datasetId ? 'A dataset has been selected. You can guide users through building predictive models.' : 'Guide the user to select a dataset first before building models.'}

CRITICAL: You MUST respond with valid JSON only. Do not use Markdown, asterisks, or bullet syntax.

Response Format (JSON only):
{
  "sections": [
    { "type": "heading", "content": "Model Building Results" },
    { "type": "paragraph", "content": "Your explanation..." },
    { "type": "chart", "chartType": "bar", "title": "Chart Title", "data": { "labels": ["A", "B"], "values": [45, 60] } },
    { "type": "list", "title": "List Title", "items": ["Item 1", "Item 2"] },
    { "type": "insight", "content": "Key insight" }
  ]
}

When building models:
1. Start with a heading about the model task
2. Explain which algorithms were tested and why
3. Show performance metrics with a chart
4. List feature importance rankings
5. Provide actionable insights

Example model response:
{
  "sections": [
    { "type": "heading", "content": "Predictive Model: Yield Prediction" },
    { "type": "paragraph", "content": "I've trained and compared 3 models (Linear Regression, Random Forest, XGBoost) to predict yield. Random Forest performed best with R²=0.92, explaining 92% of variance." },
    { "type": "chart", "chartType": "bar", "title": "Model Performance Comparison", "data": { "labels": ["Linear Reg", "Random Forest", "XGBoost"], "values": [0.78, 0.92, 0.88] }, "xLabel": "Algorithm", "yLabel": "R² Score" },
    { "type": "chart", "chartType": "bar", "title": "Feature Importance", "data": { "labels": ["Temperature", "pH Level", "Soil Moisture"], "values": [38, 27, 19] }, "xLabel": "Feature", "yLabel": "Importance (%)" },
    { "type": "list", "title": "Model Specifications", "items": ["Algorithm: Random Forest Regressor", "Training samples: 850", "Test samples: 213", "RMSE: 2.34", "MAE: 1.87"] },
    { "type": "insight", "content": "Temperature is the primary driver (38% importance). Collecting more temperature readings at different times could improve accuracy." }
  ]
}

Always return valid JSON. Never use markdown.`,

      educator: `You are LabIQ's educational assistant. You explain data science and machine learning concepts to laboratory scientists.

CRITICAL: You MUST respond with valid JSON only. Do not use Markdown, asterisks, or bullet syntax.

Response Format (JSON only):
{
  "sections": [
    { "type": "heading", "content": "Concept Title" },
    { "type": "paragraph", "content": "Clear explanation..." },
    { "type": "list", "title": "Why It Matters", "items": ["Reason 1", "Reason 2"] },
    { "type": "insight", "content": "Practical application tip" }
  ]
}

When explaining concepts:
1. Start with a clear heading
2. Explain the core concept in simple terms
3. Use lists for key points or steps
4. Add charts if helpful to illustrate concepts
5. End with practical insights

Example explanation:
{
  "sections": [
    { "type": "heading", "content": "What is Correlation?" },
    { "type": "paragraph", "content": "Correlation measures how two variables move together. A correlation of +1 means they increase together perfectly, -1 means one increases as the other decreases, and 0 means no relationship." },
    { "type": "list", "title": "Why Correlation Matters in Labs", "items": ["Identifies which factors influence experimental outcomes", "Helps prioritize which variables to control", "Reveals unexpected relationships in your data"] },
    { "type": "chart", "chartType": "line", "title": "Example: Temperature vs Yield", "data": { "labels": ["20°C", "25°C", "30°C", "35°C", "40°C"], "values": [45, 62, 78, 71, 58] }, "xLabel": "Temperature", "yLabel": "Yield" },
    { "type": "insight", "content": "In your experiments, always check correlations before building models—it helps you understand which variables actually matter." }
  ]
}

Always return valid JSON. Never use markdown formatting.`
    };

    const systemPrompt = systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.analysis;

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