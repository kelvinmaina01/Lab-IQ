/**
 * Template-related type definitions
 * Shared across components and services for consistency
 */

export interface ExperimentTemplate {
    id: string;
    name: string;
    description: string;
    discipline: "clinical" | "research" | "lab" | "public-health" | "general";
    sections: string[];
    isPro: boolean;
    isPopular?: boolean;
}

export interface TemplateRecommendation {
    id: string;
    confidence: number; // 0-1 score indicating AI confidence
    reasoning: string;  // Explanation of why this template was recommended
    templateName?: string; // Populated when displayed to user
    discipline?: string;
}

export interface TemplateSuggestionContext {
    fileName: string;
    columns: Array<{
        name: string;
        type?: 'numeric' | 'categorical' | 'datetime' | 'text';
        sampleValues?: any[];
        uniqueCount?: number;
        nullCount?: number;
    }>;
    sampleRows?: Record<string, any>[];
    rowCount?: number;
    columnCount?: number;
    dataQuality?: number;
}

/**
 * Template metadata - Health Research & Clinical Analysis Templates
 */
export const TEMPLATE_METADATA: Record<string, ExperimentTemplate> = {
    "clinical-trial": {
        id: "clinical-trial",
        name: "Clinical Trial Analysis",
        description: "Comprehensive template for analyzing clinical trial data including efficacy, safety, and statistical endpoints",
        discipline: "clinical",
        sections: ["Study Overview", "Patient Demographics", "Primary Endpoints", "Secondary Endpoints", "Adverse Events", "Statistical Analysis", "Efficacy Results", "Safety Profile", "Discussion", "Conclusions"],
        isPro: false,
        isPopular: true
    },
    "diagnostic-validation": {
        id: "diagnostic-validation",
        name: "Diagnostic Test Validation",
        description: "Template for validating diagnostic tests with sensitivity, specificity, and ROC analysis",
        discipline: "clinical",
        sections: ["Test Description", "Study Population", "Reference Standard", "Test Performance", "Sensitivity & Specificity", "ROC Curve Analysis", "Predictive Values", "Clinical Utility", "Quality Assessment"],
        isPro: false,
        isPopular: true
    },
    "cohort-study": {
        id: "cohort-study",
        name: "Patient Cohort Study",
        description: "Longitudinal analysis of patient cohorts with risk factors and outcomes",
        discipline: "research",
        sections: ["Study Design", "Cohort Definition", "Baseline Characteristics", "Exposure Assessment", "Outcome Measures", "Statistical Methods", "Results", "Risk Analysis", "Confounding Factors", "Conclusions"],
        isPro: false
    },
    "lab-qc": {
        id: "lab-qc",
        name: "Laboratory Quality Control",
        description: "Quality control analysis for laboratory test results with Westgard rules",
        discipline: "lab",
        sections: ["QC Protocol", "Control Materials", "Acceptance Criteria", "Control Charts", "Trend Analysis", "Out-of-Control Events", "Corrective Actions", "Performance Review"],
        isPro: true
    },
    "biomarker-discovery": {
        id: "biomarker-discovery",
        name: "Biomarker Discovery",
        description: "Template for identifying and validating potential biomarkers from omics data",
        discipline: "research",
        sections: ["Study Design", "Sample Collection", "Data Preprocessing", "Statistical Analysis", "Candidate Biomarkers", "Validation Cohort", "Clinical Correlation", "Pathway Analysis", "Conclusions"],
        isPro: true
    },
    "drug-efficacy": {
        id: "drug-efficacy",
        name: "Drug Efficacy Analysis",
        description: "Analyze drug treatment outcomes and dose-response relationships",
        discipline: "clinical",
        sections: ["Drug Information", "Study Population", "Treatment Protocol", "Efficacy Endpoints", "Dose-Response Analysis", "Subgroup Analysis", "Safety Data", "Pharmacokinetics", "Clinical Significance"],
        isPro: true
    },
    "epidemiology-survey": {
        id: "epidemiology-survey",
        name: "Epidemiological Survey",
        description: "Population health survey analysis with prevalence and incidence calculations",
        discipline: "public-health",
        sections: ["Survey Design", "Population Characteristics", "Sampling Method", "Data Collection", "Prevalence Analysis", "Incidence Rates", "Risk Factors", "Geographic Distribution", "Temporal Trends", "Public Health Implications"],
        isPro: false
    },
    "case-control": {
        id: "case-control",
        name: "Case-Control Study",
        description: "Retrospective analysis comparing cases and controls with odds ratio calculations",
        discipline: "research",
        sections: ["Study Objectives", "Case Definition", "Control Selection", "Matching Criteria", "Exposure Assessment", "Odds Ratio Analysis", "Confounders", "Stratified Analysis", "Sensitivity Analysis", "Conclusions"],
        isPro: false
    },
    "lab-results": {
        id: "lab-results",
        name: "Laboratory Results Analysis",
        description: "General template for analyzing laboratory test results and identifying patterns",
        discipline: "lab",
        sections: ["Test Overview", "Reference Ranges", "Result Distribution", "Abnormal Findings", "Temporal Patterns", "Correlations", "Clinical Interpretation", "Quality Metrics"],
        isPro: false,
        isPopular: true
    },
    "vitals-monitoring": {
        id: "vitals-monitoring",
        name: "Vital Signs Monitoring",
        description: "Continuous monitoring and analysis of patient vital signs data",
        discipline: "clinical",
        sections: ["Patient Information", "Monitoring Protocol", "Vital Signs Trends", "Alert Thresholds", "Critical Events", "Statistical Summary", "Clinical Assessment", "Recommendations"],
        isPro: false
    }
};
