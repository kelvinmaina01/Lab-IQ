// Unified hackathon execution service that handles code validation and scoring

import {
  getExecutionEngine,
  type ExecutionLanguage,
  type TestCase,
  type TestResult,
  type ChallengeResult,
} from './executionEngines';

export class HackathonExecutionService {
  /**
   * Execute user code against a challenge and return results
   */
  async executeChallenge(
    language: ExecutionLanguage,
    userCode: string,
    datasetUrl: string | undefined,
    testCases: TestCase[],
    basePoints: number = 100,
    completionTimeSeconds?: number,
    timeThresholdSeconds?: number
  ): Promise<ChallengeResult> {
    const engine = getExecutionEngine(language);

    // Execute user code
    const execution = await engine.executeCode(userCode, datasetUrl);

    if (!execution.success) {
      return {
        passed: false,
        error: execution.error,
        testResults: [],
        score: 0,
        feedback: this.generateErrorFeedback(execution.error || 'Unknown error', execution.traceback),
      };
    }

    // Run test cases
    const testResults = await this.runTestCases(execution.output, testCases);

    const allPassed = testResults.every((t) => t.passed);

    // Calculate score
    const score = this.calculateScore({
      basePoints,
      passed: allPassed,
      testResults,
      completionTimeSeconds,
      timeThresholdSeconds,
    });

    return {
      passed: allPassed,
      testResults,
      output: execution.output,
      plots: execution.plots,
      score,
      feedback: this.generateFeedback(testResults, allPassed),
    };
  }

