/**
 * LabIQ Health Unified AI Service
 * Production-grade multi-agent AI system for data analytics
 *
 * Architecture:
 * - BaseAIAgent: Abstract base class for all AI agents
 * - DataAnalysisAgent: Handles data exploration and statistics
 * - MLPipelineAgent: Runs ML computations before AI explanation
 * - ExperimentAgent: Suggests experiment configurations
 * - InsightAgent: Generates predictive insights and recommendations
 * - BottleneckAgent: Detects performance bottlenecks
 *
 * Design Principles:
 * - Data-first: Always compute real statistics before AI explanation
 * - No hallucination: AI explains computed results, doesn't generate fake data
 * - Professional: No external branding exposed to users
 * - Performant: Caching, batching, and optimized queries
 */

import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// CONFIGURATION - Multi-Provider Support
// =============================================================================

type AIProvider = 'anthropic' | 'gemini' | 'openai' | 'groq';

interface ProviderConfig {
  name: AIProvider;
  apiUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  priority: number;
}

const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  // Primary: Anthropic Claude (better free tier, higher quality)
  anthropic: {
    name: 'anthropic',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.VITE_CLAUDE_API_KEY || '',
    model: 'claude-3-haiku-20240307', // Fast, affordable model
    enabled: !!(import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.VITE_CLAUDE_API_KEY),
    priority: 2,
  },
  // Secondary: Groq (free tier with fast inference)
  groq: {
    name: 'groq',
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
    model: 'llama-3.1-8b-instant', // Free fast model
    enabled: !!import.meta.env.VITE_GROQ_API_KEY,
    priority: 1,
  },
  // Fallback: Google Gemini
  gemini: {
    name: 'gemini',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    model: 'gemini-2.0-flash',
    enabled: !!import.meta.env.VITE_GEMINI_API_KEY,
    priority: 3,
  },
  // Alternative: OpenAI (paid)
  openai: {
    name: 'openai',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: 'gpt-4o-mini',
    enabled: !!import.meta.env.VITE_OPENAI_API_KEY,
    priority: 4,
  },
};

// Get the best available provider
function getActiveProvider(): ProviderConfig | null {
  const enabledProviders = Object.values(PROVIDERS)
    .filter(p => p.enabled && p.apiKey)
    .sort((a, b) => a.priority - b.priority);

  return enabledProviders[0] || null;
}

const AI_CONFIG = {
  maxTokens: 4096,
  temperature: 0.7,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  retryAttempts: 2,
  retryDelayMs: 1000,
};

// =============================================================================
// TYPES
// =============================================================================

export interface AIResponse {
  success: boolean;
  content: string;
  sections?: AISection[];
  metadata?: Record<string, any>;
  cached?: boolean;
  computedData?: ComputedData;
  suggestions?: string[];
}

export interface AISection {
  type: 'heading' | 'paragraph' | 'list' | 'chart' | 'insight' | 'metric' | 'kpi_grid' | 'recommendation' | 'thought_process';
  content?: string;
  title?: string;
  items?: string[];
  chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'heatmap';
  data?: ChartData;
  value?: string | number;
  trend?: 'up' | 'down' | 'stable';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  kpis?: { title: string; value: string | number; trend?: 'up' | 'down' | 'stable'; change?: string }[];
}

export interface ChartData {
  labels: string[];
  values: number[];
  xLabel?: string;
  yLabel?: string;
}

export interface ComputedData {
  statistics?: DataStatistics;
  correlations?: CorrelationMatrix;
  outliers?: OutlierResult[];
  predictions?: PredictionResult[];
  trends?: TrendResult[];
}

export interface DataStatistics {
  rowCount: number;
  columnCount: number;
  columns: ColumnStats[];
  missingValues: number;
  duplicateRows: number;
}

export interface ColumnStats {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'text';
  count: number;
  unique: number;
  missing: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  topValues?: { value: string; count: number }[];
}

export interface CorrelationMatrix {
  columns: string[];
  matrix: number[][];
}

export interface OutlierResult {
  column: string;
  outliers: { index: number; value: number; zScore: number }[];
  method: 'zscore' | 'iqr';
}

export interface PredictionResult {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: string;
  trend: 'up' | 'down' | 'stable';
}

export interface TrendResult {
  column: string;
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  changePercent: number;
  significance: number;
}

