import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Editor from '@monaco-editor/react';
import { Play, Download, Save, Database, Code2, Brain, Trophy, Loader2, Clock, Zap, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { datasetChallengeService, type ChallengeSession } from '@/lib/services/datasetChallengeService';
import { analystIQService } from '@/lib/services/analystIQService';
import { supabase } from '@/integrations/supabase/client';
import { getPythonExecutor, type ExecutionResult as PythonResult } from '@/lib/services/pythonExecutor';
import { getSQLExecutor, type SQLResult } from '@/lib/services/sqlExecutor';
import { useNavigate } from 'react-router-dom';

interface DatasetExplorerProps {
  mode: 'forensic' | 'reverse' | 'racer';
  datasetId?: string;
}

// Output types for unified display
interface ExecutionOutput {
  type: 'success' | 'error' | 'result' | 'loading';
  data?: any;
  stdout?: string;
  message?: string;
  success?: boolean;
  accuracy?: number;
  iq_change?: number;
  feedback?: string[];
  execution_time_ms?: number;
  plots?: string[];
  columns?: string[];
  rows?: any[];
  row_count?: number;
}

export const DatasetExplorer: React.FC<DatasetExplorerProps> = ({ mode, datasetId }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<ChallengeSession | null>(null);
  const [sqlCode, setSqlCode] = useState<string>('-- Write your SQL query here\nSELECT * FROM dataset LIMIT 10;');
  const [pythonCode, setPythonCode] = useState<string>('# Write your Python code here\nimport pandas as pd\n\n# Dataset is pre-loaded as "df"\nprint(df.head())');
  const [activeTab, setActiveTab] = useState<'sql' | 'python'>('python');
  const [output, setOutput] = useState<ExecutionOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [userIQ, setUserIQ] = useState<number>(1000);
  const [executing, setExecuting] = useState(false);
  const [executorReady, setExecutorReady] = useState<{ python: boolean; sql: boolean }>({ python: false, sql: false });
  const [initProgress, setInitProgress] = useState<number>(0);
  const [lastExecutionTime, setLastExecutionTime] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState<number>(0);
  const [datasetLoaded, setDatasetLoaded] = useState(false);

  // Initialize execution engines on mount
  useEffect(() => {
    initializeExecutors();
  }, []);

  useEffect(() => {
    initializeChallenge();
    loadUserIQ();
  }, [mode, datasetId]);

  /**
   * Initialize Python (Pyodide) and SQL (DuckDB-WASM) execution engines
   */
  const initializeExecutors = async () => {
    setInitProgress(10);

    try {
      // Initialize SQL executor first (faster)
      const sqlExecutor = getSQLExecutor();
      await sqlExecutor.initialize();
      setExecutorReady(prev => ({ ...prev, sql: true }));
      setInitProgress(40);

      // Initialize Python executor (larger)
      const pythonExecutor = getPythonExecutor();
      await pythonExecutor.initialize();
      setExecutorReady(prev => ({ ...prev, python: true }));
      setInitProgress(100);

      console.log('✅ All execution engines initialized');
    } catch (error) {
      console.error('Failed to initialize executors:', error);
      setOutput({
        type: 'error',
        message: `Failed to initialize execution engine: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  /**
   * Load dataset into execution engines
   */
  const loadDatasetIntoExecutors = useCallback(async (dataset: any) => {
    if (!dataset?.data || datasetLoaded) return;

    try {
      // Load into SQL engine
      if (executorReady.sql) {
        const sqlExecutor = getSQLExecutor();
        await sqlExecutor.loadDataset('dataset', dataset.data);
      }

      // Python will load dataset on execution
      setDatasetLoaded(true);
      console.log(`✅ Dataset loaded: ${dataset.data.length} rows`);
    } catch (error) {
      console.error('Failed to load dataset:', error);
    }
  }, [executorReady.sql, datasetLoaded]);

  const initializeChallenge = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const challengeSession = await datasetChallengeService.startChallenge(
      user.id,
      mode,
      datasetId
    );

    if (challengeSession) {
      setSession(challengeSession);

      // Set initial code based on mode
      if (mode === 'forensic') {
        setPythonCode(`# Forensic Lab: Find and fix errors in the dataset
import pandas as pd

# Load the corrupted dataset
df = pd.read_csv("corrupted_data.csv")

# Task 1: Identify data quality issues
# YOUR CODE HERE

# Task 2: Clean the data
# YOUR CODE HERE

# Task 3: Validate your cleaning
# YOUR CODE HERE

print("Cleaned dataset:")
print(df.head())
print(f"\\nShape: {df.shape}")
print(f"\\nMissing values: {df.isnull().sum()}")
`);
        setSqlCode(`-- Forensic Lab: Find and fix errors in SQL
-- Task 1: Identify data quality issues
SELECT * FROM dataset LIMIT 100;

-- Task 2: Find outliers
-- YOUR QUERY HERE

-- Task 3: Find missing patterns
-- YOUR QUERY HERE
`);
      } else if (mode === 'reverse') {
        setPythonCode(`# Reverse Engineer: Recreate the analysis that produced the target output
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("dataset.csv")

# Task 1: Explore the dataset
# YOUR CODE HERE

# Task 2: Perform analysis to match target output
# YOUR CODE HERE

# Task 3: Create visualization if needed
# YOUR CODE HERE
`);
        setSqlCode(`-- Reverse Engineer: Recreate the SQL query that produces the target
-- Target output shown on the right →
-- Write your query here:
SELECT
  -- YOUR COLUMNS HERE
FROM dataset
WHERE
  -- YOUR CONDITIONS HERE
GROUP BY
  -- YOUR GROUPING HERE
`);
      } else if (mode === 'racer') {
        const slowCode = challengeSession.dataset_challenge.racer_data?.slow_code || '';
        setPythonCode(`# Ghost Racer: Optimize this slow code
import pandas as pd
import time

df = pd.read_csv("dataset.csv")

# SLOW CODE (provided):
${slowCode}

# YOUR OPTIMIZED CODE HERE:
# Try to beat ${challengeSession.dataset_challenge.racer_data?.target_time_ms}ms

`);
      }
    }
  };

  const loadUserIQ = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const profile = await analystIQService.getOrCreateProfile(user.id);
    if (profile) {
      let iq = profile.overall_iq;
      if (mode === 'forensic') iq = profile.data_integrity_score;
      else if (mode === 'reverse') iq = profile.logic_reasoning_score;
      else if (mode === 'racer') iq = profile.optimization_score;
      setUserIQ(iq);
    }
  };

  /**
   * Execute code using the appropriate engine (Pyodide for Python, DuckDB for SQL)
   */
  const executeCode = async () => {
    if (!session) return;

    // Check if executor is ready
    const isReady = activeTab === 'python' ? executorReady.python : executorReady.sql;
    if (!isReady) {
      setOutput({
        type: 'error',
        message: `${activeTab === 'python' ? 'Python' : 'SQL'} execution engine is still initializing. Please wait...`,
      });
      return;
    }

    setExecuting(true);
    setOutput({ type: 'loading' });

    try {
      const code = activeTab === 'sql' ? sqlCode : pythonCode;

      // Get dataset from challenge session for context
      const datasetRows = await fetchDatasetRows();
      const dataset = datasetRows ? { data: datasetRows } : undefined;

      if (activeTab === 'python') {
        // Execute Python code
        const pythonExecutor = getPythonExecutor();
        const result: PythonResult = await pythonExecutor.execute(code, dataset);

        setLastExecutionTime(result.execution_time_ms);

        if (result.success) {
          setOutput({
            type: 'success',
            stdout: result.output,
            execution_time_ms: result.execution_time_ms,
            plots: result.plots,
          });
        } else {
          setOutput({
            type: 'error',
            message: result.error || 'Python execution failed',
            execution_time_ms: result.execution_time_ms,
          });
        }
      } else {
        // Execute SQL code
        const sqlExecutor = getSQLExecutor();
        const result: SQLResult = await sqlExecutor.execute(code, dataset);

        setLastExecutionTime(result.execution_time_ms);

        if (result.success) {
          setOutput({
            type: 'success',
            columns: result.columns,
            rows: result.rows,
            row_count: result.row_count,
            execution_time_ms: result.execution_time_ms,
          });
        } else {
          setOutput({
            type: 'error',
            message: result.error || 'SQL execution failed',
            execution_time_ms: result.execution_time_ms,
          });
        }
      }
    } catch (error: any) {
      console.error('Execution error:', error);
      setOutput({
        type: 'error',
        message: error.message || 'An unexpected error occurred',
      });
    } finally {
      setExecuting(false);
    }
  };

  /**
   * Fetch dataset rows from database
   */
  const fetchDatasetRows = async (): Promise<any[] | null> => {
    if (!session?.dataset_challenge?.dataset_id) return null;

    try {
      const { data: rows, error } = await supabase
        .from('dataset_rows')
        .select('data')
        .eq('dataset_id', session.dataset_challenge.dataset_id)
        .order('row_index', { ascending: true })
        .limit(5000); // Limit for browser performance

      if (error) throw error;
      return rows?.map(r => r.data) || null;
    } catch (error) {
      console.error('Failed to fetch dataset rows:', error);
      return null;
    }
  };

  /**
   * Submit solution for validation
   * For Racer mode: execution time is critical
   * For Forensic/Reverse: accuracy of output matters
   */
  const submitSolution = async () => {
    if (!session) return;
    setLoading(true);

    try {
      // If no previous execution, run the code first
      let executionTime = lastExecutionTime || 0;

      if (!lastExecutionTime) {
        // Execute code to get actual timing
        const code = activeTab === 'python' ? pythonCode : sqlCode;
        const datasetRows = await fetchDatasetRows();
        const dataset = datasetRows ? { data: datasetRows } : undefined;

        if (activeTab === 'python' && executorReady.python) {
          const pythonExecutor = getPythonExecutor();
          const result = await pythonExecutor.execute(code, dataset);
          executionTime = result.execution_time_ms;
        } else if (activeTab === 'sql' && executorReady.sql) {
          const sqlExecutor = getSQLExecutor();
          const result = await sqlExecutor.execute(code, dataset);
          executionTime = result.execution_time_ms;
        }
      }

      const result = await datasetChallengeService.submitSolution(
        session.match_id,
        sqlCode,
        pythonCode,
        executionTime
      );

      if (result) {
        setOutput({
          type: 'result',
          success: result.success,
          accuracy: result.accuracy_score,
          iq_change: result.iq_change,
          feedback: result.feedback,
          execution_time_ms: executionTime,
        });

        // Reload IQ
        await loadUserIQ();
      }
    } catch (error) {
      console.error('Error submitting solution:', error);
      setOutput({
        type: 'error',
        message: 'Failed to submit solution. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Use a hint (costs IQ points)
   */
  const useHint = (hintLevel: number) => {
    const hints = session?.dataset_challenge?.forensic_data?.hints ||
                  session?.dataset_challenge?.reverse_data?.target_metrics ||
                  session?.dataset_challenge?.racer_data;

    if (hintLevel > hintUsed) {
      setHintUsed(hintLevel);
      // TODO: Deduct hint cost from user's points
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'forensic': return '🔍';
      case 'reverse': return '🔄';
      case 'racer': return '⚡';
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'forensic': return 'Forensic Lab';
      case 'reverse': return 'Reverse Engineer';
      case 'racer': return 'Ghost Racer';
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'forensic':
        return 'Find and fix data quality issues in the corrupted dataset';
      case 'reverse':
        return 'Recreate the analysis that produced the target output';
      case 'racer':
        return 'Optimize the slow code to beat the target execution time';
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-lg">Loading challenge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Execution Engine Status */}
      {initProgress < 100 && (
        <Card className="p-4 border-2 border-blue-500/50 bg-blue-500/10">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <div className="flex-1">
              <p className="font-medium text-sm">Initializing Execution Engines...</p>
              <Progress value={initProgress} className="h-2 mt-2" />
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span className={executorReady.sql ? 'text-green-500' : ''}>
                  {executorReady.sql ? '✓' : '○'} SQL (DuckDB)
                </span>
                <span className={executorReady.python ? 'text-green-500' : ''}>
                  {executorReady.python ? '✓' : '○'} Python (Pyodide)
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">{getModeIcon()}</span>
            <h1 className="text-2xl font-bold">{getModeTitle()}</h1>
            <Badge variant="outline" className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              IQ {userIQ}
            </Badge>
            <Badge variant="secondary">Difficulty {session.dataset_challenge.difficulty}</Badge>
            {lastExecutionTime && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastExecutionTime}ms
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{getModeDescription()}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/hackathons/leaderboard')}
          >
            <Trophy className="w-4 h-4 mr-1" />
            Leaderboard
          </Button>
        </div>
      </div>

      {/* Dataset Info */}
      <Card className="p-4 bg-accent/30">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-5 h-5" />
          <h3 className="font-semibold">{session.dataset_challenge.dataset_name}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {session.dataset_challenge.dataset_description}
        </p>
      </Card>

      {/* Mode-specific Instructions */}
      {mode === 'reverse' && session.dataset_challenge.reverse_data && (
        <Card className="p-4 border-2 border-primary/50">
          <h3 className="font-semibold mb-2">🎯 Target Output</h3>
          <p className="text-sm mb-2">{session.dataset_challenge.reverse_data.description}</p>
          <div className="bg-muted p-3 rounded font-mono text-sm">
            {/* TODO: Display target visualization or metrics */}
            <pre>{JSON.stringify(session.dataset_challenge.reverse_data.target_metrics, null, 2)}</pre>
          </div>
        </Card>
      )}

      {mode === 'racer' && session.dataset_challenge.racer_data && (
        <Card className="p-4 border-2 border-yellow-500/50">
          <h3 className="font-semibold mb-2">⚡ Challenge</h3>
          <p className="text-sm">
            Beat the target time: <span className="font-bold">{session.dataset_challenge.racer_data.target_time_ms}ms</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            (Optimal: {session.dataset_challenge.racer_data.optimal_time_ms}ms)
          </p>
        </Card>
      )}

      {/* Code Editor Tabs */}
      <Card className="p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sql' | 'python')}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="python" className="flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Python
              </TabsTrigger>
              <TabsTrigger value="sql" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                SQL
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2 items-center">
              {/* Executor Status Indicator */}
              <div className="flex gap-1 mr-2">
                <span
                  className={`w-2 h-2 rounded-full ${executorReady.python ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}
                  title={executorReady.python ? 'Python ready' : 'Python initializing...'}
                />
                <span
                  className={`w-2 h-2 rounded-full ${executorReady.sql ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}
                  title={executorReady.sql ? 'SQL ready' : 'SQL initializing...'}
                />
              </div>

              <Button
                onClick={executeCode}
                disabled={executing || (activeTab === 'python' && !executorReady.python) || (activeTab === 'sql' && !executorReady.sql)}
                size="sm"
                variant="secondary"
              >
                {executing ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-1" />
                )}
                {executing ? 'Executing...' : 'Run Code'}
              </Button>
              <Button
                onClick={submitSolution}
                disabled={loading}
                variant="default"
                size="sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-1" />
                )}
                Submit Solution
              </Button>
            </div>
          </div>

          <TabsContent value="python" className="mt-0">
            <Editor
              height="400px"
              language="python"
              value={pythonCode}
              onChange={(value) => setPythonCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
              }}
            />
          </TabsContent>

          <TabsContent value="sql" className="mt-0">
            <Editor
              height="400px"
              language="sql"
              value={sqlCode}
              onChange={(value) => setSqlCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
              }}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Output Panel */}
      {output && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              Output
              {output.execution_time_ms && (
                <Badge variant="outline" className="font-normal">
                  <Clock className="w-3 h-3 mr-1" />
                  {output.execution_time_ms}ms
                </Badge>
              )}
            </h3>
            {output.row_count !== undefined && (
              <span className="text-sm text-muted-foreground">{output.row_count} rows</span>
            )}
          </div>

          {/* Loading State */}
          {output.type === 'loading' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3">Executing...</span>
            </div>
          )}

          {/* Challenge Result */}
          {output.type === 'result' && (
            <div className="space-y-3">
              <div className={`p-4 rounded ${output.success ? 'bg-green-500/20 border border-green-500/50' : 'bg-yellow-500/20 border border-yellow-500/50'}`}>
                <div className="flex items-center gap-2">
                  {output.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                  <p className="font-semibold">
                    {output.success ? 'Challenge Completed!' : 'Almost There!'}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span>Accuracy: <span className="font-semibold">{((output.accuracy || 0) * 100).toFixed(1)}%</span></span>
                  {output.execution_time_ms && (
                    <span>Time: <span className="font-semibold">{output.execution_time_ms}ms</span></span>
                  )}
                  <span>IQ Change:
                    <span className={`font-semibold ml-1 ${(output.iq_change || 0) > 0 ? 'text-green-500' : (output.iq_change || 0) < 0 ? 'text-red-500' : ''}`}>
                      {(output.iq_change || 0) > 0 ? '+' : ''}{output.iq_change || 0}
                    </span>
                  </span>
                </div>
              </div>

              {output.feedback && output.feedback.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Feedback
                  </p>
                  {output.feedback.map((fb: string, idx: number) => (
                    <p key={idx} className="text-sm text-muted-foreground pl-6">• {fb}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Success - Python Output */}
          {output.type === 'success' && output.stdout && (
            <div className="space-y-3">
              <div className="bg-muted p-3 rounded font-mono text-sm max-h-64 overflow-auto">
                <pre className="whitespace-pre-wrap">{output.stdout}</pre>
              </div>

              {/* Matplotlib Plots */}
              {output.plots && output.plots.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Generated Plots:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {output.plots.map((plot: string, idx: number) => (
                      <div key={idx} className="border rounded p-2 bg-white">
                        <img
                          src={`data:image/png;base64,${plot}`}
                          alt={`Plot ${idx + 1}`}
                          className="w-full h-auto"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success - SQL Results Table */}
          {output.type === 'success' && output.columns && output.rows && (
            <div className="overflow-auto max-h-96">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {output.columns.map((col: string, idx: number) => (
                      <th key={idx} className="p-2 text-left font-semibold border-r last:border-r-0">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {output.rows.slice(0, 100).map((row: any, rowIdx: number) => (
                    <tr key={rowIdx} className="border-b hover:bg-muted/30">
                      {output.columns!.map((col: string, colIdx: number) => (
                        <td key={colIdx} className="p-2 font-mono text-xs border-r last:border-r-0">
                          {row[col] === null ? (
                            <span className="text-muted-foreground italic">NULL</span>
                          ) : typeof row[col] === 'object' ? (
                            JSON.stringify(row[col])
                          ) : (
                            String(row[col])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {output.rows.length > 100 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Showing first 100 of {output.row_count} rows
                </p>
              )}
            </div>
          )}

          {/* Error State */}
          {output.type === 'error' && (
            <div className="bg-red-500/10 border border-red-500/50 p-3 rounded">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-500">Execution Error</p>
                  <pre className="text-sm text-red-400 mt-1 whitespace-pre-wrap font-mono">
                    {output.message}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
