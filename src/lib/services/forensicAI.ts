/**
 * Forensic AI Service
 * Google-grade implementation for intelligent data corruption
 *
 * This service uses Gemini AI to:
 * - Analyze dataset structure and content
 * - Inject realistic, difficulty-appropriate errors
 * - Generate progressive hints
 * - Validate user's cleaning solutions
 */

import { supabase } from '@/integrations/supabase/client';

interface DatasetAnalysis {
  numeric_columns: string[];
  text_columns: string[];
  date_columns: string[];
  categorical_columns: string[];
  row_count: number;
  null_percentages: Record<string, number>;
  data_types: Record<string, string>;
}

interface ErrorInjection {
  error_id: string;
  error_type: string;
  column: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affected_rows: number[];
  original_values: any[];
  corrupted_values: any[];
}

interface ForensicChallenge {
  challenge_id: string;
  dataset_snapshot: {
    original_data: any[];
    corrupted_data: any[];
    schema: DatasetAnalysis;
  };
  injected_errors: ErrorInjection[];
  hints: {
    level: 1 | 2 | 3;
    hint: string;
    reveals: string; // What this hint reveals
  }[];
  difficulty_actual: number;
  estimated_time_minutes: number;
  validation_criteria: {
    error_detection_rate: number; // % of errors user must find
    cleaning_accuracy: number; // How accurate the cleaning must be
  };
}

interface ValidationResult {
  detected_errors: string[];
  missed_errors: string[];
  false_positives: string[];
  cleaning_accuracy: number;
  score: number; // 0-1
  feedback: string[];
}

