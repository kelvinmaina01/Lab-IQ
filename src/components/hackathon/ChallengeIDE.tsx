// Challenge IDE component for the hackathon system

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, Save, Send, Lightbulb, MessageSquare, X, Check, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getHackathonService } from '@/lib/services/hackathonService';
import { getHackathonExecutionService } from '@/lib/services/hackathonExecutionService';
import { getExecutionEngine } from '@/lib/services/executionEngines';
import type { HackathonChallenge } from '@/lib/services/hackathonService';
import type { ChallengeResult, TestResult } from '@/lib/services/executionEngines';
import { HintModal } from './HintModal';
import { SubmissionSuccess } from './SubmissionSuccess';
import { supabase } from '@/integrations/supabase/client';

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  expert: 'bg-orange-500',
  advanced: 'bg-red-500',
};

const DIFFICULTY_STARS = {
  beginner: 1,
  intermediate: 2,
  expert: 3,
  advanced: 4,
};

export function ChallengeIDE() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<HackathonChallenge | null>(null);
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [plots, setPlots] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load challenge
  useEffect(() => {
    if (!challengeId) return;

    const loadChallenge = async () => {
      try {
        const service = getHackathonService();
        const challengeData = await service.getChallenge(challengeId);

        if (!challengeData) {
          toast.error('Challenge not found');
          navigate('/hackathons');
          return;
        }

        setChallenge(challengeData);
        setCode(challengeData.incomplete_code);
        setStartTime(Date.now());

        // Pre-initialize execution engine
        const engine = getExecutionEngine(challengeData.language);
        await engine.initialize();
        setIsInitializing(false);

        toast.success('Challenge loaded! Good luck!');
      } catch (error) {
        console.error('Error loading challenge:', error);
        toast.error('Failed to load challenge');
      }
    };

    loadChallenge();
  }, [challengeId, navigate]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startTime]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Run code without submitting
  const handleRunCode = async () => {
    if (!challenge) return;

    setIsRunning(true);
    setOutput('Running your code...\n');
    setTestResults([]);
    setPlots([]);

    try {
      const executionService = getHackathonExecutionService();
      const result = await executionService.executeChallenge(
        challenge.language,
        code,
        challenge.dataset_url,
        challenge.test_cases,
        challenge.base_points
      );

      setOutput(result.feedback);
      setTestResults(result.testResults);
      setPlots(result.plots || []);

      if (result.passed) {
        toast.success('All tests passed! Ready to submit.');
      } else {
        toast.info('Some tests failed. Keep working on it!');
      }
    } catch (error) {
      console.error('Execution error:', error);
      setOutput(`Error: ${error instanceof Error ? error.message : String(error)}`);
      toast.error('Failed to run code');
    } finally {
      setIsRunning(false);
    }
  };

  // Submit solution
  const handleSubmit = async () => {
    if (!challenge) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to submit');
        return;
      }

      const executionService = getHackathonExecutionService();
      const completionTime = Math.floor((Date.now() - startTime) / 1000);

      const result = await executionService.executeChallenge(
        challenge.language,
        code,
        challenge.dataset_url,
        challenge.test_cases,
        challenge.base_points,
        completionTime,
        challenge.estimated_time_minutes * 60
      );

      if (!result.passed) {
        toast.error('Your solution did not pass all tests');
        setOutput(result.feedback);
        setTestResults(result.testResults);
        return;
      }

      // Calculate time bonus and hint penalty
      const timeThreshold = challenge.estimated_time_minutes * 60;
      const timeBonus = completionTime < timeThreshold ? Math.floor(((timeThreshold - completionTime) / timeThreshold) * challenge.time_bonus_points) : 0;
      const hintPenalty = hintsUsed * challenge.hint_penalty_points;

      // Submit to database
      const service = getHackathonService();
      await service.submitChallenge({
        challenge_id: challenge.id,
        user_id: user.id,
        submitted_code: code,
        language: challenge.language,
        passed: true,
        test_results: result.testResults,
        execution_output: result.output,
        completion_time_seconds: completionTime,
        hints_used: hintsUsed,
        attempts_before_success: 1, // TODO: track actual attempts
        base_score: challenge.base_points,
        time_bonus: timeBonus,
        hint_penalty: hintPenalty,
      });

      setFinalScore(result.score);
      setShowSuccess(true);
      toast.success('Challenge completed successfully!');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit solution');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle hint request
  const handleHintRequest = () => {
    setShowHintModal(true);
  };

  // Handle hint used
  const handleHintUsed = async (hintLevel: number, blankId?: string) => {
    setHintsUsed(hintsUsed + 1);

    // Record hint usage
    if (challenge) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const service = getHackathonService();
          await service.recordHintUsage({
            user_id: user.id,
            challenge_id: challenge.id,
            hint_level: hintLevel,
            blank_id: blankId,
            points_deducted: challenge.hint_penalty_points,
          });
        }
      } catch (error) {
        console.error('Error recording hint:', error);
      }
    }
  };

  if (!challenge) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading challenge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/hackathons')}>
              <X className="h-4 w-4 mr-2" />
              Exit
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <div>
              <h1 className="text-xl font-bold">{challenge.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={DIFFICULTY_COLORS[challenge.difficulty_level]}>
                  {challenge.difficulty_level}
                  {' '}
                  {'★'.repeat(DIFFICULTY_STARS[challenge.difficulty_level])}
                </Badge>
                <Badge variant="secondary">{challenge.language.toUpperCase()}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(elapsedTime)}</span>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-2 text-sm">
              <Award className="h-4 w-4" />
              <span className="font-semibold">{challenge.base_points} pts</span>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4" />
              <span>{3 - hintsUsed} hints left</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleHintRequest} disabled={hintsUsed >= 3}>
              <Lightbulb className="h-4 w-4 mr-2" />
              Get Hint
            </Button>
            <Button variant="outline" size="sm" onClick={handleRunCode} disabled={isRunning || isInitializing}>
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? 'Running...' : 'Run Code'}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || isRunning || isInitializing}>
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Instructions */}
        <div className="w-80 border-r bg-card overflow-y-auto">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Challenge</h3>
                <p className="text-sm text-muted-foreground">{challenge.description}</p>
              </div>

              {challenge.learning_objectives.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Learning Objectives</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {challenge.learning_objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {challenge.concepts_tested.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Concepts</h3>
                  <div className="flex flex-wrap gap-2">
                    {challenge.concepts_tested.map((concept, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {challenge.dataset_url && (
                <div>
                  <h3 className="font-semibold mb-2">Dataset</h3>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={challenge.dataset_url} target="_blank" rel="noopener noreferrer">
                      View Dataset
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Center panel - Code editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage={challenge.language === 'python' ? 'python' : challenge.language === 'sql' ? 'sql' : 'r'}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: challenge.language === 'python' ? 4 : 2,
              }}
            />
          </div>
        </div>

        {/* Right panel - Output */}
        <div className="w-96 border-l bg-card flex flex-col">
          <Tabs defaultValue="console" className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="console" className="flex-1">
                Console
              </TabsTrigger>
              <TabsTrigger value="tests" className="flex-1">
                Tests {testResults.length > 0 && `(${testResults.filter((t) => t.passed).length}/${testResults.length})`}
              </TabsTrigger>
              {plots.length > 0 && (
                <TabsTrigger value="plots" className="flex-1">
                  Plots
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="console" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-4 font-mono text-sm whitespace-pre-wrap">{output || 'Run your code to see output...'}</div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tests" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {testResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Run your code to see test results...</p>
                  ) : (
                    testResults.map((result, i) => (
                      <Card key={i} className={result.passed ? 'border-green-500' : 'border-red-500'}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-2">
                            {result.passed ? (
                              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <CardTitle className="text-sm">{result.test}</CardTitle>
                              {result.message && (
                                <CardDescription className="text-xs mt-1">{result.message}</CardDescription>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {plots.length > 0 && (
              <TabsContent value="plots" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {plots.map((plot, i) => (
                      <img key={i} src={`data:image/png;base64,${plot}`} alt={`Plot ${i + 1}`} className="w-full rounded-lg border" />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Hint Modal */}
      {showHintModal && challenge && (
        <HintModal
          isOpen={showHintModal}
          onClose={() => setShowHintModal(false)}
          challenge={challenge}
          onHintUsed={handleHintUsed}
        />
      )}

      {/* Success Modal */}
      {showSuccess && (
        <SubmissionSuccess
          isOpen={showSuccess}
          onClose={() => {
            setShowSuccess(false);
            navigate('/hackathons');
          }}
          score={finalScore}
          challenge={challenge}
          completionTime={elapsedTime}
          hintsUsed={hintsUsed}
        />
      )}
    </div>
  );
}
