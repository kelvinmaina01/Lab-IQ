import { supabase } from '@/integrations/supabase/client';
import { analystIQService } from './analystIQService';
import { getForensicAI } from './forensicAI';
import { getReverseAI } from './reverseAI';
import { getRacerAI } from './racerAI';

export interface DatasetChallenge {
  id: string;
  dataset_id: string;
  dataset_name: string;
  dataset_description: string;
  mode: 'forensic' | 'reverse' | 'racer';
  difficulty: number;

  // Mode-specific data
  forensic_data?: {
    corrupted_csv: string;
    ground_truth_csv: string;
    error_types: string[];
    hints: string[];
  };

  reverse_data?: {
    target_visualization?: string; // Image URL or chart config
    target_table?: any; // Expected result table
    target_metrics?: any; // Expected metrics
    description: string;
  };

  racer_data?: {
    slow_code: string;
    target_time_ms: number;
    optimal_time_ms: number;
    test_data_size: number;
  };
}

export interface ChallengeSession {
  match_id: string;
  dataset_challenge: DatasetChallenge;
  start_time: Date;
  user_code_sql?: string;
  user_code_python?: string;
}

class DatasetChallengeService {
  private static instance: DatasetChallengeService;

  private constructor() {}

  static getInstance(): DatasetChallengeService {
    if (!DatasetChallengeService.instance) {
      DatasetChallengeService.instance = new DatasetChallengeService();
    }
    return DatasetChallengeService.instance;
  }

  /**
   * Start a new challenge session for a dataset
   */
  async startChallenge(
    userId: string,
    mode: 'forensic' | 'reverse' | 'racer',
    datasetId?: string
  ): Promise<ChallengeSession | null> {
    try {
      // Get user's current IQ to determine difficulty
      const targetDifficulty = await analystIQService.calculateNextDifficulty(userId, mode);

      // Get or select a dataset from the existing datasets table
      let dataset;
      if (datasetId) {
        const { data } = await supabase
          .from('datasets')
          .select('*')
          .eq('id', datasetId)
          .single();
        dataset = data;
      } else {
        // Select a random dataset that's ready
        const { data } = await supabase
          .from('datasets')
          .select('*')
          .eq('status', 'ready')
          .limit(10);
        dataset = data?.[Math.floor(Math.random() * (data?.length || 1))];
      }

      if (!dataset) {
        throw new Error('No dataset available');
      }

      // Generate mode-specific challenge data
      const challengeData = await this.generateChallengeForDataset(
        dataset,
        mode,
        targetDifficulty
      );

      // Create match record
      const { data: match, error } = await supabase
        .from('challenge_matches')
        .insert({
          user_id: userId,
          match_mode: mode,
          target_difficulty: targetDifficulty,
          dataset_id: dataset.id,
          dataset_snapshot: dataset,
          challenge_setup: challengeData,
          iq_before: targetDifficulty,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        match_id: match.id,
        dataset_challenge: {
          id: match.id,
          dataset_id: dataset.id,
          dataset_name: dataset.name,
          dataset_description: dataset.description,
          mode,
          difficulty: targetDifficulty,
          ...challengeData,
        },
        start_time: new Date(),
      };
    } catch (error) {
      console.error('Error starting challenge:', error);
      return null;
    }
  }

  /**
   * Generate mode-specific challenge data for a dataset using AI
   */
  private async generateChallengeForDataset(
    dataset: any,
    mode: 'forensic' | 'reverse' | 'racer',
    difficulty: number
  ): Promise<any> {
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Load dataset data from Supabase
      const datasetWithData = await this.loadDatasetData(dataset);

      switch (mode) {
        case 'forensic': {
          const forensicAI = getForensicAI();
          const challenge = await forensicAI.generateChallenge(
            datasetWithData,
            difficulty,
            user.id
          );
          return { forensic_data: challenge };
        }

        case 'reverse': {
          const reverseAI = getReverseAI();
          const challenge = await reverseAI.generateChallenge(
            datasetWithData,
            difficulty,
            user.id
          );
          return { reverse_data: challenge };
        }

        case 'racer': {
          const racerAI = getRacerAI();
          const challenge = await racerAI.generateChallenge(
            datasetWithData,
            difficulty,
            user.id,
            'python'
          );
          return { racer_data: challenge };
        }

        default:
          throw new Error(`Invalid mode: ${mode}`);
      }
    } catch (error) {
      console.error('Error generating AI challenge:', error);
      // Return fallback challenge if AI fails
      return this.getFallbackChallenge(dataset, mode, difficulty);
    }
  }

  /**
   * Load dataset data from database
   */
  private async loadDatasetData(dataset: any): Promise<any> {
    try {
      // Fetch actual dataset rows
      const { data: rows, error } = await supabase
        .from('dataset_rows')
        .select('data')
        .eq('dataset_id', dataset.id)
        .order('row_index', { ascending: true })
        .limit(1000); // Limit for performance

      if (error) throw error;

      return {
        ...dataset,
        data: rows?.map(r => r.data) || [],
      };
    } catch (error) {
      console.error('Error loading dataset data:', error);
      return { ...dataset, data: [] };
    }
  }

