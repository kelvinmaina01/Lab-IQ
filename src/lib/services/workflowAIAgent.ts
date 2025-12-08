/**
 * AI Agent for Workflow Analysis and Insight Generation
 *
 * This service provides AI-powered analysis of workflow executions,
 * generating insights, anomaly detection, and recommendations.
 */

import { WorkflowExecution, WorkflowInsight } from './workflowService';

export interface AIAnalysisResult {
  insights: Array<Omit<WorkflowInsight, 'id' | 'created_at'>>;
  summary: string;
  recommendations: string[];
  anomalies: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export class WorkflowAIAgent {
  /**
   * Analyze a workflow execution and generate insights
   */
  async analyzeExecution(
    execution: WorkflowExecution,
    workflowId: string,
    historicalExecutions: WorkflowExecution[] = []
  ): Promise<AIAnalysisResult> {
    const insights: Array<Omit<WorkflowInsight, 'id' | 'created_at'>> = [];
    const anomalies: AIAnalysisResult['anomalies'] = [];
    const recommendations: string[] = [];

    // 1. Quality Analysis
    if (execution.status === 'success') {
      const qualityInsight = this.analyzeQuality(execution, historicalExecutions);
      if (qualityInsight) insights.push(qualityInsight);
    }

    // 2. Performance Analysis
    const performanceInsights = this.analyzePerformance(execution, historicalExecutions);
    insights.push(...performanceInsights);

    // 3. Anomaly Detection
    const detectedAnomalies = this.detectAnomalies(execution, historicalExecutions);
    anomalies.push(...detectedAnomalies);

    // Convert anomalies to insights
    detectedAnomalies.forEach(anomaly => {
      insights.push({
        execution_id: execution.id,
        workflow_id: workflowId,
        insight_type: 'anomaly',
        title: `Anomaly Detected: ${anomaly.type}`,
        description: anomaly.description,
        severity: anomaly.severity,
        is_significant: anomaly.severity === 'high' || anomaly.severity === 'critical',
        notification_sent: false,
        data: { anomaly_type: anomaly.type }
      });
    });

    // 4. Generate Recommendations
    const workflowRecommendations = this.generateRecommendations(
      execution,
      historicalExecutions,
      anomalies
    );
    recommendations.push(...workflowRecommendations);

    // Add recommendation insights
    if (recommendations.length > 0) {
      insights.push({
        execution_id: execution.id,
        workflow_id: workflowId,
        insight_type: 'recommendation',
        title: 'Optimization Recommendations',
        description: recommendations.join('; '),
        severity: 'medium',
        is_significant: true,
        notification_sent: false,
        data: { recommendations }
      });
    }

    // 5. Generate Summary
    const summary = this.generateSummary(execution, insights, anomalies);

    return {
      insights,
      summary,
      recommendations,
      anomalies
    };
  }

  /**
   * Analyze data quality from execution
   */
  private analyzeQuality(
    execution: WorkflowExecution,
    historicalExecutions: WorkflowExecution[]
  ): Omit<WorkflowInsight, 'id' | 'created_at'> | null {
    // Check if there are quality metrics in the result
    if (!execution.result || !execution.result.quality_score) {
      return null;
    }

    const qualityScore = execution.result.quality_score;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let isSignificant = false;

    if (qualityScore >= 90) {
      severity = 'low';
      isSignificant = qualityScore >= 95;
    } else if (qualityScore >= 80) {
      severity = 'medium';
      isSignificant = true;
    } else if (qualityScore >= 70) {
      severity = 'high';
      isSignificant = true;
    } else {
      severity = 'critical';
      isSignificant = true;
    }

    return {
      execution_id: execution.id,
      workflow_id: execution.workflow_id,
      insight_type: 'quality',
      title: `Data Quality Score: ${qualityScore}%`,
      description: this.getQualityDescription(qualityScore),
      severity,
      is_significant: isSignificant,
      notification_sent: false,
      data: {
        quality_score: qualityScore,
        details: execution.result.quality_details || {}
      }
    };
  }

  /**
   * Analyze workflow performance
   */
  private analyzePerformance(
    execution: WorkflowExecution,
    historicalExecutions: WorkflowExecution[]
  ): Array<Omit<WorkflowInsight, 'id' | 'created_at'>> {
    const insights: Array<Omit<WorkflowInsight, 'id' | 'created_at'>> = [];

    // Calculate average duration from historical data
    if (historicalExecutions.length > 0 && execution.duration_ms) {
      const avgDuration = historicalExecutions
        .filter(e => e.duration_ms)
        .reduce((sum, e) => sum + (e.duration_ms || 0), 0) / historicalExecutions.length;

      const deviationPercent = ((execution.duration_ms - avgDuration) / avgDuration) * 100;

      // Performance degradation warning
      if (deviationPercent > 50) {
        insights.push({
          execution_id: execution.id,
          workflow_id: execution.workflow_id,
          insight_type: 'warning',
          title: 'Performance Degradation Detected',
          description: `Execution took ${Math.round(deviationPercent)}% longer than average (${Math.round(execution.duration_ms / 1000)}s vs ${Math.round(avgDuration / 1000)}s avg)`,
          severity: deviationPercent > 100 ? 'high' : 'medium',
          is_significant: deviationPercent > 100,
          notification_sent: false,
          data: {
            current_duration_ms: execution.duration_ms,
            average_duration_ms: avgDuration,
            deviation_percent: deviationPercent
          }
        });
      }

      // Performance improvement recognition
      else if (deviationPercent < -30) {
        insights.push({
          execution_id: execution.id,
          workflow_id: execution.workflow_id,
          insight_type: 'success',
          title: 'Performance Improvement',
          description: `Execution completed ${Math.abs(Math.round(deviationPercent))}% faster than average`,
          severity: 'low',
          is_significant: true,
          notification_sent: false,
          data: {
            current_duration_ms: execution.duration_ms,
            average_duration_ms: avgDuration,
            improvement_percent: Math.abs(deviationPercent)
          }
        });
      }
    }

    return insights;
  }

  /**
   * Detect anomalies in execution
   */
  private detectAnomalies(
    execution: WorkflowExecution,
    historicalExecutions: WorkflowExecution[]
  ): AIAnalysisResult['anomalies'] {
    const anomalies: AIAnalysisResult['anomalies'] = [];

    // 1. Failure pattern detection
    if (execution.status === 'failed') {
      const recentFailures = historicalExecutions
        .slice(0, 5)
        .filter(e => e.status === 'failed').length;

      if (recentFailures >= 3) {
        anomalies.push({
          type: 'recurring_failures',
          description: `${recentFailures} failures in last 5 executions. This indicates a systematic issue that needs attention.`,
          severity: 'critical'
        });
      }
    }

    // 2. Duration anomalies
    if (execution.duration_ms && historicalExecutions.length >= 3) {
      const durations = historicalExecutions
        .filter(e => e.duration_ms)
        .map(e => e.duration_ms!);

      if (durations.length > 0) {
        const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
        const stdDev = Math.sqrt(
          durations.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / durations.length
        );

        // Statistical anomaly (3 standard deviations)
        if (Math.abs(execution.duration_ms - mean) > 3 * stdDev) {
          anomalies.push({
            type: 'duration_anomaly',
            description: `Execution duration (${Math.round(execution.duration_ms / 1000)}s) is statistically abnormal compared to historical patterns.`,
            severity: 'high'
          });
        }
      }
    }

    // 3. Log pattern anomalies
    if (execution.logs && execution.logs.length > 0) {
      const errorLogs = execution.logs.filter(log => log.level === 'error');
      const warningLogs = execution.logs.filter(log => log.level === 'warning');

      if (errorLogs.length > 0 && execution.status === 'success') {
        anomalies.push({
          type: 'errors_despite_success',
          description: `Execution succeeded but logged ${errorLogs.length} errors. This may indicate partial failures or data quality issues.`,
          severity: 'medium'
        });
      }

      if (warningLogs.length > 5) {
        anomalies.push({
          type: 'excessive_warnings',
          description: `${warningLogs.length} warnings detected during execution. Review logs for potential issues.`,
          severity: 'low'
        });
      }
    }

    // 4. Step completion anomalies
    if (execution.total_steps && execution.current_step) {
      if (execution.current_step < execution.total_steps && execution.status === 'success') {
        anomalies.push({
          type: 'incomplete_steps',
          description: `Workflow marked as successful but only completed ${execution.current_step}/${execution.total_steps} steps.`,
          severity: 'high'
        });
      }
    }

    return anomalies;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    execution: WorkflowExecution,
    historicalExecutions: WorkflowExecution[],
    anomalies: AIAnalysisResult['anomalies']
  ): string[] {
    const recommendations: string[] = [];

    // Recommendation based on failure rate
    if (historicalExecutions.length >= 5) {
      const failureRate = historicalExecutions.filter(e => e.status === 'failed').length / historicalExecutions.length;

      if (failureRate > 0.3) {
        recommendations.push('High failure rate detected (>30%). Consider reviewing workflow configuration and error logs.');
      } else if (failureRate > 0.1) {
        recommendations.push('Moderate failure rate detected. Monitor closely and consider adding error handling steps.');
      }
    }

    // Recommendation based on duration
    if (execution.duration_ms && execution.duration_ms > 300000) { // > 5 minutes
      recommendations.push('Execution duration is high. Consider optimizing data processing steps or splitting into smaller workflows.');
    }

    // Recommendations based on anomalies
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
      recommendations.push('Critical anomalies detected. Immediate investigation recommended before next execution.');
    }

    // Data quality recommendations
    if (execution.result && execution.result.quality_score < 80) {
      recommendations.push('Data quality score is below acceptable threshold. Review data sources and validation rules.');
    }

    // Success recommendations
    if (execution.status === 'success' && anomalies.length === 0) {
      if (historicalExecutions.every(e => e.status === 'success')) {
        recommendations.push('Workflow consistently successful. Consider automating this workflow with scheduled triggers.');
      }
    }

    return recommendations;
  }

