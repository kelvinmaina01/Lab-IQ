"""
Lab-IQ Multi-Agent AutoML Service
Production-ready ML API for Hugging Face Spaces
Specialized for Biotech/Health Domain Analysis
"""
import os
import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np

# Import LangGraph Agents
# from .agent import run_notebook_generation

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("lab-iq-ml")

# =============================================================================
# ENVIRONMENT CONFIGURATION
# =============================================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
HF_TOKEN = os.getenv("HF_TOKEN", "")

# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class AutoMLRequest(BaseModel):
    """Request model for AutoML pipeline"""
    dataset_id: str = Field(..., description="Unique identifier for the dataset")
    data: List[Dict[str, Any]] = Field(..., description="Dataset as list of row dictionaries")
    target_column: Optional[str] = Field(None, description="Target column for supervised learning")
    problem_type: Optional[str] = Field(None, description="classification, regression, or clustering")
    options: Optional[Dict[str, Any]] = Field(default_factory=dict)

class QuickAnalysisRequest(BaseModel):
    """Request for quick data analysis"""
    dataset_id: str
    data: List[Dict[str, Any]]

class InsightsRequest(BaseModel):
    """Request for generating insights"""
    dataset_id: str
    data: List[Dict[str, Any]]
    columns: Optional[List[Dict[str, Any]]] = None



class GenerateDescriptionRequest(BaseModel):
    """Request for generating report descriptions"""
    title: str
    report_type: str
    modules: List[str]

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    active_pipelines: int
    gemini_configured: bool
    timestamp: str

# =============================================================================
# DATA ANALYSIS AGENT
# =============================================================================

