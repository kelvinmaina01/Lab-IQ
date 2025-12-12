import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, TrendingUp, Search, RotateCcw, Zap, Crown, ArrowLeft } from 'lucide-react';
import { analystIQService } from '@/lib/services/analystIQService';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  email: string;
  iq_score: number;
  percentile?: number;
  wins: number;
  total_matches: number;
  win_rate?: number;
}

const AnalystIQLeaderboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overall' | 'forensic' | 'reverse' | 'racer'>('overall');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      let data: any[] = [];

      if (activeTab === 'overall') {
        // Get overall leaderboard
        const { data: profiles, error } = await supabase
          .from('analyst_iq_profiles')
          .select(`
            user_id,
            overall_iq,
            total_challenges_completed
          `)
          .order('overall_iq', { ascending: false })
          .limit(100);

        if (error) throw error;

        // Get user emails
        const userIds = profiles?.map(p => p.user_id) || [];
        const { data: users } = await supabase.auth.admin.listUsers();

        data = profiles?.map((profile, index) => {
          const userEmail = users?.users.find(u => u.id === profile.user_id)?.email || 'Anonymous';
          return {
            rank: index + 1,
            user_id: profile.user_id,
            email: userEmail,
            iq_score: profile.overall_iq,
            wins: profile.total_challenges_completed,
            total_matches: profile.total_challenges_completed,
            win_rate: 0,
          };
        }) || [];

      } else {
        // Get mode-specific leaderboard
        data = await analystIQService.getLeaderboard(activeTab, 100);
      }

      setLeaderboard(data);

      // Find current user's rank
      if (user) {
        const myEntry = data.find((entry: any) => entry.user_id === user.id);
        setMyRank(myEntry || null);
      }

    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">👑 Champion</Badge>;
    if (rank <= 3) return <Badge className="bg-gray-400">🥈 Top 3</Badge>;
    if (rank <= 10) return <Badge className="bg-amber-600">⭐ Top 10</Badge>;
    if (rank <= 50) return <Badge variant="secondary">Top 50</Badge>;
    return null;
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'forensic': return <Search className="w-5 h-5 text-red-500" />;
      case 'reverse': return <RotateCcw className="w-5 h-5 text-blue-500" />;
      case 'racer': return <Zap className="w-5 h-5 text-yellow-500" />;
      default: return <Trophy className="w-5 h-5 text-primary" />;
    }
  };

  const getIQColor = (iq: number) => {
    if (iq >= 1600) return 'text-purple-500 font-bold';
    if (iq >= 1400) return 'text-blue-500 font-bold';
    if (iq >= 1200) return 'text-green-500 font-semibold';
    if (iq >= 1000) return 'text-yellow-600';
    return 'text-gray-500';
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/hackathons')}
              className="mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Hub
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Global Leaderboard
            </h1>
            <p className="text-muted-foreground mt-1">
              See where you rank among all analysts worldwide
            </p>
          </div>
        </div>

        {/* My Rank Card */}
        {myRank && (
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  {getRankIcon(myRank.rank)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Rank</p>
                  <h2 className="text-3xl font-bold">#{myRank.rank}</h2>
                  <p className="text-sm text-muted-foreground">out of {leaderboard.length} analysts</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">IQ Score</p>
                <p className={`text-4xl font-bold ${getIQColor(myRank.iq_score)}`}>
                  {myRank.iq_score}
                </p>
                {myRank.percentile && (
                  <p className="text-sm text-muted-foreground">
                    Top {100 - myRank.percentile}%
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Tabs for Different Leaderboards */}
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="overall" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Overall
              </TabsTrigger>
              <TabsTrigger value="forensic" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Forensic
              </TabsTrigger>
              <TabsTrigger value="reverse" className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Reverse
              </TabsTrigger>
              <TabsTrigger value="racer" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Racer
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <TrendingUp className="w-8 h-8 animate-pulse" />
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                        entry.user_id === currentUserId
                          ? 'bg-primary/10 border-2 border-primary/50'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      {/* Rank & User */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 flex items-center justify-center">
                          {getRankIcon(entry.rank)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {entry.email === currentUserId ? 'You' : entry.email.split('@')[0]}
                            </p>
                            {getRankBadge(entry.rank)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {entry.wins} {entry.wins === 1 ? 'win' : 'wins'} / {entry.total_matches} matches
                          </p>
                        </div>
                      </div>

                      {/* IQ Score */}
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getIQColor(entry.iq_score)}`}>
                          {entry.iq_score}
                        </p>
                        <p className="text-xs text-muted-foreground">IQ</p>
                      </div>
                    </div>
                  ))}

                  {leaderboard.length === 0 && (
                    <div className="text-center py-12">
                      <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-semibold">No rankings yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Be the first to complete a challenge!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Tabs>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Top Analyst</p>
                <p className="text-xl font-bold">
                  {leaderboard[0] ? leaderboard[0].email.split('@')[0] : '-'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Average IQ</p>
                <p className="text-xl font-bold">
                  {leaderboard.length > 0
                    ? Math.round(leaderboard.reduce((sum, e) => sum + e.iq_score, 0) / leaderboard.length)
                    : 1000}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Analysts</p>
                <p className="text-xl font-bold">{leaderboard.length}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default AnalystIQLeaderboard;
