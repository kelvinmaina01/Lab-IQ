/**
 * Ghost Racer AI Service
 * Google-grade implementation for code optimization challenges
 *
 * This service uses Gemini AI to:
 * - Generate intentionally slow code patterns
 * - Create optimization challenges based on dataset
 * - Benchmark execution times
 * - Validate optimizations and provide feedback
 */

import { supabase } from '@/integrations/supabase/client';

interface SlowCodePattern {
  pattern_id: string;
  name: string;
  category: 'loops' | 'operations' | 'memory' | 'io' | 'algorithm';
  slow_code: string;
  optimal_code: string;
  speedup_factor_expected: number;
  optimization_techniques: string[];
}

interface RacerChallenge {
  challenge_id: string;
  dataset_info: any;
  operation_description: string;
  slow_code: {
    language: 'python' | 'sql';
    code: string;
    estimated_time_ms: number;
    inefficiency: string; // What makes it slow
  };
  optimal_solution: {
    code: string;
    estimated_time_ms: number;
    optimization_used: string[];
  };
  target_time_ms: number; // User must beat this
  test_data_size: number;
  hints: {
    level: number;
    hint: string;
    cost: number;
  }[];
  difficulty_actual: number;
}

interface RacerValidationResult {
  beat_target: boolean;
  user_time_ms: number;
  target_time_ms: number;
  speedup_factor: number; // Compared to slow code
  optimization_score: number; // 0-1
  detected_optimizations: string[];
  feedback: string[];
}

