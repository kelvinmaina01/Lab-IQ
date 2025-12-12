// Challenge Browser - Browse and filter all available challenges

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, Trophy, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { getHackathonService, type HackathonChallenge } from '@/lib/services/hackathonService';
import { toast } from 'sonner';

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  expert: 'bg-orange-500',
  advanced: 'bg-red-500',
};

export function ChallengeBrowser() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<HackathonChallenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<HackathonChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');

  useEffect(() => {
    loadChallenges();
  }, []);

  useEffect(() => {
    filterAndSortChallenges();
  }, [challenges, searchQuery, difficultyFilter, languageFilter, sortBy]);

  const loadChallenges = async () => {
    try {
      const service = getHackathonService();
      const data = await service.getChallenges();
      setChallenges(data);
    } catch (error) {
      console.error('Error loading challenges:', error);
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortChallenges = () => {
    let filtered = [...challenges];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.concepts_tested.some((concept) => concept.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter((c) => c.difficulty_level === difficultyFilter);
    }

    // Language filter
    if (languageFilter !== 'all') {
      filtered = filtered.filter((c) => c.language === languageFilter);
    }

    // Sort
    switch (sortBy) {
      case 'featured':
        filtered.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
        break;
      case 'popular':
        filtered.sort((a, b) => b.success_count - a.success_count);
        break;
      case 'points':
        filtered.sort((a, b) => b.base_points - a.base_points);
        break;
      case 'difficulty':
        const difficultyOrder = { beginner: 1, intermediate: 2, expert: 3, advanced: 4 };
        filtered.sort((a, b) => difficultyOrder[a.difficulty_level] - difficultyOrder[b.difficulty_level]);
        break;
      default:
        break;
    }

    setFilteredChallenges(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Browse Challenges</h1>
        <p className="text-muted-foreground">
          Found {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search challenges, concepts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Difficulty */}
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            {/* Language */}
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="r">R</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="mt-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <div className="flex gap-2">
              {[
                { value: 'featured', label: 'Featured' },
                { value: 'popular', label: 'Popular' },
                { value: 'points', label: 'Points' },
                { value: 'difficulty', label: 'Difficulty' },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenges Grid */}
      {filteredChallenges.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No challenges found matching your filters.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setDifficultyFilter('all');
                setLanguageFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChallenges.map((challenge) => (
            <Card
              key={challenge.id}
              className="hover:shadow-lg transition-shadow cursor-pointer relative"
              onClick={() => navigate(`/hackathons/challenge/${challenge.id}`)}
            >
              {challenge.is_featured && (
                <div className="absolute top-3 right-3">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={DIFFICULTY_COLORS[challenge.difficulty_level]}>
                      {challenge.difficulty_level}
                    </Badge>
                    <Badge variant="secondary">{challenge.language.toUpperCase()}</Badge>
                  </div>
                </div>
                <CardTitle className="mt-2">{challenge.title}</CardTitle>
                <CardDescription className="line-clamp-2">{challenge.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Concepts */}
                {challenge.concepts_tested.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {challenge.concepts_tested.slice(0, 3).map((concept, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {concept}
                      </Badge>
                    ))}
                    {challenge.concepts_tested.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{challenge.concepts_tested.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>~{challenge.estimated_time_minutes} mins</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span>{challenge.base_points} points</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{challenge.success_count} completed</span>
                  </div>
                </div>

                {/* Success Rate */}
                {challenge.attempts_count > 0 && (
                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium">
                        {Math.round((challenge.success_count / challenge.attempts_count) * 100)}%
                      </span>
                    </div>
                    <Progress value={(challenge.success_count / challenge.attempts_count) * 100} className="h-2" />
                  </div>
                )}

                <Button className="w-full mt-4" onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/hackathons/challenge/${challenge.id}`);
                }}>
                  Start Challenge
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
