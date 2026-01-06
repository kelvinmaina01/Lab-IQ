/**
 * Mock Notebook Data
 * For testing UI before AI is fully working
 */

import { NotebookOutput } from './notebook';

export const mockNotebookData: NotebookOutput = {
    notebook_id: 'nb_mock_001',
    analysis_metadata: {
        domain: 'health',
        analysis_type: 'descriptive',
        generated_at: new Date().toISOString(),
        confidence_level: 'high'
    },
    cells: [
        {
            cell_id: 'cell_1',
            cell_type: 'prompt',
            title: 'User Question',
            content: {
                user_question: 'How does diabetes correlate with BMI in our patient dataset?'
            },
            dependencies: [],
            ui_hints: {
                collapsible: false,
                emphasis: 'normal'
            }
        },
        {
            cell_id: 'cell_2',
            cell_type: 'reasoning',
            title: 'Analysis Methodology',
            content: {
                methodology: 'Statistical correlation analysis using Pearson correlation coefficient to examine the relationship between BMI (Body Mass Index) and diabetes diagnosis.',
                assumptions: [
                    'BMI values are accurate and recent',
                    'Diabetes diagnosis is confirmed',
                    'Sample size is sufficient for statistical significance'
                ],
                challenges: [
                    'Missing BMI data for 12% of patients',
                    'Age may be a confounding variable'
                ],
                observations: [
                    'Dataset contains 768 patient records',
                    'BMI range: 18.2 to 67.1',
                    'Diabetes prevalence: 34.9%'
                ]
            },
            dependencies: [],
            ui_hints: {
                collapsible: true,
                emphasis: 'normal'
            }
        },
        {
            cell_id: 'cell_3',
            cell_type: 'metric',
            title: 'Key Metrics',
            content: {
                metrics: [
                    {
                        label: 'Correlation Coefficient',
                        value: '0.67',
                        unit: 'r'
                    },
                    {
                        label: 'Average BMI (Diabetic)',
                        value: '35.4',
                        unit: 'kg/m²'
                    },
                    {
                        label: 'Average BMI (Non-Diabetic)',
                        value: '27.8',
                        unit: 'kg/m²'
                    },
                    {
                        label: 'P-Value',
                        value: '< 0.001',
                        unit: ''
                    }
                ]
            },
            dependencies: ['cell_2'],
            ui_hints: {
                collapsible: false,
                emphasis: 'highlighted'
            }
        },
        {
            cell_id: 'cell_4',
            cell_type: 'visualization',
            title: 'BMI Distribution by Diabetes Status',
            content: {
                chart_type: 'scatter',
                description: 'This scatter plot shows the clear separation between diabetic and non-diabetic patients based on BMI. The upward trend indicates that higher BMI values are associated with increased diabetes prevalence.',
                data_source_cell_ids: ['cell_3'],
                config: {
                    xAxis: 'BMI',
                    yAxis: 'Patient Count',
                    series: ['Diabetic', 'Non-Diabetic']
                }
            },
            dependencies: ['cell_2', 'cell_3'],
            ui_hints: {
                collapsible: false,
                emphasis: 'normal'
            }
        },
        {
            cell_id: 'cell_5',
            cell_type: 'table',
            title: 'BMI Categories and Diabetes Rate',
            content: {
                headers: ['BMI Category', 'Range', 'Patient Count', 'Diabetes Rate', 'Risk Level'],
                rows: [
                    ['Underweight', '< 18.5', '12', '8.3%', 'Low'],
                    ['Normal', '18.5 - 24.9', '156', '15.4%', 'Low'],
                    ['Overweight', '25.0 - 29.9', '284', '28.2%', 'Medium'],
                    ['Obese Class I', '30.0 - 34.9', '198', '45.5%', 'High'],
                    ['Obese Class II', '35.0 - 39.9', '89', '61.8%', 'Very High'],
                    ['Obese Class III', '≥ 40.0', '29', '75.9%', 'Extreme']
                ],
                caption: 'Breakdown of diabetes prevalence across BMI categories'
            },
            dependencies: ['cell_3'],
            ui_hints: {
                collapsible: true,
                emphasis: 'normal'
            }
        },
        {
            cell_id: 'cell_6',
            cell_type: 'insight',
            title: 'Strong BMI-Diabetes Correlation Requires Intervention',
            content: {
                summary: 'Analysis reveals a strong positive correlation (r=0.67, p<0.001) between BMI and diabetes prevalence. Patients with BMI ≥30 show diabetes rates exceeding 45%, compared to just 15.4% in normal-weight individuals.',
                key_evidence: [
                    'Correlation coefficient of 0.67 indicates strong relationship',
                    'Average BMI difference of 7.6 kg/m² between diabetic and non-diabetic groups',
                    'Diabetes rate increases from 15.4% (normal BMI) to 75.9% (BMI ≥40)',
                    'Statistical significance confirmed with p-value < 0.001'
                ],
                notable_examples: [
                    'Obese Class III patients (BMI ≥40) have 5x higher diabetes rate than normal-weight patients',
                    '316 patients (41% of dataset) are obese, accounting for 67% of diabetes cases',
                    'Only 8.3% of underweight patients have diabetes, suggesting BMI threshold effect'
                ],
                implications: [
                    'Weight management programs should be prioritized for patients with BMI >30',
                    'Early intervention at overweight stage (BMI 25-29.9) could prevent progression',
                    'Risk stratification should incorporate BMI as a primary factor',
                    'Consider targeted screening for patients approaching BMI threshold of 30'
                ],
                confidence: 'high',
                pin_metadata: {
                    pin_eligible: true,
                    suggested_title: 'BMI Shows 67% Correlation with Diabetes - Intervention Critical for BMI >30',
                    suggested_description: 'Strong statistical evidence (r=0.67, p<0.001) shows diabetes rates surge from 15% to 76% as BMI increases from normal to extremely obese. Immediate weight management needed for 316 at-risk patients.',
                    pin_tags: ['correlation', 'risk', 'trend'],
                    source_cells: ['cell_3', 'cell_4', 'cell_5'],
                    drilldown_path: {
                        type: 'notebook',
                        target_cell_ids: ['cell_6', 'cell_3', 'cell_4']
                    }
                }
            },
            dependencies: ['cell_3', 'cell_4', 'cell_5'],
            ui_hints: {
                collapsible: false,
                emphasis: 'critical'
            }
        },
        {
            cell_id: 'cell_7',
            cell_type: 'suggestion',
            title: 'Recommended Next Steps',
            content: {
                suggestions: [
                    {
                        prompt: 'What age groups show the strongest BMI-diabetes correlation?',
                        rationale: 'Identify if intervention should target specific age demographics'
                    },
                    {
                        prompt: 'Compare diabetes outcomes for patients who reduced BMI vs. those who maintained high BMI',
                        rationale: 'Validate effectiveness of weight management interventions'
                    },
                    {
                        prompt: 'Analyze relationship between diabetes medication adherence and BMI changes',
                        rationale: 'Understand if treatment compliance affects weight management success'
                    }
                ]
            },
            dependencies: ['cell_6'],
            ui_hints: {
                collapsible: false,
                emphasis: 'normal'
            }
        }
    ]
};
