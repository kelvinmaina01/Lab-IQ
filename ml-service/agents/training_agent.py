"""
Training and Evaluation Agent - Model training with comprehensive evaluation
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from .base_agent import BaseAgent
from sklearn.model_selection import train_test_split, cross_val_score, cross_validate
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, VotingClassifier, VotingRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.cluster import KMeans, DBSCAN
from sklearn.mixture import GaussianMixture
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    mean_squared_error, r2_score, mean_absolute_error,
    silhouette_score, davies_bouldin_score, calinski_harabasz_score,
    confusion_matrix, classification_report
)
import joblib
import os
import logging

logger = logging.getLogger(__name__)

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False

try:
    import catboost as cb
    CATBOOST_AVAILABLE = True
except ImportError:
    CATBOOST_AVAILABLE = False


class TrainingAgent(BaseAgent):
    """Agent responsible for model training and evaluation"""
    
    def __init__(self):
        super().__init__("training_agent", "Training & Evaluation Agent 📊")
    
    async def execute(self, data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Train and evaluate multiple models
        """
        df = pd.DataFrame(data)
        target_column = context.get("target_column")
        problem_type = context.get("problem_type", "classification")
        optimized_algorithms = context.get("optimized_algorithms", [])
        dataset_id = context.get("dataset_id", "unknown")
        
        # Prepare data
        X, y = self._prepare_data(df, target_column)
        
        # Split data
        if problem_type != "clustering":
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
        else:
            X_train = X
            y_train = None
            X_test = None
            y_test = None
        
        # Train all models
        model_results = []
        trained_models = []
        
        for algo_info in optimized_algorithms:
            if algo_info.get("status") == "skipped":
                continue
            
            logger.info(f"Training {algo_info['algorithm_name']}...")
            
            result = self._train_model(
                algo_info, X_train, y_train, X_test, y_test, problem_type
            )
            
            if result["status"] == "success":
                model_results.append(result)
                trained_models.append({
                    "algorithm": algo_info["algorithm_id"],
                    "model": result["model"],
                    "score": result["metrics"].get("test_score", 0)
                })
        
        # Sort by performance
        model_results.sort(key=lambda x: x["metrics"].get("test_score", 0), reverse=True)
        
        # Get best model
        best_model_info = model_results[0] if model_results else None
        
        # Create ensemble if we have multiple models
        ensemble_result = None
        if len(trained_models) >= 2 and problem_type != "clustering":
            ensemble_result = self._create_ensemble(
                trained_models, X_train, y_train, X_test, y_test, problem_type
            )
            if ensemble_result:
                model_results.append(ensemble_result)
        
        # Save best model
        model_path = None
        if best_model_info:
            model_path = self._save_model(
                best_model_info["model"],
                dataset_id,
                best_model_info["algorithm_name"]
            )
        
        return {
            "models_trained": len(model_results),
            "model_results": model_results,
            "best_model": best_model_info,
            "ensemble_model": ensemble_result,
            "model_path": model_path,
            "training_samples": len(X_train),
            "test_samples": len(X_test) if X_test is not None else 0
        }
    
    def _prepare_data(self, df: pd.DataFrame, target_column: str) -> Tuple:
        """Prepare features and target"""
        if target_column and target_column in df.columns:
            X = df.drop(columns=[target_column])
            y = df[target_column]
        else:
            X = df
            y = None
        
        # Handle any remaining infinite values
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(X.median())
        
        return X, y
    
    def _train_model(self, algo_info: Dict, X_train, y_train, X_test, y_test, 
                    problem_type: str) -> Dict[str, Any]:
        """Train a single model"""
        
        try:
            algo_id = algo_info["algorithm_id"]
            params = algo_info.get("best_params", {})
            
            # Create model instance
            model = self._create_model(algo_id, problem_type, params)
            
            if model is None:
                return {
                    "status": "failed",
                    "algorithm_name": algo_info["algorithm_name"],
                    "error": "Model creation failed"
                }
            
            # Train model
            if problem_type == "clustering":
                model.fit(X_train)
                y_pred = model.predict(X_train)
                metrics = self._evaluate_clustering(X_train, y_pred)
            else:
                model.fit(X_train, y_train)
                
                # Predictions
                y_train_pred = model.predict(X_train)
                y_test_pred = model.predict(X_test)
                
                # Evaluate
                if problem_type == "classification":
                    metrics = self._evaluate_classification(
                        y_train, y_train_pred, y_test, y_test_pred, model, X_test
                    )
                else:  # regression
                    metrics = self._evaluate_regression(
                        y_train, y_train_pred, y_test, y_test_pred
                    )
                
                # Cross-validation
                cv_scores = cross_val_score(model, X_train, y_train, cv=5)
                metrics["cv_mean"] = float(cv_scores.mean())
                metrics["cv_std"] = float(cv_scores.std())
            
            # Feature importance if available
            feature_importance = None
            if hasattr(model, 'feature_importances_'):
                importance = model.feature_importances_
                feature_importance = [
                    {"feature": col, "importance": float(imp)}
                    for col, imp in zip(X_train.columns, importance)
                ]
                feature_importance.sort(key=lambda x: x['importance'], reverse=True)
            
            return {
                "status": "success",
                "algorithm_id": algo_id,
                "algorithm_name": algo_info["algorithm_name"],
                "model": model,
                "metrics": metrics,
                "feature_importance": feature_importance[:20] if feature_importance else None,
                "hyperparameters": params
            }
            
        except Exception as e:
            logger.error(f"Training failed for {algo_info['algorithm_name']}: {e}")
            return {
                "status": "failed",
                "algorithm_name": algo_info["algorithm_name"],
                "error": str(e)
            }
    
    def _create_model(self, algo_id: str, problem_type: str, params: Dict):
        """Create model instance"""
        
        if problem_type == "classification":
            models = {
                "random_forest": RandomForestClassifier,
                "logistic_regression": LogisticRegression,
                "svm": SVC,
                "knn": KNeighborsClassifier,
                "naive_bayes": GaussianNB
            }
            
            if algo_id == "xgboost" and XGBOOST_AVAILABLE:
                return xgb.XGBClassifier(**params)
            elif algo_id == "lightgbm" and LIGHTGBM_AVAILABLE:
                return lgb.LGBMClassifier(**params)
            elif algo_id == "catboost" and CATBOOST_AVAILABLE:
                return cb.CatBoostClassifier(**params)
            elif algo_id in models:
                return models[algo_id](**params)
                
        elif problem_type == "regression":
            models = {
                "random_forest": RandomForestRegressor,
                "linear_regression": LinearRegression,
                "ridge": Ridge,
                "svr": SVR
            }
            
            if algo_id == "xgboost" and XGBOOST_AVAILABLE:
                return xgb.XGBRegressor(**params)
            elif algo_id == "lightgbm" and LIGHTGBM_AVAILABLE:
                return lgb.LGBMRegressor(**params)
            elif algo_id == "catboost" and CATBOOST_AVAILABLE:
                return cb.CatBoostRegressor(**params)
            elif algo_id in models:
                return models[algo_id](**params)
                
        else:  # clustering
            if algo_id == "kmeans":
                return KMeans(**params)
            elif algo_id == "dbscan":
                return DBSCAN(**params)
            elif algo_id == "gaussian_mixture":
                return GaussianMixture(**params)
        
        return None
    
    def _evaluate_classification(self, y_train, y_train_pred, y_test, y_test_pred, 
                                model, X_test) -> Dict[str, float]:
        """Evaluate classification model"""
        
        metrics = {
            "train_accuracy": float(accuracy_score(y_train, y_train_pred)),
            "test_accuracy": float(accuracy_score(y_test, y_test_pred)),
            "test_score": float(accuracy_score(y_test, y_test_pred)),  # Main score
            "precision": float(precision_score(y_test, y_test_pred, average='weighted', zero_division=0)),
            "recall": float(recall_score(y_test, y_test_pred, average='weighted', zero_division=0)),
            "f1_score": float(f1_score(y_test, y_test_pred, average='weighted', zero_division=0))
        }
        
        # ROC AUC if probability supported
        if hasattr(model, 'predict_proba'):
            try:
                y_proba = model.predict_proba(X_test)
                if len(np.unique(y_test)) == 2:  # Binary classification
                    metrics["roc_auc"] = float(roc_auc_score(y_test, y_proba[:, 1]))
                else:  # Multi-class
                    metrics["roc_auc"] = float(roc_auc_score(y_test, y_proba, multi_class='ovr', average='weighted'))
            except Exception as e:
                logger.warning(f"Could not calculate ROC AUC: {e}")
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_test_pred)
        metrics["confusion_matrix"] = cm.tolist()
        
        return metrics
    
    def _evaluate_regression(self, y_train, y_train_pred, y_test, y_test_pred) -> Dict[str, float]:
        """Evaluate regression model"""
        
        return {
            "train_r2": float(r2_score(y_train, y_train_pred)),
            "test_r2": float(r2_score(y_test, y_test_pred)),
            "test_score": float(r2_score(y_test, y_test_pred)),  # Main score
            "rmse": float(np.sqrt(mean_squared_error(y_test, y_test_pred))),
            "mae": float(mean_absolute_error(y_test, y_test_pred)),
            "mse": float(mean_squared_error(y_test, y_test_pred))
        }
    
    def _evaluate_clustering(self, X, labels) -> Dict[str, float]:
        """Evaluate clustering model"""
        
        metrics = {}
        
        try:
            metrics["silhouette_score"] = float(silhouette_score(X, labels))
            metrics["davies_bouldin"] = float(davies_bouldin_score(X, labels))
            metrics["calinski_harabasz"] = float(calinski_harabasz_score(X, labels))
            metrics["test_score"] = metrics["silhouette_score"]  # Main score
        except Exception as e:
            logger.warning(f"Clustering evaluation error: {e}")
            metrics["test_score"] = 0.0
        
        return metrics
    
    def _create_ensemble(self, trained_models: List, X_train, y_train, X_test, y_test,
                        problem_type: str) -> Dict[str, Any]:
        """Create ensemble model from top performers"""
        
        try:
            # Take top 3 models
            top_models = sorted(trained_models, key=lambda x: x["score"], reverse=True)[:3]
            
            estimators = [(m["algorithm"], m["model"]) for m in top_models]
            
            if problem_type == "classification":
                ensemble = VotingClassifier(estimators=estimators, voting='soft')
            else:
                ensemble = VotingRegressor(estimators=estimators)
            
            # Train ensemble
            ensemble.fit(X_train, y_train)
            
            # Evaluate
            y_train_pred = ensemble.predict(X_train)
            y_test_pred = ensemble.predict(X_test)
            
            if problem_type == "classification":
                metrics = self._evaluate_classification(
                    y_train, y_train_pred, y_test, y_test_pred, ensemble, X_test
                )
            else:
                metrics = self._evaluate_regression(
                    y_train, y_train_pred, y_test, y_test_pred
                )
            
            return {
                "status": "success",
                "algorithm_id": "ensemble",
                "algorithm_name": "Voting Ensemble",
                "model": ensemble,
                "metrics": metrics,
                "base_models": [m["algorithm"] for m in top_models],
                "hyperparameters": {"voting": "soft" if problem_type == "classification" else "average"}
            }
            
        except Exception as e:
            logger.error(f"Ensemble creation failed: {e}")
            return None
    
    def _save_model(self, model, dataset_id: str, algorithm_name: str) -> str:
        """Save trained model to disk"""
        
        try:
            model_dir = "models"
            os.makedirs(model_dir, exist_ok=True)
            
            model_filename = f"{dataset_id}_{algorithm_name.replace(' ', '_')}_model.pkl"
            model_path = os.path.join(model_dir, model_filename)
            
            joblib.dump(model, model_path)
            logger.info(f"Model saved to {model_path}")
            
            return model_path
            
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
            return None