  /**
   * Generate execution summary
   */
  private generateSummary(
    execution: WorkflowExecution,
    insights: Array<Omit<WorkflowInsight, 'id' | 'created_at'>>,
    anomalies: AIAnalysisResult['anomalies']
  ): string {
    const statusEmoji = execution.status === 'success' ? '✅' :
                       execution.status === 'failed' ? '❌' : '⚠️';

    const duration = execution.duration_ms
      ? ` in ${Math.round(execution.duration_ms / 1000)}s`
      : '';

    const parts = [
      `${statusEmoji} Workflow ${execution.status}${duration}.`,
    ];

    if (insights.length > 0) {
      parts.push(`Generated ${insights.length} insights.`);
    }

    if (anomalies.length > 0) {
      const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
      if (criticalCount > 0) {
        parts.push(`⚠️ ${criticalCount} critical anomalies detected.`);
      } else {
        parts.push(`${anomalies.length} anomalies detected.`);
      }
    }

    const significantInsights = insights.filter(i => i.is_significant).length;
    if (significantInsights > 0) {
      parts.push(`${significantInsights} significant insights require attention.`);
    }

    return parts.join(' ');
  }

  /**
   * Get quality description based on score
   */
  private getQualityDescription(score: number): string {
    if (score >= 95) {
      return 'Excellent data quality. All checks passed with high confidence.';
    } else if (score >= 90) {
      return 'Very good data quality. Minor issues detected but within acceptable range.';
    } else if (score >= 80) {
      return 'Good data quality. Some data quality issues detected. Review recommended.';
    } else if (score >= 70) {
      return 'Fair data quality. Multiple quality issues detected. Investigation recommended.';
    } else {
      return 'Poor data quality. Significant issues detected. Immediate action required.';
    }
  }

