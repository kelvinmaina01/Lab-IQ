import { supabase } from '@/integrations/supabase/client';

export interface AnalystIQProfile {
  id: string;
  user_id: string;
  overall_iq: number;
  data_integrity_score: number;
  logic_reasoning_score: number;
  optimization_score: number;
  data_integrity_percentile?: number;
  logic_reasoning_percentile?: number;
  optimization_percentile?: number;
  learning_velocity: number;
  consistency_score: number;
  challenge_completion_rate: number;
  learning_style?: string;
  preferred_mode?: string;
  strength_areas: string[];
  weakness_areas: string[];
  current_level: string;
  total_challenges_completed: number;
  total_time_spent_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface MatchResult {
  match_id: string;
  success: boolean;
  accuracy_score: number;
  speed_score?: number;
  quality_score?: number;
  execution_time_ms: number;
  attempts_count: number;
  hints_requested: number;
}

export interface SkillRadarData {
  data_integrity: number;
  logic_reasoning: number;
  optimization: number;
  overall_iq: number;
}

class AnalystIQService {
  private static instance: AnalystIQService;

  private constructor() {}

  static getInstance(): AnalystIQService {
    if (!AnalystIQService.instance) {
      AnalystIQService.instance = new AnalystIQService();
    }
    return AnalystIQService.instance;
  }

