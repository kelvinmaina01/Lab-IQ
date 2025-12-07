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
      // ===== GENERAL TEMPLATES =====
      {
        name: 'Auto-ML Pipeline',
        description: 'Automatically train ML models when new datasets are uploaded',
        category: 'General',
        icon: '🤖',
        trigger_type: 'dataset_upload' as const,
        trigger_config: {},
        steps: [
          { type: 'quality_check' as const, config: { threshold: 80 } },
          { type: 'train_model' as const, config: { auto_detect: true } },
          { type: 'notify' as const, config: { recipients: [] } }
        ],
        status: 'active' as const,
        estimatedTimeSaved: '10 min per dataset'
      },
      {
        name: 'Data Quality Check',
        description: 'Check data quality and send alerts if below threshold',
        category: 'General',
        icon: '✓',
        trigger_type: 'dataset_upload' as const,
        trigger_config: {},
        steps: [
          { type: 'quality_check' as const, config: { threshold: 85 } },
          { type: 'notify' as const, config: { recipients: [] } }
        ],
        status: 'active' as const,
        estimatedTimeSaved: '5 min per dataset'
      },
      {
        name: 'Weekly Analysis Report',
        description: 'Generate and export weekly analysis reports',
        category: 'General',
        icon: '📊',
        trigger_type: 'schedule' as const,
        trigger_config: { schedule: 'weekly', day: 'monday', time: '09:00' },
        steps: [
          { type: 'analyze' as const, config: { mode: 'analysis' } },
          { type: 'export' as const, config: { format: 'pdf' } },
          { type: 'notify' as const, config: { recipients: [] } }
        ],
        status: 'active' as const,
        estimatedTimeSaved: '30 min per week'
      },

      // ===== BIOTECH TEMPLATES =====
      {
        name: 'IC50 Calculation & Analysis',
        description: 'Automated IC50 calculation, curve fitting, and statistical validation for drug screening',
        category: 'Biotech',
        icon: '🧬',
        trigger_type: 'dataset_upload' as const,
        trigger_config: { tags: ['ic50', 'dose-response'] },
        steps: [
          { type: 'quality_check' as const, config: {
            threshold: 90,
            required_columns: ['concentration', 'response'],
            check_outliers: true
          }},
          { type: 'transform' as const, config: {
            operations: ['log_transform', 'normalize', 'curve_fitting'],
            model: 'four_parameter_logistic'
          }},
          { type: 'analyze' as const, config: {
            mode: 'analysis',
            metrics: ['ic50', 'hill_slope', 'r_squared', 'confidence_interval']
          }},
          { type: 'export' as const, config: {
            format: 'pdf',
            include: ['dose_response_curve', 'statistics_table', 'quality_metrics']
          }},
          { type: 'notify' as const, config: {
            recipients: [],
            include_summary: true
          }}
        ],
        status: 'active' as const,
        estimatedTimeSaved: '45 min per assay'
      },
      {
        name: 'ELISA Plate Analysis',
        description: 'Automated ELISA plate reader data analysis with standard curve generation',
        category: 'Biotech',
        icon: '🔬',
        trigger_type: 'dataset_upload' as const,
        trigger_config: { tags: ['elisa', 'plate-reader'] },
        steps: [
          { type: 'quality_check' as const, config: {
            threshold: 85,
            check_plate_layout: true,
            cv_threshold: 15
          }},
          { type: 'transform' as const, config: {
            operations: ['background_subtraction', 'standard_curve_fit'],
            interpolation: 'four_parameter'
          }},
          { type: 'analyze' as const, config: {
            mode: 'analysis',
            calculate: ['concentrations', 'cv', 'lod', 'loq']
          }},
          { type: 'export' as const, config: {
            format: 'excel',
            include: ['standard_curve', 'sample_concentrations', 'qc_metrics']
          }},
          { type: 'notify' as const, config: { recipients: [] }}
        ],
        status: 'active' as const,
        estimatedTimeSaved: '30 min per plate'
      },
      {
        name: 'Cell Viability Analysis',
        description: 'Automated MTT/MTS assay analysis with viability calculations and IC50',
        category: 'Biotech',
        icon: '🧫',
        trigger_type: 'dataset_upload' as const,
        trigger_config: { tags: ['cell-viability', 'mtt', 'mts'] },
        steps: [
          { type: 'quality_check' as const, config: {
            threshold: 85,
            check_controls: true,
            replicate_check: true
          }},
          { type: 'transform' as const, config: {
            operations: ['blank_subtraction', 'viability_calculation', 'normalization'],
            control: 'untreated'
          }},
          { type: 'analyze' as const, config: {
            mode: 'analysis',
            calculate: ['percent_viability', 'ic50', 'statistical_significance']
          }},
          { type: 'export' as const, config: {
            format: 'pdf',
            include: ['dose_response', 'viability_table', 'statistics']
          }},
          { type: 'notify' as const, config: { recipients: [] }}
        ],
        status: 'active' as const,
        estimatedTimeSaved: '40 min per experiment'
      },
      {
        name: 'Protein Quantification (Bradford/BCA)',
        description: 'Standard curve generation and protein concentration calculation',
        category: 'Biotech',
        icon: '🧪',
        trigger_type: 'dataset_upload' as const,
        trigger_config: { tags: ['bradford', 'bca', 'protein-quant'] },
        steps: [
          { type: 'quality_check' as const, config: {
            threshold: 90,
            check_standards: true,
            linearity_check: true
          }},
          { type: 'transform' as const, config: {
            operations: ['standard_curve_fit', 'interpolation'],
            curve_type: 'linear'
          }},
          { type: 'analyze' as const, config: {
            mode: 'analysis',
            calculate: ['concentrations', 'r_squared', 'detection_range']
          }},
          { type: 'export' as const, config: {
            format: 'excel',
            include: ['standard_curve', 'sample_concentrations', 'dilution_factors']
          }},
          { type: 'notify' as const, config: { recipients: [] }}
        ],
        status: 'active' as const,
        estimatedTimeSaved: '20 min per assay'
      },

      // ===== PHARMACEUTICAL TEMPLATES =====
      {
        name: 'HPLC Data Analysis',
        description: 'Automated HPLC chromatogram analysis with peak integration and purity calculation',
        category: 'Pharmaceutical',
        icon: '📈',
        trigger_type: 'dataset_upload' as const,
        trigger_config: { tags: ['hplc', 'chromatography'] },
        steps: [
          { type: 'quality_check' as const, config: {
            threshold: 90,
            check_baseline: true,
            resolution_check: true
          }},
          { type: 'transform' as const, config: {
            operations: ['baseline_correction', 'peak_detection', 'integration'],
            method: 'trapezoid'
          }},
          { type: 'analyze' as const, config: {
            mode: 'analysis',
            calculate: ['peak_area', 'retention_time', 'purity', 'symmetry_factor']
          }},
          { type: 'export' as const, config: {
            format: 'pdf',
            include: ['chromatogram', 'peak_table', 'purity_report', 'system_suitability']
          }},
          { type: 'notify' as const, config: { recipients: [] }}
        ],
        status: 'active' as const,
        estimatedTimeSaved: '25 min per run'
      },
      {
        name: 'Stability Study Analysis',
        description: 'Track drug stability over time with degradation kinetics and shelf-life prediction',
        category: 'Pharmaceutical',
        icon: '⏱️',
        trigger_type: 'dataset_upload' as const,
        trigger_config: { tags: ['stability', 'degradation'] },
        steps: [
          { type: 'quality_check' as const, config: {
            threshold: 95,
            temporal_consistency: true,
            missing_timepoints: false
          }},
          { type: 'transform' as const, config: {
            operations: ['time_series_analysis', 'degradation_modeling'],
            models: ['zero_order', 'first_order']
          }},
          { type: 'analyze' as const, config: {
            mode: 'analysis',
            calculate: ['degradation_rate', 'shelf_life', 't90', 'arrhenius_plot']
          }},
          { type: 'export' as const, config: {
            format: 'pdf',
            include: ['stability_plot', 'kinetics_table', 'shelf_life_prediction', 'statistical_summary']
          }},
          { type: 'notify' as const, config: { recipients: [] }}
        ],
        status: 'active' as const,
        estimatedTimeSaved: '60 min per study'
      },
      {
        name: 'Dissolution Profile Analysis',
        description: 'Automated dissolution testing analysis with similarity factor (f2) calculation',
        category: 'Pharmaceutical',
        icon: '💊',
        trigger_type: 'dataset_upload' as const,
        trigger_config: { tags: ['dissolution', 'release-profile'] },
        steps: [
          { type: 'quality_check' as const, config: {
            threshold: 90,
            check_timepoints: true,
            vessel_variability: true
          }},
          { type: 'transform' as const, config: {
            operations: ['cumulative_calculation', 'vessel_averaging'],
            correction: 'volume_correction'
          }},
          { type: 'analyze' as const, config: {
            mode: 'analysis',
            calculate: ['dissolution_profile', 'f2_similarity', 'cv', 'model_fitting']
          }},
          { type: 'export' as const, config: {
            format: 'pdf',
            include: ['dissolution_curve', 'f2_calculation', 'statistical_comparison', 'specifications']
          }},
          { type: 'notify' as const, config: { recipients: [] }}
        ],
        status: 'active' as const,
        estimatedTimeSaved: '35 min per batch'
      },
      {
        name: 'Batch Release Testing',
        description: 'QC batch testing workflow with specification compliance checking',
        category: 'Pharmaceutical',
        icon: '✅',
        trigger_type: 'dataset_upload' as const,
        trigger_config: { tags: ['qc', 'batch-release'] },
        steps: [
          { type: 'quality_check' as const, config: {
            threshold: 98,
            completeness_check: true,
            duplicate_check: true
          }},
          { type: 'analyze' as const, config: {
            mode: 'analysis',
            tests: ['assay', 'impurities', 'dissolution', 'appearance'],
            specifications: 'usp_standards'
          }},
          { type: 'transform' as const, config: {
            operations: ['specification_check', 'ooc_flagging'],
            criteria: 'acceptance_limits'
          }},
          { type: 'export' as const, config: {
            format: 'pdf',
            include: ['certificate_of_analysis', 'test_results', 'trend_charts', 'ooc_summary']
          }},
          { type: 'notify' as const, config: {
            recipients: [],
            urgent_if_failure: true
          }}
        ],
        status: 'active' as const,
        estimatedTimeSaved: '50 min per batch'
      },

      // ===== CHEMISTRY TEMPLATES =====
      {
        name: 'NMR Spectrum Analysis',
        description: 'Automated NMR peak picking, integration, and chemical shift assignment',
        category: 'Chemistry',
        icon: '📊',
        trigger_type: 'dataset_upload' as const,
        trigger_config: { tags: ['nmr', '1h-nmr', '13c-nmr'] },
        steps: [
          { type: 'quality_check' as const, config: {
            threshold: 85,
            check_shimming: true,
            check_resolution: true
          }},
          { type: 'transform' as const, config: {
            operations: ['baseline_correction', 'phase_correction', 'peak_picking'],
            threshold: 'auto'
          }},
          { type: 'analyze' as const, config: {
            mode: 'analysis',
            calculate: ['chemical_shifts', 'coupling_constants', 'integrations', 'multiplicity']
          }},
          { type: 'export' as const, config: {
            format: 'pdf',
            include: ['spectrum', 'peak_table', 'integration', 'structure_assignment']
          }},
          { type: 'notify' as const, config: { recipients: [] }}
        ],
        status: 'active' as const,
        estimatedTimeSaved: '20 min per spectrum'
      },
      {
        name: 'Reaction Optimization',
        description: 'Design of Experiments (DOE) for reaction condition optimization',
        category: 'Chemistry',
        icon: '⚗️',
        trigger_type: 'dataset_upload' as const,
        trigger_config: { tags: ['doe', 'optimization'] },
        steps: [
          { type: 'quality_check' as const, config: {
            threshold: 85,
            design_check: true,
            balance_check: true
          }},
          { type: 'analyze' as const, config: {
            mode: 'analysis',
            method: 'response_surface_methodology',
            factors: ['temperature', 'time', 'concentration', 'catalyst']
          }},
          { type: 'train_model' as const, config: {
            model_type: 'polynomial_regression',
            interaction_terms: true
          }},
          { type: 'transform' as const, config: {
            operations: ['optimization', 'desirability_function'],
            target: 'maximize_yield'
          }},
          { type: 'export' as const, config: {
            format: 'pdf',
            include: ['response_surface', 'contour_plot', 'optimal_conditions', 'predicted_response']
          }},
          { type: 'notify' as const, config: { recipients: [] }}
        ],
        status: 'active' as const,
        estimatedTimeSaved: '90 min per optimization'
      },
      {
        name: 'GC-MS Compound Identification',
        description: 'Automated GC-MS peak identification and library matching',
        category: 'Chemistry',
        icon: '🔍',
        trigger_type: 'dataset_upload' as const,
        trigger_config: { tags: ['gcms', 'mass-spec'] },
        steps: [
          { type: 'quality_check' as const, config: {
            threshold: 85,
            check_calibration: true,
            check_resolution: true
          }},
          { type: 'transform' as const, config: {
            operations: ['peak_detection', 'deconvolution', 'library_search'],
            library: 'nist'
          }},
          { type: 'analyze' as const, config: {
            mode: 'analysis',
            calculate: ['retention_indices', 'match_factors', 'quantification']
          }},
          { type: 'export' as const, config: {
            format: 'pdf',
            include: ['chromatogram', 'compound_list', 'spectra', 'quantification_table']
          }},
          { type: 'notify' as const, config: { recipients: [] }}
        ],
        status: 'active' as const,
        estimatedTimeSaved: '30 min per sample'
      },
      {
        name: 'Yield & Purity Calculation',
        description: 'Automated reaction yield and product purity assessment',
        category: 'Chemistry',
        icon: '💯',
        trigger_type: 'dataset_upload' as const,
        trigger_config: { tags: ['synthesis', 'yield'] },
        steps: [
          { type: 'quality_check' as const, config: {
            threshold: 90,
            material_balance: true
          }},
          { type: 'transform' as const, config: {
            operations: ['stoichiometry_calculation', 'yield_calculation', 'purity_assessment'],
            limiting_reagent: 'auto_detect'
          }},
          { type: 'analyze' as const, config: {
            mode: 'analysis',
            calculate: ['theoretical_yield', 'actual_yield', 'percent_yield', 'purity', 'ee']
          }},
          { type: 'export' as const, config: {
            format: 'excel',
            include: ['reaction_scheme', 'yield_table', 'purity_data', 'mass_balance']
          }},
          { type: 'notify' as const, config: { recipients: [] }}
        ],
        status: 'active' as const,
        estimatedTimeSaved: '15 min per reaction'
      },

      // ===== CLINICAL/DIAGNOSTIC TEMPLATES =====
      {
        name: 'Clinical Assay Validation',
        description: 'Complete assay validation including precision, accuracy, linearity, and LOD/LOQ',
        category: 'Clinical',
        icon: '🏥',
        trigger_type: 'dataset_upload' as const,
        trigger_config: { tags: ['validation', 'clinical'] },
        steps: [
          { type: 'quality_check' as const, config: {
            threshold: 95,
            completeness_check: true,
            replicate_check: true
          }},
          { type: 'analyze' as const, config: {
            mode: 'analysis',
            validations: ['precision', 'accuracy', 'linearity', 'lod', 'loq', 'specificity']
          }},
          { type: 'transform' as const, config: {
            operations: ['statistical_analysis', 'acceptance_criteria_check'],
            standards: 'clsi_guidelines'
          }},
          { type: 'export' as const, config: {
            format: 'pdf',
            include: ['validation_report', 'statistical_summary', 'plots', 'acceptance_table']
          }},
          { type: 'notify' as const, config: { recipients: [] }}
        ],
        status: 'active' as const,
        estimatedTimeSaved: '120 min per validation'
      },
      {
        name: 'Patient Sample QC',
        description: 'Quality control checks for patient sample processing with flagging',
        category: 'Clinical',
        icon: '🩺',
        trigger_type: 'dataset_upload' as const,
        trigger_config: { tags: ['patient-samples', 'qc'] },
        steps: [
          { type: 'quality_check' as const, config: {
            threshold: 98,
            check_controls: true,
            check_calibrators: true,
            delta_check: true
          }},
          { type: 'analyze' as const, config: {
            mode: 'analysis',
            qc_rules: 'westgard_rules',
            reference_ranges: true
          }},
          { type: 'transform' as const, config: {
            operations: ['outlier_flagging', 'critical_value_alert'],
            flag_criteria: 'clinical_significance'
          }},
          { type: 'export' as const, config: {
            format: 'csv',
            include: ['patient_results', 'qc_summary', 'flags', 'trending']
          }},
          { type: 'notify' as const, config: {
            recipients: [],
            urgent_if_critical: true
          }}
        ],
        status: 'active' as const,
        estimatedTimeSaved: '40 min per batch'
      }
    ];
  }
}

export const workflowService = new WorkflowService();