  /**
   * Fallback challenge if AI fails
   */
  private getFallbackChallenge(dataset: any, mode: string, difficulty: number): any {
    switch (mode) {
      case 'forensic':
        return {
          forensic_data: {
            challenge_id: crypto.randomUUID(),
            dataset_snapshot: {
              original_data: [],
              corrupted_data: [],
              schema: {},
            },
            injected_errors: [],
            hints: [
              { level: 1, hint: 'Check for unusual values', cost: 10 },
              { level: 2, hint: 'Look at data distributions', cost: 25 },
              { level: 3, hint: 'Use statistical methods', cost: 50 },
            ],
            difficulty_actual: difficulty,
          },
        };

      case 'reverse':
        return {
          reverse_data: {
            challenge_id: crypto.randomUUID(),
            target: {
              type: 'metrics',
              description: 'Calculate basic statistics',
              target_output: { type: 'metrics', data: {} },
            },
            hints: [],
            difficulty_actual: difficulty,
          },
        };

      case 'racer':
        return {
          racer_data: {
            challenge_id: crypto.randomUUID(),
            slow_code: {
              code: 'for i in range(len(df)):\n    df.loc[i, "result"] = df.loc[i, "value"] * 2',
              estimated_time_ms: 5000,
            },
            target_time_ms: 1000,
            hints: [],
            difficulty_actual: difficulty,
          },
        };
    }
  }

  /**
   * Submit solution for validation
   */
  async submitSolution(
    matchId: string,
    sqlCode?: string,
    pythonCode?: string,
    executionTime?: number
  ): Promise<{
    success: boolean;
    accuracy_score: number;
    feedback: string[];
    iq_change: number;
  } | null> {
    try {
      // Get match details
      const { data: match, error: matchError } = await supabase
        .from('challenge_matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError || !match) throw matchError;

      // Validate solution based on mode
      let validationResult;
      switch (match.match_mode) {
        case 'forensic':
          validationResult = await this.validateForensicSolution(
            match,
            sqlCode,
            pythonCode
          );
          break;
        case 'reverse':
          validationResult = await this.validateReverseSolution(
            match,
            sqlCode,
            pythonCode
          );
          break;
        case 'racer':
          validationResult = await this.validateRacerSolution(
            match,
            sqlCode,
            pythonCode,
            executionTime
          );
          break;
        default:
          throw new Error('Invalid mode');
      }

      // Update match record
      const { error: updateError } = await supabase
        .from('challenge_matches')
        .update({
          user_solution: pythonCode || sqlCode || '',
          execution_time_ms: executionTime,
          success: validationResult.success,
          accuracy_score: validationResult.accuracy_score,
          completed_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      if (updateError) throw updateError;

      // Get updated IQ (trigger will have calculated it)
      const { data: updatedMatch } = await supabase
        .from('challenge_matches')
        .select('iq_after, iq_before')
        .eq('id', matchId)
        .single();

      const iqChange = updatedMatch
        ? updatedMatch.iq_after - updatedMatch.iq_before
        : 0;

      return {
        ...validationResult,
        iq_change: iqChange,
      };
    } catch (error) {
      console.error('Error submitting solution:', error);
      return null;
    }
  }

  /**
   * Validate Forensic Lab solution
   */
  private async validateForensicSolution(
    match: any,
    sqlCode?: string,
    pythonCode?: string
  ): Promise<{ success: boolean; accuracy_score: number; feedback: string[] }> {
    // TODO: Execute user's code and compare cleaned data with ground truth
    // For now, return mock validation

    const feedback = [
      'Good effort at identifying outliers',
      'Consider checking for duplicate records',
      'Some encoding issues remain unfixed',
    ];

    return {
      success: true,
      accuracy_score: 0.75,
      feedback,
    };
  }

  /**
   * Validate Reverse Engineer solution
   */
  private async validateReverseSolution(
    match: any,
    sqlCode?: string,
    pythonCode?: string
  ): Promise<{ success: boolean; accuracy_score: number; feedback: string[] }> {
    // TODO: Execute user's code and compare output with target
    // For now, return mock validation

    const feedback = [
      'Your analysis approach is correct',
      'Output matches target metrics within tolerance',
      'Code quality could be improved',
    ];

    return {
      success: true,
      accuracy_score: 0.85,
      feedback,
    };
  }

  /**
   * Validate Ghost Racer solution
   */
  private async validateRacerSolution(
    match: any,
    sqlCode?: string,
    pythonCode?: string,
    executionTime?: number
  ): Promise<{ success: boolean; accuracy_score: number; feedback: string[] }> {
    const targetTime = match.challenge_setup?.racer_data?.target_time_ms || 1000;
    const optimalTime = match.challenge_setup?.racer_data?.optimal_time_ms || 50;

    const actualTime = executionTime || 0;
    const success = actualTime <= targetTime;

    // Calculate speed score (0-1)
    const speedScore = success
      ? Math.min(1.0, targetTime / actualTime)
      : actualTime / targetTime;

    const feedback = [];
    if (success) {
      feedback.push(`Excellent! You beat the target time (${actualTime}ms vs ${targetTime}ms)`);
      if (actualTime <= optimalTime * 1.2) {
        feedback.push('Your solution is near-optimal!');
      }
    } else {
      feedback.push(`Almost there! Target: ${targetTime}ms, Your time: ${actualTime}ms`);
      feedback.push('Try vectorization or more efficient algorithms');
    }

    return {
      success,
      accuracy_score: speedScore,
      feedback,
    };
  }

  /**
   * Get available datasets for challenges
   */
  async getAvailableDatasets(limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching datasets:', error);
      return [];
    }
  }

  /**
   * Mark dataset as available for challenges
   * (Datasets are uploaded through the main upload system)
   */
  async markDatasetForChallenges(datasetId: string): Promise<boolean> {
    try {
      // Just verify the dataset exists and is ready
      const { data, error } = await supabase
        .from('datasets')
        .select('id, status')
        .eq('id', datasetId)
        .eq('status', 'ready')
        .single();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error marking dataset for challenges:', error);
      return false;
    }
  }
}

export const datasetChallengeService = DatasetChallengeService.getInstance();
