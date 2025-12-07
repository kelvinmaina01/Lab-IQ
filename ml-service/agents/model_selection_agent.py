"""
Model Selection Agent - Intelligent algorithm selection and recommendation
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from .base_agent import BaseAgent
import logging

logger = logging.getLogger(__name__)


class ModelSelectionAgent(BaseAgent):
    """Agent responsible for selecting optimal ML algorithms"""
    
    def __init__(self):
        super().__init__("model_selection_agent", "Model Selection Agent 🤖")
    
    async def execute(self, data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Select best algorithms based on problem characteristics
        """
        df = pd.DataFrame(data)
        target_column = context.get("target_column")
        problem_type = context.get("problem_type")
        data_analysis = context.get("data_analysis", {})
        
        # Auto-detect problem type if not provided
        if not problem_type:
            problem_type = self._detect_problem_type(df, target_column)
        
        # Analyze dataset characteristics
        characteristics = self._analyze_dataset_characteristics(df, target_column, data_analysis)
        
        # Get algorithm recommendations
        recommendations = self._get_algorithm_recommendations(problem_type, characteristics)
        
        # Get ensemble strategies
        ensemble_strategies = self._get_ensemble_strategies(problem_type)
        
        return {
            "problem_type": problem_type,
            "dataset_characteristics": characteristics,
            "recommended_algorithms": recommendations,
            "ensemble_strategies": ensemble_strategies,
            "total_algorithms": len(recommendations)
        }
    
    def _detect_problem_type(self, df: pd.DataFrame, target_column: str = None) -> str:
        """Auto-detect problem type"""
        if not target_column or target_column not in df.columns:
            return "clustering"
        
        target = df[target_column]
        unique_ratio = len(target.unique()) / len(target)
        
        # Check if numeric
        if pd.api.types.is_numeric_dtype(target):
            if unique_ratio > 0.05:  # More than 5% unique values
                return "regression"
            elif unique_ratio > 0.5:
                return "regression"
            else:
                return "classification"
        else:
            return "classification"
    
    def _analyze_dataset_characteristics(self, df: pd.DataFrame, target_column: str,
                                         data_analysis: Dict) -> Dict[str, Any]:
        """Analyze dataset to inform algorithm selection"""
        n_samples = len(df)
        n_features = len(df.columns) - (1 if target_column else 0)
        
        # Get class information for classification
        class_balance = None
        n_classes = None
        if target_column and target_column in df.columns:
            target = df[target_column]
            if not pd.api.types.is_numeric_dtype(target) or target.nunique() < 20:
                value_counts = target.value_counts()
                n_classes = len(value_counts)
                class_balance = {
                    "balanced": value_counts.min() / value_counts.max() > 0.5,
                    "ratio": float(value_counts.min() / value_counts.max()),
                    "classes": n_classes
                }
        
        # Dataset size category
        if n_samples < 1000:
            size_category = "small"
        elif n_samples < 10000:
            size_category = "medium"
        elif n_samples < 100000:
            size_category = "large"
        else:
            size_category = "very_large"
        
        # Feature count category
        if n_features < 10:
            feature_category = "low"
        elif n_features < 50:
            feature_category = "medium"
        elif n_features < 200:
            feature_category = "high"
        else:
            feature_category = "very_high"
        
        # Linearity check (simple heuristic)
        linearity = "unknown"
        if target_column and target_column in df.columns:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 1:
                # Simple correlation check
                correlations = df[numeric_cols].corr()[target_column].abs()
                avg_correlation = correlations.mean()
                linearity = "likely_linear" if avg_correlation > 0.5 else "likely_nonlinear"
        
        return {
            "n_samples": n_samples,
            "n_features": n_features,
            "size_category": size_category,
            "feature_category": feature_category,
            "class_balance": class_balance,
            "n_classes": n_classes,
            "linearity": linearity,
            "has_missing_values": df.isnull().sum().sum() > 0,
            "has_categorical": len(df.select_dtypes(include=['object']).columns) > 0
        }
    
    def _get_algorithm_recommendations(self, problem_type: str, 
                                      characteristics: Dict) -> List[Dict[str, Any]]:
        """Get ranked algorithm recommendations"""
        
        if problem_type == "classification":
            return self._get_classification_algorithms(characteristics)
        elif problem_type == "regression":
            return self._get_regression_algorithms(characteristics)
        else:  # clustering
            return self._get_clustering_algorithms(characteristics)
    
    def _get_classification_algorithms(self, chars: Dict) -> List[Dict[str, Any]]:
        """Get classification algorithm recommendations"""
        algorithms = []
        
        # Random Forest - versatile, works well in most cases
        algorithms.append({
            "id": "random_forest",
            "name": "Random Forest",
            "library": "sklearn",
            "priority": 1,
            "rationale": "Excellent general-purpose algorithm, handles non-linear relationships, robust to outliers",
            "pros": ["No feature scaling needed", "Feature importance", "Handles missing values"],
            "cons": ["Can be slow on large datasets", "Black box model"],
            "suitable_for": ["small", "medium", "large"],
            "hyperparameters": {
                "n_estimators": [100, 200, 300],
                "max_depth": [None, 10, 20, 30],
                "min_samples_split": [2, 5, 10],
                "min_samples_leaf": [1, 2, 4]
            }
        })
        
        # XGBoost - high performance
        algorithms.append({
            "id": "xgboost",
            "name": "XGBoost",
            "library": "xgboost",
            "priority": 1,
            "rationale": "State-of-the-art gradient boosting, often wins competitions",
            "pros": ["High accuracy", "Regularization", "Handles missing data"],
            "cons": ["Requires tuning", "Can overfit on small datasets"],
            "suitable_for": ["medium", "large", "very_large"],
            "hyperparameters": {
                "n_estimators": [100, 200, 300],
                "max_depth": [3, 5, 7, 9],
                "learning_rate": [0.01, 0.05, 0.1, 0.2],
                "subsample": [0.8, 0.9, 1.0],
                "colsample_bytree": [0.8, 0.9, 1.0]
            }
        })
        
        # LightGBM - fast and efficient
        algorithms.append({
            "id": "lightgbm",
            "name": "LightGBM",
            "library": "lightgbm",
            "priority": 1,
            "rationale": "Very fast training, efficient memory usage, great for large datasets",
            "pros": ["Fast training", "Low memory", "Handles categorical features"],
            "cons": ["Can overfit on small datasets", "Sensitive to parameters"],
            "suitable_for": ["medium", "large", "very_large"],
            "hyperparameters": {
                "n_estimators": [100, 200, 300],
                "max_depth": [3, 5, 7],
                "learning_rate": [0.01, 0.05, 0.1],
                "num_leaves": [31, 63, 127]
            }
        })
        
        # Logistic Regression - simple and interpretable
        algorithms.append({
            "id": "logistic_regression",
            "name": "Logistic Regression",
            "library": "sklearn",
            "priority": 2 if chars["linearity"] == "likely_linear" else 3,
            "rationale": "Simple, fast, interpretable - great baseline",
            "pros": ["Fast training", "Interpretable", "Low memory"],
            "cons": ["Assumes linearity", "May underfit complex data"],
            "suitable_for": ["small", "medium", "large", "very_large"],
            "hyperparameters": {
                "C": [0.001, 0.01, 0.1, 1, 10, 100],
                "penalty": ["l1", "l2"],
                "solver": ["liblinear", "saga"]
            }
        })
        
        # CatBoost - handles categorical well
        if chars["has_categorical"]:
            algorithms.append({
                "id": "catboost",
                "name": "CatBoost",
                "library": "catboost",
                "priority": 1,
                "rationale": "Excellent for categorical features, no preprocessing needed",
                "pros": ["Handles categorical automatically", "High accuracy", "Robust"],
                "cons": ["Slower training", "Large model size"],
                "suitable_for": ["small", "medium", "large"],
                "hyperparameters": {
                    "iterations": [100, 200, 300],
                    "depth": [4, 6, 8],
                    "learning_rate": [0.01, 0.05, 0.1]
                }
            })
        
        # SVM for small-medium datasets
        if chars["size_category"] in ["small", "medium"]:
            algorithms.append({
                "id": "svm",
                "name": "Support Vector Machine",
                "library": "sklearn",
                "priority": 2,
                "rationale": "Effective in high dimensional spaces",
                "pros": ["Effective for small datasets", "Handles high dimensions"],
                "cons": ["Slow on large datasets", "Requires scaling"],
                "suitable_for": ["small", "medium"],
                "hyperparameters": {
                    "C": [0.1, 1, 10],
                    "kernel": ["rbf", "linear"],
                    "gamma": ["scale", "auto"]
                }
            })
        
        # K-Nearest Neighbors
        if chars["size_category"] in ["small", "medium"]:
            algorithms.append({
                "id": "knn",
                "name": "K-Nearest Neighbors",
                "library": "sklearn",
                "priority": 3,
                "rationale": "Simple, non-parametric algorithm",
                "pros": ["Simple", "No training time", "Naturally handles multi-class"],
                "cons": ["Slow prediction", "Memory intensive", "Sensitive to scale"],
                "suitable_for": ["small", "medium"],
                "hyperparameters": {
                    "n_neighbors": [3, 5, 7, 9, 11],
                    "weights": ["uniform", "distance"],
                    "metric": ["euclidean", "manhattan"]
                }
            })
        
        # Naive Bayes for text/high dimensional
        algorithms.append({
            "id": "naive_bayes",
            "name": "Naive Bayes",
            "library": "sklearn",
            "priority": 3,
            "rationale": "Fast, works well with high-dimensional data",
            "pros": ["Very fast", "Low memory", "Works with small datasets"],
            "cons": ["Assumes independence", "May underperform"],
            "suitable_for": ["small", "medium", "large"],
            "hyperparameters": {
                "var_smoothing": [1e-9, 1e-8, 1e-7, 1e-6]
            }
        })
        
        # Sort by priority and suitable size
        algorithms = [
            algo for algo in algorithms 
            if chars["size_category"] in algo["suitable_for"]
        ]
        algorithms.sort(key=lambda x: x["priority"])
        
        return algorithms
    
    def _get_regression_algorithms(self, chars: Dict) -> List[Dict[str, Any]]:
        """Get regression algorithm recommendations"""
        algorithms = []
        
        # Random Forest Regressor
        algorithms.append({
            "id": "random_forest",
            "name": "Random Forest Regressor",
            "library": "sklearn",
            "priority": 1,
            "rationale": "Robust, handles non-linearity well",
            "pros": ["No scaling needed", "Feature importance", "Robust to outliers"],
            "cons": ["Can be slow", "Memory intensive"],
            "suitable_for": ["small", "medium", "large"],
            "hyperparameters": {
                "n_estimators": [100, 200, 300],
                "max_depth": [None, 10, 20, 30],
                "min_samples_split": [2, 5, 10]
            }
        })
        
        # XGBoost Regressor
        algorithms.append({
            "id": "xgboost",
            "name": "XGBoost Regressor",
            "library": "xgboost",
            "priority": 1,
            "rationale": "High performance, regularization built-in",
            "pros": ["High accuracy", "Regularization", "Fast"],
            "cons": ["Requires tuning", "Can overfit"],
            "suitable_for": ["medium", "large", "very_large"],
            "hyperparameters": {
                "n_estimators": [100, 200, 300],
                "max_depth": [3, 5, 7],
                "learning_rate": [0.01, 0.05, 0.1]
            }
        })
        
        # LightGBM Regressor
        algorithms.append({
            "id": "lightgbm",
            "name": "LightGBM Regressor",
            "library": "lightgbm",
            "priority": 1,
            "rationale": "Very fast, efficient for large datasets",
            "pros": ["Fast", "Low memory", "High accuracy"],
            "cons": ["Can overfit small data", "Requires tuning"],
            "suitable_for": ["medium", "large", "very_large"],
            "hyperparameters": {
                "n_estimators": [100, 200, 300],
                "max_depth": [3, 5, 7],
                "learning_rate": [0.01, 0.05, 0.1]
            }
        })
        
        # Linear Regression
        algorithms.append({
            "id": "linear_regression",
            "name": "Linear Regression",
            "library": "sklearn",
            "priority": 2 if chars["linearity"] == "likely_linear" else 3,
            "rationale": "Simple, interpretable, fast",
            "pros": ["Very fast", "Interpretable", "Low memory"],
            "cons": ["Assumes linearity", "Sensitive to outliers"],
            "suitable_for": ["small", "medium", "large", "very_large"],
            "hyperparameters": {}
        })
        
        # Ridge Regression
        algorithms.append({
            "id": "ridge",
            "name": "Ridge Regression",
            "library": "sklearn",
            "priority": 2,
            "rationale": "Linear regression with L2 regularization",
            "pros": ["Handles multicollinearity", "Interpretable"],
            "cons": ["Assumes linearity"],
            "suitable_for": ["small", "medium", "large"],
            "hyperparameters": {
                "alpha": [0.01, 0.1, 1, 10, 100]
            }
        })
        
        # SVR for small-medium datasets
        if chars["size_category"] in ["small", "medium"]:
            algorithms.append({
                "id": "svr",
                "name": "Support Vector Regression",
                "library": "sklearn",
                "priority": 2,
                "rationale": "Effective for small datasets",
                "pros": ["Works well with small data", "Handles non-linearity"],
                "cons": ["Slow on large data", "Requires scaling"],
                "suitable_for": ["small", "medium"],
                "hyperparameters": {
                    "C": [0.1, 1, 10],
                    "kernel": ["rbf", "linear"],
                    "epsilon": [0.01, 0.1, 0.2]
                }
            })
        
        algorithms = [
            algo for algo in algorithms 
            if chars["size_category"] in algo["suitable_for"]
        ]
        algorithms.sort(key=lambda x: x["priority"])
        
        return algorithms
    
    def _get_clustering_algorithms(self, chars: Dict) -> List[Dict[str, Any]]:
        """Get clustering algorithm recommendations"""
        return [
            {
                "id": "kmeans",
                "name": "K-Means",
                "library": "sklearn",
                "priority": 1,
                "rationale": "Fast, scalable clustering algorithm",
                "pros": ["Fast", "Scalable", "Simple"],
                "cons": ["Requires k specification", "Sensitive to outliers"],
                "hyperparameters": {
                    "n_clusters": [2, 3, 4, 5, 6, 7, 8, 9, 10],
                    "init": ["k-means++", "random"]
                }
            },
            {
                "id": "dbscan",
                "name": "DBSCAN",
                "library": "sklearn",
                "priority": 2,
                "rationale": "Density-based, finds arbitrary shapes",
                "pros": ["Finds arbitrary shapes", "Robust to outliers", "No k needed"],
                "cons": ["Sensitive to parameters", "Varying densities"],
                "hyperparameters": {
                    "eps": [0.3, 0.5, 0.7, 1.0],
                    "min_samples": [5, 10, 15, 20]
                }
            },
            {
                "id": "gaussian_mixture",
                "name": "Gaussian Mixture",
                "library": "sklearn",
                "priority": 2,
                "rationale": "Probabilistic clustering",
                "pros": ["Soft clustering", "Flexible shapes"],
                "cons": ["Can be slow", "May not converge"],
                "hyperparameters": {
                    "n_components": [2, 3, 4, 5, 6, 7, 8],
                    "covariance_type": ["full", "tied", "diag", "spherical"]
                }
            }
        ]
    
    def _get_ensemble_strategies(self, problem_type: str) -> List[Dict[str, Any]]:
        """Get ensemble learning strategies"""
        strategies = [
            {
                "id": "voting",
                "name": "Voting Ensemble",
                "description": "Combine predictions from multiple models by voting (classification) or averaging (regression)",
                "suitable_for": ["classification", "regression"],
                "complexity": "low"
            },
            {
                "id": "stacking",
                "name": "Stacking Ensemble",
                "description": "Train a meta-model on predictions from base models",
                "suitable_for": ["classification", "regression"],
                "complexity": "high"
            },
            {
                "id": "bagging",
                "name": "Bagging",
                "description": "Bootstrap aggregating to reduce variance",
                "suitable_for": ["classification", "regression"],
                "complexity": "medium"
            }
        ]
        
        return [s for s in strategies if problem_type in s["suitable_for"]]
