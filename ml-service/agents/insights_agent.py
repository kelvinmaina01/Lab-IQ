"""
Insights and Explanation Agent - ML interpretability and business insights
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from .base_agent import BaseAgent
import logging

logger = logging.getLogger(__name__)

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    logger.warning("SHAP not available, will use simplified explanations")


class InsightsAgent(BaseAgent):
    """Agent responsible for generating insights and explanations"""
    
    def __init__(self):
        super().__init__("insights_agent", "Insights & Explanation Agent 💡")
    
    async def execute(self, data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate comprehensive insights and explanations
        """
        best_model_info = context.get("best_model")
        all_models = context.get("model_results", [])
        problem_type = context.get("problem_type", "classification")
        data_analysis = context.get("data_analysis", {})
        feature_engineering = context.get("feature_engineering", {})
        
        if not best_model_info:
            return {"error": "No trained model available"}
        
        # Model comparison insights
        model_comparison = self._compare_models(all_models, problem_type)
        
        # Feature insights
        feature_insights = self._analyze_features(best_model_info, feature_engineering)
        
        # Performance insights
        performance_insights = self._generate_performance_insights(best_model_info, problem_type)
        
        # Data quality insights
        data_insights = self._generate_data_insights(data_analysis)
        
        # Business recommendations
        recommendations = self._generate_recommendations(
            best_model_info, model_comparison, data_analysis, problem_type
        )
        
        # SHAP explanations if available
        shap_insights = None
        if SHAP_AVAILABLE:
            shap_insights = self._generate_shap_insights(best_model_info, data)
        
        # Key findings summary
        key_findings = self._summarize_key_findings(
            best_model_info, feature_insights, performance_insights, problem_type
        )
        
        return {
            "key_findings": key_findings,
            "model_comparison": model_comparison,
            "feature_insights": feature_insights,
            "performance_insights": performance_insights,
            "data_insights": data_insights,
            "recommendations": recommendations,
            "shap_insights": shap_insights,
            "best_model_summary": self._create_model_summary(best_model_info, problem_type)
        }
    
    def _compare_models(self, models: List[Dict], problem_type: str) -> Dict[str, Any]:
        """Compare performance across all models"""
        
        if not models:
            return {}
        
        # Extract key metrics
        comparisons = []
        for model in models:
            if model.get("status") != "success":
                continue
            
            metrics = model.get("metrics", {})
            comparisons.append({
                "algorithm": model["algorithm_name"],
                "test_score": metrics.get("test_score", 0),
                "metrics": metrics
            })
        
        # Sort by performance
        comparisons.sort(key=lambda x: x["test_score"], reverse=True)
        
        # Calculate performance differences
        if len(comparisons) > 1:
            best_score = comparisons[0]["test_score"]
            worst_score = comparisons[-1]["test_score"]
            performance_gap = best_score - worst_score
        else:
            performance_gap = 0
        
        return {
            "total_models": len(comparisons),
            "rankings": comparisons,
            "performance_gap": round(performance_gap, 4),
            "winner": comparisons[0]["algorithm"] if comparisons else None,
            "winner_score": comparisons[0]["test_score"] if comparisons else 0
        }
    
    def _analyze_features(self, model_info: Dict, feature_engineering: Dict) -> Dict[str, Any]:
        """Analyze feature importance and engineering impact"""
        
        feature_importance = model_info.get("feature_importance", [])
        
        if not feature_importance:
            return {"message": "Feature importance not available for this model"}
        
        # Top features
        top_features = feature_importance[:10]
        
        # Identify engineered features
        generated_features = feature_engineering.get("generated_features", [])
        engineered_in_top = [
            f for f in top_features 
            if f["feature"] in generated_features
        ]
        
        # Feature importance distribution
        importances = [f["importance"] for f in feature_importance]
        
        return {
            "top_features": top_features,
            "total_features": len(feature_importance),
            "top_10_importance_sum": sum(f["importance"] for f in top_features),
            "engineered_in_top_10": len(engineered_in_top),
            "feature_importance_stats": {
                "mean": float(np.mean(importances)),
                "std": float(np.std(importances)),
                "max": float(np.max(importances)),
                "min": float(np.min(importances))
            }
        }
    
    def _generate_performance_insights(self, model_info: Dict, problem_type: str) -> List[str]:
        """Generate insights about model performance"""
        
        insights = []
        metrics = model_info.get("metrics", {})
        
        if problem_type == "classification":
            test_acc = metrics.get("test_accuracy", 0)
            train_acc = metrics.get("train_accuracy", 0)
            
            # Overall performance
            if test_acc >= 0.9:
                insights.append(f"🎯 Excellent performance! Test accuracy of {test_acc:.2%} indicates the model is highly reliable.")
            elif test_acc >= 0.8:
                insights.append(f"✅ Good performance! Test accuracy of {test_acc:.2%} shows the model performs well.")
            elif test_acc >= 0.7:
                insights.append(f"📊 Moderate performance. Test accuracy of {test_acc:.2%} - consider feature engineering or trying different algorithms.")
            else:
                insights.append(f"⚠️ Low performance. Test accuracy of {test_acc:.2%} - significant improvements needed.")
            
            # Overfitting check
            if train_acc - test_acc > 0.1:
                gap = train_acc - test_acc
                insights.append(f"⚠️ Overfitting detected! Training accuracy ({train_acc:.2%}) is {gap:.2%} higher than test accuracy. Consider regularization or more data.")
            elif train_acc - test_acc < 0.05:
                insights.append("✅ Model generalizes well - minimal gap between training and test accuracy.")
            
            # F1 Score
            f1 = metrics.get("f1_score", 0)
            if f1 >= 0.8:
                insights.append(f"💪 Strong F1 score of {f1:.3f} indicates balanced precision and recall.")
            
            # ROC AUC
            if "roc_auc" in metrics:
                auc = metrics["roc_auc"]
                if auc >= 0.9:
                    insights.append(f"🌟 Excellent discrimination ability (ROC AUC: {auc:.3f})")
        
        elif problem_type == "regression":
            r2 = metrics.get("test_r2", 0)
            rmse = metrics.get("rmse", 0)
            
            # R² interpretation
            if r2 >= 0.9:
                insights.append(f"🎯 Excellent fit! R² of {r2:.3f} means the model explains {r2*100:.1f}% of variance.")
            elif r2 >= 0.7:
                insights.append(f"✅ Good fit! R² of {r2:.3f} indicates strong predictive power.")
            elif r2 >= 0.5:
                insights.append(f"📊 Moderate fit. R² of {r2:.3f} - consider adding more relevant features.")
            else:
                insights.append(f"⚠️ Weak fit. R² of {r2:.3f} suggests the model may not capture the underlying pattern well.")
            
            # RMSE insight
            insights.append(f"📏 Average prediction error (RMSE): {rmse:.4f}")
            
            # Overfitting check
            train_r2 = metrics.get("train_r2", 0)
            if train_r2 - r2 > 0.15:
                insights.append("⚠️ Model may be overfitting - consider regularization or simpler model.")
        
        # Cross-validation
        if "cv_mean" in metrics:
            cv_mean = metrics["cv_mean"]
            cv_std = metrics.get("cv_std", 0)
            insights.append(f"📊 Cross-validation score: {cv_mean:.3f} (±{cv_std:.3f}) - indicates model stability.")
        
        return insights
    
    def _generate_data_insights(self, data_analysis: Dict) -> List[str]:
        """Generate insights about data quality and characteristics"""
        
        if not data_analysis:
            return []
        
        insights = []
        
        basic_info = data_analysis.get("basic_info", {})
        quality_score = data_analysis.get("quality_score", {})
        
        # Data quality
        if quality_score:
            overall = quality_score.get("overall_score", 0)
            rating = quality_score.get("rating", "Unknown")
            insights.append(f"📊 Data quality score: {overall:.1f}/100 ({rating})")
        
        # Dataset size
        rows = basic_info.get("rows", 0)
        cols = basic_info.get("columns", 0)
        if rows < 1000:
            insights.append(f"⚠️ Small dataset ({rows} rows) - results may be less reliable. Consider collecting more data.")
        elif rows > 10000:
            insights.append(f"✅ Large dataset ({rows} rows) - provides good statistical power.")
        
        # Missing values
        missing_analysis = data_analysis.get("missing_analysis", {})
        missing_pct = missing_analysis.get("overall_percentage", 0)
        if missing_pct > 20:
            insights.append(f"⚠️ High missing data ({missing_pct:.1f}%) - imputation strategies applied.")
        elif missing_pct > 5:
            insights.append(f"📝 Moderate missing data ({missing_pct:.1f}%) - handled during preprocessing.")
        
        return insights
    
    def _generate_recommendations(self, model_info: Dict, model_comparison: Dict,
                                  data_analysis: Dict, problem_type: str) -> List[str]:
        """Generate actionable recommendations"""
        
        recommendations = []
        
        # Model-specific recommendations
        algo_name = model_info.get("algorithm_name", "")
        test_score = model_info.get("metrics", {}).get("test_score", 0)
        
        if test_score < 0.7:
            recommendations.append("🔧 Consider collecting more data or engineering better features to improve performance.")
            recommendations.append("🔍 Try ensemble methods or more sophisticated algorithms.")
        
        # Deployment recommendations
        if test_score >= 0.8:
            recommendations.append("✅ Model performance is good - ready for deployment in low-risk scenarios.")
            if test_score >= 0.9:
                recommendations.append("🚀 Excellent performance - model is production-ready for most use cases.")
        else:
            recommendations.append("⏸️ Performance needs improvement before deployment - continue iterating.")
        
        # Feature engineering recommendations
        feature_insights = model_info.get("feature_importance", [])
        if feature_insights:
            top_importance = feature_insights[0].get("importance", 0)
            if top_importance > 0.5:
                top_feature = feature_insights[0].get("feature")
                recommendations.append(f"💡 Feature '{top_feature}' is dominant ({top_importance:.2%}). Investigate this feature carefully.")
        
        # Data recommendations
        if data_analysis:
            quality = data_analysis.get("quality_score", {}).get("overall_score", 100)
            if quality < 70:
                recommendations.append("🧹 Improve data quality through better collection and validation processes.")
        
        # Model interpretation
        recommendations.append("📊 Use SHAP or LIME for detailed prediction explanations in production.")
        recommendations.append("📈 Monitor model performance over time to detect drift.")
        
        # Next steps
        recommendations.append("🔄 Continuously retrain with new data to maintain performance.")
        recommendations.append("🎯 Set up A/B testing to validate model impact in production.")
        
        return recommendations
    
    def _generate_shap_insights(self, model_info: Dict, data: Any) -> Dict[str, Any]:
        """Generate SHAP-based explanations (placeholder for now)"""
        
        if not SHAP_AVAILABLE:
            return {"available": False, "message": "SHAP library not installed"}
        
        # This would contain actual SHAP analysis in production
        return {
            "available": True,
            "message": "SHAP analysis would be performed here for detailed feature interactions"
        }
    
    def _summarize_key_findings(self, model_info: Dict, feature_insights: Dict,
                                performance_insights: List[str], problem_type: str) -> List[str]:
        """Create executive summary of key findings"""
        
        findings = []
        
        # Best model
        algo_name = model_info.get("algorithm_name", "Unknown")
        test_score = model_info.get("metrics", {}).get("test_score", 0)
        
        if problem_type == "classification":
            findings.append(f"🏆 Best Model: {algo_name} with {test_score:.1%} accuracy")
        elif problem_type == "regression":
            findings.append(f"🏆 Best Model: {algo_name} with R² of {test_score:.3f}")
        else:
            findings.append(f"🏆 Best Model: {algo_name} with silhouette score {test_score:.3f}")
        
        # Top feature
        if feature_insights.get("top_features"):
            top_feature = feature_insights["top_features"][0]
            findings.append(f"⭐ Most Important Feature: {top_feature['feature']} ({top_feature['importance']:.2%})")
        
        # Performance summary (first insight)
        if performance_insights:
            findings.append(performance_insights[0])
        
        return findings
    
    def _create_model_summary(self, model_info: Dict, problem_type: str) -> Dict[str, Any]:
        """Create comprehensive model summary"""
        
        metrics = model_info.get("metrics", {})
        
        summary = {
            "algorithm": model_info.get("algorithm_name"),
            "problem_type": problem_type,
            "performance_score": metrics.get("test_score", 0),
            "hyperparameters": model_info.get("hyperparameters", {}),
            "status": "ready_for_deployment" if metrics.get("test_score", 0) >= 0.8 else "needs_improvement"
        }
        
        # Add problem-specific metrics
        if problem_type == "classification":
            summary["key_metrics"] = {
                "accuracy": metrics.get("test_accuracy", 0),
                "f1_score": metrics.get("f1_score", 0),
                "precision": metrics.get("precision", 0),
                "recall": metrics.get("recall", 0)
            }
        elif problem_type == "regression":
            summary["key_metrics"] = {
                "r2_score": metrics.get("test_r2", 0),
                "rmse": metrics.get("rmse", 0),
                "mae": metrics.get("mae", 0)
            }
        
        return summary
