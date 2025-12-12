// Hackathon Leaderboard page

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Zap, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getHackathonService, type LeaderboardEntry } from '@/lib/services/hackathonService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function HackathonLeaderboard() {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [speedLeaderboard, setSpeedLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [accuracyLeaderboard, setAccuracyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      const service = getHackathonService();

      // Load different leaderboards
      const [global, speed, accuracy] = await Promise.all([
        service.getLeaderboard(100, 'total_points'),
        service.getLeaderboard(100, 'speed_run_score'),
        service.getLeaderboard(100, 'accuracy_score'),
      ]);

      setGlobalLeaderboard(global);
      setSpeedLeaderboard(speed);
      setAccuracyLeaderboard(accuracy);

      // Load user's position
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const position = await service.getUserLeaderboardPosition(user.id);
        setUserPosition(position);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getInitials = (email?: string) => {
    if (!email) return '?';
    return email.substring(0, 2).toUpperCase();
  };

  const LeaderboardTable = ({ entries, sortBy }: { entries: LeaderboardEntry[]; sortBy: 'total_points' | 'speed_run_score' | 'accuracy_score' }) => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No rankings yet. Be the first to complete a challenge!</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map((entry, index) => {
          const isCurrentUser = userPosition && entry.user_id === userPosition.user_id;
          const rank = index + 1;

          return (
            <Card
              key={entry.user_id}
              className={`${isCurrentUser ? 'border-2 border-primary bg-primary/5' : ''} ${
                rank <= 3 ? 'bg-muted/50' : ''
              }`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                {/* Rank */}
                <div className="w-12 flex items-center justify-center">
                  {getRankDisplay(rank)}
                </div>

                {/* Avatar */}
                <Avatar>
                  <AvatarFallback>{getInitials(entry.email)}</AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{entry.email || 'Anonymous User'}</p>
                    {isCurrentUser && <Badge variant="secondary">You</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {entry.total_challenges_completed} challenges completed
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {sortBy === 'total_points' && entry.total_points}
                    {sortBy === 'speed_run_score' && entry.speed_run_score}
                    {sortBy === 'accuracy_score' && entry.accuracy_score}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sortBy === 'total_points' && 'points'}
                    {sortBy === 'speed_run_score' && 'speed score'}
                    {sortBy === 'accuracy_score' && 'accuracy'}
                  </p>
                </div>

                {/* Badges */}
                {entry.badges_earned && entry.badges_earned.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">{entry.badges_earned.length}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
          <Trophy className="h-10 w-10 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-xl text-muted-foreground">
          Compete with peers and climb the ranks!
        </p>
      </div>

      {/* User Position Card */}
      {userPosition && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Your Ranking</CardTitle>
            <CardDescription>Current position across all leaderboards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">#{userPosition.global_rank || '-'}</div>
                <p className="text-sm text-muted-foreground">Global</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{userPosition.total_points}</div>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{userPosition.total_challenges_completed}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Tabs */}
      <Tabs defaultValue="global" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Global
          </TabsTrigger>
          <TabsTrigger value="speed" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Speed Run
          </TabsTrigger>
          <TabsTrigger value="accuracy" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Accuracy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <Card>
            <CardHeader>
              <CardTitle>Global Leaderboard</CardTitle>
              <CardDescription>Ranked by total points earned</CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardTable entries={globalLeaderboard} sortBy="total_points" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="speed">
          <Card>
            <CardHeader>
              <CardTitle>Speed Run Leaderboard</CardTitle>
              <CardDescription>Ranked by time bonuses earned</CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardTable entries={speedLeaderboard} sortBy="speed_run_score" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accuracy">
          <Card>
            <CardHeader>
              <CardTitle>Accuracy Leaderboard</CardTitle>
              <CardDescription>Ranked by first-attempt success rate</CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardTable entries={accuracyLeaderboard} sortBy="accuracy_score" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
