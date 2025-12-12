// Main hackathon service for managing challenges, submissions, and leaderboard

import { supabase } from '@/integrations/supabase/client';
import type { ExecutionLanguage } from './executionEngines';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface HackathonChallenge {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'expert' | 'advanced';
  language: ExecutionLanguage;
  user_prompt: string;
  incomplete_code: string;
  complete_solution: string;
  blanks: BlankDefinition[];
  test_cases: TestCaseDefinition[];
  dataset_id?: string;
  dataset_url?: string;
  dataset_schema?: any;
  learning_objectives: string[];
  concepts_tested: string[];
  estimated_time_minutes: number;
  base_points: number;
  time_bonus_points: number;
  hint_penalty_points: number;
  attempts_count: number;
  success_count: number;
  average_completion_time_seconds?: number;
  challenge_format: 'cloze' | 'parsons' | 'debug' | 'optimize';
  is_active: boolean;
  is_featured: boolean;
  creator_id?: string;
}

export interface BlankDefinition {
  id: string;
  type: 'function_name' | 'expression' | 'logic_block' | 'variable_name';
  expected_answer: string | string[]; // Can be multiple valid answers
  concept_tested: string;
  hint_progression: string[];
}

export interface TestCaseDefinition {
  description: string;
  validation_type: 'exact_match' | 'numeric_tolerance' | 'shape_match' | 'regex_match';
  expected_output?: any;
  expected_shape?: { rows?: number; cols?: number };
  tolerance?: number;
  regex_pattern?: string;
}

export interface HackathonSubmission {
  id: string;
  created_at: string;
  user_id: string;
  challenge_id: string;
  submitted_code: string;
  language: string;
  passed: boolean;
  test_results: any[];
  execution_output: any;
  error_message?: string;
  completion_time_seconds?: number;
  hints_used: number;
  attempts_before_success: number;
  base_score: number;
  time_bonus: number;
  hint_penalty: number;
  final_score: number;
}

export interface LeaderboardEntry {
  user_id: string;
  email?: string;
  total_challenges_completed: number;
  total_points: number;
  average_score: number;
  speed_run_score: number;
  accuracy_score: number;
  consistency_score: number;
  badges_earned: string[];
  current_streak: number;
  longest_streak: number;
  global_rank: number;
  difficulty_ranks: Record<string, number>;
  language_ranks: Record<string, number>;
}

export interface Badge {
  id: string;
  badge_code: string;
  name: string;
  description: string;
  icon_url: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlock_criteria: any;
  points_value: number;
}

export interface UserBadge {
  id: string;
  earned_at: string;
  user_id: string;
  badge_id: string;
  badge: Badge;
  challenge_id?: string;
  submission_id?: string;
}

// ============================================================================
// CHALLENGE MANAGEMENT
// ============================================================================

