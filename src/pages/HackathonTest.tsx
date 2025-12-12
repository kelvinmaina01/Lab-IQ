// Test page to debug hackathon execution

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getHackathonExecutionService } from '@/lib/services/hackathonExecutionService';
import { getExecutionEngine } from '@/lib/services/executionEngines';

export function HackathonTest() {
  const [pythonCode, setPythonCode] = useState(`import pandas as pd
import numpy as np

# Simple test
data = {'A': [1, 2, 3], 'B': [4, 5, 6]}
df = pd.DataFrame(data)
print(df)
print("Mean of A:", df['A'].mean())`);

  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [engineStatus, setEngineStatus] = useState('Not initialized');

  const testPyodide = async () => {
    setLoading(true);
    setOutput('Initializing Pyodide...\n');

    try {
      const engine = getExecutionEngine('python');
      setEngineStatus('Initializing...');

      await engine.initialize();
      setEngineStatus('✅ Initialized');
      setOutput(prev => prev + 'Pyodide initialized successfully!\n');

      setOutput(prev => prev + 'Running code...\n');
      const result = await engine.executeCode(pythonCode, undefined);

      if (result.success) {
        setOutput(prev => prev + '\n✅ SUCCESS!\n\n' + result.stdout);
        toast.success('Code executed successfully!');
      } else {
        setOutput(prev => prev + '\n❌ ERROR!\n\n' + result.error);
        toast.error('Execution failed');
      }
    } catch (error) {
      setOutput(prev => prev + '\n❌ FATAL ERROR!\n\n' + String(error));
      toast.error('Failed to execute');
      setEngineStatus('❌ Failed');
    } finally {
      setLoading(false);
    }
  };

  const testExecutionService = async () => {
    setLoading(true);
    setOutput('Testing execution service...\n');

    try {
      const service = getHackathonExecutionService();

      const testCases = [
        {
          description: 'Code should execute',
          validation_type: 'exact_match' as const,
          expected_output: null,
        }
      ];

      const result = await service.executeChallenge(
        'python',
        pythonCode,
        undefined,
        testCases,
        100
      );

      setOutput(prev => prev + '\n' + JSON.stringify(result, null, 2));

      if (result.passed) {
        toast.success('Challenge validated!');
      } else {
        toast.info('Some tests failed');
      }
    } catch (error) {
      setOutput(prev => prev + '\n❌ ERROR: ' + String(error));
      toast.error('Service test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Hackathon Execution Test</h1>

      <Card>
        <CardHeader>
          <CardTitle>Engine Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Pyodide: {engineStatus}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Python Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={pythonCode}
            onChange={(e) => setPythonCode(e.target.value)}
            rows={10}
            className="font-mono"
          />

          <div className="flex gap-2">
            <Button onClick={testPyodide} disabled={loading}>
              {loading ? 'Running...' : 'Test Pyodide Directly'}
            </Button>

            <Button onClick={testExecutionService} disabled={loading} variant="secondary">
              Test Execution Service
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Output</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-black text-green-400 p-4 rounded overflow-auto max-h-96 font-mono text-sm">
            {output || 'No output yet. Click a button to test.'}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>1. Click "Test Pyodide Directly" to test if Pyodide can execute code</p>
          <p>2. Click "Test Execution Service" to test the full validation system</p>
          <p>3. Check the browser console (F12) for detailed errors</p>
          <p>4. First run will take 10-15 seconds to download Pyodide (~50MB)</p>
        </CardContent>
      </Card>
    </div>
  );
}
