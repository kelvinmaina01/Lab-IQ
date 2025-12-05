"""
Data Agent - Handles data profiling, quality assessment, and understanding
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from .base_agent import BaseAgent
import logging

logger = logging.getLogger(__name__)


class DataAgent(BaseAgent):
    """Agent responsible for data understanding and quality assessment"""
    
    def __init__(self):
        super().__init__("data_agent", "Data Understanding Agent 🗂️")
    
    async def execute(self, data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze dataset and provide comprehensive profiling
        """
        df = pd.DataFrame(data)
        
        # Basic information
        basic_info = self._get_basic_info(df)
        
        # Data types analysis
        type_analysis = self._analyze_types(df)
        
        # Missing values analysis
        missing_analysis = self._analyze_missing_values(df)
        
        # Statistical summary
        stats_summary = self._statistical_summary(df)
        
        # Outlier detection
        outliers = self._detect_outliers(df)
        
        # Data quality score
        quality_score = self._calculate_quality_score(df, missing_analysis, outliers)
        
        # Recommendations
        recommendations = self._generate_recommendations(df, missing_analysis, outliers, type_analysis)
        
        return {
            "basic_info": basic_info,
            "type_analysis": type_analysis,
            "missing_analysis": missing_analysis,
            "statistical_summary": stats_summary,
            "outliers": outliers,
            "quality_score": quality_score,
            "recommendations": recommendations
        }
    
    def _get_basic_info(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get basic dataset information"""
        return {
            "rows": len(df),
            "columns": len(df.columns),
            "total_cells": df.size,
            "memory_usage_mb": df.memory_usage(deep=True).sum() / 1024**2,
            "duplicates": df.duplicated().sum(),
            "column_names": df.columns.tolist()
        }
    
    def _analyze_types(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze data types and categorize columns"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        datetime_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
        
        # Detect potential categorical columns in numeric
        potential_categorical = []
        for col in numeric_cols:
            unique_ratio = df[col].nunique() / len(df)
            if unique_ratio < 0.05 and df[col].nunique() < 20:
                potential_categorical.append(col)
        
        return {
            "numeric_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "datetime_columns": datetime_cols,
            "potential_categorical": potential_categorical,
            "column_types": {col: str(dtype) for col, dtype in df.dtypes.items()}
        }
    
    def _analyze_missing_values(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze missing values patterns"""
        missing_counts = df.isnull().sum()
        missing_percentages = (missing_counts / len(df) * 100).round(2)
        
        columns_with_missing = missing_counts[missing_counts > 0].to_dict()
        missing_percentage_dict = missing_percentages[missing_percentages > 0].to_dict()
        
        total_missing = df.isnull().sum().sum()
        total_cells = df.size
        overall_missing_percentage = (total_missing / total_cells * 100) if total_cells > 0 else 0
        
        return {
            "total_missing": int(total_missing),
            "overall_percentage": round(overall_missing_percentage, 2),
            "columns_with_missing": columns_with_missing,
            "missing_percentages": missing_percentage_dict,
            "complete_rows": len(df.dropna()),
            "incomplete_rows": len(df) - len(df.dropna())
        }
    
    def _statistical_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate statistical summary for numeric columns"""
        numeric_df = df.select_dtypes(include=[np.number])
        
        if numeric_df.empty:
            return {"message": "No numeric columns found"}
        
        summary = {}
        for col in numeric_df.columns:
            summary[col] = {
                "mean": float(numeric_df[col].mean()),
                "median": float(numeric_df[col].median()),
                "std": float(numeric_df[col].std()),
                "min": float(numeric_df[col].min()),
                "max": float(numeric_df[col].max()),
                "q25": float(numeric_df[col].quantile(0.25)),
                "q75": float(numeric_df[col].quantile(0.75)),
                "skewness": float(numeric_df[col].skew()),
                "kurtosis": float(numeric_df[col].kurtosis())
            }
        
        return summary
    
    def _detect_outliers(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect outliers using IQR method"""
        numeric_df = df.select_dtypes(include=[np.number])
        outliers = {}
        
        for col in numeric_df.columns:
            Q1 = numeric_df[col].quantile(0.25)
            Q3 = numeric_df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outlier_mask = (numeric_df[col] < lower_bound) | (numeric_df[col] > upper_bound)
            outlier_count = outlier_mask.sum()
            
            if outlier_count > 0:
                outliers[col] = {
                    "count": int(outlier_count),
                    "percentage": round((outlier_count / len(df)) * 100, 2),
                    "lower_bound": float(lower_bound),
                    "upper_bound": float(upper_bound)
                }
        
        return outliers
    
    def _calculate_quality_score(self, df: pd.DataFrame, missing_analysis: Dict, outliers: Dict) -> Dict[str, Any]:
        """Calculate overall data quality score (0-100)"""
        scores = []
        
        # Completeness score (based on missing values)
        completeness = 100 - missing_analysis["overall_percentage"]
        scores.append(("completeness", completeness))
        
        # Uniqueness score (based on duplicates)
        duplicates = df.duplicated().sum()
        uniqueness = 100 - (duplicates / len(df) * 100) if len(df) > 0 else 100
        scores.append(("uniqueness", uniqueness))
        
        # Consistency score (based on outliers)
        total_outliers = sum(info["count"] for info in outliers.values())
        consistency = 100 - (total_outliers / df.size * 100) if df.size > 0 else 100
        scores.append(("consistency", max(0, consistency)))
        
        # Overall score
        overall_score = sum(score for _, score in scores) / len(scores)
        
        return {
            "overall_score": round(overall_score, 2),
            "completeness_score": round(completeness, 2),
            "uniqueness_score": round(uniqueness, 2),
            "consistency_score": round(consistency, 2),
            "rating": self._get_quality_rating(overall_score)
        }
    
    def _get_quality_rating(self, score: float) -> str:
        """Convert quality score to rating"""
        if score >= 90:
            return "Excellent"
        elif score >= 75:
            return "Good"
        elif score >= 60:
            return "Fair"
        elif score >= 40:
            return "Poor"
        else:
            return "Critical"
    
    def _generate_recommendations(self, df: pd.DataFrame, missing_analysis: Dict, 
                                  outliers: Dict, type_analysis: Dict) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Missing values recommendations
        if missing_analysis["overall_percentage"] > 5:
            recommendations.append(
                f"⚠️ {missing_analysis['overall_percentage']}% of data is missing. "
                "Consider imputation strategies or removing columns with >50% missing values."
            )
        
        # Duplicates recommendation
        duplicates = df.duplicated().sum()
        if duplicates > 0:
            recommendations.append(
                f"📋 Found {duplicates} duplicate rows. Consider removing duplicates before training."
            )
        
        # Outliers recommendation
        if outliers:
            total_outliers = sum(info["count"] for info in outliers.values())
            recommendations.append(
                f"📊 Detected {total_outliers} outliers across {len(outliers)} columns. "
                "Consider outlier treatment or robust algorithms."
            )
        
        # Categorical encoding recommendation
        if type_analysis["categorical_columns"]:
            recommendations.append(
                f"🏷️ {len(type_analysis['categorical_columns'])} categorical columns detected. "
                "Will apply appropriate encoding (One-Hot, Label, or Target encoding)."
            )
        
        # Potential categorical recommendation
        if type_analysis["potential_categorical"]:
            recommendations.append(
                f"🔄 {len(type_analysis['potential_categorical'])} numeric columns may be categorical: "
                f"{', '.join(type_analysis['potential_categorical'][:3])}. Consider treating as categorical."
            )
        
        # Small dataset warning
        if len(df) < 100:
            recommendations.append(
                "⚠️ Small dataset detected (<100 rows). Results may not be reliable. "
                "Consider collecting more data or using simpler models."
            )
        
        # High dimensionality warning
        if len(df.columns) > 50:
            recommendations.append(
                f"📐 High dimensionality detected ({len(df.columns)} features). "
                "Will apply feature selection and dimensionality reduction techniques."
            )
        
        if not recommendations:
            recommendations.append("✅ Data quality is good. No major issues detected.")
        
        return recommendations
