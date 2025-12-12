// AI Challenge Generator using Gemini API

import { supabase } from '@/integrations/supabase/client';

interface DatasetInfo {
  name: string;
  columns: Array<{ name: string; type: string; sample_values: any[] }>;
  row_count: number;
  description?: string;
}

interface ChallengeTask {
  task_number: number;
  instruction: string;
  hint: string;
  expected_approach: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface GeneratedChallenge {
  title: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'expert' | 'advanced';
  language: 'python' | 'sql' | 'r';
  starter_code: string; // Code with comments indicating where to complete tasks
  solution_code: string;
  tasks: ChallengeTask[];
  learning_objectives: string[];
  concepts_tested: string[];
  estimated_time_minutes: number;
  expected_outputs: Array<{
    type: 'plot' | 'table' | 'metric' | 'text';
    description: string;
  }>;
}

export class AIChallengeGenerator {
  private apiKey: string;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  /**
   * Generate a challenge from a dataset
   */
  async generateChallengeFromDataset(
    dataset: DatasetInfo,
    preferences: {
      difficulty?: 'beginner' | 'intermediate' | 'expert' | 'advanced';
      language?: 'python' | 'sql' | 'r';
      focus_area?: string; // e.g., "visualization", "statistics", "cleaning"
      num_tasks?: number;
    } = {}
  ): Promise<GeneratedChallenge> {
    const prompt = this.buildChallengePrompt(dataset, preferences);

    try {
      const response = await this.callGeminiAPI(prompt);
      const challenge = this.parseChallengeResponse(response);

      // Log the generation
      await this.logGeneration('challenge', prompt, challenge);

      return challenge;
    } catch (error) {
      console.error('Error generating challenge:', error);
      throw new Error(`Failed to generate challenge: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build the prompt for challenge generation
   */
  private buildChallengePrompt(dataset: DatasetInfo, preferences: any): string {
    const { difficulty = 'beginner', language = 'python', focus_area, num_tasks = 3 } = preferences;

    return `You are an expert data science educator. Generate a practical, hands-on coding challenge.

DATASET INFORMATION:
- Name: ${dataset.name}
- Columns: ${JSON.stringify(dataset.columns, null, 2)}
- Total Rows: ${dataset.row_count}
${dataset.description ? `- Description: ${dataset.description}` : ''}

REQUIREMENTS:
- Difficulty: ${difficulty}
- Language: ${language}
- Number of tasks: ${num_tasks}
${focus_area ? `- Focus area: ${focus_area}` : ''}

IMPORTANT FORMATTING RULES:
1. Use inline comments (# for Python, -- for SQL, # for R) to indicate where users should complete tasks
2. Format tasks as: "# Task 1: [clear instruction here]"
3. Each task should be a realistic data analysis step
4. Include code scaffolding with clear TODO markers
5. Tasks should build on each other progressively

OUTPUT FORMAT (JSON):
{
  "title": "Descriptive challenge title",
  "description": "What the challenge is about and what they'll learn",
  "difficulty_level": "${difficulty}",
  "language": "${language}",
  "starter_code": "# Code with task comments\\n# Task 1: Load the dataset and display first 5 rows\\n# YOUR CODE HERE\\n\\n# Task 2: Calculate summary statistics\\n# YOUR CODE HERE",
  "solution_code": "Complete working solution with all tasks completed",
  "tasks": [
    {
      "task_number": 1,
      "instruction": "Clear instruction for the task",
      "hint": "Helpful hint without giving away the answer",
      "expected_approach": "Brief description of what they should do",
      "difficulty": "easy|medium|hard"
    }
  ],
  "learning_objectives": ["What they'll learn"],
  "concepts_tested": ["pandas", "visualization", etc.],
  "estimated_time_minutes": 15,
  "expected_outputs": [
    {
      "type": "plot|table|metric|text",
      "description": "What output should be generated"
    }
  ]
}

Generate a challenge that:
1. Is practical and realistic
2. Teaches valuable data analysis skills
3. Has clear, achievable tasks
4. Produces meaningful visualizations or insights
5. Is appropriate for ${difficulty} level

Return ONLY valid JSON, no markdown formatting.`;
  }

  /**
   * Call Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated by Gemini');
    }

    return generatedText;
  }

  /**
   * Parse the AI response
   */
  private parseChallengeResponse(response: string): GeneratedChallenge {
    // Remove markdown code blocks if present
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/```\n?$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/```\n?$/, '');
    }

    try {
      const parsed = JSON.parse(jsonText);
      return parsed as GeneratedChallenge;
    } catch (error) {
      console.error('Failed to parse AI response:', jsonText);
      throw new Error('Failed to parse AI-generated challenge');
    }
  }

  /**
   * Save generated challenge to database
   */
  async saveChallengeToDatabase(
    challenge: GeneratedChallenge,
    customDatasetId?: string,
    userId?: string
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    const actualUserId = userId || user?.id;

    const { data, error } = await supabase
      .from('hackathon_challenges')
      .insert({
        title: challenge.title,
        description: challenge.description,
        difficulty_level: challenge.difficulty_level,
        language: challenge.language,
        user_prompt: `AI-generated challenge for data analysis`,
        incomplete_code: challenge.starter_code,
        complete_solution: challenge.solution_code,
        challenge_tasks: challenge.tasks,
        learning_objectives: challenge.learning_objectives,
        concepts_tested: challenge.concepts_tested,
        estimated_time_minutes: challenge.estimated_time_minutes,
        ai_generated: true,
        custom_dataset_id: customDatasetId,
        creator_id: actualUserId,
        is_active: true,
        is_featured: false,
        challenge_format: 'cloze',
        base_points: this.calculateBasePoints(challenge.difficulty_level),
        blanks: [], // Not using blanks anymore
        test_cases: this.generateTestCases(challenge),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving challenge:', error);
      throw error;
    }

    return data.id;
  }

  /**
   * Generate test cases based on expected outputs
   */
  private generateTestCases(challenge: GeneratedChallenge): any[] {
    return challenge.expected_outputs.map((output, index) => ({
      description: output.description,
      validation_type: output.type === 'plot' ? 'has_visualization' : 'code_executes',
      required: true,
    }));
  }

  /**
   * Calculate base points based on difficulty
   */
  private calculateBasePoints(difficulty: string): number {
    const pointsMap = {
      beginner: 100,
      intermediate: 200,
      expert: 300,
      advanced: 500,
    };
    return pointsMap[difficulty as keyof typeof pointsMap] || 100;
  }

  /**
   * Log AI generation for tracking
   */
  private async logGeneration(type: string, prompt: string, content: any): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('hackathon_ai_generations').insert({
        user_id: user.id,
        generation_type: type,
        prompt: prompt.substring(0, 1000), // Truncate for storage
        generated_content: content,
        model_used: 'gemini-pro',
      });
    } catch (error) {
      console.error('Failed to log AI generation:', error);
    }
  }

  /**
   * Analyze dataset and suggest challenge ideas
   */
  async suggestChallengeIdeas(dataset: DatasetInfo): Promise<string[]> {
    const prompt = `Given this dataset with columns: ${dataset.columns.map(c => c.name).join(', ')},
    suggest 5 interesting data analysis challenge ideas. Keep each suggestion to one sentence.
    Return as JSON array of strings.`;

    try {
      const response = await this.callGeminiAPI(prompt);
      const ideas = JSON.parse(response);
      return Array.isArray(ideas) ? ideas : [];
    } catch (error) {
      console.error('Error suggesting ideas:', error);
      return [];
    }
  }
}

// Singleton instance
let aiGenerator: AIChallengeGenerator | null = null;

export function getAIChallengeGenerator(): AIChallengeGenerator {
  if (!aiGenerator) {
    aiGenerator = new AIChallengeGenerator();
  }
  return aiGenerator;
}
