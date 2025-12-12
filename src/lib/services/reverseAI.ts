/**
 * Reverse Engineer AI Service
 * Google-grade implementation for target output generation
 *
 * This service uses Gemini AI to:
 * - Analyze datasets and create interesting analysis targets
 * - Generate visualizations/metrics users must recreate
 * - Validate user's solution against target
 * - Provide intelligent feedback
 */

import { supabase } from '@/integrations/supabase/client';

interface ReverseTarget {
  target_id: string;
  type: 'visualization' | 'metrics' | 'table' | 'correlation';
  description: string;
  target_output: {
    type: string;
    data: any;
    config?: any; // Chart configuration if visualization
  };
  solution: {
    approach: string;
    code_python: string;
    code_sql: string;
    steps: string[];
  };
  difficulty_indicators: {
    requires_grouping: boolean;
    requires_aggregation: boolean;
    requires_joins: boolean;
    requires_window_functions: boolean;
    complexity_score: number;
  };
  validation_rules: {
    exact_match_required: boolean;
    tolerance: number;
    key_checks: string[];
  };
}

interface ReverseChallenge {
  challenge_id: string;
  dataset_info: any;
  target: ReverseTarget;
  hints: {
    level: number;
    hint: string;
    cost: number;
  }[];
  difficulty_actual: number;
  estimated_time_minutes: number;
}

interface ReverseValidationResult {
  matches_target: boolean;
  similarity_score: number; // 0-1
  differences: string[];
  feedback: string[];
  approach_quality: number; // How elegant/efficient the solution is
}