  /**
   * Get or create user's Analyst IQ profile
   */
  async getOrCreateProfile(userId: string): Promise<AnalystIQProfile | null> {
    try {
      // First try to get existing profile
      const { data: existing, error: fetchError } = await supabase
        .from('analyst_iq_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existing) {
        return existing;
      }

      // If not found, create new profile
      if (fetchError?.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('analyst_iq_profiles')
          .insert({
            user_id: userId,
            overall_iq: 1000,
            data_integrity_score: 1000,
            logic_reasoning_score: 1000,
            optimization_score: 1000,
            learning_velocity: 1.0,
            consistency_score: 0.5,
            challenge_completion_rate: 0.0,
            strength_areas: [],
            weakness_areas: [],
            current_level: 'novice',
            total_challenges_completed: 0,
            total_time_spent_minutes: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        return newProfile;
      }

      throw fetchError;
    } catch (error) {
      console.error('Error in getOrCreateProfile:', error);
      return null;
    }
  }

  /**
   * Calculate next appropriate difficulty level for user
   */
  async calculateNextDifficulty(
    userId: string,
    mode: 'forensic' | 'reverse' | 'racer'
  ): Promise<number> {
    try {
      const profile = await this.getOrCreateProfile(userId);
      if (!profile) return 1000; // Default starting difficulty

      // Get mode-specific IQ
      let baseIQ: number;
      switch (mode) {
        case 'forensic':
          baseIQ = profile.data_integrity_score;
          break;
        case 'reverse':
          baseIQ = profile.logic_reasoning_score;
          break;
        case 'racer':
          baseIQ = profile.optimization_score;
          break;
        default:
          baseIQ = profile.overall_iq;
      }

      // Get recent performance (last 5 matches in this mode)
      const { data: recentMatches } = await supabase
        .from('challenge_matches')
        .select('success, accuracy_score, speed_score')
        .eq('user_id', userId)
        .eq('match_mode', mode)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (!recentMatches || recentMatches.length === 0) {
        // First challenge in this mode - start at base IQ
        return baseIQ;
      }

      // Calculate average accuracy from recent matches
      const avgAccuracy =
        recentMatches.reduce((sum, match) => sum + (match.accuracy_score || 0), 0) /
        recentMatches.length;

      // Adaptive difficulty adjustment
      if (avgAccuracy > 0.8) {
        // User is crushing it - increase difficulty significantly
        return Math.min(baseIQ + 100, 2000);
      } else if (avgAccuracy > 0.6) {
        // Good performance - slight increase
        return Math.min(baseIQ + 50, 2000);
      } else if (avgAccuracy < 0.4) {
        // Struggling - ease up
        return Math.max(baseIQ - 50, 800);
      }

      // Average performance - maintain with slight progressive challenge
      return Math.min(baseIQ + 20, 2000);
    } catch (error) {
      console.error('Error calculating next difficulty:', error);
      return 1000;
    }
  }

  /**
   * Get skill radar data for visualization
   */
  async getSkillRadarData(userId: string): Promise<SkillRadarData | null> {
    try {
      const profile = await this.getOrCreateProfile(userId);
      if (!profile) return null;

      return {
        data_integrity: profile.data_integrity_score,
        logic_reasoning: profile.logic_reasoning_score,
        optimization: profile.optimization_score,
        overall_iq: profile.overall_iq,
      };
    } catch (error) {
      console.error('Error getting skill radar data:', error);
      return null;
    }
  }

  /**
   * Get user's strengths and weaknesses
   */
  async analyzeSkillProfile(userId: string): Promise<{
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  } | null> {
    try {
      const profile = await this.getOrCreateProfile(userId);
      if (!profile) return null;

      const skills = {
        data_integrity: profile.data_integrity_score,
        logic_reasoning: profile.logic_reasoning_score,
        optimization: profile.optimization_score,
      };

      // Find strengths (> average + 100)
      const avgScore = profile.overall_iq;
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      if (skills.data_integrity > avgScore + 100) {
        strengths.push('Data Quality & Forensics');
      } else if (skills.data_integrity < avgScore - 50) {
        weaknesses.push('Data Debugging');
      }

      if (skills.logic_reasoning > avgScore + 100) {
        strengths.push('Logic & Analysis');
      } else if (skills.logic_reasoning < avgScore - 50) {
        weaknesses.push('Problem Solving');
      }

      if (skills.optimization > avgScore + 100) {
        strengths.push('Code Optimization');
      } else if (skills.optimization < avgScore - 50) {
        weaknesses.push('Performance Tuning');
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (weaknesses.includes('Data Debugging')) {
        recommendations.push('Try more Forensic Lab challenges to improve data quality skills');
      }
      if (weaknesses.includes('Problem Solving')) {
        recommendations.push('Practice Reverse Engineer mode to strengthen logic skills');
      }
      if (weaknesses.includes('Performance Tuning')) {
        recommendations.push('Focus on Ghost Racer challenges to learn optimization techniques');
      }

      if (recommendations.length === 0) {
        recommendations.push('Keep up the great work! Try challenges at higher difficulty levels.');
      }

      return { strengths, weaknesses, recommendations };
    } catch (error) {
      console.error('Error analyzing skill profile:', error);
      return null;
    }
  }

  /**
   * Get leaderboard for specific mode
   */
  async getLeaderboard(
    mode: 'forensic' | 'reverse' | 'racer',
    limit: number = 100
  ): Promise<any[]> {
    try {
      let viewName: string;
      switch (mode) {
        case 'forensic':
          viewName = 'forensic_leaderboard';
          break;
        case 'reverse':
          viewName = 'reverse_leaderboard';
          break;
        case 'racer':
          viewName = 'racer_leaderboard';
          break;
      }

      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  /**
   * Get user's performance history
   */
  async getPerformanceHistory(
    userId: string,
    mode?: 'forensic' | 'reverse' | 'racer'
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('challenge_matches')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .not('completed_at', 'is', null);

      if (mode) {
        query = query.eq('match_mode', mode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching performance history:', error);
      return [];
    }
  }

  /**
   * Track performance event
   */
  async trackEvent(
    userId: string,
    matchId: string,
    eventType: string,
    eventData: any,
    skillIndicator?: string,
    performanceMetric?: number
  ): Promise<void> {
    try {
      await supabase.from('performance_events').insert({
        user_id: userId,
        match_id: matchId,
        event_type: eventType,
        event_data: eventData,
        skill_indicator: skillIndicator,
        performance_metric: performanceMetric,
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }
}

export const analystIQService = AnalystIQService.getInstance();