export class ForensicAI {
  private apiKey: string;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Gemini API key not configured for ForensicAI');
    }
  }

  /**
   * Main entry point: Generate a forensic challenge
   */
  async generateChallenge(
    dataset: any,
    userIQ: number,
    userId: string
  ): Promise<ForensicChallenge> {
    try {
      // Step 1: Analyze dataset structure
      const analysis = await this.analyzeDataset(dataset);

      // Step 2: Determine error types based on IQ
      const errorProfile = this.getErrorProfile(userIQ);

      // Step 3: Generate corruption strategy with AI
      const corruptionPlan = await this.generateCorruptionPlan(
        analysis,
        errorProfile,
        userIQ
      );

      // Step 4: Execute corruption
      const corruptedData = await this.executeCorruption(
        dataset.data,
        corruptionPlan
      );

      // Step 5: Generate hints
      const hints = await this.generateHints(corruptionPlan, userIQ);

      // Step 6: Create challenge object
      const challenge: ForensicChallenge = {
        challenge_id: crypto.randomUUID(),
        dataset_snapshot: {
          original_data: dataset.data,
          corrupted_data: corruptedData.data,
          schema: analysis,
        },
        injected_errors: corruptedData.injections,
        hints,
        difficulty_actual: userIQ,
        estimated_time_minutes: this.estimateTime(userIQ, corruptedData.injections.length),
        validation_criteria: {
          error_detection_rate: this.getRequiredDetectionRate(userIQ),
          cleaning_accuracy: this.getRequiredAccuracy(userIQ),
        },
      };

      // Step 7: Log to database for analytics
      await this.logChallengeGeneration(challenge, userId);

      return challenge;
    } catch (error) {
      console.error('Error generating forensic challenge:', error);
      throw new Error(`Failed to generate forensic challenge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze dataset to understand its structure
   */
  private async analyzeDataset(dataset: any): Promise<DatasetAnalysis> {
    const data = dataset.data || [];
    if (data.length === 0) {
      throw new Error('Dataset is empty');
    }

    const firstRow = data[0];
    const columns = Object.keys(firstRow);

    const analysis: DatasetAnalysis = {
      numeric_columns: [],
      text_columns: [],
      date_columns: [],
      categorical_columns: [],
      row_count: data.length,
      null_percentages: {},
      data_types: {},
    };

    // Analyze each column
    columns.forEach((col) => {
      const values = data.map((row: any) => row[col]).filter((v: any) => v != null);
      const nullCount = data.length - values.length;

      analysis.null_percentages[col] = (nullCount / data.length) * 100;

      // Determine type
      if (values.length === 0) {
        analysis.data_types[col] = 'unknown';
        return;
      }

      const sampleValue = values[0];
      if (typeof sampleValue === 'number') {
        analysis.numeric_columns.push(col);
        analysis.data_types[col] = 'numeric';
      } else if (this.isDate(sampleValue)) {
        analysis.date_columns.push(col);
        analysis.data_types[col] = 'date';
      } else {
        // Check if categorical (low cardinality)
        const uniqueValues = new Set(values);
        if (uniqueValues.size < values.length * 0.1) {
          analysis.categorical_columns.push(col);
          analysis.data_types[col] = 'categorical';
        } else {
          analysis.text_columns.push(col);
          analysis.data_types[col] = 'text';
        }
      }
    });

    return analysis;
  }

  /**
   * Get error profile based on user IQ
   */
  private getErrorProfile(userIQ: number): {
    complexity: 'simple' | 'medium' | 'complex' | 'expert';
    error_count: number;
    error_types: string[];
  } {
    if (userIQ < 900) {
      return {
        complexity: 'simple',
        error_count: 3,
        error_types: ['outlier', 'missing_value'],
      };
    } else if (userIQ < 1100) {
      return {
        complexity: 'medium',
        error_count: 5,
        error_types: ['outlier', 'missing_value', 'duplicate', 'format_inconsistency'],
      };
    } else if (userIQ < 1400) {
      return {
        complexity: 'complex',
        error_count: 7,
        error_types: ['outlier', 'missing_value', 'duplicate', 'format_inconsistency', 'encoding_error', 'unit_mismatch'],
      };
    } else {
      return {
        complexity: 'expert',
        error_count: 10,
        error_types: ['outlier', 'missing_value', 'duplicate', 'format_inconsistency', 'encoding_error', 'unit_mismatch', 'subtle_corruption', 'data_drift'],
      };
    }
  }

  /**
   * Use AI to generate corruption plan
   */
  private async generateCorruptionPlan(
    analysis: DatasetAnalysis,
    errorProfile: any,
    userIQ: number
  ): Promise<any> {
    const prompt = `You are a data quality expert designing a forensic data challenge.

DATASET ANALYSIS:
${JSON.stringify(analysis, null, 2)}

USER SKILL LEVEL: IQ ${userIQ} (${errorProfile.complexity})
TARGET ERROR COUNT: ${errorProfile.error_count}
ALLOWED ERROR TYPES: ${errorProfile.error_types.join(', ')}

TASK: Generate a corruption plan that will test the user's data quality skills.

REQUIREMENTS:
1. Errors must be realistic (like real-world data issues)
2. Difficulty must match user IQ level
3. Errors should be discoverable but not obvious
4. Mix different error types for variety

RETURN JSON FORMAT:
{
  "errors": [
    {
      "error_type": "outlier|missing_value|duplicate|format_inconsistency|encoding_error|unit_mismatch|subtle_corruption|data_drift",
      "target_column": "column_name",
      "strategy": "detailed description of how to corrupt",
      "affected_percentage": 0.05,
      "severity": "low|medium|high",
      "detection_difficulty": "easy|medium|hard"
    }
  ],
  "rationale": "Why these errors at this difficulty level"
}

Return ONLY valid JSON, no markdown.`;

    try {
      const response = await this.callGeminiAPI(prompt);
      return JSON.parse(this.cleanJSONResponse(response));
    } catch (error) {
      console.error('AI corruption plan failed, using fallback:', error);
      return this.getFallbackCorruptionPlan(analysis, errorProfile);
    }
  }

  /**
   * Execute corruption based on plan
   */
  private async executeCorruption(
    originalData: any[],
    plan: any
  ): Promise<{ data: any[]; injections: ErrorInjection[] }> {
    const corrupted = JSON.parse(JSON.stringify(originalData)); // Deep clone
    const injections: ErrorInjection[] = [];

    for (const error of plan.errors) {
      const injection = await this.applyError(corrupted, error);
      if (injection) {
        injections.push(injection);
      }
    }

    return { data: corrupted, injections };
  }

  /**
   * Apply specific error type
   */
  private async applyError(data: any[], errorSpec: any): Promise<ErrorInjection | null> {
    const column = errorSpec.target_column;
    const affectedCount = Math.ceil(data.length * errorSpec.affected_percentage);
    const affectedIndices = this.getRandomIndices(data.length, affectedCount);

    const injection: ErrorInjection = {
      error_id: crypto.randomUUID(),
      error_type: errorSpec.error_type,
      column,
      severity: errorSpec.severity,
      description: errorSpec.strategy,
      affected_rows: affectedIndices,
      original_values: [],
      corrupted_values: [],
    };

    for (const idx of affectedIndices) {
      const original = data[idx][column];
      injection.original_values.push(original);

      let corrupted;
      switch (errorSpec.error_type) {
        case 'outlier':
          corrupted = this.generateOutlier(original);
          break;
        case 'missing_value':
          corrupted = null;
          break;
        case 'duplicate':
          // Duplicate with slight variation
          corrupted = this.addNoise(original);
          break;
        case 'format_inconsistency':
          corrupted = this.corruptFormat(original);
          break;
        default:
          corrupted = original;
      }

      injection.corrupted_values.push(corrupted);
      data[idx][column] = corrupted;
    }

    return injection;
  }

  /**
   * Generate progressive hints
   */
  private async generateHints(plan: any, userIQ: number): Promise<any[]> {
    const prompt = `Generate 3 progressive hints for finding these data errors:

${JSON.stringify(plan.errors, null, 2)}

HINT LEVELS:
1. Conceptual hint (10 points cost) - General area to look
2. Specific hint (25 points cost) - Which columns/rows
3. Solution hint (50 points cost) - How to fix

User IQ: ${userIQ}

Return JSON array of hints with structure:
[
  {"level": 1, "hint": "...", "reveals": "..."},
  {"level": 2, "hint": "...", "reveals": "..."},
  {"level": 3, "hint": "...", "reveals": "..."}
]`;

    try {
      const response = await this.callGeminiAPI(prompt);
      return JSON.parse(this.cleanJSONResponse(response));
    } catch (error) {
      return this.getFallbackHints(plan);
    }
  }

  /**
   * Validate user's cleaning solution
   */
  async validateCleaning(
    challenge: ForensicChallenge,
    userCleanedData: any[]
  ): Promise<ValidationResult> {
    const detected: string[] = [];
    const missed: string[] = [];
    const falsePositives: string[] = [];

    // Check each injected error
    for (const injection of challenge.injected_errors) {
      const wasFixed = this.checkIfErrorFixed(
        challenge.dataset_snapshot.original_data,
        userCleanedData,
        injection
      );

      if (wasFixed) {
        detected.push(injection.error_id);
      } else {
        missed.push(injection.error_id);
      }
    }

    // Calculate accuracy
    const detectionRate = detected.length / challenge.injected_errors.length;
    const cleaningAccuracy = this.calculateCleaningAccuracy(
      challenge.dataset_snapshot.original_data,
      userCleanedData
    );

    // Generate feedback
    const feedback = await this.generateFeedback(
      detected,
      missed,
      cleaningAccuracy,
      challenge
    );

    // Calculate final score
    const score = (detectionRate * 0.6) + (cleaningAccuracy * 0.4);

    return {
      detected_errors: detected,
      missed_errors: missed,
      false_positives,
      cleaning_accuracy: cleaningAccuracy * 100,
      score,
      feedback,
    };
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
          temperature: 0.8,
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

  private getRandomIndices(max: number, count: number): number[] {
    const indices: number[] = [];
    while (indices.length < count) {
      const idx = Math.floor(Math.random() * max);
      if (!indices.includes(idx)) {
        indices.push(idx);
      }
    }
    return indices;
  }

  private generateOutlier(value: any): any {
    if (typeof value === 'number') {
      return value * (Math.random() > 0.5 ? 100 : 0.01);
    }
    return value;
  }

  private addNoise(value: any): any {
    if (typeof value === 'string') {
      return value + ' ';
    }
    return value;
  }

  private corruptFormat(value: any): any {
    if (typeof value === 'string' && this.isDate(value)) {
      const date = new Date(value);
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }
    return value;
  }

  private checkIfErrorFixed(
    original: any[],
    cleaned: any[],
    injection: ErrorInjection
  ): boolean {
    // Check if corrupted values were restored to originals
    for (let i = 0; i < injection.affected_rows.length; i++) {
      const rowIdx = injection.affected_rows[i];
      const originalValue = injection.original_values[i];
      const cleanedValue = cleaned[rowIdx]?.[injection.column];

      if (cleanedValue === originalValue || this.isCloseEnough(cleanedValue, originalValue)) {
        return true;
      }
    }
    return false;
  }

  private isCloseEnough(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a === 'number' && typeof b === 'number') {
      return Math.abs(a - b) < 0.01;
    }
    return false;
  }

  private calculateCleaningAccuracy(original: any[], cleaned: any[]): number {
    if (original.length !== cleaned.length) return 0;

    let matches = 0;
    let total = 0;

    for (let i = 0; i < original.length; i++) {
      const origRow = original[i];
      const cleanRow = cleaned[i];

      for (const key in origRow) {
        total++;
        if (this.isCloseEnough(origRow[key], cleanRow[key])) {
          matches++;
        }
      }
    }

    return matches / total;
  }

  private async generateFeedback(
    detected: string[],
    missed: string[],
    accuracy: number,
    challenge: ForensicChallenge
  ): Promise<string[]> {
    const feedback: string[] = [];

    if (detected.length === challenge.injected_errors.length) {
      feedback.push('🎉 Excellent! You found all the errors!');
    } else {
      feedback.push(`You found ${detected.length} out of ${challenge.injected_errors.length} errors.`);
    }

    if (accuracy > 0.95) {
      feedback.push('✅ Your cleaning is highly accurate!');
    } else if (accuracy > 0.80) {
      feedback.push('⚠️ Good cleaning, but some values could be more accurate.');
    } else {
      feedback.push('❌ Some cleaned values are incorrect. Review your approach.');
    }

    return feedback;
  }

  private getFallbackCorruptionPlan(analysis: DatasetAnalysis, errorProfile: any): any {
    // Fallback if AI fails
    return {
      errors: [
        {
          error_type: 'outlier',
          target_column: analysis.numeric_columns[0] || 'value',
          strategy: 'Add extreme outliers',
          affected_percentage: 0.05,
          severity: 'medium',
          detection_difficulty: 'easy',
        },
      ],
      rationale: 'Fallback corruption plan',
    };
  }

  private getFallbackHints(plan: any): any[] {
    return [
      { level: 1, hint: 'Check numeric columns for unusual values', reveals: 'General area' },
      { level: 2, hint: 'Look at the distribution of values', reveals: 'Specific approach' },
      { level: 3, hint: 'Use statistical methods to detect outliers', reveals: 'Solution method' },
    ];
  }

  private getRequiredDetectionRate(userIQ: number): number {
    if (userIQ < 1000) return 0.6;
    if (userIQ < 1200) return 0.75;
    if (userIQ < 1400) return 0.85;
    return 0.95;
  }

  private getRequiredAccuracy(userIQ: number): number {
    if (userIQ < 1000) return 0.7;
    if (userIQ < 1200) return 0.8;
    if (userIQ < 1400) return 0.9;
    return 0.95;
  }

  private estimateTime(userIQ: number, errorCount: number): number {
    const baseTime = errorCount * 3; // 3 minutes per error
    const skillFactor = 2000 / userIQ; // Lower IQ = more time needed
    return Math.ceil(baseTime * skillFactor);
  }

  private async logChallengeGeneration(challenge: ForensicChallenge, userId: string): Promise<void> {
    try {
      await supabase.from('hackathon_ai_generations').insert({
        user_id: userId,
        generation_type: 'forensic_challenge',
        generated_content: {
          challenge_id: challenge.challenge_id,
          error_count: challenge.injected_errors.length,
          difficulty: challenge.difficulty_actual,
        },
        model_used: 'gemini-pro',
      });
    } catch (error) {
      console.error('Failed to log challenge generation:', error);
    }
  }
}

// Singleton - backward compatible
// For new code, prefer using DI: container.resolve(SERVICE_IDENTIFIERS.ForensicAI)
let forensicAI: ForensicAI | null = null;

export function getForensicAI(): ForensicAI {
  if (!forensicAI) {
    forensicAI = new ForensicAI();
  }
  return forensicAI;
}

// Re-export types for convenience
export type { ForensicChallenge };
