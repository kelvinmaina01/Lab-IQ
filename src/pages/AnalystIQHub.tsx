import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Search, RotateCcw, Zap, Trophy, TrendingUp, Target } from 'lucide-react';
import { analystIQService, type AnalystIQProfile } from '@/lib/services/analystIQService';
import { datasetChallengeService } from '@/lib/services/datasetChallengeService';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';

const AnalystIQHub = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AnalystIQProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    loadProfile();
    loadDatasets();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userProfile = await analystIQService.getOrCreateProfile(user.id);
      if (userProfile) {
        setProfile(userProfile);

        const skillAnalysis = await analystIQService.analyzeSkillProfile(user.id);
        setAnalysis(skillAnalysis);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDatasets = async () => {
    const availableDatasets = await datasetChallengeService.getAvailableDatasets(10);
    setDatasets(availableDatasets);
  };

  const startChallenge = (mode: 'forensic' | 'reverse' | 'racer') => {
    navigate(`/hackathons/challenge?mode=${mode}`);
  };

  const getIQColor = (iq: number) => {
    if (iq >= 1600) return 'text-purple-500';
    if (iq >= 1400) return 'text-blue-500';
    if (iq >= 1200) return 'text-green-500';
    if (iq >= 1000) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const getLevel = (iq: number) => {
    if (iq >= 1800) return 'Master';
    if (iq >= 1600) return 'Expert';
    if (iq >= 1400) return 'Advanced';
    if (iq >= 1200) return 'Intermediate';
    if (iq >= 1000) return 'Novice';
    return 'Beginner';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Brain className="w-12 h-12 animate-pulse" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🏆 Hackathons - Analyst IQ System</h1>
            <p className="text-muted-foreground">
              Dataset-based challenges with adaptive AI difficulty | Choose your mode: Forensic Lab, Reverse Engineer, or Ghost Racer
            </p>
          </div>
          <Button
            onClick={() => navigate('/hackathons/leaderboard')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </Button>
        </div>

        {/* User Profile Card */}
        {profile && (
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  Overall IQ: <span className={getIQColor(profile.overall_iq)}>{profile.overall_iq}</span>
                </h2>
                <Badge variant="outline">{getLevel(profile.overall_iq)}</Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Challenges Completed</p>
                <p className="text-2xl font-bold">{profile.total_challenges_completed}</p>
              </div>
            </div>

            {/* Skill Breakdown */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Search className="w-4 h-4" />
                  <p className="text-sm font-semibold">Forensic</p>
                </div>
                <p className={`text-xl font-bold ${getIQColor(profile.data_integrity_score)}`}>
                  {profile.data_integrity_score}
                </p>
                <Progress value={((profile.data_integrity_score - 800) / 1200) * 100} className="mt-2" />
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <RotateCcw className="w-4 h-4" />
                  <p className="text-sm font-semibold">Reverse</p>
                </div>
                <p className={`text-xl font-bold ${getIQColor(profile.logic_reasoning_score)}`}>
                  {profile.logic_reasoning_score}
                </p>
                <Progress value={((profile.logic_reasoning_score - 800) / 1200) * 100} className="mt-2" />
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="w-4 h-4" />
                  <p className="text-sm font-semibold">Racer</p>
                </div>
                <p className={`text-xl font-bold ${getIQColor(profile.optimization_score)}`}>
                  {profile.optimization_score}
                </p>
                <Progress value={((profile.optimization_score - 800) / 1200) * 100} className="mt-2" />
              </div>
            </div>

            {/* Recommendations */}
            {analysis && analysis.recommendations.length > 0 && (
              <div className="mt-4 p-3 bg-accent/50 rounded">
                <p className="text-sm font-semibold mb-2">💡 Recommendations:</p>
                {analysis.recommendations.map((rec: string, idx: number) => (
                  <p key={idx} className="text-sm text-muted-foreground">• {rec}</p>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Three Challenge Modes */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Forensic Lab */}
          <Card className="p-6 hover:shadow-lg transition-all border-2 hover:border-red-500/50 cursor-pointer group">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Search className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">🔍 Forensic Lab</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Find and fix data quality issues in corrupted datasets
              </p>

              <div className="space-y-2 mb-4 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-red-500" />
                  <span>Data Integrity Score: {profile?.data_integrity_score || 1000}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  • Identify outliers and anomalies
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  • Fix encoding and formatting issues
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  • Validate data quality
                </div>
              </div>

              <Button
                onClick={() => startChallenge('forensic')}
                className="w-full bg-red-500 hover:bg-red-600"
              >
                Start Forensic Challenge
              </Button>
            </div>
          </Card>

          {/* Reverse Engineer */}
          <Card className="p-6 hover:shadow-lg transition-all border-2 hover:border-blue-500/50 cursor-pointer group">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <RotateCcw className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">🔄 Reverse Engineer</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Recreate the analysis that produced the target output
              </p>

              <div className="space-y-2 mb-4 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span>Logic Reasoning Score: {profile?.logic_reasoning_score || 1000}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  • Analyze target outputs
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  • Reconstruct logic & transformations
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  • Match exact results
                </div>
              </div>

              <Button
                onClick={() => startChallenge('reverse')}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                Start Reverse Challenge
              </Button>
            </div>
          </Card>

          {/* Ghost Racer */}
          <Card className="p-6 hover:shadow-lg transition-all border-2 hover:border-yellow-500/50 cursor-pointer group">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">⚡ Ghost Racer</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Optimize slow code to beat target execution time
              </p>

              <div className="space-y-2 mb-4 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-yellow-500" />
                  <span>Optimization Score: {profile?.optimization_score || 1000}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  • Identify bottlenecks
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  • Apply optimizations
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  • Beat time targets
                </div>
              </div>

              <Button
                onClick={() => startChallenge('racer')}
                className="w-full bg-yellow-500 hover:bg-yellow-600"
              >
                Start Racer Challenge
              </Button>
            </div>
          </Card>
        </div>

        {/* Available Datasets */}
        {datasets.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">📊 Available Datasets</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasets.slice(0, 6).map((dataset) => (
                <Card key={dataset.id} className="p-4 hover:shadow-md transition-all">
                  <h3 className="font-semibold mb-2">{dataset.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {dataset.description}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {dataset.row_count || 0} rows
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {dataset.column_count || 0} columns
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {dataset.file_type}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rank</p>
                <p className="text-xl font-bold">#{Math.floor(profile?.overall_iq || 1000 / 10)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Learning Velocity</p>
                <p className="text-xl font-bold">{profile?.learning_velocity.toFixed(2)}x</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-xl font-bold">
                  {((profile?.challenge_completion_rate || 0) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="text-xl font-bold">{profile?.total_time_spent_minutes || 0}m</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default AnalystIQHub;
