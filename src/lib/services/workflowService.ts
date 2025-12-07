import { supabase } from "@/integrations/supabase/client";

export interface WorkflowStep {
  type: 'quality_check' | 'transform' | 'train_model' | 'analyze' | 'notify' | 'export';
  config: Record<string, any>;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  trigger_type: 'dataset_upload' | 'manual' | 'schedule' | 'threshold' | 'event';
  trigger_config: Record<string, any>;
  steps: WorkflowStep[];
  status: 'active' | 'paused' | 'disabled';
  last_run_at: string | null;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'running' | 'success' | 'failed';
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  logs: Array<{
    timestamp: string;
    step: string;
    message: string;
    level: 'info' | 'warning' | 'error';
  }>;
  result: Record<string, any> | null;
  error: string | null;
}

class WorkflowService {
  /**
   * Fetch all workflows for the current user
   */
  async fetchWorkflows(): Promise<Workflow[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Workflow[];
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflow: Omit<Workflow, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_run_at' | 'success_count' | 'failure_count'>): Promise<Workflow> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('workflows')
        .insert({
          user_id: user.id,
          ...workflow,
          success_count: 0,
          failure_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data as Workflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  /**
   * Update workflow status (active/paused/disabled)
   */
  async updateWorkflowStatus(workflowId: string, status: 'active' | 'paused' | 'disabled'): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', workflowId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating workflow status:', error);
      throw error;
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  }

  /**
   * Execute a workflow manually
   */
  async executeWorkflow(workflowId: string, datasetId?: string): Promise<WorkflowExecution> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      // Fetch workflow
      const { data: workflow, error: fetchError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (fetchError) throw fetchError;

      // Create execution record
      const execution: Omit<WorkflowExecution, 'id'> = {
        workflow_id: workflowId,
        status: 'running',
        started_at: new Date().toISOString(),
        completed_at: null,
        duration_ms: null,
        logs: [{
          timestamp: new Date().toISOString(),
          step: 'init',
          message: 'Workflow execution started',
          level: 'info'
        }],
        result: null,
        error: null
      };

      const { data: executionData, error: executionError } = await supabase
        .from('workflow_executions')
        .insert(execution)
        .select()
        .single();

      if (executionError) throw executionError;

      // Execute workflow steps
      await this.runWorkflowSteps(workflow as Workflow, executionData.id, datasetId);

      return executionData as WorkflowExecution;
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw error;
    }
  }

  /**
   * Run workflow steps sequentially
   */
  private async runWorkflowSteps(workflow: Workflow, executionId: string, datasetId?: string): Promise<void> {
    const startTime = Date.now();
    const logs: WorkflowExecution['logs'] = [];

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        logs.push({
          timestamp: new Date().toISOString(),
          step: `step_${i + 1}_${step.type}`,
          message: `Executing step ${i + 1}: ${step.type}`,
          level: 'info'
        });

        // Execute step based on type
        await this.executeStep(step, datasetId);

        logs.push({
          timestamp: new Date().toISOString(),
          step: `step_${i + 1}_${step.type}`,
          message: `Step ${i + 1} completed successfully`,
          level: 'info'
        });
      }

      // Update execution as successful
      const duration = Date.now() - startTime;
      await supabase
        .from('workflow_executions')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          logs,
          result: { steps_completed: workflow.steps.length }
        })
        .eq('id', executionId);

      // Update workflow stats
      await supabase
        .from('workflows')
        .update({
          last_run_at: new Date().toISOString(),
          success_count: workflow.success_count + 1
        })
        .eq('id', workflow.id);

    } catch (error) {
      const duration = Date.now() - startTime;
      logs.push({
        timestamp: new Date().toISOString(),
        step: 'error',
        message: `Workflow failed: ${error}`,
        level: 'error'
      });

      // Update execution as failed
      await supabase
        .from('workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          logs,
          error: String(error)
        })
        .eq('id', executionId);

      // Update workflow stats
      await supabase
        .from('workflows')
        .update({
          last_run_at: new Date().toISOString(),
          failure_count: workflow.failure_count + 1
        })
        .eq('id', workflow.id);

      throw error;
    }
  }

  /**
   * Execute individual workflow step
   */
  private async executeStep(step: WorkflowStep, datasetId?: string): Promise<void> {
    // Simulate step execution (replace with actual implementation)
    await new Promise(resolve => setTimeout(resolve, 1000));

    switch (step.type) {
      case 'quality_check':
        // Check data quality
        console.log('Running quality check...', step.config);
        break;

      case 'transform':
        // Transform data
        console.log('Transforming data...', step.config);
        break;

      case 'train_model':
        // Train ML model
        console.log('Training model...', step.config);
        if (datasetId) {
          // Call ML service API
          // await fetch('http://localhost:8002/api/ml/automl', {...})
        }
        break;

      case 'analyze':
        // Run analysis
        console.log('Running analysis...', step.config);
        break;

      case 'notify':
        // Send notification
        console.log('Sending notification...', step.config);
        break;

      case 'export':
        // Export results
        console.log('Exporting results...', step.config);
        break;

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Fetch workflow execution history
   */
  async fetchExecutions(workflowId: string, limit: number = 10): Promise<WorkflowExecution[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as WorkflowExecution[];
    } catch (error) {
      console.error('Error fetching executions:', error);
      throw error;
    }
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(workflowId: string) {
    try {
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('success_count, failure_count, last_run_at')
        .eq('id', workflowId)
        .single();

      if (workflowError) throw workflowError;

      const { count: totalRuns, error: countError } = await supabase
        .from('workflow_executions')
        .select('*', { count: 'exact', head: true })
        .eq('workflow_id', workflowId);

      if (countError) throw countError;

      const successRate = workflow.success_count + workflow.failure_count > 0
        ? (workflow.success_count / (workflow.success_count + workflow.failure_count)) * 100
        : 0;

      return {
        totalRuns: totalRuns || 0,
        successCount: workflow.success_count,
        failureCount: workflow.failure_count,
        successRate: successRate.toFixed(1),
        lastRunAt: workflow.last_run_at
      };
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      throw error;
    }
  }

  /**
   * Create pre-built workflow templates
   */
  getWorkflowTemplates() {
    return [
      {
        name: 'Auto-ML Pipeline',
        description: 'Automatically train ML models when new datasets are uploaded',
        trigger_type: 'dataset_upload' as const,
        trigger_config: {},
        steps: [
          { type: 'quality_check' as const, config: { threshold: 80 } },
          { type: 'train_model' as const, config: { auto_detect: true } },
          { type: 'notify' as const, config: { recipients: [] } }
        ],
        status: 'active' as const
      },
      {
        name: 'Data Quality Check',
        description: 'Check data quality and send alerts if below threshold',
        trigger_type: 'dataset_upload' as const,
        trigger_config: {},
        steps: [
          { type: 'quality_check' as const, config: { threshold: 85 } },
          { type: 'notify' as const, config: { recipients: [] } }
        ],
        status: 'active' as const
      },
      {
        name: 'Weekly Analysis Report',
        description: 'Generate and export weekly analysis reports',
        trigger_type: 'schedule' as const,
        trigger_config: { schedule: 'weekly', day: 'monday', time: '09:00' },
        steps: [
          { type: 'analyze' as const, config: { mode: 'analysis' } },
          { type: 'export' as const, config: { format: 'pdf' } },
          { type: 'notify' as const, config: { recipients: [] } }
        ],
        status: 'active' as const
      }
    ];
  }
}

export const workflowService = new WorkflowService();
