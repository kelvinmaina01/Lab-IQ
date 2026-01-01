import { supabase } from '@/integrations/supabase/client';
import { datasetService } from './datasetService';
import { dashboardService } from './dashboardService';

/**
 * Service to calculate and seed a full end-to-end demo experience.
 * Orchestrates the entire "LabIQ Health" lifecycle:
 * Data -> Experiment -> Workflow -> Model -> Report -> Dashboard
 */
export class DemoService {
    private static instance: DemoService;

    private constructor() { }

    public static getInstance(): DemoService {
        if (!DemoService.instance) {
            DemoService.instance = new DemoService();
        }
        return DemoService.instance;
    }

    /**
     * Run the full automation demo pipeline
     */
    async runDemoPipeline(userId: string): Promise<void> {
        try {
            console.log("🚀 Starting Full Automation Demo Pipeline...");

            // =========================================================================
            // 1. DATA INGESTION (Complex Dataset)
            // =========================================================================
            const fileName = `Cardiovascular_Study_Cohort_2025.csv`;
            const rowCount = 350;

            // 18 Columns including Vitals, Labs, History, and Outcomes
            const columns = [
                { name: 'patient_id', index: 0, dataType: 'string', nullable: false, uniqueValues: rowCount },
                { name: 'age', index: 1, dataType: 'number', nullable: false, uniqueValues: 60 },
                { name: 'sex', index: 2, dataType: 'string', nullable: false, uniqueValues: 2 },
                { name: 'chest_pain_type', index: 3, dataType: 'string', nullable: false, uniqueValues: 4 },
                { name: 'resting_bp', index: 4, dataType: 'number', nullable: false, uniqueValues: 45 },
                { name: 'cholesterol', index: 5, dataType: 'number', nullable: false, uniqueValues: 120 },
                { name: 'fasting_bs', index: 6, dataType: 'number', nullable: false, uniqueValues: 2 },
                { name: 'resting_ecg', index: 7, dataType: 'string', nullable: false, uniqueValues: 3 },
                { name: 'max_hr', index: 8, dataType: 'number', nullable: false, uniqueValues: 70 },
                { name: 'exercise_angina', index: 9, dataType: 'string', nullable: false, uniqueValues: 2 },
                { name: 'oldpeak', index: 10, dataType: 'number', nullable: false, uniqueValues: 25 },
                { name: 'st_slope', index: 11, dataType: 'string', nullable: false, uniqueValues: 3 },
                { name: 'heart_disease', index: 12, dataType: 'boolean', nullable: false, uniqueValues: 2 },
                { name: 'bmi', index: 13, dataType: 'number', nullable: false, uniqueValues: 150 },
                { name: 'smoking_status', index: 14, dataType: 'string', nullable: false, uniqueValues: 3 },
                { name: 'alcohol_intake', index: 15, dataType: 'string', nullable: false, uniqueValues: 3 },
                { name: 'physical_activity', index: 16, dataType: 'string', nullable: false, uniqueValues: 4 },
                { name: 'family_history', index: 17, dataType: 'boolean', nullable: false, uniqueValues: 2 }
            ];

            const rows = this.generateComplexRows(rowCount);

            const parsedData = {
                fileName,
                fileSize: 1024 * 25, // ~25KB
                fileType: 'text/csv',
                rowCount,
                columnCount: columns.length,
                columns,
                rows
            };

            console.log("📦 1. Uploading Complex Dataset...");
            const datasetId = await datasetService.saveDataset(userId, parsedData as any);
            console.log("✅ Dataset Created:", datasetId);

            // =========================================================================
            // 2. EXPERIMENT CREATION
            // =========================================================================
            console.log("🧪 2. Creating Clinical Experiment...");
            const { data: experiment, error: expError } = await supabase
                .from('experiments')
                .insert({
                    user_id: userId,
                    title: 'CVD Risk Prediction Study 2025',
                    description: 'Longitudinal analysis of cardiovascular risk factors using 18-point biomarker panel.',
                    type: 'clinical_trial',
                    dataset_id: datasetId,
                    status: 'completed',
                    progress: 100,
                    started_at: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
                    completed_at: new Date().toISOString(),
                    protocol: {
                        steps: [
                            'Cohort selection (n=350)',
                            'Biomarker normalization',
                            'Automated feature scaling',
                            'Model training (XGBoost)',
                            'Validation against holdout set'
                        ]
                    }
                })
                .select()
                .single();

            if (expError) throw expError;
            console.log("✅ Experiment Created:", experiment.id);

            // =========================================================================
            // 3. WORKFLOW AUTOMATION (Simulated Execution)
            // =========================================================================
            console.log("⚙️ 3. Creating and Executing Automation Workflow...");

            // Create Workflow Definition
            const { data: workflow, error: wfError } = await supabase
                .from('workflows')
                .insert({
                    user_id: userId,
                    name: 'Auto-Analysis Pipeline',
                    description: 'Triggered on dataset upload: Quality Check -> Normalization -> Training -> Report',
                    trigger_type: 'dataset_upload',
                    trigger_config: { file_pattern: '*.csv' },
                    steps: [
                        { type: 'quality_check', config: { threshold: 90 } },
                        { type: 'transform', config: { method: 'standard_scaler' } },
                        { type: 'train_model', config: { target: 'heart_disease' } },
                        { type: 'notify', config: { channel: 'email' } }
                    ],
                    status: 'active',
                    total_runs: 1,
                    successful_runs: 1,
                    tags: JSON.stringify({ category: 'Automation', icon: '⚡' })
                })
                .select()
                .single();

            if (wfError) throw wfError;

            // Create Execution Log
            const executionId = crypto.randomUUID(); // Simulated ID for logs
            await supabase.from('workflow_executions').insert({
                workflow_id: workflow.id,
                user_id: userId,
                status: 'completed',
                started_at: new Date(Date.now() - 60000).toISOString(),
                completed_at: new Date().toISOString(),
                execution_time_ms: 12450,
                current_step: 4,
                completed_steps: [
                    { step: 'quality_check', status: 'success', timestamp: new Date().toISOString() },
                    { step: 'transform', status: 'success', timestamp: new Date().toISOString() },
                    { step: 'train_model', status: 'success', timestamp: new Date().toISOString() },
                    { step: 'notify', status: 'success', timestamp: new Date().toISOString() }
                ],
                output_data: { accuracy: 0.94, f1_score: 0.92 }
            });
            console.log("✅ Workflow Executed:", workflow.id);

            // =========================================================================
            // 4. ML MODEL CREATION
            // =========================================================================
            console.log("🤖 4. Registering ML Model...");
            // Assuming ml_models table exists as per blueprint, if not we skip or use mock
            // We'll try to insert, if fails (due to schema mismatch), we catch and proceed
            try {
                await supabase.from('ml_models').insert({
                    user_id: userId,
                    name: 'CVD Risk Classifier v2.1',
                    description: 'XGBoost model optimized for early detection of heart disease.',
                    type: 'classification',
                    algorithm: 'xgboost',
                    status: 'production',
                    dataset_id: datasetId,
                    training_metrics: { accuracy: 0.94, precision: 0.91, recall: 0.96 },
                    parameters: { learning_rate: 0.01, max_depth: 5 },
                    version: '2.1.0'
                });
                console.log("✅ ML Model Registered");
            } catch (e) {
                console.warn("⚠️ ML Model table might not exist yet, skipping insert", e);
            }

            // =========================================================================
            // 5. REPORT GENERATION
            // =========================================================================
            console.log("📄 5. Generating Final Report...");
            await supabase.from('reports').insert({
                user_id: userId,
                title: 'Clinical Study Findings: CVD Risk Factors',
                description: 'Comprehensive analysis report including cohort demographics, model performance, and key risk indicators.',
                type: 'Research',
                format: 'PDF',
                status: 'published',
                compliance_standard: 'ISO 13485',
                dataset_id: datasetId,
                config: { generated_by: 'LabIQ Automation' }
            });
            console.log("✅ Report Published");

            // =========================================================================
            // 6. DASHBOARD GENERATION (The "View")
            // =========================================================================
            console.log("📊 6. Creating Dashboards...");

            // 1. Metric: Cohort Size
            await dashboardService.createDashboard({
                title: 'Total Cohort',
                type: 'metric',
                source: 'system',
                category: 'clinical',
                config: { layout: { width: 1, height: 1 } },
                data: {
                    value: rowCount,
                    unit: 'Patients',
                    trend: 'up',
                    change: 12,
                    summary: 'New enrollments this week'
                }
            });

            // 2. Metric: Model Accuracy
            await dashboardService.createDashboard({
                title: 'Model Accuracy',
                type: 'metric',
                source: 'experiment',
                source_id: experiment.id,
                category: 'clinical',
                config: { layout: { width: 1, height: 1 } },
                data: {
                    value: 94.2,
                    unit: '%',
                    trend: 'up',
                    change: 2.5,
                    summary: 'Validation set performance'
                }
            });

            // 3. Chart: Age vs Max HR (Physiological correlation)
            await dashboardService.createDashboard({
                title: 'Physiological Trends: Age vs Max HR',
                description: 'Inverse correlation observed between Age and Max Heart Rate',
                type: 'chart',
                source: 'experiment',
                source_id: experiment.id,
                category: 'clinical',
                is_favorite: true,
                config: {
                    chartType: 'scatter',
                    colors: ['#3b82f6'],
                    xAxis: 'Age',
                    yAxis: 'Max Heart Rate',
                    layout: { width: 2, height: 1 }
                },
                data: {
                    labels: rows.slice(0, 50).map(r => r.age.toString()),
                    datasets: [{
                        label: 'Patient Vitals',
                        data: rows.slice(0, 50).map(r => r.max_hr)
                    }]
                }
            });

            // 4. Chart: Risk Factors by Gender
            await dashboardService.createDashboard({
                title: 'Heart Disease Presence by Gender',
                description: 'Demographic breakdown of positive cases',
                type: 'chart',
                source: 'experiment',
                source_id: experiment.id,
                category: 'clinical',
                is_favorite: true,
                config: {
                    chartType: 'bar',
                    colors: ['#ec4899', '#3b82f6'], // Pink/Blue
                    layout: { width: 1, height: 1 }
                },
                data: {
                    labels: ['Female', 'Male'],
                    datasets: [{
                        label: 'Positive Cases',
                        data: [
                            rows.filter(r => r.sex === 'F' && r.heart_disease).length,
                            rows.filter(r => r.sex === 'M' && r.heart_disease).length
                        ]
                    }]
                }
            });

            // 5. AI Insight: Deep Analysis
            await dashboardService.createDashboard({
                title: 'AI Analysis: Key Risk Drivers',
                description: 'Automated insight from LabIQ AI',
                type: 'insight',
                source: 'ai_assistant',
                source_id: experiment.id,
                category: 'clinical',
                is_favorite: true,
                config: {
                    layout: { width: 3, height: 1 }
                },
                data: {
                    summary: 'Automated analysis pipeline completed successfully. Key finding: "Oldpeak" (ST depression) is the strongest single predictor of heart disease (correlation coefficient 0.78).',
                    keyPoints: [
                        'Asymptomatic chest pain is paradoxically associated with higher risk in this cohort.',
                        'Fasting Blood Sugar > 120mg/dl shows a 2.1x relative risk increase.',
                        'Exercise Angina was present in 85% of confirmed cases.'
                    ],
                    recommendations: [
                        'Update screening protocol to include ST Slope analysis.',
                        'Flag patients with Resting BP > 140 for immediate review.',
                        'Generate follow-up report for the "Asymptomatic" high-risk subgroup.'
                    ]
                }
            });

            // 6. Workflow Status Metric
            await dashboardService.createDashboard({
                title: 'Automation Pipeline',
                type: 'metric',
                source: 'workflow',
                source_id: workflow.id,
                category: 'automation',
                config: { layout: { width: 1, height: 1 } },
                data: {
                    value: 'Active',
                    unit: '',
                    summary: 'Last run: 1 minute ago (Success)'
                }
            });

            // 7. Insight: Automation ROI (New)
            await dashboardService.createDashboard({
                title: 'Automation Impact Analysis',
                description: 'Efficiency gains from LabIQ Workflow Automation',
                type: 'insight',
                source: 'workflow',
                source_id: workflow.id,
                category: 'automation',
                is_favorite: true,
                config: {
                    layout: { width: 2, height: 1 }
                },
                data: {
                    summary: 'The "Auto-Analysis Pipeline" has reduced time-to-insight by 99.2% compared to manual processing.',
                    keyPoints: [
                        'Manual Process: 4.5 hours (Data Cleaning + Training + Reporting)',
                        'LabIQ Automated: 12.4 seconds (End-to-End)',
                        'Standardization: 100% compliance with ISO 13485'
                    ],
                    recommendations: [
                        'Scale pipeline to "Daily" frequency.',
                        'Enable "Device Stream" trigger for real-time monitoring.'
                    ]
                }
            });

            console.log("✨ Full Automation Demo Complete!");

        } catch (error) {
            console.error("❌ Demo Pipeline Failed:", error);
            throw error;
        }
    }