export class RacerAI {
  private apiKey: string;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Gemini API key not configured for RacerAI');
    }
  }

  /**
   * Generate an optimization challenge
   */
  async generateChallenge(
    dataset: any,
    userIQ: number,
    userId: string,
    language: 'python' | 'sql' = 'python'
  ): Promise<RacerChallenge> {
    try {
      // Step 1: Select operation type based on dataset
      const operation = this.selectOperation(dataset, userIQ);

      // Step 2: Generate slow code with AI
      const slowCodePattern = await this.generateSlowCode(
        dataset,
        operation,
        userIQ,
        language
      );

      // Step 3: Generate hints
      const hints = await this.generateHints(slowCodePattern, userIQ);

      // Step 4: Calculate time targets
      const timings = this.calculateTimeTargets(userIQ, slowCodePattern.speedup_factor_expected);

      // Step 5: Create challenge
      const challenge: RacerChallenge = {
        challenge_id: crypto.randomUUID(),
        dataset_info: {
          name: dataset.name,
          row_count: dataset.data?.length || 0,
        },
        operation_description: operation.description,
        slow_code: {
          language,
          code: slowCodePattern.slow_code,
          estimated_time_ms: timings.slow_time,
          inefficiency: slowCodePattern.name,
        },
        optimal_solution: {
          code: slowCodePattern.optimal_code,
          estimated_time_ms: timings.optimal_time,
          optimization_used: slowCodePattern.optimization_techniques,
        },
        target_time_ms: timings.target_time,
        test_data_size: dataset.data?.length || 10000,
        hints,
        difficulty_actual: userIQ,
      };

      // Step 6: Log generation
      await this.logChallengeGeneration(challenge, userId);

      return challenge;
    } catch (error) {
      console.error('Error generating racer challenge:', error);
      throw new Error(`Failed to generate racer challenge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Select operation type based on dataset and IQ
   */
  private selectOperation(dataset: any, userIQ: number): {
    type: string;
    description: string;
  } {
    const operations = [
      { type: 'row_iteration', description: 'Process each row individually', iq_range: [800, 1200] },
      { type: 'multiple_passes', description: 'Multiple iterations over data', iq_range: [1000, 1400] },
      { type: 'nested_loops', description: 'Nested loop operations', iq_range: [1200, 1600] },
      { type: 'inefficient_join', description: 'Cartesian join or unindexed join', iq_range: [1300, 1800] },
      { type: 'memory_inefficient', description: 'Inefficient memory usage', iq_range: [1400, 2000] },
    ];

    // Find operations suitable for user's IQ
    const suitable = operations.filter(
      op => userIQ >= op.iq_range[0] && userIQ <= op.iq_range[1]
    );

    return suitable[Math.floor(Math.random() * suitable.length)] || operations[0];
  }

  /**
   * Generate slow code using AI
   */
  private async generateSlowCode(
    dataset: any,
    operation: any,
    userIQ: number,
    language: 'python' | 'sql'
  ): Promise<SlowCodePattern> {
    const prompt = `You are a performance optimization expert creating a "Ghost Racer" challenge.

DATASET:
- Rows: ${dataset.data?.length || 10000}
- Columns: ${Object.keys(dataset.data?.[0] || {}).join(', ')}

OPERATION TYPE: ${operation.type} - ${operation.description}
USER IQ: ${userIQ}
LANGUAGE: ${language}

TASK: Generate intentionally slow code that performs a realistic data operation.

IQ-BASED COMPLEXITY:
- 800-1000: Simple row-by-row operations (for loops with loc)
- 1000-1200: Multiple passes or inefficient filtering
- 1200-1400: Nested loops or cartesian products
- 1400+: Complex inefficient algorithms

REQUIREMENTS:
1. Code must be FUNCTIONALLY CORRECT (produces right output)
2. Code must be OBVIOUSLY SLOW (clear inefficiency)
3. Code must be REALISTIC (something a beginner might write)
4. Optimization should be CLEAR (vectorization, better algorithm, etc.)

RETURN JSON:
{
  "pattern_id": "unique_id",
  "name": "Row-by-row assignment" or similar,
  "category": "loops|operations|memory|io|algorithm",
  "slow_code": "# Slow implementation\\n${language === 'python' ? 'for i in range(len(df)):' : 'SELECT with cross join'}",
  "optimal_code": "# Optimal implementation\\ndf['result'] = df['value'] * 2",
  "speedup_factor_expected": 100,
  "optimization_techniques": ["vectorization", "avoid_loops"],
  "explanation": "Why the slow code is slow and how optimization helps"
}

Return ONLY valid JSON for ${language}.`;

    try {
      const response = await this.callGeminiAPI(prompt);
      const parsed = JSON.parse(this.cleanJSONResponse(response));
      return parsed as SlowCodePattern;
    } catch (error) {
      console.error('AI slow code generation failed, using fallback:', error);
      return this.getFallbackSlowCode(language, userIQ);
    }
  }

  /**
   * Generate progressive hints
   */
  private async generateHints(pattern: SlowCodePattern, userIQ: number): Promise<any[]> {
    const prompt = `Generate 3 progressive optimization hints for this slow code:

SLOW CODE:
${pattern.slow_code}

OPTIMAL APPROACH:
${pattern.optimal_code}

OPTIMIZATION TECHNIQUES: ${pattern.optimization_techniques.join(', ')}

Create hints:
1. Level 1 (10 pts): Identify the bottleneck (what's slow)
2. Level 2 (25 pts): Suggest optimization approach (without code)
3. Level 3 (50 pts): Specific technique or pattern to use

Return JSON:
[
  {"level": 1, "hint": "...", "cost": 10},
  {"level": 2, "hint": "...", "cost": 25},
  {"level": 3, "hint": "...", "cost": 50}
]`;

    try {
      const response = await this.callGeminiAPI(prompt);
      return JSON.parse(this.cleanJSONResponse(response));
    } catch (error) {
      return this.getFallbackHints(pattern);
    }
  }

  /**
   * Validate user's optimization
   */
  async validateOptimization(
    challenge: RacerChallenge,
    userCode: string,
    executionTime: number
  ): Promise<RacerValidationResult> {
    try {
      // Step 1: Check if beat target time
      const beatTarget = executionTime <= challenge.target_time_ms;

      // Step 2: Calculate speedup factor
      const speedupFactor = challenge.slow_code.estimated_time_ms / executionTime;

      // Step 3: Detect optimization techniques used
      const detectedOptimizations = await this.detectOptimizations(
        userCode,
        challenge.optimal_solution.optimization_used
      );

      // Step 4: Calculate optimization score
      const optimizationScore = this.calculateOptimizationScore(
        executionTime,
        challenge.target_time_ms,
        challenge.optimal_solution.estimated_time_ms,
        detectedOptimizations.length,
        challenge.optimal_solution.optimization_used.length
      );

      // Step 5: Generate feedback
      const feedback = await this.generateFeedback(
        beatTarget,
        executionTime,
        challenge.target_time_ms,
        speedupFactor,
        detectedOptimizations,
        challenge
      );

      return {
        beat_target: beatTarget,
        user_time_ms: executionTime,
        target_time_ms: challenge.target_time_ms,
        speedup_factor,
        optimization_score: optimizationScore,
        detected_optimizations: detectedOptimizations,
        feedback,
      };
    } catch (error) {
      console.error('Error validating optimization:', error);
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
          temperature: 0.9,
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

  private calculateTimeTargets(userIQ: number, expectedSpeedup: number): {
    slow_time: number;
    optimal_time: number;
    target_time: number;
  } {
    // Base times scale with dataset size
    const baseOptimalTime = 100; // ms
    const slowTime = baseOptimalTime * expectedSpeedup;

    // Target time varies by IQ
    // Higher IQ = stricter target (must get closer to optimal)
    const targetRatio = userIQ < 1000 ? 0.5 : userIQ < 1200 ? 0.3 : userIQ < 1400 ? 0.2 : 0.1;
    const targetTime = baseOptimalTime + (slowTime - baseOptimalTime) * targetRatio;

    return {
      slow_time: slowTime,
      optimal_time: baseOptimalTime,
      target_time: Math.round(targetTime),
    };
  }

  private async detectOptimizations(userCode: string, expectedOptimizations: string[]): Promise<string[]> {
    const detected: string[] = [];

    const optimizationPatterns = {
      vectorization: /\.\w+\(|\[.*\].*=|apply\(/i,
      caching: /cache|memo|store|save/i,
      indexing: /index|set_index|loc\[/i,
      efficient_join: /merge\(.*on=|join/i,
      list_comprehension: /\[.*for.*in.*\]/i,
      generator: /yield|generator/i,
      numpy_operations: /np\.|numpy\./i,
      query_optimization: /WHERE.*AND|INDEX|EXPLAIN/i,
    };

    for (const [technique, pattern] of Object.entries(optimizationPatterns)) {
      if (pattern.test(userCode)) {
        detected.push(technique);
      }
    }

    return detected.filter(opt => expectedOptimizations.includes(opt));
  }

  private calculateOptimizationScore(
    userTime: number,
    targetTime: number,
    optimalTime: number,
    detectedCount: number,
    expectedCount: number
  ): number {
    // Score based on time (60%) and technique detection (40%)
    const timeScore = userTime <= targetTime
      ? Math.min(1.0, targetTime / userTime)
      : Math.max(0, 1 - (userTime - targetTime) / targetTime);

    const techniqueScore = expectedCount > 0
      ? detectedCount / expectedCount
      : 0.5;

    return (timeScore * 0.6) + (techniqueScore * 0.4);
  }

  private async generateFeedback(
    beatTarget: boolean,
    userTime: number,
    targetTime: number,
    speedupFactor: number,
    detectedOptimizations: string[],
    challenge: RacerChallenge
  ): Promise<string[]> {
    const feedback: string[] = [];

    if (beatTarget) {
      feedback.push(`🏆 Success! You beat the target time!`);
      feedback.push(`⏱️ Your time: ${userTime}ms | Target: ${targetTime}ms`);

      if (userTime <= challenge.optimal_solution.estimated_time_ms * 1.2) {
        feedback.push(`⚡ Near-optimal performance! Speedup: ${speedupFactor.toFixed(1)}x`);
      } else {
        feedback.push(`📈 Good speedup: ${speedupFactor.toFixed(1)}x | Room for more optimization`);
      }
    } else {
      feedback.push(`⏱️ Almost there! Your time: ${userTime}ms | Target: ${targetTime}ms`);
      feedback.push(`Need to improve by: ${((userTime / targetTime - 1) * 100).toFixed(1)}%`);
    }

    if (detectedOptimizations.length > 0) {
      feedback.push(`✅ Good techniques used: ${detectedOptimizations.join(', ')}`);
    } else {
      feedback.push(`💡 Try: ${challenge.optimal_solution.optimization_used.join(', ')}`);
    }

    return feedback;
  }

  private getFallbackSlowCode(language: 'python' | 'sql', userIQ: number): SlowCodePattern {
    if (language === 'python') {
      return {
        pattern_id: crypto.randomUUID(),
        name: 'Row-by-row DataFrame modification',
        category: 'loops',
        slow_code: `# Slow: Row-by-row iteration
for i in range(len(df)):
    df.loc[i, 'result'] = df.loc[i, 'value'] * 2`,
        optimal_code: `# Fast: Vectorized operation
df['result'] = df['value'] * 2`,
        speedup_factor_expected: 100,
        optimization_techniques: ['vectorization', 'avoid_loops'],
      };
    } else {
      return {
        pattern_id: crypto.randomUUID(),
        name: 'Cartesian product join',
        category: 'operations',
        slow_code: `-- Slow: Cross join without filter
SELECT a.*, b.*
FROM table1 a
CROSS JOIN table2 b
WHERE a.id = b.id`,
        optimal_code: `-- Fast: Direct join
SELECT a.*, b.*
FROM table1 a
INNER JOIN table2 b ON a.id = b.id`,
        speedup_factor_expected: 50,
        optimization_techniques: ['efficient_join', 'query_optimization'],
      };
    }
  }

  private getFallbackHints(pattern: SlowCodePattern): any[] {
    return [
      {
        level: 1,
        hint: `The bottleneck is: ${pattern.category}`,
        cost: 10,
      },
      {
        level: 2,
        hint: `Consider using ${pattern.optimization_techniques[0]} to improve performance`,
        cost: 25,
      },
      {
        level: 3,
        hint: `Try this approach: ${pattern.optimization_techniques.join(' and ')}`,
        cost: 50,
      },
    ];
  }

  private async logChallengeGeneration(challenge: RacerChallenge, userId: string): Promise<void> {
    try {
      await supabase.from('hackathon_ai_generations').insert({
        user_id: userId,
        generation_type: 'racer_challenge',
        generated_content: {
          challenge_id: challenge.challenge_id,
          operation: challenge.operation_description,
          difficulty: challenge.difficulty_actual,
          expected_speedup: challenge.optimal_solution.estimated_time_ms,
        },
        model_used: 'gemini-pro',
      });
    } catch (error) {
      console.error('Failed to log challenge generation:', error);
    }
  }
}

// Singleton
let racerAI: RacerAI | null = null;

export function getRacerAI(): RacerAI {
  if (!racerAI) {
    racerAI = new RacerAI();
  }
  return racerAI;
}
