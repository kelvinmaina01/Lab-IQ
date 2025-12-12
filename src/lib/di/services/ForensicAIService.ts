/**
 * Forensic AI Service Implementation
 * Refactored with Dependency Injection pattern
 */

import {
  IForensicAI,
  IForensicChallenge,
  IAIProvider,
  IDatabaseClient,
  ILogger,
  DatasetAnalysis,
  ErrorInjection,
  ValidationResult,
  ChallengeHint,
} from '../types';

interface ErrorProfile {
  complexity: 'simple' | 'medium' | 'complex' | 'expert';
  error_count: number;
  error_types: string[];
}

export class ForensicAIService implements IForensicAI {
  constructor(
    private aiProvider: IAIProvider,
    private database: IDatabaseClient,
    private logger: ILogger
  ) {}

  /**
   * Generate a forensic challenge for the given dataset
   */
  async generateChallenge(
    dataset: any,
    userIQ: number,
    userId: string
  ): Promise<IForensicChallenge> {
    try {
      this.logger.info('Generating forensic challenge', { userIQ, datasetId: dataset.id });

      // Step 1: Analyze dataset structure
      const analysis = this.analyzeDataset(dataset);

      // Step 2: Determine error profile based on IQ
      const errorProfile = this.getErrorProfile(userIQ);

      // Step 3: Generate corruption plan with AI
      const corruptionPlan = await this.generateCorruptionPlan(analysis, errorProfile, userIQ);

      // Step 4: Execute corruption
      const corruptedData = this.executeCorruption(dataset.data, corruptionPlan);

      // Step 5: Generate hints
      const hints = await this.generateHints(corruptionPlan, userIQ);

      // Step 6: Create challenge object
      const challenge: IForensicChallenge = {
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

      // Step 7: Log to database
      await this.logChallengeGeneration(challenge, userId);

      this.logger.info('Forensic challenge generated', {
        challengeId: challenge.challenge_id,
        errorCount: challenge.injected_errors.length,
      });

      return challenge;
    } catch (error) {
      this.logger.error('Failed to generate forensic challenge', error as Error);
      throw new Error(`Failed to generate forensic challenge: ${(error as Error).message}`);
    }
  }

  /**
   * Validate user's cleaning solution
   */
  async validateCleaning(
    challenge: IForensicChallenge,
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

    // Calculate metrics
    const detectionRate = detected.length / challenge.injected_errors.length;
    const cleaningAccuracy = this.calculateCleaningAccuracy(
      challenge.dataset_snapshot.original_data,
      userCleanedData
    );

    // Generate feedback
    const feedback = this.generateFeedback(detected, missed, cleaningAccuracy, challenge);

    // Calculate final score
    const score = detectionRate * 0.6 + cleaningAccuracy * 0.4;

    return {
      detected_errors: detected,
      missed_errors: missed,
      false_positives: falsePositives,
      cleaning_accuracy: cleaningAccuracy * 100,
      score,
      feedback,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private analyzeDataset(dataset: any): DatasetAnalysis {
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

    columns.forEach((col) => {
      const values = data.map((row: any) => row[col]).filter((v: any) => v != null);
      const nullCount = data.length - values.length;
      analysis.null_percentages[col] = (nullCount / data.length) * 100;

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

  private getErrorProfile(userIQ: number): ErrorProfile {
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
        error_types: [
          'outlier',
          'missing_value',
          'duplicate',
          'format_inconsistency',
          'encoding_error',
          'unit_mismatch',
        ],
      };
    } else {
      return {
        complexity: 'expert',
        error_count: 10,
        error_types: [
          'outlier',
          'missing_value',
          'duplicate',
          'format_inconsistency',
          'encoding_error',
          'unit_mismatch',
          'subtle_corruption',
          'data_drift',
        ],
      };
    }
  }

  private async generateCorruptionPlan(
    analysis: DatasetAnalysis,
    errorProfile: ErrorProfile,
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
}`;

    try {
      return await this.aiProvider.generateJSON(prompt);
    } catch (error) {
      this.logger.warn('AI corruption plan failed, using fallback');
      return this.getFallbackCorruptionPlan(analysis, errorProfile);
    }
  }

  private executeCorruption(
    originalData: any[],
    plan: any
  ): { data: any[]; injections: ErrorInjection[] } {
    const corrupted = JSON.parse(JSON.stringify(originalData));
    const injections: ErrorInjection[] = [];

    for (const error of plan.errors || []) {
      const injection = this.applyError(corrupted, error);
      if (injection) {
        injections.push(injection);
      }
    }

    return { data: corrupted, injections };
  }

  private applyError(data: any[], errorSpec: any): ErrorInjection | null {
    const column = errorSpec.target_column;
    if (!column || !data[0]?.[column]) return null;

    const affectedCount = Math.ceil(data.length * (errorSpec.affected_percentage || 0.05));
    const affectedIndices = this.getRandomIndices(data.length, affectedCount);

    const injection: ErrorInjection = {
      error_id: crypto.randomUUID(),
      error_type: errorSpec.error_type,
      column,
      severity: errorSpec.severity || 'medium',
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

  private async generateHints(plan: any, userIQ: number): Promise<ChallengeHint[]> {
    const prompt = `Generate 3 progressive hints for finding these data errors:

${JSON.stringify(plan.errors, null, 2)}

HINT LEVELS:
1. Conceptual hint (10 points cost) - General area to look
2. Specific hint (25 points cost) - Which columns/rows
3. Solution hint (50 points cost) - How to fix

User IQ: ${userIQ}

Return JSON array:
[
  {"level": 1, "hint": "...", "reveals": "...", "cost": 10},
  {"level": 2, "hint": "...", "reveals": "...", "cost": 25},
  {"level": 3, "hint": "...", "reveals": "...", "cost": 50}
]`;

    try {
      return await this.aiProvider.generateJSON<ChallengeHint[]>(prompt);
    } catch {
      return this.getFallbackHints();
    }
  }

  private checkIfErrorFixed(
    original: any[],
    cleaned: any[],
    injection: ErrorInjection
  ): boolean {
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

  private generateFeedback(
    detected: string[],
    missed: string[],
    accuracy: number,
    challenge: IForensicChallenge
  ): string[] {
    const feedback: string[] = [];

    if (detected.length === challenge.injected_errors.length) {
      feedback.push('Excellent! You found all the errors!');
    } else {
      feedback.push(`You found ${detected.length} out of ${challenge.injected_errors.length} errors.`);
    }

    if (accuracy > 0.95) {
      feedback.push('Your cleaning is highly accurate!');
    } else if (accuracy > 0.8) {
      feedback.push('Good cleaning, but some values could be more accurate.');
    } else {
      feedback.push('Some cleaned values are incorrect. Review your approach.');
    }

    return feedback;
  }

  private async logChallengeGeneration(challenge: IForensicChallenge, userId: string): Promise<void> {
    try {
      await this.database.from('hackathon_ai_generations').insert({
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
      this.logger.warn('Failed to log challenge generation');
    }
  }

  // Helper methods
  private isDate(value: any): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private getRandomIndices(max: number, count: number): number[] {
    const indices: number[] = [];
    while (indices.length < Math.min(count, max)) {
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

  private isCloseEnough(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a === 'number' && typeof b === 'number') {
      return Math.abs(a - b) < 0.01;
    }
    return false;
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
    const baseTime = errorCount * 3;
    const skillFactor = 2000 / userIQ;
    return Math.ceil(baseTime * skillFactor);
  }

  private getFallbackCorruptionPlan(analysis: DatasetAnalysis, errorProfile: ErrorProfile): any {
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

  private getFallbackHints(): ChallengeHint[] {
    return [
      { level: 1, hint: 'Check numeric columns for unusual values', reveals: 'General area', cost: 10 },
      { level: 2, hint: 'Look at the distribution of values', reveals: 'Specific approach', cost: 25 },
      { level: 3, hint: 'Use statistical methods to detect outliers', reveals: 'Solution method', cost: 50 },
    ];
  }
}