    // --- Data Generation Helpers ---

    private generateComplexRows(count: number): Record<string, any>[] {
        const rows = [];
        const chestPainTypes = ['TA', 'ATA', 'NAP', 'ASY'];
        const restingECG = ['Normal', 'ST', 'LVH'];
        const stSlope = ['Up', 'Flat', 'Down'];
        const activityLevels = ['Sedentary', 'Light', 'Moderate', 'Active'];

        for (let i = 0; i < count; i++) {
            const age = 28 + Math.floor(Math.random() * 55); // 28-83
            const gender = Math.random() > 0.35 ? 'M' : 'F';

            // Make data slightly realistic with correlations
            // Older + Male + Asymptomatic Pain + High Cholesterol -> Higher chance of disease
            let riskFactor = 0;
            if (age > 50) riskFactor += 2;
            if (gender === 'M') riskFactor += 1;

            const cholesterol = 150 + Math.floor(Math.random() * 250);
            if (cholesterol > 250) riskFactor += 2;

            const chestPain = chestPainTypes[Math.floor(Math.random() * chestPainTypes.length)];
            if (chestPain === 'ASY') riskFactor += 3;

            const hasDisease = riskFactor > 4 || Math.random() > 0.8;

            rows.push({
                patient_id: `PT-${1000 + i}`,
                age,
                sex: gender,
                chest_pain_type: chestPain,
                resting_bp: 90 + Math.floor(Math.random() * 90),
                cholesterol,
                fasting_bs: Math.random() > 0.85 ? 1 : 0,
                resting_ecg: restingECG[Math.floor(Math.random() * restingECG.length)],
                max_hr: 220 - age - Math.floor(Math.random() * 40), // Realistic HR
                exercise_angina: (hasDisease && Math.random() > 0.3) ? 'Y' : 'N',
                oldpeak: hasDisease ? Number((Math.random() * 4).toFixed(1)) : 0,
                st_slope: stSlope[Math.floor(Math.random() * stSlope.length)],
                heart_disease: hasDisease,
                bmi: Number((18.5 + Math.random() * 20).toFixed(1)),
                smoking_status: Math.random() > 0.7 ? 'Smoker' : 'Non-Smoker',
                alcohol_intake: Math.random() > 0.6 ? 'Moderate' : 'Low',
                physical_activity: activityLevels[Math.floor(Math.random() * activityLevels.length)],
                family_history: Math.random() > 0.8
            });
        }
        return rows;
    }
}

export const demoService = DemoService.getInstance();