export class HackathonService {
  /**
   * Get all active challenges with optional filters
   */
  async getChallenges(filters?: {
    difficulty?: string;
    language?: string;
    featured?: boolean;
    search?: string;
  }): Promise<HackathonChallenge[]> {
    let query = supabase.from('hackathon_challenges').select('*').eq('is_active', true).order('created_at', { ascending: false });

    if (filters?.difficulty) {
      query = query.eq('difficulty_level', filters.difficulty);
    }

    if (filters?.language) {
      query = query.eq('language', filters.language);
    }

    if (filters?.featured) {
      query = query.eq('is_featured', true);
    }

    if (filters?.search) {
      query = query.textSearch('search_vector', filters.search);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching challenges:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get a specific challenge by ID
   */
  async getChallenge(challengeId: string): Promise<HackathonChallenge | null> {
    const { data, error } = await supabase.from('hackathon_challenges').select('*').eq('id', challengeId).single();

    if (error) {
      console.error('Error fetching challenge:', error);
      return null;
    }

    return data;
  }

  /**
   * Create a new challenge
   */
  async createChallenge(challenge: Partial<HackathonChallenge>): Promise<HackathonChallenge | null> {
    const { data, error } = await supabase.from('hackathon_challenges').insert(challenge).select().single();

    if (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }

    return data;
  }

  /**
   * Submit a challenge attempt
   */
  async submitChallenge(submission: {
    challenge_id: string;
    user_id: string;
    submitted_code: string;
    language: string;
    passed: boolean;
    test_results: any[];
    execution_output: any;
    error_message?: string;
    completion_time_seconds?: number;
    hints_used: number;
    attempts_before_success: number;
    base_score: number;
    time_bonus: number;
    hint_penalty: number;
  }): Promise<HackathonSubmission | null> {
    const { data, error } = await supabase.from('hackathon_submissions').insert(submission).select().single();

    if (error) {
      console.error('Error submitting challenge:', error);
      throw error;
    }

    // Refresh leaderboard rankings
    if (submission.passed) {
      await this.refreshLeaderboardRanks();
    }

    return data;
  }

  /**
   * Get user's submissions for a challenge
   */
  async getUserChallengeSubmissions(userId: string, challengeId: string): Promise<HackathonSubmission[]> {
    const { data, error } = await supabase
      .from('hackathon_submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user's best submission for a challenge
   */
  async getUserBestSubmission(userId: string, challengeId: string): Promise<HackathonSubmission | null> {
    const { data, error } = await supabase
      .from('hackathon_submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .eq('passed', true)
      .order('final_score', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned"
      console.error('Error fetching best submission:', error);
    }

    return data || null;
  }

  // ============================================================================
  // LEADERBOARD
  // ============================================================================

  /**
   * Get global leaderboard
   */
  async getLeaderboard(limit: number = 100, sortBy: 'total_points' | 'speed_run_score' | 'accuracy_score' = 'total_points'): Promise<LeaderboardEntry[]> {
    const orderColumn = sortBy === 'total_points' ? 'total_points' : sortBy === 'speed_run_score' ? 'speed_run_score' : 'accuracy_score';

    const { data, error } = await supabase.from('hackathon_leaderboard').select('*').order(orderColumn, { ascending: false }).limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user's leaderboard position
   */
  async getUserLeaderboardPosition(userId: string): Promise<LeaderboardEntry | null> {
    const { data, error } = await supabase.from('hackathon_leaderboard').select('*').eq('user_id', userId).single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user leaderboard:', error);
    }

    return data || null;
  }

  /**
   * Get user progress statistics
   */
  async getUserProgress(userId: string): Promise<any> {
    const { data, error } = await supabase.from('user_hackathon_progress').select('*').eq('user_id', userId).single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user progress:', error);
    }

    return data || {
      challenges_completed: 0,
      total_points: 0,
      global_rank: null,
      current_streak: 0,
      badges_count: 0,
      total_submissions: 0,
      successful_submissions: 0,
      success_rate: 0,
    };
  }

  /**
   * Refresh leaderboard rankings
   */
  async refreshLeaderboardRanks(): Promise<void> {
    const { error } = await supabase.rpc('refresh_leaderboard_ranks');

    if (error) {
      console.error('Error refreshing leaderboard:', error);
    }
  }

  // ============================================================================
  // BADGES & ACHIEVEMENTS
  // ============================================================================

  /**
   * Get all available badges
   */
  async getBadges(): Promise<Badge[]> {
    const { data, error } = await supabase.from('hackathon_badges').select('*').order('points_value', { ascending: true });

    if (error) {
      console.error('Error fetching badges:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user's earned badges
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select(
        `
        *,
        badge:hackathon_badges(*)
      `
      )
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Check and award badges for a user
   */
  async checkAndAwardBadges(userId: string, submissionId: string): Promise<void> {
    const { error } = await supabase.rpc('check_and_award_badges', {
      p_user_id: userId,
      p_submission_id: submissionId,
    });

    if (error) {
      console.error('Error checking badges:', error);
    }
  }

  // ============================================================================
  // HINTS
  // ============================================================================

  /**
   * Record hint usage
   */
  async recordHintUsage(data: {
    user_id: string;
    challenge_id: string;
    submission_id?: string;
    hint_level: number;
    blank_id?: string;
    points_deducted: number;
  }): Promise<void> {
    const { error } = await supabase.from('hackathon_hint_usage').insert(data);

    if (error) {
      console.error('Error recording hint usage:', error);
      throw error;
    }
  }

  /**
   * Get user's hint usage for a challenge
   */
  async getHintUsage(userId: string, challengeId: string): Promise<number> {
    const { data, error } = await supabase
      .from('hackathon_hint_usage')
      .select('hint_level')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId);

    if (error) {
      console.error('Error fetching hint usage:', error);
      return 0;
    }

    return data?.length || 0;
  }

  // ============================================================================
  // PEER REVIEWS
  // ============================================================================

  /**
   * Submit a peer review
   */
  async submitReview(review: {
    reviewer_id: string;
    submission_id: string;
    efficiency_rating: number;
    readability_rating: number;
    creativity_rating: number;
    comments?: string;
    code_suggestions?: string;
  }): Promise<void> {
    const { error } = await supabase.from('hackathon_solution_reviews').insert(review);

    if (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  /**
   * Get reviews for a submission
   */
  async getSubmissionReviews(submissionId: string): Promise<any[]> {
    const { data, error } = await supabase.from('hackathon_solution_reviews').select('*').eq('submission_id', submissionId).order('helpful_votes', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // DISCUSSIONS
  // ============================================================================

  /**
   * Get discussions for a challenge
   */
  async getChallengeDiscussions(challengeId: string): Promise<any[]> {
    const { data, error } = await supabase.from('hackathon_discussions').select('*').eq('challenge_id', challengeId).is('parent_id', null).order('upvotes', { ascending: false });

    if (error) {
      console.error('Error fetching discussions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Post a discussion comment
   */
  async postDiscussion(discussion: {
    challenge_id: string;
    author_id: string;
    content: string;
    parent_id?: string;
    is_solution_spoiler?: boolean;
  }): Promise<void> {
    const { error } = await supabase.from('hackathon_discussions').insert(discussion);

    if (error) {
      console.error('Error posting discussion:', error);
      throw error;
    }
  }

  // ============================================================================
  // REALTIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to leaderboard updates
   */
  subscribeToLeaderboard(callback: (payload: any) => void) {
    return supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hackathon_leaderboard' }, callback)
      .subscribe();
  }

  /**
   * Subscribe to new challenges
   */
  subscribeToNewChallenges(callback: (payload: any) => void) {
    return supabase
      .channel('new-challenges')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hackathon_challenges' }, callback)
      .subscribe();
  }
}

// Singleton instance
let hackathonService: HackathonService | null = null;

export function getHackathonService(): HackathonService {
  if (!hackathonService) {
    hackathonService = new HackathonService();
  }
  return hackathonService;
}
