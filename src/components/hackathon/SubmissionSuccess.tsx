// Success modal shown after completing a challenge

import React from 'react';
import { Trophy, Clock, Lightbulb, Award, Share2, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { HackathonChallenge } from '@/lib/services/hackathonService';
import confetti from 'canvas-confetti';

interface SubmissionSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  challenge: HackathonChallenge;
  completionTime: number;
  hintsUsed: number;
}

export function SubmissionSuccess({
  isOpen,
  onClose,
  score,
  challenge,
  completionTime,
  hintsUsed,
}: SubmissionSuccessProps) {
  React.useEffect(() => {
    if (isOpen) {
      // Trigger confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const timeThreshold = challenge.estimated_time_minutes * 60;
  const earnedTimeBonus = completionTime < timeThreshold;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Challenge Complete!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Score Display */}
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-2">{score}</div>
            <p className="text-sm text-muted-foreground">Total Points Earned</p>
          </div>

          <Separator />

          {/* Stats */}
          <div className="space-y-3">
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Completion Time</p>
                    <p className="text-xs text-muted-foreground">{formatTime(completionTime)}</p>
                  </div>
                </div>
                {earnedTimeBonus && (
                  <Badge variant="default" className="bg-green-500">
                    Speed Bonus!
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Hints Used</p>
                    <p className="text-xs text-muted-foreground">
                      {hintsUsed} of 3 available
                    </p>
                  </div>
                </div>
                {hintsUsed === 0 && (
                  <Badge variant="default" className="bg-purple-500">
                    No Hints!
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Difficulty</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {challenge.difficulty_level}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Score Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Score Breakdown</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Points</span>
                <span className="font-medium">+{challenge.base_points}</span>
              </div>
              {earnedTimeBonus && (
                <div className="flex justify-between text-green-600">
                  <span>Time Bonus</span>
                  <span className="font-medium">
                    +{Math.floor(((timeThreshold - completionTime) / timeThreshold) * challenge.time_bonus_points)}
                  </span>
                </div>
              )}
              {hintsUsed > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Hint Penalty</span>
                  <span className="font-medium">
                    -{hintsUsed * challenge.hint_penalty_points}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => {
            // TODO: Implement share functionality
            navigator.clipboard.writeText(
              `I just completed "${challenge.title}" on Lab-IQ and earned ${score} points!`
            );
          }}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Next Challenge
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