  /**
   * Run all test cases against the execution output
   */
  private async runTestCases(output: any, testCases: TestCase[]): Promise<TestResult[]> {
    return testCases.map((tc) => {
      try {
        switch (tc.validation_type) {
          case 'exact_match':
            return this.testExactMatch(output, tc);
          case 'numeric_tolerance':
            return this.testNumericTolerance(output, tc);
          case 'shape_match':
            return this.testShapeMatch(output, tc);
          case 'regex_match':
            return this.testRegexMatch(output, tc);
          default:
            return {
              passed: false,
              test: tc.description,
              message: `Unknown validation type: ${tc.validation_type}`,
            };
        }
      } catch (error) {
        return {
          passed: false,
          test: tc.description,
          message: `Test error: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    });
  }

  /**
   * Test for exact match
   */
  private testExactMatch(output: any, testCase: TestCase): TestResult {
    const expected = testCase.expected_output;
    const matches = JSON.stringify(output) === JSON.stringify(expected);

    return {
      passed: matches,
      test: testCase.description,
      expected,
      actual: output,
      message: matches ? 'Output matches expected value' : 'Output does not match expected value',
    };
  }

  /**
   * Test numeric values with tolerance
   */
  private testNumericTolerance(output: any, testCase: TestCase): TestResult {
    const tolerance = testCase.tolerance || 0.001;
    const expected = testCase.expected_output;

    if (typeof output !== 'number' || typeof expected !== 'number') {
      return {
        passed: false,
        test: testCase.description,
        expected,
        actual: output,
        message: 'Output or expected value is not a number',
      };
    }

    const diff = Math.abs(output - expected);
    const passed = diff <= tolerance;

    return {
      passed,
      test: testCase.description,
      expected,
      actual: output,
      message: passed
        ? `Value within tolerance (±${tolerance})`
        : `Value differs by ${diff.toFixed(6)} (tolerance: ±${tolerance})`,
    };
  }

  /**
   * Test data structure shape (rows/columns)
   */
  private testShapeMatch(output: any, testCase: TestCase): TestResult {
    const expectedShape = testCase.expected_shape;

    if (!expectedShape) {
      return {
        passed: false,
        test: testCase.description,
        message: 'No expected shape specified',
      };
    }

    let actualRows = 0;
    let actualCols = 0;

    // Handle arrays/lists
    if (Array.isArray(output)) {
      actualRows = output.length;
      if (output.length > 0) {
        if (Array.isArray(output[0])) {
          actualCols = output[0].length;
        } else if (typeof output[0] === 'object') {
          actualCols = Object.keys(output[0]).length;
        }
      }
    }

    const rowsMatch = expectedShape.rows === undefined || actualRows === expectedShape.rows;
    const colsMatch = expectedShape.cols === undefined || actualCols === expectedShape.cols;
    const passed = rowsMatch && colsMatch;

    return {
      passed,
      test: testCase.description,
      expected: expectedShape,
      actual: { rows: actualRows, cols: actualCols },
      message: passed
        ? 'Shape matches expected dimensions'
        : `Expected ${expectedShape.rows || '?'} rows and ${expectedShape.cols || '?'} columns, got ${actualRows} rows and ${actualCols} columns`,
    };
  }

  /**
   * Test output against regex pattern
   */
  private testRegexMatch(output: any, testCase: TestCase): TestResult {
    if (!testCase.regex_pattern) {
      return {
        passed: false,
        test: testCase.description,
        message: 'No regex pattern specified',
      };
    }

    const regex = new RegExp(testCase.regex_pattern);
    const outputStr = String(output);
    const passed = regex.test(outputStr);

    return {
      passed,
      test: testCase.description,
      actual: outputStr,
      message: passed ? 'Output matches pattern' : `Output does not match pattern: ${testCase.regex_pattern}`,
    };
  }

  /**
   * Calculate final score based on performance
   */
  private calculateScore(params: {
    basePoints: number;
    passed: boolean;
    testResults: TestResult[];
    completionTimeSeconds?: number;
    timeThresholdSeconds?: number;
  }): number {
    if (!params.passed) {
      return 0;
    }

    let score = params.basePoints;

    // Time bonus if completed quickly
    if (
      params.completionTimeSeconds !== undefined &&
      params.timeThresholdSeconds !== undefined &&
      params.completionTimeSeconds < params.timeThresholdSeconds
    ) {
      const timeSaved = params.timeThresholdSeconds - params.completionTimeSeconds;
      const timeBonus = Math.floor((timeSaved / params.timeThresholdSeconds) * 50);
      score += timeBonus;
    }

    return Math.max(0, score);
  }

  /**
   * Generate helpful feedback for errors
   */
  private generateErrorFeedback(error: string, traceback?: string): string {
    const feedback: string[] = [];

    feedback.push('❌ Your code encountered an error:');
    feedback.push('');
    feedback.push(error);

    if (traceback) {
      feedback.push('');
      feedback.push('Traceback:');
      feedback.push(traceback);
    }

    // Add helpful hints based on error type
    if (error.includes('NameError') || error.includes('not defined')) {
      feedback.push('');
      feedback.push('💡 Hint: Check that all variables and functions are defined before use.');
    } else if (error.includes('SyntaxError')) {
      feedback.push('');
      feedback.push('💡 Hint: Check your code syntax - look for missing brackets, quotes, or colons.');
    } else if (error.includes('KeyError')) {
      feedback.push('');
      feedback.push('💡 Hint: The column or key you\'re trying to access doesn\'t exist. Check the dataset schema.');
    } else if (error.includes('IndexError')) {
      feedback.push('');
      feedback.push('💡 Hint: You\'re trying to access an index that doesn\'t exist. Check array bounds.');
    } else if (error.includes('TypeError')) {
      feedback.push('');
      feedback.push('💡 Hint: You\'re using an operation on incompatible data types. Check your data types.');
    }

    return feedback.join('\n');
  }

  /**
   * Generate feedback based on test results
   */
  private generateFeedback(testResults: TestResult[], allPassed: boolean): string {
    if (allPassed) {
      return '🎉 Excellent! All tests passed. Your solution is correct!';
    }

    const feedback: string[] = [];
    const passedCount = testResults.filter((t) => t.passed).length;
    const totalCount = testResults.length;

    feedback.push(`✓ ${passedCount}/${totalCount} tests passed`);
    feedback.push('');

    // List failed tests
    const failedTests = testResults.filter((t) => !t.passed);
    if (failedTests.length > 0) {
      feedback.push('Failed tests:');
      failedTests.forEach((test) => {
        feedback.push(`  ❌ ${test.test}`);
        if (test.message) {
          feedback.push(`     ${test.message}`);
        }
      });
    }

    return feedback.join('\n');
  }

  /**
   * Pre-initialize engines for faster first execution
   */
  async preloadEngines(languages: ExecutionLanguage[]): Promise<void> {
    const promises = languages.map((lang) => {
      const engine = getExecutionEngine(lang);
      return engine.initialize().catch((error) => {
        console.warn(`Failed to preload ${lang} engine:`, error);
      });
    });

    await Promise.all(promises);
  }
}

// Singleton instance
let executionService: HackathonExecutionService | null = null;

export function getHackathonExecutionService(): HackathonExecutionService {
  if (!executionService) {
    executionService = new HackathonExecutionService();
  }
  return executionService;
}
