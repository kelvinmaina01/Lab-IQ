// Hackathon Hub - Main landing page for the hackathon feature } 1
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Trophy, TrendingUp, BookOpen, Play, Star, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getHackathonService, type HackathonChallenge, type LeaderboardEntry } from '@/lib/services/hackathonService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  expert: 'bg-orange-500',
  advanced: 'bg-red-500',
};

export function HackathonHub() {
  const navigate = useNavigate();
  const [featuredChallenges, setFeaturedChallenges] = useState<HackathonChallenge[]>([]);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [topLeaderboard, setTopLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const service = getHackathonService();

      // Load featured challenges
      const challenges = await service.getChallenges({ featured: true });
      setFeaturedChallenges(challenges.slice(0, 3));

      // Load user progress
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const progress = await service.getUserProgress(user.id);
        setUserProgress(progress);
      }

      // Load top 5 leaderboard
      const leaderboard = await service.getLeaderboard(5);
      setTopLeaderboard(leaderboard);

    } catch (error) {
      console.error('Error loading hackathon data:', error);
      toast.error('Failed to load hackathon data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading hackathon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Lab-IQ Hackathons</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Master data science by solving real-world coding challenges. Earn points, climb the leaderboard, and unlock achievements!
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/hackathons/browse')}>
            <Play className="h-5 w-5 mr-2" />
            Start Challenge
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/hackathons/leaderboard')}>
            <Trophy className="h-5 w-5 mr-2" />
            View Leaderboard
          </Button>
        </div>
      </div>

      {/* User Progress Card */}
      {userProgress && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{userProgress.challenges_completed || 0}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{userProgress.total_points || 0}</div>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">#{userProgress.global_rank || '-'}</div>
                <p className="text-sm text-muted-foreground">Global Rank</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{userProgress.success_rate || 0}%</div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>

            {userProgress.current_streak > 0 && (
              <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500 rounded-lg">
                <p className="text-sm font-semibold text-orange-500">
                  🔥 {userProgress.current_streak} Day Streak!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Featured Challenges */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" />
            Featured Challenges
          </h2>
          <Button variant="ghost" onClick={() => navigate('/hackathons/browse')}>
            View All
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {featuredChallenges.map((challenge) => (
            <Card key={challenge.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/hackathons/challenge/${challenge.id}`)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge className={DIFFICULTY_COLORS[challenge.difficulty_level]}>
                    {challenge.difficulty_level}
                  </Badge>
                  <Badge variant="secondary">{challenge.language.toUpperCase()}</Badge>
                </div>
                <CardTitle className="mt-2">{challenge.title}</CardTitle>
                <CardDescription className="line-clamp-2">{challenge.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>~{challenge.estimated_time_minutes} mins</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span>{challenge.base_points} points</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{challenge.success_count} completed</span>
                  </div>

                  {challenge.attempts_count > 0 && (
                    <div className="pt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Success Rate</span>
                        <span>{Math.round((challenge.success_count / challenge.attempts_count) * 100)}%</span>
                      </div>
                      <Progress value={(challenge.success_count / challenge.attempts_count) * 100} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Stats & Leaderboard */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <p className="font-semibold">Choose a Challenge</p>
                <p className="text-sm text-muted-foreground">
                  Select from Python, SQL, or R challenges at your skill level
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <p className="font-semibold">Complete the Code</p>
                <p className="text-sm text-muted-foreground">
                  Fill in blanks, fix bugs, or optimize solutions in our browser IDE
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <p className="font-semibold">Earn Points & Badges</p>
                <p className="text-sm text-muted-foreground">
                  Get rewarded for speed, accuracy, and not using hints
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <p className="font-semibold">Climb the Leaderboard</p>
                <p className="text-sm text-muted-foreground">
                  Compete with peers and track your progress
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>This week's leaderboard</CardDescription>
          </CardHeader>
          <CardContent>
            {topLeaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No rankings yet. Be the first to complete a challenge!
              </p>
            ) : (
              <div className="space-y-3">
                {topLeaderboard.map((entry, index) => (
                  <div key={entry.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-muted'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{entry.email || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.total_challenges_completed} challenges
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{entry.total_points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="flex flex-col md:flex-row items-center justify-between p-8">
          <div className="mb-4 md:mb-0">
            <h3 className="text-2xl font-bold mb-2">Ready to Start Learning?</h3>
            <p className="opacity-90">
              Join thousands of scientists mastering data science through hands-on challenges
            </p>
          </div>
          <Button size="lg" variant="secondary" onClick={() => navigate('/hackathons/browse')}>
            <Code2 className="h-5 w-5 mr-2" />
            Browse Challenges
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
