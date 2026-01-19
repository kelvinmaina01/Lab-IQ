"""
Feature Engineering Agent - Automated feature creation and selection
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from .base_agent import BaseAgent
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.feature_selection import SelectKBest, f_classif, f_regression, mutual_info_classif, mutual_info_regression
from sklearn.decomposition import PCA
# Must enable experimental feature before importing IterativeImputer
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import KNNImputer, IterativeImputer
import logging

logger = logging.getLogger(__name__)


class FeatureEngineeringAgent(BaseAgent):
    """Agent responsible for automated feature engineering and selection"""
    
    def __init__(self):
        super().__init__("feature_agent", "Feature Engineering Agent ⚙️")
    
    async def execute(self, data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform automated feature engineering
        """
        df = pd.DataFrame(data)
        target_column = context.get("target_column")
        problem_type = context.get("problem_type", "classification")
        
        # Get data analysis from Data Agent
        data_analysis = context.get("data_analysis", {})
        
        # Create a copy for feature engineering
        df_engineered = df.copy()
        
        # Handle missing values
        df_engineered, missing_report = self._handle_missing_values(df_engineered, target_column)
        
        # Encode categorical variables
        df_engineered, encoding_report = self._encode_categorical(df_engineered, target_column)
        
        # Generate new features
        df_engineered, generated_features = self._generate_features(df_engineered, target_column)
        
        # Feature selection
        if target_column and target_column in df_engineered.columns:
            selected_features, selection_report = self._select_features(
                df_engineered, target_column, problem_type
            )
        else:
            selected_features = df_engineered.columns.tolist()
            selection_report = {"message": "No target column for supervised selection"}
        
        # Scale features
        df_scaled, scaler_info = self._scale_features(df_engineered, target_column)
        
        # Dimensionality reduction if needed
        dimensionality_report = None
        if len(df_scaled.columns) > 50:
            df_reduced, dimensionality_report = self._reduce_dimensions(df_scaled, target_column)
        else:
            df_reduced = df_scaled
        
        # Calculate feature importance scores
        feature_scores = self._calculate_feature_importance(df_engineered, target_column, problem_type)
        
        return {
            "engineered_data": df_engineered.to_dict('records'),
            "scaled_data": df_scaled.to_dict('records'),
            "final_data": df_reduced.to_dict('records'),
            "missing_report": missing_report,
            "encoding_report": encoding_report,
            "generated_features": generated_features,
            "selected_features": selected_features,
            "selection_report": selection_report,
            "scaler_info": scaler_info,
            "dimensionality_report": dimensionality_report,
            "feature_scores": feature_scores,
            "original_features": len(df.columns),
            "final_features": len(df_reduced.columns)
        }
    
    def _handle_missing_values(self, df: pd.DataFrame, target_column: str = None) -> Tuple[pd.DataFrame, Dict]:
        """Handle missing values intelligently"""
        df = df.copy()
        report = {"strategies": {}}
        
        for col in df.columns:
            if col == target_column:
                # Drop rows with missing target
                before = len(df)
                df = df.dropna(subset=[col])
                after = len(df)
                if before != after:
                    report["strategies"][col] = f"Dropped {before - after} rows with missing target"
                continue
            
            missing_pct = df[col].isnull().sum() / len(df) * 100
            
            if missing_pct > 50:
                # Drop columns with >50% missing
                df = df.drop(columns=[col])
                report["strategies"][col] = f"Dropped (>{missing_pct:.1f}% missing)"
                df = df.drop(columns=[col])
                report["strategies"][col] = f"Dropped (>{missing_pct:.1f}% missing)"
            elif missing_pct > 0:
                 # Check if we should use advanced imputation (if missingness is significant but not overwhelming)
                 if 5 < missing_pct <= 50 and df[col].dtype in ['int64', 'float64']:
                      # Mark for advanced imputation later (batch handle)
                      continue 
                      
                 if df[col].dtype in ['int64', 'float64']:
                    # Fill numeric with median (fallback or for low missing)
                    df[col].fillna(df[col].median(), inplace=True)
                    report["strategies"][col] = f"Filled with median ({missing_pct:.1f}% missing)"
                 else:
                    # Fill categorical with mode
                    df[col].fillna(mode_val, inplace=True)
                    report["strategies"][col] = f"Filled with mode ({missing_pct:.1f}% missing)"
        
        # Run advanced imputation for remaining numeric columns
        df = self._advanced_imputation(df, report)
        
        report["total_handled"] = len(report["strategies"])
        return df, report

    def _advanced_imputation(self, df: pd.DataFrame, report: Dict) -> pd.DataFrame:
        """Apply AI-based imputation (KNN/Iterative)"""
        # Select numeric columns with missing values
        numeric_missing = [col for col in df.columns if df[col].isnull().any() and pd.api.types.is_numeric_dtype(df[col])]
        
        if not numeric_missing:
            return df
            
        # Strategy selection
        # If dataset is small < 1000 rows, KNN is good. If larger, Iterative might be better/faster?
        # Actually Iterative (MICE) is generally robust.
        
        try:
             # Use IterativeImputer (MICE) as default advanced method
             imputer = IterativeImputer(random_state=42, max_iter=10)
             df_imputed = df.copy()
             
             # Only impute numeric columns
             imputed_data = imputer.fit_transform(df[numeric_missing])
             df_imputed[numeric_missing] = imputed_data
             
             for col in numeric_missing:
                 report["strategies"][col] = "Filled with IterativeImputer (AI-based)"
                 
             return df_imputed
        except Exception as e:
             logger.warning(f"Advanced imputation failed: {e}. Falling back to simple methods.")
             return df
    
    def _encode_categorical(self, df: pd.DataFrame, target_column: str = None) -> Tuple[pd.DataFrame, Dict]:
        """Encode categorical variables"""
        df = df.copy()
        report = {"encoded_columns": {}}
        
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        categorical_cols = [col for col in categorical_cols if col != target_column]
        
        for col in categorical_cols:
            unique_count = df[col].nunique()
            
            if unique_count == 2:
                # Binary encoding
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                report["encoded_columns"][col] = "Binary (Label Encoding)"
            elif unique_count <= 10:
                # One-hot encoding for low cardinality
                dummies = pd.get_dummies(df[col], prefix=col, drop_first=True)
                df = pd.concat([df, dummies], axis=1)
                df = df.drop(columns=[col])
                report["encoded_columns"][col] = f"One-Hot ({unique_count} categories)"
            else:
                # Label encoding for high cardinality
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                report["encoded_columns"][col] = f"Label Encoding ({unique_count} categories)"
        
        return df, report
    
    def _generate_features(self, df: pd.DataFrame, target_column: str = None) -> Tuple[pd.DataFrame, List[str]]:
        """Generate new features automatically"""
        df = df.copy()
        generated = []
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if target_column in numeric_cols:
            numeric_cols.remove(target_column)
        
        # Only generate if we have numeric columns
        if len(numeric_cols) >= 2:
            # Interaction features (limited to avoid explosion)
            for i, col1 in enumerate(numeric_cols[:5]):  # Limit to first 5 columns
                for col2 in numeric_cols[i+1:6]:  # Limit combinations
                    # Multiplication
                    new_col = f"{col1}_x_{col2}"
                    df[new_col] = df[col1] * df[col2]
                    generated.append(new_col)
                    
                    # Addition
                    new_col = f"{col1}_plus_{col2}"
                    df[new_col] = df[col1] + df[col2]
                    generated.append(new_col)
                    
                    # Ratio (avoid division by zero)
                    new_col = f"{col1}_div_{col2}"
                    df[new_col] = df[col1] / (df[col2] + 1e-10)
                    generated.append(new_col)
        
        # Polynomial features (squared and cubed) for top numeric features
        for col in numeric_cols[:5]:
            # Squared
            new_col = f"{col}_squared"
            df[new_col] = df[col] ** 2
            generated.append(new_col)
            
            # Cubed
            new_col = f"{col}_cubed"
            df[new_col] = df[col] ** 3
            generated.append(new_col)
            
            # Square root (for positive values)
            if (df[col] >= 0).all():
                new_col = f"{col}_sqrt"
                df[new_col] = np.sqrt(df[col])
                generated.append(new_col)
        
        # Statistical features across numeric columns
        if len(numeric_cols) > 3:
            df['row_mean'] = df[numeric_cols].mean(axis=1)
            df['row_std'] = df[numeric_cols].std(axis=1)
            df['row_min'] = df[numeric_cols].min(axis=1)
            df['row_max'] = df[numeric_cols].max(axis=1)
            generated.extend(['row_mean', 'row_std', 'row_min', 'row_max'])
        
        return df, generated
    
    def _select_features(self, df: pd.DataFrame, target_column: str, 
                        problem_type: str = "classification") -> Tuple[List[str], Dict]:
        """Select best features using statistical tests"""
        
        if target_column not in df.columns:
            return df.columns.tolist(), {"error": "Target column not found"}
        
        X = df.drop(columns=[target_column])
        y = df[target_column]
        
        # Handle infinite values
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(X.median())
        
        # Select scoring function
        if problem_type == "regression":
            score_func = f_regression
        else:
            score_func = f_classif
        
        # Calculate number of features to select (keep top 80% or max 50)
        n_features = min(int(len(X.columns) * 0.8), 50, len(X.columns))
        
        try:
            selector = SelectKBest(score_func=score_func, k=n_features)
            selector.fit(X, y)
            
            # Get selected features
            selected_mask = selector.get_support()
            selected_features = X.columns[selected_mask].tolist()
            
            # Get feature scores
            scores = selector.scores_
            feature_scores = {
                col: float(score) for col, score in zip(X.columns, scores) 
                if not np.isnan(score)
            }
            
            # Sort by score
            sorted_features = sorted(feature_scores.items(), key=lambda x: x[1], reverse=True)
            
            report = {
                "method": "SelectKBest with " + ("f_regression" if problem_type == "regression" else "f_classif"),
                "original_features": len(X.columns),
                "selected_features": len(selected_features),
                "top_features": [name for name, score in sorted_features[:10]],
                "feature_scores": dict(sorted_features[:20])  # Top 20
            }
            
            return selected_features, report
            
        except Exception as e:
            logger.warning(f"Feature selection failed: {e}. Using all features.")
            return X.columns.tolist(), {"error": str(e)}
    
    def _scale_features(self, df: pd.DataFrame, target_column: str = None) -> Tuple[pd.DataFrame, Dict]:
        """Scale numerical features"""
        df = df.copy()
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if target_column in numeric_cols:
            numeric_cols.remove(target_column)
        
        if not numeric_cols:
            return df, {"message": "No numeric columns to scale"}
        
        scaler = StandardScaler()
        df[numeric_cols] = scaler.fit_transform(df[numeric_cols])
        
        info = {
            "scaler_type": "StandardScaler",
            "scaled_columns": numeric_cols,
            "count": len(numeric_cols)
        }
        
        return df, info
    
    def _reduce_dimensions(self, df: pd.DataFrame, target_column: str = None) -> Tuple[pd.DataFrame, Dict]:
        """Apply PCA for dimensionality reduction"""
        X = df.drop(columns=[target_column]) if target_column in df.columns else df
        y = df[target_column] if target_column in df.columns else None
        
        # Determine number of components (preserve 95% variance)
        pca = PCA(n_components=0.95, random_state=42)
        X_reduced = pca.fit_transform(X)
        
        # Create DataFrame with PCA components
        pca_df = pd.DataFrame(
            X_reduced,
            columns=[f'PC{i+1}' for i in range(X_reduced.shape[1])]
        )
        
        # Add target back if exists
        if y is not None:
            pca_df[target_column] = y.values
        
        report = {
            "method": "PCA",
            "original_dimensions": X.shape[1],
            "reduced_dimensions": X_reduced.shape[1],
            "variance_explained": float(pca.explained_variance_ratio_.sum()),
            "variance_per_component": pca.explained_variance_ratio_.tolist()[:10]
        }
        
        return pca_df, report
    
    def _calculate_feature_importance(self, df: pd.DataFrame, target_column: str, 
                                     problem_type: str) -> List[Dict[str, Any]]:
        """Calculate feature importance scores"""
        if not target_column or target_column not in df.columns:
            return []
        
        X = df.drop(columns=[target_column])
        y = df[target_column]
        
        # Handle infinite and missing values
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(X.median())
        
        try:
            # Use mutual information
            if problem_type == "regression":
                scores = mutual_info_regression(X, y, random_state=42)
            else:
                scores = mutual_info_classif(X, y, random_state=42)
            
            feature_scores = [
                {"feature": col, "importance": float(score)}
                for col, score in zip(X.columns, scores)
            ]
            
            # Sort by importance
            feature_scores.sort(key=lambda x: x['importance'], reverse=True)
            
            return feature_scores[:20]  # Top 20
            
        except Exception as e:
            logger.warning(f"Feature importance calculation failed: {e}")
            return []