class DataAgent:
    """Agent for data profiling and quality assessment"""

    def __init__(self):
        self.name = "Data Understanding Agent"

    async def analyze(self, data: List[Dict], context: Dict) -> Dict[str, Any]:
        """Comprehensive data analysis"""
        df = pd.DataFrame(data)

        # Basic info
        basic_info = {
            "rows": len(df),
            "columns": len(df.columns),
            "total_cells": df.size,
            "memory_mb": round(df.memory_usage(deep=True).sum() / 1024**2, 4),
            "duplicates": int(df.duplicated().sum()),
            "column_names": df.columns.tolist()
        }

        # Type analysis
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()

        type_analysis = {
            "numeric_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "column_types": {col: str(dtype) for col, dtype in df.dtypes.items()}
        }

        # Missing values
        missing = df.isnull().sum()
        total_missing = int(missing.sum())
        missing_pct = round((total_missing / df.size * 100), 2) if df.size > 0 else 0

        missing_analysis = {
            "total_missing": total_missing,
            "overall_percentage": missing_pct,
            "columns_with_missing": {k: int(v) for k, v in missing[missing > 0].to_dict().items()},
            "complete_rows": len(df.dropna()),
            "incomplete_rows": len(df) - len(df.dropna())
        }

        # Statistical summary for numeric columns
        stats_summary = {}
        for col in numeric_cols:
            try:
                stats_summary[col] = {
                    "mean": float(df[col].mean()),
                    "median": float(df[col].median()),
                    "std": float(df[col].std()),
                    "min": float(df[col].min()),
                    "max": float(df[col].max()),
                    "q25": float(df[col].quantile(0.25)),
                    "q75": float(df[col].quantile(0.75))
                }
            except Exception:
                pass

        # Outlier detection (IQR method)
        outliers = {}
        for col in numeric_cols:
            try:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower = Q1 - 1.5 * IQR
                upper = Q3 + 1.5 * IQR
                outlier_count = int(((df[col] < lower) | (df[col] > upper)).sum())
                if outlier_count > 0:
                    outliers[col] = {
                        "count": outlier_count,
                        "percentage": round(outlier_count / len(df) * 100, 2)
                    }
            except Exception:
                pass

        # Quality score
        completeness = 100 - missing_pct
        uniqueness = 100 - (basic_info["duplicates"] / len(df) * 100) if len(df) > 0 else 100
        total_outliers = sum(o["count"] for o in outliers.values())
        consistency = max(0, 100 - (total_outliers / df.size * 100)) if df.size > 0 else 100

        overall_score = round((completeness + uniqueness + consistency) / 3, 2)

        quality_score = {
            "overall_score": overall_score,
            "completeness_score": round(completeness, 2),
            "uniqueness_score": round(uniqueness, 2),
            "consistency_score": round(consistency, 2),
            "rating": "Excellent" if overall_score >= 90 else "Good" if overall_score >= 75 else "Fair" if overall_score >= 60 else "Poor"
        }

        # Domain detection for biotech/health
        domain_info = self._detect_domain(df)

        # Generate recommendations
        recommendations = self._generate_recommendations(
            df, missing_analysis, outliers, type_analysis, domain_info
        )

        return {
            "basic_info": basic_info,
            "type_analysis": type_analysis,
            "missing_analysis": missing_analysis,
            "statistical_summary": stats_summary,
            "outliers": outliers,
            "quality_score": quality_score,
            "domain_analysis": domain_info,
            "recommendations": recommendations
        }

    def _detect_domain(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect biotech/health domain characteristics - comprehensive detection"""
        columns_lower = [c.lower() for c in df.columns]

        # Biotech & Genomics indicators (expanded)
        bio_keywords = [
            'sequence', 'seq', 'dna', 'rna', 'mrna', 'protein', 'gene', 'genome',
            'amino', 'nucleotide', 'gc_content', 'codon', 'exon', 'intron',
            'snp', 'variant', 'mutation', 'allele', 'chromosome', 'expression',
            'transcription', 'primer', 'pcr', 'crispr', 'plasmid', 'vector',
            'cell_line', 'culture', 'passage', 'viability', 'confluence',
            'assay', 'elisa', 'western_blot', 'qpcr', 'flow_cytometry',
            'bioreactor', 'fermentation', 'titer', 'purity'
        ]
        bio_matches = [c for c in df.columns if any(k in c.lower() for k in bio_keywords)]

        # Clinical & Healthcare indicators (expanded)
        health_keywords = [
            'patient', 'patient_id', 'mrn', 'subject', 'participant',
            'diagnosis', 'icd', 'cpt', 'snomed', 'treatment', 'therapy',
            'medication', 'drug', 'dose', 'dosage', 'prescription',
            'symptom', 'sign', 'complaint', 'vitals', 'vital_signs',
            'blood_pressure', 'bp', 'systolic', 'diastolic',
            'heart_rate', 'hr', 'pulse', 'respiratory', 'temperature',
            'oxygen', 'spo2', 'bmi', 'weight', 'height',
            'glucose', 'hba1c', 'cholesterol', 'ldl', 'hdl', 'triglycerides',
            'creatinine', 'bun', 'egfr', 'alt', 'ast', 'bilirubin', 'albumin',
            'hemoglobin', 'hgb', 'hematocrit', 'wbc', 'rbc', 'platelets',
            'sodium', 'potassium', 'calcium', 'magnesium',
            'troponin', 'bnp', 'crp', 'lactate',
            'admission', 'discharge', 'mortality', 'survival', 'outcome',
            'adverse_event', 'side_effect', 'comorbidity', 'allergy'
        ]
        health_matches = [c for c in df.columns if any(k in c.lower() for k in health_keywords)]

        # Biopharma & Drug Development indicators (new)
        biopharma_keywords = [
            'compound', 'molecule', 'drug_candidate', 'lead', 'hit',
            'smiles', 'inchi', 'mol_weight', 'mw', 'logp', 'psa', 'hbd', 'hba',
            'ic50', 'ec50', 'ki', 'kd', 'potency', 'efficacy', 'selectivity',
            'adme', 'absorption', 'distribution', 'metabolism', 'excretion',
            'pk', 'pharmacokinetics', 'cmax', 'tmax', 'auc', 'half_life',
            'bioavailability', 'clearance', 'toxicity', 'ld50', 'noael',
            'herg', 'cyp', 'cyp450', 'permeability', 'solubility',
            'clinical_trial', 'phase', 'endpoint', 'placebo', 'randomization'
        ]
        biopharma_matches = [c for c in df.columns if any(k in c.lower() for k in biopharma_keywords)]

        # Chemistry indicators (expanded)
        chem_keywords = [
            'compound', 'chemical', 'reagent', 'solvent', 'catalyst',
            'concentration', 'molarity', 'ph', 'buffer',
            'yield', 'purity', 'conversion', 'absorbance', 'fluorescence',
            'retention_time', 'peak_area', 'spectrum', 'nmr', 'ms', 'hplc', 'gc',
            'batch', 'lot'
        ]
        chem_matches = [c for c in df.columns if any(k in c.lower() for k in chem_keywords)]

        # Research & Academic indicators (new)
        research_keywords = [
            'study', 'study_id', 'trial', 'cohort', 'group', 'arm',
            'subject', 'participant', 'enrollment', 'consent',
            'variable', 'independent', 'dependent', 'covariate',
            'baseline', 'treatment', 'control', 'intervention',
            'randomization', 'blinding', 'replicate',
            'measurement', 'observation', 'timepoint', 'visit',
            'pvalue', 'p_value', 'qvalue', 'fdr', 'significance',
            'effect_size', 'confidence_interval', 'ci',
            'anova', 'ttest', 'regression', 'correlation',
            'quality_control', 'validation', 'missing', 'imputed',
            'citation', 'doi', 'pmid', 'investigator', 'irb', 'ethics',
            'followup', 'longitudinal', 'phase', 'wave'
        ]
        research_matches = [c for c in df.columns if any(k in c.lower() for k in research_keywords)]

        # Check data patterns for additional detection
        domain_scores = {
            "biotech": len(bio_matches),
            "clinical": len(health_matches),
            "biopharma": len(biopharma_matches),
            "chemistry": len(chem_matches),
            "research": len(research_matches)
        }

        # Check for DNA/RNA sequences in data
        for col in df.columns:
            if df[col].dtype == 'object':
                sample = df[col].dropna().head(5)
                for val in sample:
                    if isinstance(val, str):
                        # DNA/RNA sequence pattern
                        if len(val) > 10 and all(c in 'ATCGUNatcgun' for c in val):
                            domain_scores["biotech"] += 5
                        # SMILES pattern
                        if 'C' in val and any(c in val for c in '()[]=#@'):
                            domain_scores["biopharma"] += 3
                        # ICD code pattern
                        if len(val) < 8 and val[0].isalpha() and val[1:3].isdigit():
                            domain_scores["clinical"] += 3

        # Determine winning domain
        max_score = max(domain_scores.values())
        domain = "general"
        confidence = 0.3
        domain_columns = []

        if max_score >= 2:
            domain = max(domain_scores, key=domain_scores.get)
            confidence = min(0.95, 0.4 + max_score * 0.05)
            if domain == "biotech":
                domain_columns = bio_matches
            elif domain == "clinical":
                domain_columns = health_matches
            elif domain == "biopharma":
                domain_columns = biopharma_matches
            elif domain == "chemistry":
                domain_columns = chem_matches
            elif domain == "research":
                domain_columns = research_matches

        # Generate domain-specific suggestions
        suggested_analyses = self._get_suggested_analyses(domain)
        reference_ranges = self._get_reference_ranges(domain) if domain == "clinical" else None
        research_quality_checks = self._get_research_quality_checks(domain) if domain == "research" else None

        return {
            "domain_detected": domain,
            "confidence": confidence,
            "domain_columns": domain_columns,
            "domain_scores": domain_scores,
            "is_biotech": domain == "biotech",
            "is_clinical": domain == "clinical",
            "is_biopharma": domain == "biopharma",
            "is_chemistry": domain == "chemistry",
            "is_research": domain == "research",
            "suggested_analyses": suggested_analyses,
            "reference_ranges": reference_ranges,
            "research_quality_checks": research_quality_checks
        }

    def _get_suggested_analyses(self, domain: str) -> List[str]:
        """Get domain-specific suggested analyses"""
        suggestions = {
            "biotech": [
                "Differential expression analysis",
                "Gene set enrichment (GSEA)",
                "Principal component analysis (PCA)",
                "Quality control metrics assessment",
                "Batch effect detection"
            ],
            "clinical": [
                "Reference range flagging",
                "Risk stratification modeling",
                "Survival analysis (Kaplan-Meier)",
                "Comorbidity correlation",
                "Treatment response analysis"
            ],
            "biopharma": [
                "Lipinski Rule of Five assessment",
                "ADME property prediction",
                "Dose-response curve fitting",
                "Structure-activity relationship (SAR)",
                "Toxicity risk assessment"
            ],
            "chemistry": [
                "Method validation statistics",
                "Precision and accuracy assessment",
                "Stability trend analysis",
                "Impurity profiling"
            ],
            "research": [
                "Power analysis and sample size calculation",
                "Descriptive statistics with effect sizes",
                "Assumption testing (normality, homogeneity)",
                "Statistical test selection",
                "Multiple testing correction (FDR, Bonferroni)",
                "Missing data pattern analysis",
                "Batch effect detection",
                "Repeated measures analysis",
                "Survival analysis (Cox, Kaplan-Meier)",
                "Reproducibility documentation"
            ],
            "general": [
                "Statistical summary",
                "Correlation analysis",
                "Outlier detection",
                "Distribution analysis"
            ]
        }
        return suggestions.get(domain, suggestions["general"])

    def _get_reference_ranges(self, domain: str) -> Dict[str, Dict]:
        """Get clinical reference ranges"""
        if domain != "clinical":
            return None
        return {
            "glucose_fasting": {"min": 70, "max": 100, "unit": "mg/dL", "critical_low": 50, "critical_high": 400},
            "hba1c": {"min": 4.0, "max": 5.6, "unit": "%", "prediabetic": 6.4, "diabetic": 6.5},
            "systolic_bp": {"min": 90, "max": 120, "unit": "mmHg", "hypertension": 140},
            "diastolic_bp": {"min": 60, "max": 80, "unit": "mmHg", "hypertension": 90},
            "heart_rate": {"min": 60, "max": 100, "unit": "bpm"},
            "temperature": {"min": 36.1, "max": 37.2, "unit": "°C", "fever": 38.0},
            "bmi": {"min": 18.5, "max": 24.9, "unit": "kg/m²", "overweight": 25, "obese": 30},
            "hemoglobin_male": {"min": 13.5, "max": 17.5, "unit": "g/dL"},
            "hemoglobin_female": {"min": 12.0, "max": 16.0, "unit": "g/dL"},
            "wbc": {"min": 4000, "max": 11000, "unit": "cells/μL"},
            "platelets": {"min": 150000, "max": 400000, "unit": "cells/μL"},
            "creatinine": {"min": 0.7, "max": 1.3, "unit": "mg/dL"},
            "egfr": {"min": 90, "max": 120, "unit": "mL/min/1.73m²", "ckd_stage3": 60},
            "sodium": {"min": 136, "max": 145, "unit": "mEq/L"},
            "potassium": {"min": 3.5, "max": 5.0, "unit": "mEq/L", "critical_low": 2.5, "critical_high": 6.5},
            "ldl_cholesterol": {"optimal": 100, "borderline": 130, "high": 160, "unit": "mg/dL"},
            "hdl_cholesterol": {"low_risk_male": 40, "low_risk_female": 50, "optimal": 60, "unit": "mg/dL"}
        }

    def _get_research_quality_checks(self, domain: str) -> Dict[str, Any]:
        """Get research quality assessment criteria"""
        if domain != "research":
            return None
        return {
            "sample_size": {
                "minimum_recommended": 30,
                "power_target": 0.80,
                "note": "Sample size should support 80% power to detect meaningful effects"
            },
            "missing_data": {
                "acceptable_threshold": 5.0,
                "unit": "percent",
                "recommendation": "< 5% missing data per variable; use appropriate imputation methods"
            },
            "statistical_significance": {
                "alpha_level": 0.05,
                "multiple_testing": "Apply FDR or Bonferroni correction for multiple comparisons",
                "effect_size": "Always report effect sizes (Cohen's d, OR, HR, etc.) with confidence intervals"
            },
            "reproducibility": {
                "requirements": [
                    "Document software versions",
                    "Set and record random seeds",
                    "Provide analysis code/scripts",
                    "Report all preprocessing steps",
                    "Follow FAIR principles for data"
                ]
            },
            "experimental_design": {
                "controls": "Include appropriate control groups",
                "randomization": "Randomize assignment to reduce bias",
                "blinding": "Use blinding when possible to reduce observer bias",
                "replication": "Include technical and biological replicates"
            },
            "reporting_standards": {
                "descriptives": "Report mean, SD, median, IQR for continuous variables",
                "inference": "Report p-values, effect sizes, and confidence intervals",
                "visualization": "Provide data visualizations (boxplots, scatter, etc.)",
                "assumptions": "Test and report statistical assumptions"
            }
        }

    def _generate_recommendations(self, df, missing, outliers, types, domain) -> List[str]:
        """Generate actionable recommendations"""
        recs = []

        if missing["overall_percentage"] > 5:
            recs.append(f"High missing data ({missing['overall_percentage']}%). Consider imputation or removal strategies.")

        if df.duplicated().sum() > 0:
            recs.append(f"Found {df.duplicated().sum()} duplicate rows. Consider deduplication.")

        if outliers:
            total = sum(o["count"] for o in outliers.values())
            recs.append(f"Detected {total} outliers across {len(outliers)} columns. Review for data quality.")

        if domain["domain_detected"] != "general":
            recs.append(f"Detected {domain['domain_detected']} domain data. Domain-specific analysis available.")

        if len(df) < 100:
            recs.append("Small dataset (<100 rows). Results may have high variance.")

        if len(df.columns) > 50:
            recs.append("High dimensionality. Feature selection recommended.")

        if not recs:
            recs.append("Data quality looks good. Ready for analysis.")

        return recs


# =============================================================================
# ML ORCHESTRATOR
# =============================================================================

class MLOrchestrator:
    """Orchestrates the complete AutoML pipeline"""

    def __init__(self):
        self.data_agent = DataAgent()
        self.progress = 0
        self.status = "idle"

    async def run_pipeline(self, data: List[Dict], context: Dict) -> Dict[str, Any]:
        """Run complete AutoML pipeline"""
        start_time = datetime.now()
        self.status = "running"
        self.progress = 0

        results = {"stages": {}}

        try:
            # Stage 1: Data Understanding (30%)
            logger.info("Stage 1: Data Understanding")
            self.progress = 10
            data_result = await self.data_agent.analyze(data, context)
            results["stages"]["data_understanding"] = data_result
            self.progress = 30

            # Stage 2: Auto Problem Detection (40%)
            logger.info("Stage 2: Problem Detection")
            df = pd.DataFrame(data)
            target = context.get("target_column")
            problem_type = context.get("problem_type")

            if not problem_type and target and target in df.columns:
                # Auto-detect problem type
                unique_ratio = df[target].nunique() / len(df)
                is_numeric = pd.api.types.is_numeric_dtype(df[target])

                if is_numeric and unique_ratio > 0.1:
                    problem_type = "regression"
                else:
                    problem_type = "classification"
            elif not problem_type:
                problem_type = "clustering"

            results["problem_type"] = problem_type
            self.progress = 40

            # Stage 3: Feature Engineering Recommendations (60%)
            logger.info("Stage 3: Feature Engineering")
            feature_recs = self._recommend_features(df, data_result)
            results["stages"]["feature_engineering"] = feature_recs
            self.progress = 60

            # Stage 4: Model Recommendations (80%)
            logger.info("Stage 4: Model Selection")
            model_recs = self._recommend_models(problem_type, data_result)
            results["stages"]["model_selection"] = model_recs
            self.progress = 80

            # Stage 5: Generate Insights (100%)
            logger.info("Stage 5: Insights Generation")
            insights = self._generate_insights(data_result, problem_type)
            results["stages"]["insights"] = insights
            self.progress = 100

            # Final summary
            duration = (datetime.now() - start_time).total_seconds()
            results["success"] = True
            results["pipeline_duration"] = duration
            results["summary"] = {
                "data_summary": {
                    "rows": data_result["basic_info"]["rows"],
                    "columns": data_result["basic_info"]["columns"],
                    "quality_score": data_result["quality_score"]["overall_score"],
                    "quality_rating": data_result["quality_score"]["rating"]
                },
                "domain": data_result["domain_analysis"]["domain_detected"],
                "problem_type": problem_type,
                "recommended_model": model_recs["recommended_models"][0] if model_recs["recommended_models"] else "Unknown",
                "key_insights": insights["key_findings"][:3]
            }

            self.status = "completed"
            return results

        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            self.status = "failed"
            return {
                "success": False,
                "error": str(e),
                "stages": results.get("stages", {})
            }

    def _recommend_features(self, df: pd.DataFrame, data_result: Dict) -> Dict:
        """Recommend feature engineering steps"""
        recs = []

        # Categorical encoding
        cat_cols = data_result["type_analysis"]["categorical_columns"]
        if cat_cols:
            recs.append({
                "action": "encode_categorical",
                "columns": cat_cols[:5],
                "method": "one_hot" if len(cat_cols) <= 10 else "target_encoding"
            })

        # Missing value handling
        if data_result["missing_analysis"]["total_missing"] > 0:
            recs.append({
                "action": "handle_missing",
                "method": "median_imputation" if data_result["type_analysis"]["numeric_columns"] else "mode_imputation"
            })

        # Outlier handling
        if data_result["outliers"]:
            recs.append({
                "action": "handle_outliers",
                "columns": list(data_result["outliers"].keys())[:5],
                "method": "clip_to_bounds"
            })

        # Scaling
        if data_result["type_analysis"]["numeric_columns"]:
            recs.append({
                "action": "scale_features",
                "method": "standard_scaler"
            })

        return {
            "original_features": len(df.columns),
            "recommendations": recs,
            "estimated_final_features": len(df.columns) + len(cat_cols) * 3 if cat_cols else len(df.columns)
        }

    def _recommend_models(self, problem_type: str, data_result: Dict) -> Dict:
        """Recommend ML models based on data characteristics"""
        rows = data_result["basic_info"]["rows"]
        cols = data_result["basic_info"]["columns"]
        domain = data_result["domain_analysis"]["domain_detected"]

        models = []

        if problem_type == "classification":
            if rows < 1000:
                models = ["Random Forest", "Logistic Regression", "SVM"]
            else:
                models = ["XGBoost", "LightGBM", "Random Forest", "Neural Network"]

        elif problem_type == "regression":
            if rows < 1000:
                models = ["Random Forest Regressor", "Ridge Regression", "ElasticNet"]
            else:
                models = ["XGBoost Regressor", "LightGBM Regressor", "Gradient Boosting"]

        else:  # clustering
            models = ["K-Means", "DBSCAN", "Hierarchical Clustering"]

        # Domain-specific recommendations
        if domain == "biotech":
            models.insert(0, "BioBERT (for sequences)" if cols < 10 else models[0])
        elif domain == "clinical/health":
            models.insert(0, "Interpretable Model (Logistic/Decision Tree)")

        return {
            "problem_type": problem_type,
            "recommended_models": models,
            "primary_recommendation": models[0],
            "reasoning": f"Based on {rows} rows, {cols} features, and {domain} domain"
        }

    def _generate_insights(self, data_result: Dict, problem_type: str) -> Dict:
        """Generate insights from data analysis"""
        findings = []
        recommendations = []

        quality = data_result["quality_score"]
        domain = data_result["domain_analysis"]

        # Quality insights
        if quality["overall_score"] >= 90:
            findings.append("Excellent data quality - ready for production modeling")
        elif quality["overall_score"] >= 75:
            findings.append("Good data quality - minor cleaning recommended")
        else:
            findings.append(f"Data quality needs attention (score: {quality['overall_score']})")

        # Domain insights
        if domain["domain_detected"] != "general":
            findings.append(f"Detected {domain['domain_detected']} domain with {domain['confidence']*100:.0f}% confidence")
            if domain["is_biotech"]:
                recommendations.append("Consider using domain-specific feature extractors for biological sequences")
            elif domain["is_clinical"]:
                recommendations.append("Ensure HIPAA compliance for clinical data handling")

        # Statistical insights
        stats = data_result.get("statistical_summary", {})
        for col, stat in list(stats.items())[:3]:
            if stat.get("std", 0) > stat.get("mean", 1) * 2:
                findings.append(f"High variance in '{col}' - consider normalization")

        # Missing data insights
        missing = data_result["missing_analysis"]
        if missing["overall_percentage"] > 0:
            findings.append(f"{missing['overall_percentage']}% missing data detected")
            if missing["overall_percentage"] > 20:
                recommendations.append("Consider multiple imputation strategies")

        return {
            "key_findings": findings,
            "recommendations": recommendations,
            "data_quality_summary": quality["rating"],
            "domain_summary": domain["domain_detected"]
        }

    def get_progress(self) -> int:
        return self.progress

    def get_status(self) -> str:
        return self.status


# =============================================================================
# AI CONTENT GENERATION (Groq FIRST, then Gemini fallback)
# =============================================================================

async def generate_ai_content(prompt: str, system_instruction: str = "") -> Dict[str, Any]:
    """Generate AI content using available APIs - Groq is PRIMARY"""
    import httpx

    # PRIMARY: Try Groq FIRST (free tier, fast inference)
    if GROQ_API_KEY:
        try:
            api_url = "https://api.groq.com/openai/v1/chat/completions"

            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    api_url,
                    json={
                        "model": "llama-3.1-8b-instant",
                        "messages": messages,
                        "max_tokens": 2048,
                        "temperature": 0.7
                    },
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {GROQ_API_KEY}"
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    return {"success": True, "text": text, "provider": "groq"}

        except Exception as e:
            logger.warning(f"Groq API failed: {e}")

    # FALLBACK: Try Gemini if Groq fails
    if GEMINI_API_KEY:
        try:
            api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent"
            full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt

            payload = {
                "contents": [{"parts": [{"text": full_prompt}]}],
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{api_url}?key={GEMINI_API_KEY}",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )

                if response.status_code == 200:
                    result = response.json()
                    text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    return {"success": True, "text": text, "provider": "gemini"}

        except Exception as e:
            logger.warning(f"Gemini API failed: {e}")

    return {"success": False, "text": "", "error": "No AI provider configured or available"}


# =============================================================================
# FASTAPI APPLICATION
# =============================================================================

# Track active pipelines
active_orchestrators: Dict[str, MLOrchestrator] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    logger.info("Lab-IQ ML Service starting...")
    logger.info(f"Gemini API: {'Configured' if GEMINI_API_KEY else 'Not configured'}")
    logger.info(f"Groq API: {'Configured' if GROQ_API_KEY else 'Not configured'}")
    yield
    logger.info("Lab-IQ ML Service shutting down...")

app = FastAPI(
    title="Lab-IQ Multi-Agent AutoML Service",
    description="Production-ready ML API for Biotech/Health domain analysis",
    version="2.1.0",
    lifespan=lifespan
)

# Configure CORS for WebSocket and API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=Dict[str, Any])
async def root():
    """Root endpoint with service info"""
    return {
        "service": "Lab-IQ Multi-Agent AutoML",
        "version": "2.1.0",
        "status": "running",
        "domain": "Biotech/Health",
        "capabilities": [
            "Automated data profiling",
            "Domain detection (Biotech, Clinical, Chemistry)",
            "Feature engineering recommendations",
            "Model selection",
            "AI-powered insights generation",
            "Real-time WebSocket updates"
        ]
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="2.1.0",
        active_pipelines=len(active_orchestrators),
        gemini_configured=bool(GEMINI_API_KEY),
        timestamp=datetime.now().isoformat()
    )


@app.post("/api/ml/automl")
async def run_automl(request: AutoMLRequest):
    """Run complete AutoML pipeline"""
    try:
        logger.info(f"Starting AutoML for dataset: {request.dataset_id}")

        orchestrator = MLOrchestrator()
        active_orchestrators[request.dataset_id] = orchestrator

        context = {
            "dataset_id": request.dataset_id,
            "target_column": request.target_column,
            "problem_type": request.problem_type,
            "options": request.options or {}
        }

        result = await orchestrator.run_pipeline(request.data, context)

        # Cleanup
        if request.dataset_id in active_orchestrators:
            del active_orchestrators[request.dataset_id]

        if result.get("success"):
            return JSONResponse(content={
                "success": True,
                "dataset_id": request.dataset_id,
                "summary": result.get("summary"),
                "detailed_results": result,
                "pipeline_duration": result.get("pipeline_duration")
            })
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Pipeline failed"))

    except Exception as e:
        logger.error(f"AutoML failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/quick-analysis")
async def quick_analysis(request: QuickAnalysisRequest):
    """Quick data analysis without full pipeline"""
    try:
        data_agent = DataAgent()
        result = await data_agent.analyze(request.data, {"dataset_id": request.dataset_id})

        return {
            "success": True,
            "dataset_id": request.dataset_id,
            "analysis": result
        }
    except Exception as e:
        logger.error(f"Quick analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/insights")
async def generate_insights(request: InsightsRequest):
    """Generate comprehensive insights"""
    try:
        data_agent = DataAgent()

        # Run analysis
        data_result = await data_agent.analyze(request.data, {"dataset_id": request.dataset_id})

        # Generate additional AI insights if available
        ai_insights = []
        if GEMINI_API_KEY or GROQ_API_KEY:
            prompt = f"""Analyze this dataset summary and provide 3-5 key insights:
            - Rows: {data_result['basic_info']['rows']}
            - Columns: {data_result['basic_info']['columns']}
            - Domain: {data_result['domain_analysis']['domain_detected']}
            - Quality Score: {data_result['quality_score']['overall_score']}
            - Missing Data: {data_result['missing_analysis']['overall_percentage']}%

            Provide actionable insights for a biotech/health researcher."""

            ai_result = await generate_ai_content(
                prompt,
                "You are a data science expert specializing in biotech and health research."
            )
            if ai_result["success"]:
                ai_insights = [ai_result["text"]]

        return {
            "success": True,
            "dataset_id": request.dataset_id,
            "insights": data_result.get("recommendations", []) + ai_insights,
            "data_profile": data_result,
            "domain_analysis": data_result.get("domain_analysis", {})
        }

    except Exception as e:
        logger.error(f"Insights generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/generate-description")
async def generate_description(request: GenerateDescriptionRequest):
    """Generate AI-powered report description"""
    try:
        prompt = f"""Generate a professional, concise executive summary (2-3 sentences) for a laboratory report.

        Report Title: {request.title}
        Report Type: {request.report_type}
        Included Sections: {', '.join(request.modules)}

        The description should be authoritative and suitable for scientific documentation."""

        result = await generate_ai_content(
            prompt,
            "You are a technical writer for pharmaceutical and biotech laboratories."
        )

        if result["success"]:
            return {"success": True, "description": result["text"]}
        else:
            return {"success": False, "description": "", "error": result.get("error")}

    except Exception as e:
        logger.error(f"Description generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Legacy chat endpoint removed

    except Exception as e:
        logger.error(f"Chat failed: {e}")
        return {
            "sections": [
                {"type": "paragraph", "content": f"Error: {str(e)}"}
            ]
        }


@app.get("/api/ml/pipeline-status/{dataset_id}")
async def get_pipeline_status(dataset_id: str):
    """Get status of running AutoML pipeline"""
    if dataset_id not in active_orchestrators:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    orchestrator = active_orchestrators[dataset_id]
    return {
        "dataset_id": dataset_id,
        "progress": orchestrator.get_progress(),
        "status": orchestrator.get_status()
    }


@app.websocket("/ws/automl/{dataset_id}")
async def websocket_automl(websocket: WebSocket, dataset_id: str):
    """WebSocket endpoint for real-time AutoML updates"""
    await websocket.accept()

    try:
        # Receive request
        data = await websocket.receive_json()

        logger.info(f"WebSocket AutoML started for: {dataset_id}")

        orchestrator = MLOrchestrator()
        active_orchestrators[dataset_id] = orchestrator

        context = {
            "dataset_id": dataset_id,
            "target_column": data.get("target_column"),
            "problem_type": data.get("problem_type"),
            "options": data.get("options", {})
        }

        # Send initial status
        await websocket.send_json({
            "type": "status",
            "message": "Pipeline started",
            "progress": 0
        })

        # Progress update task
        async def send_progress():
            while orchestrator.get_progress() < 100 and orchestrator.get_status() == "running":
                await asyncio.sleep(1)
                await websocket.send_json({
                    "type": "progress",
                    "progress": orchestrator.get_progress(),
                    "status": orchestrator.get_status()
                })

        # Start progress updates in background
        progress_task = asyncio.create_task(send_progress())

        # Run pipeline
        result = await orchestrator.run_pipeline(data.get("data", []), context)

        # Cancel progress updates
        progress_task.cancel()

        # Send final result
        await websocket.send_json({
            "type": "complete",
            "progress": 100,
            "result": result
        })

        # Cleanup
        if dataset_id in active_orchestrators:
            del active_orchestrators[dataset_id]

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {dataset_id}")
        if dataset_id in active_orchestrators:
            del active_orchestrators[dataset_id]
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "error": str(e)})
        except:
            pass


from pydantic import BaseModel

class GenerateNotebookRequest(BaseModel):
    user_prompt: str
    dataset_context: dict

from .agent import stream_notebook_generation

@app.websocket("/ws/generate-notebook")
async def websocket_generate_notebook(websocket: WebSocket):
    """
    Real-time Streaming Notebook Generation
    Protocol:
    1. Client sends JSON: { "user_prompt": "...", "dataset_context": {...}, "data_rows": [...] }
    2. Server streams JSON events:
       - { "type": "thought", "content": "..." }
       - { "type": "code", "content": "..." }
       - { "type": "execution", "logs": "..." }
       - { "type": "complete", "payload": NotebookJSON }
       - { "type": "error", "error": "..." }
    """
    await websocket.accept()
    
    try:
        # Receive Initial Request
        data = await websocket.receive_json()
        user_prompt = data.get("user_prompt")
        dataset_context = data.get("dataset_context", {})
        data_rows = data.get("data_rows", [])
        
        if not user_prompt:
            await websocket.send_json({"type": "error", "error": "Missing user_prompt"})
            return

        logger.info(f"Starting Streaming Notebook Generation for: {user_prompt[:50]}")

        # Stream Events from Agent
        async for event in stream_notebook_generation(user_prompt, dataset_context, data_rows):
            await websocket.send_json(event)
            
    except WebSocketDisconnect:
        logger.info("Client disconnected from notebook stream")
    except Exception as e:
        logger.error(f"Streaming failed: {e}")
        try:
            await websocket.send_json({"type": "error", "error": str(e)})
        except:
            pass

@app.post("/api/v1/generate-notebook")
async def generate_notebook_endpoint(request: Dict[str, Any]):
    """
    Legacy/Sync Endpoint - Wraps the streaming agent but returns only final result.
    Useful for non-streaming clients.
    """
    try:
        user_prompt = request.get("user_prompt")
        dataset_context = request.get("dataset_context", {})
        data_rows = request.get("data_rows", [])
        
        if not user_prompt:
            raise HTTPException(status_code=400, detail="Missing user_prompt")
            
        logger.info(f"Synchronous generation for: {user_prompt[:50]}")
        
        final_result = None
        
        # Consume the stream until completion
        async for event in stream_notebook_generation(user_prompt, dataset_context, data_rows):
            if event["type"] == "complete":
                final_result = event["payload"]
            elif event["type"] == "error":
                raise Exception(event["error"])
                
        if not final_result:
            raise Exception("Agent completed without producing a notebook.")
            
        return final_result

    except Exception as e:
        logger.error(f"Notebook generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))




# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    print("=" * 70)
    print("Lab-IQ Multi-Agent AutoML Service")
    print("Biotech/Health Domain Specialized")
    print("=" * 70)
    print(f"Gemini API: {'Configured' if GEMINI_API_KEY else 'Not configured'}")
    print(f"Groq API: {'Configured' if GROQ_API_KEY else 'Not configured'}")
    print("=" * 70)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5001,
        reload=False,
        workers=1
    )