export class ReverseAI {
  private apiKey: string;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Gemini API key not configured for ReverseAI');
    }
  }

  /**
   * Generate a reverse engineering challenge
   */
  async generateChallenge(
    dataset: any,
    userIQ: number,
    userId: string
  ): Promise<ReverseChallenge> {
    try {
      // Step 1: Analyze dataset to find interesting patterns
      const datasetAnalysis = await this.analyzeDatasetForTargets(dataset);

      // Step 2: Generate target based on IQ level
      const target = await this.generateTarget(dataset, datasetAnalysis, userIQ);

      // Step 3: Generate hints
      const hints = await this.generateHints(target, userIQ);

      // Step 4: Create challenge
      const challenge: ReverseChallenge = {
        challenge_id: crypto.randomUUID(),
        dataset_info: {
          name: dataset.name,
          columns: Object.keys(dataset.data[0] || {}),
          row_count: dataset.data.length,
        },
        target,
        hints,
        difficulty_actual: userIQ,
        estimated_time_minutes: this.estimateTime(userIQ, target.difficulty_indicators.complexity_score),
      };

      // Step 5: Log generation
      await this.logChallengeGeneration(challenge, userId);

      return challenge;
    } catch (error) {
      console.error('Error generating reverse challenge:', error);
      throw new Error(`Failed to generate reverse challenge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze dataset to find patterns and interesting targets
   */
  private async analyzeDatasetForTargets(dataset: any): Promise<any> {
    const data = dataset.data || [];
    if (data.length === 0) {
      throw new Error('Dataset is empty');
    }

    const columns = Object.keys(data[0]);
    const analysis: any = {
      numeric_columns: [],
      categorical_columns: [],
      date_columns: [],
      potential_aggregations: [],
      potential_groupings: [],
      correlations: [],
    };

    // Identify column types and find interesting patterns
    for (const col of columns) {
      const values = data.map((row: any) => row[col]).filter((v: any) => v != null);
      const sampleValue = values[0];

      if (typeof sampleValue === 'number') {
        analysis.numeric_columns.push(col);
        // Suggest aggregations
        analysis.potential_aggregations.push({
          column: col,
          operations: ['sum', 'average', 'min', 'max', 'count'],
        });
      } else {
        // Check cardinality for grouping potential
        const uniqueValues = new Set(values);
        if (uniqueValues.size < values.length * 0.3 && uniqueValues.size > 1) {
          analysis.categorical_columns.push(col);
          analysis.potential_groupings.push(col);
        }

        if (this.isDate(sampleValue)) {
          analysis.date_columns.push(col);
        }
      }
    }

    // Find correlations between numeric columns
    if (analysis.numeric_columns.length >= 2) {
      for (let i = 0; i < analysis.numeric_columns.length - 1; i++) {
        for (let j = i + 1; j < analysis.numeric_columns.length; j++) {
          const col1 = analysis.numeric_columns[i];
          const col2 = analysis.numeric_columns[j];
          const correlation = this.calculateCorrelation(data, col1, col2);
          if (Math.abs(correlation) > 0.5) {
            analysis.correlations.push({ col1, col2, correlation });
          }
        }
      }
    }

    return analysis;
  }

  /**
   * Generate target output user must recreate
   */
  private async generateTarget(
    dataset: any,
    analysis: any,
    userIQ: number
  ): Promise<ReverseTarget> {
    const prompt = `You are a data analyst creating a reverse engineering challenge.

DATASET INFO:
${JSON.stringify({
  columns: Object.keys(dataset.data[0] || {}),
  row_count: dataset.data.length,
  numeric_columns: analysis.numeric_columns,
  categorical_columns: analysis.categorical_columns,
  potential_groupings: analysis.potential_groupings,
}, null, 2)}

USER IQ: ${userIQ}

DIFFICULTY GUIDE:
- 800-1000: Simple aggregation (total, average) by one dimension
- 1000-1200: Multiple aggregations, 2-3 dimensions
- 1200-1400: Complex aggregations, calculated fields, filtering
- 1400+: Window functions, multiple joins, advanced analytics

TASK: Create an analysis target that the user must recreate.

TARGET TYPES (choose most appropriate):
1. metrics: Key statistics (e.g., "Total sales by category")
2. visualization: Bar chart, line chart, scatter plot
3. table: Pivot table or aggregated data table
4. correlation: Correlation analysis between variables

RETURN JSON:
{
  "type": "metrics|visualization|table|correlation",
  "description": "Clear description of what to create",
  "target_output": {
    "type": "specific_chart_type or metric_type",
    "data": {
      "labels": ["Category A", "Category B"],
      "values": [100, 200]
    },
    "config": {
      "chart_type": "bar",
      "x_axis": "category",
      "y_axis": "value"
    }
  },
  "solution": {
    "approach": "High-level strategy",
    "code_python": "Complete Python solution using pandas",
    "code_sql": "Complete SQL solution",
    "steps": ["Step 1", "Step 2", "Step 3"]
  },
  "difficulty_indicators": {
    "requires_grouping": true,
    "requires_aggregation": true,
    "requires_joins": false,
    "requires_window_functions": false,
    "complexity_score": 5
  },
  "validation_rules": {
    "exact_match_required": false,
    "tolerance": 0.01,
    "key_checks": ["check values sum correctly", "check labels match"]
  }
}

Make it realistic and educational. Return ONLY valid JSON.`;

    try {
      const response = await this.callGeminiAPI(prompt);
      const parsed = JSON.parse(this.cleanJSONResponse(response));

      // Enhance with unique ID
      parsed.target_id = crypto.randomUUID();

      return parsed as ReverseTarget;
    } catch (error) {
      console.error('AI target generation failed, using fallback:', error);
      return this.getFallbackTarget(analysis, userIQ);
    }
  }

  /**
   * Generate progressive hints
   */
  private async generateHints(target: ReverseTarget, userIQ: number): Promise<any[]> {
    const prompt = `Generate 3 progressive hints for recreating this analysis:

TARGET: ${target.description}
SOLUTION APPROACH: ${target.solution.approach}
USER IQ: ${userIQ}

Create hints that:
1. Level 1 (10 pts): Conceptual direction
2. Level 2 (25 pts): Specific columns/operations needed
3. Level 3 (50 pts): Code structure or SQL pattern

Return JSON array:
[
  {"level": 1, "hint": "...", "cost": 10},
  {"level": 2, "hint": "...", "cost": 25},
  {"level": 3, "hint": "...", "cost": 50}
]`;

    try {
      const response = await this.callGeminiAPI(prompt);
      return JSON.parse(this.cleanJSONResponse(response));
    } catch (error) {
      return this.getFallbackHints(target);
    }
  }

  /**
   * Validate user's solution against target
   */
  async validateSolution(
    target: ReverseTarget,
    userOutput: any,
    userCode: string
  ): Promise<ReverseValidationResult> {
    try {
      // Step 1: Compare outputs
      const similarity = this.calculateSimilarity(target.target_output.data, userOutput);

      // Step 2: Check key validation rules
      const differences = this.findDifferences(
        target.target_output.data,
        userOutput,
        target.validation_rules
      );

      // Step 3: Evaluate code quality
      const approachQuality = await this.evaluateApproachQuality(userCode, target.solution);

      // Step 4: Generate feedback
      const feedback = await this.generateFeedback(
        similarity,
        differences,
        approachQuality,
        target
      );

      const matches = similarity > (1 - target.validation_rules.tolerance);

      return {
        matches_target: matches,
        similarity_score: similarity,
        differences,
        feedback,
        approach_quality: approachQuality,
      };
    } catch (error) {
      console.error('Error validating solution:', error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private cleanJSONResponse(response: string): string {
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/, '').replace(/```\n?$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/, '').replace(/```\n?$/, '');
    }
    return cleaned;
  }

  private isDate(value: any): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private calculateCorrelation(data: any[], col1: string, col2: string): number {
    const values1 = data.map(row => row[col1]).filter(v => typeof v === 'number');
    const values2 = data.map(row => row[col2]).filter(v => typeof v === 'number');

    if (values1.length === 0 || values2.length === 0) return 0;

    const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;

    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < Math.min(values1.length, values2.length); i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      denom1 += diff1 * diff1;
      denom2 += diff2 * diff2;
    }

    if (denom1 === 0 || denom2 === 0) return 0;
    return numerator / Math.sqrt(denom1 * denom2);
  }

  private calculateSimilarity(target: any, user: any): number {
    // Deep comparison of data structures
    const targetStr = JSON.stringify(target);
    const userStr = JSON.stringify(user);

    if (targetStr === userStr) return 1.0;

    // Calculate edit distance similarity
    const maxLen = Math.max(targetStr.length, userStr.length);
    const distance = this.levenshteinDistance(targetStr, userStr);
    return 1 - (distance / maxLen);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private findDifferences(target: any, user: any, rules: any): string[] {
    const differences: string[] = [];

    // Type mismatch
    if (typeof target !== typeof user) {
      differences.push(`Type mismatch: expected ${typeof target}, got ${typeof user}`);
      return differences;
    }

    // Array comparison
    if (Array.isArray(target) && Array.isArray(user)) {
      if (target.length !== user.length) {
        differences.push(`Length mismatch: expected ${target.length} items, got ${user.length}`);
      }
    }

    // Object comparison
    if (typeof target === 'object' && target !== null) {
      const targetKeys = Object.keys(target);
      const userKeys = Object.keys(user || {});

      const missingKeys = targetKeys.filter(k => !userKeys.includes(k));
      const extraKeys = userKeys.filter(k => !targetKeys.includes(k));

      if (missingKeys.length > 0) {
        differences.push(`Missing keys: ${missingKeys.join(', ')}`);
      }
      if (extraKeys.length > 0) {
        differences.push(`Extra keys: ${extraKeys.join(', ')}`);
      }
    }

    return differences;
  }

  private async evaluateApproachQuality(userCode: string, solution: any): Promise<number> {
    // Simple heuristics for code quality
    let score = 0.5; // Base score

    // Check if uses recommended approach
    const keywords = solution.approach.toLowerCase().split(' ');
    for (const keyword of keywords) {
      if (userCode.toLowerCase().includes(keyword)) {
        score += 0.1;
      }
    }

    // Penalize overly complex solutions
    const codeLength = userCode.length;
    const expectedLength = solution.code_python.length;
    if (codeLength > expectedLength * 2) {
      score -= 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  private async generateFeedback(
    similarity: number,
    differences: string[],
    approachQuality: number,
    target: ReverseTarget
  ): Promise<string[]> {
    const feedback: string[] = [];

    if (similarity > 0.95) {
      feedback.push('🎉 Perfect! Your output matches the target exactly!');
    } else if (similarity > 0.85) {
      feedback.push('✅ Very close! Minor differences in the output.');
    } else if (similarity > 0.70) {
      feedback.push('⚠️ Good attempt, but some values are off.');
    } else {
      feedback.push('❌ Output doesn\'t match the target. Review your approach.');
    }

    if (differences.length > 0) {
      feedback.push(`Issues found: ${differences.slice(0, 3).join('; ')}`);
    }

    if (approachQuality > 0.8) {
      feedback.push('💡 Excellent code quality and approach!');
    } else if (approachQuality < 0.5) {
      feedback.push('💡 Consider simplifying your approach.');
    }

    return feedback;
  }

  private getFallbackTarget(analysis: any, userIQ: number): ReverseTarget {
    // Fallback if AI fails
    const numCol = analysis.numeric_columns[0] || 'value';
    const catCol = analysis.categorical_columns[0] || 'category';

    return {
      target_id: crypto.randomUUID(),
      type: 'metrics',
      description: `Calculate the average ${numCol} for each ${catCol}`,
      target_output: {
        type: 'aggregation',
        data: { example: 'data' },
      },
      solution: {
        approach: `Group by ${catCol} and calculate mean of ${numCol}`,
        code_python: `df.groupby('${catCol}')['${numCol}'].mean()`,
        code_sql: `SELECT ${catCol}, AVG(${numCol}) FROM dataset GROUP BY ${catCol}`,
        steps: ['Group data', 'Calculate average', 'Display results'],
      },
      difficulty_indicators: {
        requires_grouping: true,
        requires_aggregation: true,
        requires_joins: false,
        requires_window_functions: false,
        complexity_score: 3,
      },
      validation_rules: {
        exact_match_required: false,
        tolerance: 0.05,
        key_checks: ['Values should be aggregated', 'Grouping should be correct'],
      },
    };
  }

  private getFallbackHints(target: ReverseTarget): any[] {
    return [
      { level: 1, hint: 'Think about how to group and aggregate the data', cost: 10 },
      { level: 2, hint: `Focus on the ${target.description} operation`, cost: 25 },
      { level: 3, hint: `Try this approach: ${target.solution.approach}`, cost: 50 },
    ];
  }

  private estimateTime(userIQ: number, complexity: number): number {
    const baseTime = complexity * 5; // 5 minutes per complexity point
    const skillFactor = 2000 / userIQ;
    return Math.ceil(baseTime * skillFactor);
  }

  private async logChallengeGeneration(challenge: ReverseChallenge, userId: string): Promise<void> {
    try {
      await supabase.from('hackathon_ai_generations').insert({
        user_id: userId,
        generation_type: 'reverse_challenge',
        generated_content: {
          challenge_id: challenge.challenge_id,
          target_type: challenge.target.type,
          difficulty: challenge.difficulty_actual,
        },
        model_used: 'gemini-pro',
      });
    } catch (error) {
      console.error('Failed to log challenge generation:', error);
    }
  }
}

// Singleton
let reverseAI: ReverseAI | null = null;

export function getReverseAI(): ReverseAI {
  if (!reverseAI) {
    reverseAI = new ReverseAI();
  }
  return reverseAI;
}