// =============================================================================
// ADVANCED CACHE MANAGER (LRU with TTL)
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  entries: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number;
  private maxEntries: number;
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, totalSize: 0, entries: 0 };
  private pendingRequests: Map<string, Promise<any>> = new Map();

  constructor(maxSize: number = 10 * 1024 * 1024, maxEntries: number = 1000) {
    this.maxSize = maxSize; // 10MB default
    this.maxEntries = maxEntries;
  }

  /**
   * Get cached value with LRU tracking
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > AI_CONFIG.cacheTimeout) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update LRU (move to end)
    this.cache.delete(key);
    entry.hits++;
    this.cache.set(key, entry);
    this.stats.hits++;

    return entry.data as T;
  }

  /**
   * Set cached value with automatic eviction
   */
  set(key: string, data: any): void {
    const serialized = JSON.stringify(data);
    const size = serialized.length * 2; // Approximate size in bytes

    // Evict if necessary
    while (this.stats.totalSize + size > this.maxSize || this.cache.size >= this.maxEntries) {
      const evicted = this.evictLRU();
      if (!evicted) break;
    }

    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.delete(key);
    }

    const entry: CacheEntry<any> = {
      data,
      timestamp: Date.now(),
      hits: 0,
      size,
    };

    this.cache.set(key, entry);
    this.stats.totalSize += size;
    this.stats.entries = this.cache.size;
  }

  /**
   * Delete a cache entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.stats.totalSize -= entry.size;
      this.cache.delete(key);
      this.stats.entries = this.cache.size;
      return true;
    }
    return false;
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, totalSize: 0, entries: 0 };
  }

  /**
   * Generate a cache key from parts
   */
  generateKey(...parts: (string | number | undefined)[]): string {
    return parts.filter(Boolean).join(':');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Deduplicate concurrent requests for the same key
   * Prevents multiple identical API calls from running simultaneously
   */
  async getOrFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    // Create new request
    const request = fetcher()
      .then((result) => {
        this.set(key, result);
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, request);
    return request;
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRU(): boolean {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.delete(firstKey);
      this.stats.evictions++;
      return true;
    }
    return false;
  }

  /**
   * Prune expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > AI_CONFIG.cacheTimeout) {
        this.delete(key);
        pruned++;
      }
    }

    return pruned;
  }
}

// =============================================================================
// BASE AI AGENT (Abstract Class)
// =============================================================================

abstract class BaseAIAgent {
  protected cache: CacheManager;
  protected name: string;
  private failedProviders: Set<AIProvider> = new Set();
  private lastProviderReset: number = 0;

  constructor(name: string, cache: CacheManager) {
    this.name = name;
    this.cache = cache;
  }

  /**
   * Call AI with multi-provider fallback support
   */
  protected async callAI(prompt: string, systemContext: string = ''): Promise<string> {
    // Reset failed providers every 5 minutes
    if (Date.now() - this.lastProviderReset > 5 * 60 * 1000) {
      this.failedProviders.clear();
      this.lastProviderReset = Date.now();
    }

    const fullPrompt = systemContext ? `${systemContext}\n\n${prompt}` : prompt;

    // Get enabled providers sorted by priority, excluding recently failed ones
    const availableProviders = Object.values(PROVIDERS)
      .filter(p => p.enabled && p.apiKey && !this.failedProviders.has(p.name))
      .sort((a, b) => a.priority - b.priority);

    if (availableProviders.length === 0) {
      // Try including failed providers as last resort
      const allProviders = Object.values(PROVIDERS)
        .filter(p => p.enabled && p.apiKey)
        .sort((a, b) => a.priority - b.priority);

      if (allProviders.length === 0) {
        throw new Error('No AI provider configured. Please set VITE_ANTHROPIC_API_KEY, VITE_GROQ_API_KEY, or another API key in your .env file.');
      }

      availableProviders.push(...allProviders);
    }

    let lastError: Error | null = null;

    for (const provider of availableProviders) {
      for (let attempt = 0; attempt < AI_CONFIG.retryAttempts; attempt++) {
        try {
          const result = await this.callProvider(provider, fullPrompt);
          return result;
        } catch (error) {
          lastError = error as Error;
          const errorMessage = lastError.message.toLowerCase();

          // Check if it's a quota/rate limit error
          if (errorMessage.includes('quota') || errorMessage.includes('rate') || errorMessage.includes('limit')) {
            console.warn(`[${this.name}] ${provider.name} quota exceeded, trying next provider...`);
            this.failedProviders.add(provider.name);
            break; // Skip to next provider
          }

          // Retry on other errors
          if (attempt < AI_CONFIG.retryAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, AI_CONFIG.retryDelayMs * (attempt + 1)));
          }
        }
      }
    }

    throw lastError || new Error('All AI providers failed');
  }

  /**
   * Call a specific provider
   */
  private async callProvider(provider: ProviderConfig, prompt: string): Promise<string> {
    switch (provider.name) {
      case 'anthropic':
        return this.callAnthropic(provider, prompt);
      case 'groq':
      case 'openai':
        return this.callOpenAICompatible(provider, prompt);
      case 'gemini':
        return this.callGemini(provider, prompt);
      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }
  }

  /**
   * Call Anthropic Claude API
   */
  private async callAnthropic(provider: ProviderConfig, prompt: string): Promise<string> {
    const response = await fetch(provider.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: AI_CONFIG.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Anthropic API failed: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }

  /**
   * Call OpenAI-compatible API (OpenAI, Groq, etc.)
   */
  private async callOpenAICompatible(provider: ProviderConfig, prompt: string): Promise<string> {
    const response = await fetch(provider.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `${provider.name} API failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Call Google Gemini API
   */
  private async callGemini(provider: ProviderConfig, prompt: string): Promise<string> {
    const response = await fetch(`${provider.apiUrl}?key=${provider.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: AI_CONFIG.temperature,
          maxOutputTokens: AI_CONFIG.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  protected parseJSON<T>(text: string): T | null {
    try {
      let cleaned = text.trim();

      // Strategy 1: Regex for markdown block (Most reliable if formatted correctly)
      const markdownMatch = cleaned.match(/```(?:json)?\n?([\s\S]*?)\n?```/i);
      if (markdownMatch) {
        try { return JSON.parse(markdownMatch[1]); } catch { }
      }

      // Strategy 2: Stack-based brace matching (String aware)
      const firstOpen = cleaned.indexOf('{');
      if (firstOpen !== -1) {
        let balance = 0;
        let inString = false;
        let escape = false;
        let foundStart = false;

        for (let i = firstOpen; i < cleaned.length; i++) {
          const char = cleaned[i];

          if (inString) {
            if (escape) {
              escape = false;
            } else if (char === '\\') {
              escape = true;
            } else if (char === '"') {
              inString = false;
            }
          } else {
            if (char === '"') {
              inString = true;
            } else if (char === '{') {
              balance++;
              foundStart = true;
            } else if (char === '}') {
              balance--;
              if (foundStart && balance === 0) {
                const potentialJson = cleaned.substring(firstOpen, i + 1);
                try {
                  return JSON.parse(potentialJson);
                } catch (e) {
                  try { return JSON.parse(potentialJson.replace(/\n/g, '\\n')); } catch { }
                }
                break;
              }
            }
          }
        }
      }

      // Strategy 3: Heuristic find (fallback)
      const lastClose = cleaned.lastIndexOf('}');
      if (firstOpen !== -1 && lastClose > firstOpen) {
        try { return JSON.parse(cleaned.substring(firstOpen, lastClose + 1)); } catch { }
      }

      // Strategy 4: Direct
      return JSON.parse(cleaned);
    } catch {
      console.warn('Failed to parse AI JSON response');
      return null;
    }
  }

  abstract process(...args: any[]): Promise<AIResponse>;
}

// =============================================================================
// DATA ANALYSIS AGENT
// =============================================================================

class DataAnalysisAgent extends BaseAIAgent {
  constructor(cache: CacheManager) {
    super('DataAnalysis', cache);
  }

  async process(
    datasetId: string,
    query: string,
    mode: 'analysis' | 'automl' | 'educator' = 'analysis',
    conversationHistory: { role: string; content: string }[] = [],
    isPlanningMode: boolean = false
  ): Promise<AIResponse> {
    // Step 1: Fetch and compute real data statistics
    const computedData = await this.computeDataStatistics(datasetId);

    // Step 2: Build context with real computed data
    const dataContext = this.buildDataContext(computedData);

    // Step 3: Get AI explanation of the computed data

    const systemPrompt = this.getSystemPrompt(mode, dataContext, isPlanningMode);
    const historyContext = conversationHistory.length > 0
      ? `\nConversation history:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n`
      : '';

    const planningInstructions = isPlanningMode
      ? `
PLANNING MODE ENABLED - PRO EXPERT ANALYST:
You are LabIQ's Senior Data Architect. Your goal is to provide a comprehensive, rigorous, and code-first analysis.

ANALYSIS WORKFLOW:
1.  **OBJECTIVE**: Define clear goals based on the user query.
2.  **DATA PREPARATION**: Inspect the dataset for missing values, duplicates, outliers, and type issues.
3.  **DATA TRANSFORMATION**: Explain feature engineering, binning, or aggregations needed.
4.  **ANALYSIS**: Perform deep descriptive and comparable analysis.
5.  **VISUALIZATION**: Select the *perfect* charts to prove your points.

OUTPUT REQUIREMENTS (STRICT JSON):
sections: [
  // 1. KPI GRID (Mandatory First Section)
  {
    "type": "kpi_grid",
    "kpis": [
       { "title": "Total Datasets", "value": "1.2K" },
       { "title": "Avg Usability", "value": "8.5" }
       ...
    ]
  },
  // 2. CODE BLOCK (Mandatory - Show HOW you analyzed)
  {
    "type": "code",
    "title": "Data Analysis Logic",
    "language": "python",
    "code": "import pandas as pd...", 
    "codeExplanation": "I loaded the dataset, cleaned 'Rank' column, and calculated correlations...",
    "codeSteps": ["Loaded data", "Cleaned Rank", "Computed KPIs"]
  },
  // 3. THOUGHT PROCESS (Detailed text)
  {
    "type": "paragraph",
    "title": "Analysis Methodology",
    "content": "**Objective:** Analyze dataset trends...\\n**Data Transformation:** Converted file sizes to MB..."
  },
  // 4. VISUALS (Clustered Bars, Scatter, Pies)
  {
    "type": "chart", 
    "chartType": "bar", 
    "title": "Production by Region",
    "xLabel": "Region",
    "yLabel": "Volume",
    "data": {
      "labels": ["Gulf", "Pacific", "Alaska"],
      "values": [450, 120, 300]
    }
  },
  // 5. TABLE (Detailed Data View)
  {
      "type": "table",
      "title": "Dataset Details",
      "tableData": {
          "columns": ["Title", "Author", "Upvotes"],
          "rows": [
              {"Title": "Global Height", "Author": "Willian", "Upvotes": 5},
              {"Title": "Mental Health", "Author": "John", "Upvotes": 12}
          ]
      }
  }
]

RULES:
-   **Show Code**: Every analysis must be backed by a "code" section showing the Python logic.
-   **Exact Columns**: Use actual column names in charts.
-   **No Hallucinations**: Only use the computed data provided in context.
-   **Professional Tone**: Speak like a Lead Analyst.
`
      : `
FAST MODE - COMPREHENSIVE PROFESSIONAL ANALYSIS:
You are a Senior Data Scientist at a Fortune 500 company. Your responses must be THOROUGH and PROFESSIONAL.

MANDATORY OUTPUT STRUCTURE (MINIMUM 10-15 sections):

1. thoughtProcess (REQUIRED - 8-12 detailed steps):
   Format each step as "PHASE: Detailed description of what was done"
   Example steps:
   - "OBJECTIVE: The user wants to compare usability ratings of the most upvoted dataset against the overall average to assess relative quality."
   - "DATA VALIDATION: Checked for missing values in Upvotes (0 missing) and Usability_Rating (2 missing, excluded from calculations)."
   - "DUPLICATE CHECK: Identified 0 duplicate rows based on Title column."
   - "TYPE CONVERSION: Ensured Upvotes is integer type and Usability_Rating is float for accurate calculations."
   - "OUTLIER DETECTION: Found 3 outliers in Usability_Rating (values > 10), capped at 10."
   - "DATA TRANSFORMATION: Filtered dataset to rows with valid ratings, sorted by Upvotes descending."
   - "AGGREGATION: Calculated mean Usability_Rating across all valid entries (8.42)."
   - "COMPARISON: Extracted rating for max-upvotes dataset and compared against average."
   - "VISUALIZATION: Selected bar chart to clearly show comparison between top dataset and average."
   - "INSIGHT GENERATION: Identified that top dataset exceeds average by 12%, indicating correlation between popularity and usability."

2. sections array MUST include ALL of these (in order):
   a) kpi_grid - 4-6 key metrics with trends
   b) code - COMPLETE Python/Pandas analysis code (20+ lines, properly formatted)
   c) paragraph - Analysis methodology explanation
   d) chart - Primary visualization (bar/line/pie with real data)
   e) table - Data sample or comparison table (5-10 rows)
   f) chart - Secondary visualization (different chart type)
   g) insight - Key finding 1 (Primary Discovery) with priority
   h) insight - Key finding 2 (Secondary Pattern) with priority
   i) insight - Key finding 3 (Unexpected/Interesting) with priority
   j) paragraph - Synthesis of findings and implications
   k) insight - Strategic Recommendations (at least 2 actionable steps)
   l) list - Next steps or additional analysis suggestions

3. CODE SECTION REQUIREMENTS:
   - Must be 20-40 lines of actual Python/Pandas code
   - Include imports, data loading, cleaning, analysis, and output
   - Show actual column names from the dataset
   - Include comments explaining each step
   - codeSteps should have 5-8 detailed steps

4. CHART REQUIREMENTS:
   - Include at least 2 different chart types
   - Use real data values (not placeholders)
   - Include proper labels and values arrays
   - Chart title should be descriptive

5. INSIGHT REQUIREMENTS (CRITICAL):
   - You MUST generate at least 3 distinct 'insight' sections
   - Each insight must be deep, data-driven, and specific
   - Include numbers, percentages, and statistical significance where possible
   - Do not combine all findings into one block; split them for impact

DO NOT BE LAZY. This is a production system. Generate COMPREHENSIVE, MULTI-FACETED output.
`;

    const fullPrompt = `${systemPrompt}${historyContext}

User question: ${query}

${planningInstructions}

ABSOLUTELY CRITICAL - READ CAREFULLY:
You MUST respond with ONLY a valid JSON object. 
NO markdown. NO explanatory text. NO ** formatting. NO text before or after the JSON.
Start your response with { and end with }

The JSON structure MUST be exactly:
{
  "thoughtProcess": [
    "OBJECTIVE: ...",
    "DATA VALIDATION: ...",
    "DATA TRANSFORMATION: ...",
    "ANALYSIS: ...",
    "VISUALIZATION: ..."
  ],
  "sections": [
    {"type": "kpi_grid", "kpis": [{"title": "...", "value": "...", "trend": "up"}]},
    {"type": "code", "title": "Analysis Code", "language": "python", "code": "import pandas as pd\\n...", "codeExplanation": "...", "codeSteps": ["Step 1", "Step 2"]},
    {"type": "paragraph", "content": "Detailed analysis text here..."},
    {"type": "chart", "chartType": "bar", "title": "Chart Title", "data": {"labels": ["A", "B"], "values": [10, 20]}},
    {"type": "table", "title": "Data Table", "tableData": {"columns": ["Col1", "Col2"], "rows": [{"Col1": "val1", "Col2": "val2"}]}},
    {"type": "insight", "title": "Key Finding", "content": "Insight text...", "priority": "high"}
  ],
  "suggestions": ["Follow-up question 1", "Follow-up question 2"]
}

RESPOND WITH ONLY THE JSON OBJECT. NO OTHER TEXT.`;


    try {
      const aiResponse = await this.callAI(fullPrompt);
      console.log('[LabIQAI] Raw AI Response length:', aiResponse.length);

      const parsed = this.parseJSON<{ sections: AISection[], suggestions?: string[], thoughtProcess?: string[] }>(aiResponse);

      // Build sections - use parsed if available, otherwise create clean fallback
      let sections: AISection[] = [];

      if (parsed?.sections && parsed.sections.length > 0) {
        sections = parsed.sections;
        console.log('[LabIQAI] Parsed sections:', sections.length);
      } else {
        // Create a clean paragraph fallback - DO NOT show raw JSON
        console.warn('[LabIQAI] JSON parsing failed, creating clean fallback');

        // Try to extract meaningful text from response
        let cleanText = aiResponse;

        // Remove JSON-like content
        cleanText = cleanText.replace(/```[\s\S]*?```/g, '');
        cleanText = cleanText.replace(/\{[\s\S]*?\}/g, '');
        cleanText = cleanText.replace(/\[[\s\S]*?\]/g, '');
        cleanText = cleanText.replace(/"[^"]+"\s*:/g, '');
        cleanText = cleanText.trim();

        if (cleanText.length < 50) {
          cleanText = 'Analysis complete. The AI processed your query but the response format was unexpected. Please try rephrasing your question.';
        }

        sections = [{
          type: 'paragraph',
          content: cleanText
        }];
      }

      // Inject thought process into sections if available at root
      if (parsed?.thoughtProcess && parsed.thoughtProcess.length > 0) {
        sections.unshift({
          type: 'thought_process',
          items: parsed.thoughtProcess
        });
      }

      return {
        success: true,
        content: 'Analysis complete',
        sections: sections,
        suggestions: parsed?.suggestions || [],
        computedData,
      };
    } catch (error) {
      return {
        success: false,
        content: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'} `,
      };
    }
  }

  private async computeDataStatistics(datasetId: string): Promise<ComputedData> {
    const cacheKey = this.cache.generateKey('stats', datasetId);
    const cached = this.cache.get<ComputedData>(cacheKey);
    if (cached) return cached;

    try {
      // Fetch dataset metadata
      const { data: dataset, error: datasetError } = await supabase
        .from('datasets')
        .select('name, description, row_count, column_count, file_name')
        .eq('id', datasetId)
        .single();

      if (datasetError || !dataset) {
        console.error('Error fetching dataset:', datasetError);
        return { statistics: this.getEmptyStats() };
      }

      // Fetch columns from dataset_columns table
      const { data: columnData, error: columnsError } = await supabase
        .from('dataset_columns')
        .select('column_name, data_type, unique_values_count, stats')
        .eq('dataset_id', datasetId)
        .order('column_index', { ascending: true });

      if (columnsError) {
        console.error('Error fetching columns:', columnsError);
      }

      // Build statistics from available metadata
      const columns: ColumnStats[] = (columnData || []).map((col: any) => ({
        name: col.column_name || 'unknown',
        type: this.mapDataType(col.data_type),
        count: dataset.row_count || 0,
        unique: col.unique_values_count || 0,
        missing: 0,
        mean: col.stats?.mean,
        median: col.stats?.median,
        stdDev: col.stats?.std,
        min: col.stats?.min,
        max: col.stats?.max,
      }));

      const statistics: DataStatistics = {
        rowCount: dataset.row_count || 0,
        columnCount: dataset.column_count || columns.length,
        columns,
        missingValues: 0,
        duplicateRows: 0,
      };

      const result: ComputedData = { statistics };
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error computing statistics:', error);
      return { statistics: this.getEmptyStats() };
    }
  }

  private mapDataType(dbType: string): 'numeric' | 'categorical' | 'datetime' | 'text' {
    const type = (dbType || '').toLowerCase();
    if (['number', 'integer', 'float', 'double', 'numeric', 'bigint', 'decimal'].includes(type)) return 'numeric';
    if (['date', 'datetime', 'timestamp', 'time'].includes(type)) return 'datetime';
    if (['category', 'categorical', 'enum', 'boolean'].includes(type)) return 'categorical';
    return 'text';
  }

  private inferColumnType(col: any): 'numeric' | 'categorical' | 'datetime' | 'text' {
    if (typeof col === 'object' && col.type) {
      const type = col.type.toLowerCase();
      if (['number', 'integer', 'float', 'double', 'numeric'].includes(type)) return 'numeric';
      if (['date', 'datetime', 'timestamp'].includes(type)) return 'datetime';
      if (['category', 'categorical', 'enum'].includes(type)) return 'categorical';
    }
    return 'text';
  }

  private getEmptyStats(): DataStatistics {
    return {
      rowCount: 0,
      columnCount: 0,
      columns: [],
      missingValues: 0,
      duplicateRows: 0,
    };
  }

  private buildDataContext(data: ComputedData): string {
    if (!data.statistics) return 'No data available.';

    const stats = data.statistics;
    let context = `COMPUTED DATA(Real values - do not hallucinate):
    - Total Rows: ${stats.rowCount}
    - Total Columns: ${stats.columnCount}
    - Missing Values: ${stats.missingValues}

    Columns:
${stats.columns.map(c => `  - ${c.name} (${c.type}): ${c.count} values, ${c.unique} unique${c.mean !== undefined ? `, mean=${c.mean.toFixed(2)}` : ''}`).join('\n')} `;

    if (data.correlations) {
      context += `\n\nCorrelations computed between numeric columns.`;
    }

    if (data.outliers && data.outliers.length > 0) {
      context += `\n\nOutliers detected in ${data.outliers.length} columns.`;
    }

    return context;
  }

  private getSystemPrompt(mode: string, dataContext: string, isPlanningMode: boolean = false): string {
    // Domain-specific prompts for biotech, clinical, biopharma
    const domainPrompts: Record<string, string> = {
      biotech: `You are LabIQ Health's Biotech Data Analysis Expert specializing in:
      - Genomics: DNA / RNA sequences, gene expression, SNP analysis, variant calling
        - Proteomics: Protein structure, mass spectrometry, post - translational modifications
          - Cell Biology: Cell culture, viability assays, flow cytometry analysis
            - Bioprocessing: Fermentation, bioreactor optimization, yield analysis

Key biotech metrics: Fold change, log2 ratios, Phred quality scores, FDR - corrected p - values.
Normalization methods: TPM, FPKM, CPM for expression data.`,

      clinical: `You are LabIQ Health's Clinical Data Analysis Expert specializing in:
      - Patient Outcomes: Survival analysis, readmission prediction, mortality risk
        - Laboratory Values: Reference ranges, critical values, trends
          - Vital Signs: Blood pressure, heart rate, temperature, SpO2
            - Treatment Response: Efficacy endpoints, adverse events, drug interactions

Clinical Reference Ranges:
    - Glucose(fasting): 70 - 100 mg / dL
      - Blood Pressure: <120/80 mmHg (normal), >140/90 mmHg(hypertension)
        - HbA1c: <5.7% (normal), 5.7 - 6.4 % (prediabetic), ≥6.5 % (diabetic)
          - eGFR: > 90 mL / min / 1.73m² (normal kidney function)
    - BMI: 18.5 - 24.9(normal)

Always flag values outside normal ranges and note clinical significance.`,

      biopharma: `You are LabIQ Health's Biopharma & Drug Development Expert specializing in:
      - Drug Discovery: Hit identification, lead optimization, SAR analysis
        - ADME / Tox: Absorption, distribution, metabolism, excretion, toxicity
          - Pharmacokinetics: Cmax, Tmax, AUC, half - life, clearance, bioavailability
            - Clinical Trials: Endpoint analysis, safety monitoring, efficacy assessment

    Drug - Likeness(Lipinski's Rule): MW≤500, LogP≤5, HBD≤5, HBA≤10
Potency: IC50 < 100 nM(highly potent)
Safety: hERG IC50 > 30 μM(low cardiac risk)`,

      chemistry: `You are LabIQ Health's Laboratory Chemistry Expert specializing in:
    - Analytical Chemistry: Chromatography(HPLC, GC), spectroscopy(NMR, MS, IR)
    - Synthesis: Reaction optimization, yield improvement, purity assessment
    - Quality Control: Method validation, stability studies, batch analysis
    - Process Chemistry: Scale - up considerations, process parameters`,
    };

    const modeInstructions: Record<string, string> = {
      analysis: `You are LabIQ Health's data analysis assistant for biotech, clinical, and health sector data.
Provide statistical insights, identify patterns specific to the domain, and explain data characteristics.
Focus on accuracy, clinical / biological relevance, and actionable insights.
      ${domainPrompts.clinical}
${domainPrompts.biotech}`,
      automl: `You are LabIQ Health's machine learning assistant specialized for biotech and healthcare data.
Recommend domain - appropriate algorithms, explain model selection for clinical / biological data,
      suggest feature engineering relevant to health sciences, and interpret results in medical / scientific context.
For clinical data: Prefer interpretable models(Logistic Regression, Decision Trees) for patient outcomes.
For biotech data: Consider specialized tools(DESeq2, edgeR) for expression analysis.
For biopharma: Include QSAR models and structure - activity analysis.`,
      educator: `You are LabIQ Health's data science educator for healthcare and life sciences.
Explain concepts clearly with medical / biological examples, use clinical analogies,
      and help users understand data analysis principles in the context of health research.
Ensure explanations are accessible to researchers who may not have ML backgrounds.`,
    };

    return `${modeInstructions[mode] || modeInstructions.analysis}

${dataContext} `;
  }
}

// =============================================================================
// EXPERIMENT SUGGESTION AGENT
// =============================================================================

class ExperimentAgent extends BaseAIAgent {
  constructor(cache: CacheManager) {
    super('Experiment', cache);
  }

  async process(
    datasetId: string,
    experimentType?: string,
    existingConfig?: Record<string, any>
  ): Promise<AIResponse> {
    // Fetch dataset info for context
    const { data: dataset } = await supabase
      .from('datasets')
      .select('name, description, row_count')
      .eq('id', datasetId)
      .single();

    const { data: columnsData } = await supabase
      .from('dataset_columns')
      .select('column_name')
      .eq('dataset_id', datasetId);

    const prompt = `You are LabIQ Health's experiment configuration assistant.

Dataset: ${dataset?.name || 'Unknown'}
Description: ${dataset?.description || 'No description'}
Columns: ${JSON.stringify(columnsData?.map((c: any) => c.column_name) || [])}
Row Count: ${dataset?.row_count || 0}
${experimentType ? `Experiment Type: ${experimentType}` : ''}
${existingConfig ? `Current Config: ${JSON.stringify(existingConfig)}` : ''}

Generate intelligent experiment suggestions.Return JSON:
    {
      "name": "Suggested experiment name",
        "description": "Detailed description of what this experiment will analyze and why",
          "hypothesis": "What we expect to find or test",
            "methodology": "Step-by-step approach",
              "targetColumn": "recommended target variable if applicable",
                "features": ["recommended feature columns"],
                  "parameters": {
        "key": "value"
      },
      "expectedOutcomes": ["What results to expect"],
        "risks": ["Potential issues to watch for"]
    } `;

    try {
      const response = await this.callAI(prompt);
      const parsed = this.parseJSON<Record<string, any>>(response);

      return {
        success: true,
        content: parsed?.description || response,
        metadata: parsed || {},
      };
    } catch (error) {
      return {
        success: false,
        content: `Failed to generate suggestions: ${error instanceof Error ? error.message : 'Unknown error'} `,
      };
    }
  }

  async suggestDescription(name: string, datasetInfo?: string): Promise<string> {
    const prompt = `Generate a professional, concise experiment description(2 - 3 sentences) for:
      Name: ${name}
${datasetInfo ? `Dataset context: ${datasetInfo}` : ''}

Return only the description text, no JSON.`;

    try {
      return await this.callAI(prompt);
    } catch {
      return '';
    }
  }
}

// =============================================================================
// BOTTLENECK DETECTION AGENT
// =============================================================================

class BottleneckAgent extends BaseAIAgent {
  constructor(cache: CacheManager) {
    super('Bottleneck', cache);
  }

  async process(
    metrics: {
      processingTime?: number;
      memoryUsage?: number;
      cpuUsage?: number;
      queryCount?: number;
      errorRate?: number;
      dataSize?: number;
    },
    context?: string
  ): Promise<AIResponse> {
    const prompt = `You are LabIQ Health's performance analysis agent. Analyze these metrics for bottlenecks:

    Metrics:
    - Processing Time: ${metrics.processingTime ?? 'N/A'} ms
      - Memory Usage: ${metrics.memoryUsage ?? 'N/A'}%
        - CPU Usage: ${metrics.cpuUsage ?? 'N/A'}%
          - Query Count: ${metrics.queryCount ?? 'N/A'}
    - Error Rate: ${metrics.errorRate ?? 'N/A'}%
      - Data Size: ${metrics.dataSize ?? 'N/A'} MB

${context ? `Context: ${context}` : ''}

Identify bottlenecks and provide actionable recommendations.Return JSON:
    {
      "bottlenecks": [
        {
          "type": "memory|cpu|io|query|network",
          "severity": "low|medium|high|critical",
          "description": "What's causing the issue",
          "impact": "How it affects performance",
          "recommendation": "How to fix it"
        }
      ],
        "overallHealth": "good|warning|critical",
          "prioritizedActions": ["Action 1", "Action 2"],
            "estimatedImprovement": "Expected improvement after fixes"
    } `;

    try {
      const response = await this.callAI(prompt);
      const parsed = this.parseJSON<Record<string, any>>(response);

      const sections: AISection[] = [];

      if (parsed?.overallHealth) {
        sections.push({
          type: 'metric',
          title: 'System Health',
          value: parsed.overallHealth,
          trend: parsed.overallHealth === 'good' ? 'up' : 'down',
        });
      }

      if (parsed?.bottlenecks) {
        for (const bottleneck of parsed.bottlenecks) {
          sections.push({
            type: 'insight',
            title: `${bottleneck.type.toUpperCase()} Bottleneck`,
            content: bottleneck.description,
            priority: bottleneck.severity,
          });
          sections.push({
            type: 'recommendation',
            title: 'Fix',
            content: bottleneck.recommendation,
          });
        }
      }

      if (parsed?.prioritizedActions) {
        sections.push({
          type: 'list',
          title: 'Prioritized Actions',
          items: parsed.prioritizedActions,
        });
      }

      return {
        success: true,
        content: 'Bottleneck analysis complete',
        sections,
        metadata: parsed || {},
      };
    } catch (error) {
      return {
        success: false,
        content: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'} `,
      };
    }
  }
}

// =============================================================================
// PREDICTIVE INSIGHT AGENT
// =============================================================================

class PredictiveInsightAgent extends BaseAIAgent {
  constructor(cache: CacheManager) {
    super('PredictiveInsight', cache);
  }

  async process(
    historicalData: { date: string; value: number }[],
    metricName: string,
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<AIResponse> {
    // Compute trend from historical data
    const trend = this.computeTrend(historicalData);
    const prediction = this.computePrediction(historicalData, timeframe);

    const prompt = `You are LabIQ Health's predictive analytics agent.

    Metric: ${metricName}
Historical Data Points: ${historicalData.length}
Computed Trend: ${trend.direction} (${trend.changePercent.toFixed(1)}% change)
    Timeframe: ${timeframe}

Based on the computed trend, provide insights.Return JSON:
    {
      "prediction": {
        "value": ${prediction.value.toFixed(2)},
        "confidence": ${prediction.confidence.toFixed(2)},
        "range": { "low": ${prediction.low.toFixed(2)}, "high": ${prediction.high.toFixed(2)} }
      },
      "insight": "Explanation of what this means",
        "factors": ["Factor 1", "Factor 2"],
          "recommendations": ["Action 1", "Action 2"],
            "risks": ["Risk 1"]
    } `;

    try {
      const response = await this.callAI(prompt);
      const parsed = this.parseJSON<Record<string, any>>(response);

      const sections: AISection[] = [
        {
          type: 'metric',
          title: `Predicted ${metricName} `,
          value: parsed?.prediction?.value ?? prediction.value.toFixed(2),
          trend: trend.direction === 'increasing' ? 'up' : trend.direction === 'decreasing' ? 'down' : 'stable',
        },
        {
          type: 'paragraph',
          content: parsed?.insight || `Based on historical trends, ${metricName} is expected to ${trend.direction === 'increasing' ? 'increase' : trend.direction === 'decreasing' ? 'decrease' : 'remain stable'}.`,
        },
      ];

      if (parsed?.recommendations) {
        sections.push({
          type: 'list',
          title: 'Recommendations',
          items: parsed.recommendations,
        });
      }

      return {
        success: true,
        content: 'Prediction complete',
        sections,
        computedData: {
          predictions: [{
            metric: metricName,
            currentValue: historicalData[historicalData.length - 1]?.value || 0,
            predictedValue: prediction.value,
            confidence: prediction.confidence,
            timeframe,
            trend: trend.direction === 'increasing' ? 'up' : trend.direction === 'decreasing' ? 'down' : 'stable',
          }],
          trends: [trend],
        },
      };
    } catch (error) {
      return {
        success: false,
        content: `Prediction failed: ${error instanceof Error ? error.message : 'Unknown error'} `,
      };
    }
  }

  private computeTrend(data: { date: string; value: number }[]): TrendResult {
    if (data.length < 2) {
      return { column: '', direction: 'stable', changePercent: 0, significance: 0 };
    }

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const avgFirst = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;

    const changePercent = avgFirst !== 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

    let direction: 'increasing' | 'decreasing' | 'stable' | 'volatile' = 'stable';
    if (changePercent > 5) direction = 'increasing';
    else if (changePercent < -5) direction = 'decreasing';

    // Calculate volatility
    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const cv = mean !== 0 ? (Math.sqrt(variance) / mean) * 100 : 0;

    if (cv > 30) direction = 'volatile';

    return {
      column: '',
      direction,
      changePercent,
      significance: Math.min(Math.abs(changePercent) / 10, 1),
    };
  }

  private computePrediction(
    data: { date: string; value: number }[],
    timeframe: string
  ): { value: number; confidence: number; low: number; high: number } {
    if (data.length < 3) {
      const lastValue = data[data.length - 1]?.value || 0;
      return { value: lastValue, confidence: 0.5, low: lastValue * 0.9, high: lastValue * 1.1 };
    }

    // Simple linear regression prediction
    const n = data.length;
    const xSum = (n * (n - 1)) / 2;
    const ySum = data.reduce((sum, d) => sum + d.value, 0);
    const xySum = data.reduce((sum, d, i) => sum + i * d.value, 0);
    const xxSum = data.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;

    const periods = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
    const predictedValue = intercept + slope * (n + periods);

    // Calculate confidence based on R-squared
    const yMean = ySum / n;
    const ssRes = data.reduce((sum, d, i) => {
      const predicted = intercept + slope * i;
      return sum + Math.pow(d.value - predicted, 2);
    }, 0);
    const ssTot = data.reduce((sum, d) => sum + Math.pow(d.value - yMean, 2), 0);
    const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

    const confidence = Math.max(0.3, Math.min(0.95, rSquared));
    const margin = predictedValue * (1 - confidence) * 0.5;

    return {
      value: Math.max(0, predictedValue),
      confidence,
      low: Math.max(0, predictedValue - margin),
      high: predictedValue + margin,
    };
  }
}

// =============================================================================
// QUICK INSIGHT AGENT (for dashboard widgets)
// =============================================================================

class QuickInsightAgent extends BaseAIAgent {
  constructor(cache: CacheManager) {
    super('QuickInsight', cache);
  }

  async process(
    context: string,
    type: 'eta' | 'summary' | 'recommendation' | 'anomaly'
  ): Promise<AIResponse> {
    const prompts: Record<string, string> = {
      eta: `Based on this context, provide a brief ETA prediction(1 - 2 sentences): ${context} `,
      summary: `Summarize this data in 2 - 3 bullet points: ${context} `,
      recommendation: `Provide 1 - 2 actionable recommendations based on: ${context} `,
      anomaly: `Identify any anomalies or unusual patterns in: ${context} `,
    };

    try {
      const response = await this.callAI(prompts[type] || prompts.summary);
      return {
        success: true,
        content: response.trim(),
      };
    } catch (error) {
      return {
        success: false,
        content: '',
      };
    }
  }
}

// =============================================================================
// PERFORMANCE MONITOR
// =============================================================================

interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  cached: boolean;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 1000;

  record(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    this.metrics.push({ ...metric, timestamp: Date.now() });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getAverageLatency(operation?: string): number {
    const filtered = operation
      ? this.metrics.filter((m) => m.operation === operation)
      : this.metrics;

    if (filtered.length === 0) return 0;

    return filtered.reduce((sum, m) => sum + m.duration, 0) / filtered.length;
  }

  getSuccessRate(operation?: string): number {
    const filtered = operation
      ? this.metrics.filter((m) => m.operation === operation)
      : this.metrics;

    if (filtered.length === 0) return 1;

    return filtered.filter((m) => m.success).length / filtered.length;
  }

  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.filter((m) => m.cached).length / this.metrics.length;
  }

  getSummary(): Record<string, any> {
    const operations = [...new Set(this.metrics.map((m) => m.operation))];

    return {
      totalRequests: this.metrics.length,
      averageLatency: this.getAverageLatency(),
      successRate: this.getSuccessRate(),
      cacheHitRate: this.getCacheHitRate(),
      byOperation: Object.fromEntries(
        operations.map((op) => [
          op,
          {
            count: this.metrics.filter((m) => m.operation === op).length,
            avgLatency: this.getAverageLatency(op),
            successRate: this.getSuccessRate(op),
          },
        ])
      ),
    };
  }

  clear(): void {
    this.metrics = [];
  }
}

// =============================================================================
// MAIN LabIQ Health AI CLASS (Singleton Facade)
// =============================================================================

export class LabIQAI {
  private static instance: LabIQAI;
  private cache: CacheManager;
  private monitor: PerformanceMonitor;

  // Agents
  public dataAnalysis: DataAnalysisAgent;
  public experiment: ExperimentAgent;
  public bottleneck: BottleneckAgent;
  public predictive: PredictiveInsightAgent;
  public quickInsight: QuickInsightAgent;

  private constructor() {
    this.cache = new CacheManager();
    this.monitor = new PerformanceMonitor();
    this.dataAnalysis = new DataAnalysisAgent(this.cache);
    this.experiment = new ExperimentAgent(this.cache);
    this.bottleneck = new BottleneckAgent(this.cache);
    this.predictive = new PredictiveInsightAgent(this.cache);
    this.quickInsight = new QuickInsightAgent(this.cache);

    // Set up automatic cache pruning every 5 minutes
    if (typeof window !== 'undefined') {
      setInterval(() => this.cache.prune(), 5 * 60 * 1000);
    }
  }

  public static getInstance(): LabIQAI {
    if (!LabIQAI.instance) {
      LabIQAI.instance = new LabIQAI();
    }
    return LabIQAI.instance;
  }

  /**
   * Check if AI is configured and available
   */
  public isAvailable(): boolean {
    return getActiveProvider() !== null;
  }

  /**
   * Get the currently active provider
   */
  public getActiveProvider(): string | null {
    const provider = getActiveProvider();
    return provider?.name || null;
  }

  /**
   * Get all configured providers
   */
  public getConfiguredProviders(): Array<{ name: string; enabled: boolean; priority: number }> {
    return Object.values(PROVIDERS).map(p => ({
      name: p.name,
      enabled: p.enabled && !!p.apiKey,
      priority: p.priority,
    }));
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): ReturnType<CacheManager['getStats']> {
    return this.cache.getStats();
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): ReturnType<PerformanceMonitor['getSummary']> {
    return this.monitor.getSummary();
  }

  /**
   * Quick helper for generating descriptions with performance tracking
   */
  public async generateDescription(
    type: 'experiment' | 'dataset' | 'workflow',
    name: string,
    context?: string
  ): Promise<string> {
    const startTime = Date.now();
    const cacheKey = this.cache.generateKey('description', type, name, context);

    try {
      // Use getOrFetch for deduplication
      const result = await this.cache.getOrFetch(cacheKey, async () => {
        const prompts: Record<string, string> = {
          experiment: `Generate a professional 2 - 3 sentence description for an experiment named "${name}".${context || ''} `,
          dataset: `Generate a professional 1 - 2 sentence description for a dataset named "${name}".${context || ''} `,
          workflow: `Generate a professional 2 - 3 sentence description for an automation workflow named "${name}".${context || ''} `,
        };

        const response = await this.quickInsight['callAI'](prompts[type] || prompts.experiment);
        return response.trim();
      });

      this.monitor.record({
        operation: 'generateDescription',
        duration: Date.now() - startTime,
        success: true,
        cached: Date.now() - startTime < 50, // If too fast, likely cached
      });

      return result;
    } catch (error) {
      this.monitor.record({
        operation: 'generateDescription',
        duration: Date.now() - startTime,
        success: false,
        cached: false,
      });
      return '';
    }
  }

  /**
   * Batch process multiple AI requests efficiently
   */
  public async batchProcess<T>(
    requests: Array<{ key: string; processor: () => Promise<T> }>
  ): Promise<Map<string, T | Error>> {
    const results = new Map<string, T | Error>();

    // Process in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks: Array<typeof requests> = [];

    for (let i = 0; i < requests.length; i += concurrencyLimit) {
      chunks.push(requests.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async ({ key, processor }) => {
        try {
          const result = await processor();
          results.set(key, result);
        } catch (error) {
          results.set(key, error as Error);
        }
      });

      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Health check for AI service
   */
  public async healthCheck(): Promise<{
    available: boolean;
    latency: number | null;
    cacheStats: ReturnType<CacheManager['getStats']>;
    performanceStats: ReturnType<PerformanceMonitor['getSummary']>;
  }> {
    const startTime = Date.now();
    let latency: number | null = null;

    if (this.isAvailable()) {
      try {
        await this.quickInsight['callAI']('Say "OK"');
        latency = Date.now() - startTime;
      } catch {
        latency = null;
      }
    }

    return {
      available: this.isAvailable() && latency !== null,
      latency,
      cacheStats: this.getCacheStats(),
      performanceStats: this.getPerformanceMetrics(),
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Singleton instance
export const labIQAI = LabIQAI.getInstance();

// Convenience functions
export const analyzeData = (datasetId: string, query: string, mode?: 'analysis' | 'automl' | 'educator') =>
  labIQAI.dataAnalysis.process(datasetId, query, mode);

export const suggestExperiment = (datasetId: string, type?: string) =>
  labIQAI.experiment.process(datasetId, type);

export const detectBottlenecks = (metrics: Parameters<BottleneckAgent['process']>[0]) =>
  labIQAI.bottleneck.process(metrics);

export const predictMetric = (data: { date: string; value: number }[], name: string, timeframe?: 'day' | 'week' | 'month') =>
  labIQAI.predictive.process(data, name, timeframe);

export const generateDescription = (type: 'experiment' | 'dataset' | 'workflow', name: string, context?: string) =>
  labIQAI.generateDescription(type, name, context);