  /**
   * Real-time analysis during execution
   * This method can be called periodically during workflow execution
   */
  async analyzeProgress(
    execution: WorkflowExecution,
    workflowId: string
  ): Promise<{
    status: string;
    health: 'healthy' | 'warning' | 'critical';
    message: string;
  }> {
    // Calculate progress
    const progress = execution.total_steps && execution.current_step
      ? (execution.current_step / execution.total_steps) * 100
      : 0;

    // Check for stuck execution
    const elapsedTime = Date.now() - new Date(execution.started_at).getTime();
    const expectedDuration = (execution.total_steps || 1) * 10000; // Assume 10s per step

    let health: 'healthy' | 'warning' | 'critical' = 'healthy';
    let message = `Progress: ${Math.round(progress)}% (Step ${execution.current_step}/${execution.total_steps})`;

    if (elapsedTime > expectedDuration * 2) {
      health = 'critical';
      message = `⚠️ Execution taking longer than expected. ${message}`;
    } else if (elapsedTime > expectedDuration * 1.5) {
      health = 'warning';
      message = `⚠️ Execution slower than usual. ${message}`;
    }

    // Check logs for errors
    if (execution.logs) {
      const recentErrors = execution.logs
        .slice(-10)
        .filter(log => log.level === 'error').length;

      if (recentErrors > 3) {
        health = 'critical';
        message = `❌ ${recentErrors} errors in recent logs. ${message}`;
      }
    }

    return {
      status: execution.status,
      health,
      message
    };
  }
}

// Export singleton instance
export const workflowAIAgent = new WorkflowAIAgent();
