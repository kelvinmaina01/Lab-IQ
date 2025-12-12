// Hint modal component with progressive hint system

import React, { useState } from 'react';
import { Lightbulb, Lock, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { HackathonChallenge, BlankDefinition } from '@/lib/services/hackathonService';

interface HintModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: HackathonChallenge;
  onHintUsed: (hintLevel: number, blankId?: string) => void;
}

export function HintModal({ isOpen, onClose, challenge, onHintUsed }: HintModalProps) {
  const [revealedHints, setRevealedHints] = useState<Set<string>>(new Set());
  const [currentBlank, setCurrentBlank] = useState<number>(0);

  const blanks = challenge.blanks as BlankDefinition[];

  if (blanks.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Hints Available</DialogTitle>
            <DialogDescription>
              This challenge doesn't have specific hints configured.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  const blank = blanks[currentBlank];

  const revealHint = (level: number) => {
    const hintKey = `${blank.id}-${level}`;
    if (!revealedHints.has(hintKey)) {
      setRevealedHints(new Set(revealedHints).add(hintKey));
      onHintUsed(level, blank.id);
    }
  };

  const isHintRevealed = (level: number) => {
    return revealedHints.has(`${blank.id}-${level}`);
  };

  const getPreviousHintRevealed = (level: number) => {
    if (level === 1) return true;
    return isHintRevealed(level - 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Progressive Hints
          </DialogTitle>
          <DialogDescription>
            Hints are revealed progressively. Each hint costs {challenge.hint_penalty_points} points.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Blank {currentBlank + 1} of {blanks.length}:</strong> {blank.concept_tested}
            </AlertDescription>
          </Alert>

          {/* Hint Level 1: Conceptual */}
          <Card className={isHintRevealed(1) ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">Level 1: Conceptual Hint</CardTitle>
                  <Badge variant="outline">-{challenge.hint_penalty_points} pts</Badge>
                </div>
                {!isHintRevealed(1) && (
                  <Button size="sm" onClick={() => revealHint(1)}>
                    Reveal
                  </Button>
                )}
              </div>
              <CardDescription className="text-xs">
                Helps you understand the concept without giving away the answer
              </CardDescription>
            </CardHeader>
            {isHintRevealed(1) && (
              <CardContent>
                <p className="text-sm">{blank.hint_progression[0]}</p>
              </CardContent>
            )}
          </Card>

          {/* Hint Level 2: Syntax */}
          <Card className={isHintRevealed(2) ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">Level 2: Syntax Hint</CardTitle>
                  <Badge variant="outline">-{challenge.hint_penalty_points * 2} pts</Badge>
                </div>
                {!getPreviousHintRevealed(2) ? (
                  <Button size="sm" variant="ghost" disabled>
                    <Lock className="h-4 w-4 mr-2" />
                    Locked
                  </Button>
                ) : !isHintRevealed(2) ? (
                  <Button size="sm" onClick={() => revealHint(2)}>
                    Reveal
                  </Button>
                ) : null}
              </div>
              <CardDescription className="text-xs">
                Provides syntax guidance and function names
              </CardDescription>
            </CardHeader>
            {isHintRevealed(2) && (
              <CardContent>
                <p className="text-sm">{blank.hint_progression[1]}</p>
              </CardContent>
            )}
          </Card>

          {/* Hint Level 3: Code */}
          <Card className={isHintRevealed(3) ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">Level 3: Code Hint</CardTitle>
                  <Badge variant="outline">-{challenge.hint_penalty_points * 3} pts</Badge>
                </div>
                {!getPreviousHintRevealed(3) ? (
                  <Button size="sm" variant="ghost" disabled>
                    <Lock className="h-4 w-4 mr-2" />
                    Locked
                  </Button>
                ) : !isHintRevealed(3) ? (
                  <Button size="sm" onClick={() => revealHint(3)}>
                    Reveal
                  </Button>
                ) : null}
              </div>
              <CardDescription className="text-xs">
                Shows you the exact code to use
              </CardDescription>
            </CardHeader>
            {isHintRevealed(3) && (
              <CardContent>
                <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                  {blank.hint_progression[2]}
                </pre>
              </CardContent>
            )}
          </Card>

          {/* Navigation */}
          {blanks.length > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentBlank(Math.max(0, currentBlank - 1))}
                disabled={currentBlank === 0}
              >
                Previous Blank
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentBlank + 1} / {blanks.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentBlank(Math.min(blanks.length - 1, currentBlank + 1))}
                disabled={currentBlank === blanks.length - 1}
              >
                Next Blank
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
