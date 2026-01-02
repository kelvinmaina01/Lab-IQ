"""
Orchestrator Agent - Coordinates all agents in the AutoML pipeline
"""
from typing import Dict, Any, List
from .base_agent import BaseAgent
from .data_agent import DataAgent
from .feature_agent import FeatureEngineeringAgent
from .model_selection_agent import ModelSelectionAgent
from .hyperparameter_agent import HyperparameterAgent
from .training_agent import TrainingAgent
from .insights_agent import InsightsAgent
from .labai_agent import LabAIAgent
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class OrchestratorAgent(BaseAgent):
    """Main orchestrator that coordinates all agents"""
    
    def __init__(self):
        super().__init__("orchestrator", "Orchestration Agent 🎼")
        
        # Initialize all agents
        self.data_agent = DataAgent()
        self.feature_agent = FeatureEngineeringAgent()
        self.model_selection_agent = ModelSelectionAgent()
        self.hyperparameter_agent = HyperparameterAgent()
        self.training_agent = TrainingAgent()
        self.insights_agent = InsightsAgent()
        self.labai_agent = LabAIAgent()
        
        self.pipeline_status = {}
        self.progress = 0
    
    async def execute(self, data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute complete AutoML pipeline
        """
        pipeline_start = datetime.now()
        results = {
            "pipeline_start": pipeline_start.isoformat(),
            "stages": {}
        }
        
        target_column = context.get("target_column")
        dataset_id = context.get("dataset_id", "unknown")
        
        # Shared context for all agents
        shared_context = {
            "target_column": target_column,
            "dataset_id": dataset_id
        }
        
        try:
            # Stage 1: Data Understanding
            logger.info("=" * 60)
            logger.info("STAGE 1: DATA UNDERSTANDING")
            logger.info("=" * 60)
            self.progress = 10
            
            data_result = await self.data_agent.run(data, shared_context)
            results["stages"]["data_understanding"] = data_result
            shared_context["data_analysis"] = data_result.get("results", {})
            
            # Auto-detect problem type if not provided
            if not context.get("problem_type"):
                type_analysis = data_result.get("results", {}).get("type_analysis", {})
                if target_column:
                    # Simple detection based on cardinality
                    import pandas as pd
                    df = pd.DataFrame(data)
                    if target_column in df.columns:
                        unique_ratio = df[target_column].nunique() / len(df)
                        is_numeric = pd.api.types.is_numeric_dtype(df[target_column])
                        if is_numeric and unique_ratio > 0.05:
                            shared_context["problem_type"] = "regression"
                        else:
                            shared_context["problem_type"] = "classification"
                    else:
                        shared_context["problem_type"] = "clustering"
                else:
                    shared_context["problem_type"] = "clustering"
            else:
                shared_context["problem_type"] = context.get("problem_type")
            
            logger.info(f"Problem Type: {shared_context['problem_type']}")
            
            # Stage 2: Feature Engineering
            logger.info("=" * 60)
            logger.info("STAGE 2: FEATURE ENGINEERING")
            logger.info("=" * 60)
            self.progress = 25
            
            feature_result = await self.feature_agent.run(data, shared_context)
            results["stages"]["feature_engineering"] = feature_result
            shared_context["feature_engineering"] = feature_result.get("results", {})
            
            # Update data with engineered features
            engineered_data = feature_result.get("results", {}).get("final_data", data)
            
            # Stage 3: Model Selection
            logger.info("=" * 60)
            logger.info("STAGE 3: MODEL SELECTION")
            logger.info("=" * 60)
            self.progress = 40
            
            model_selection_result = await self.model_selection_agent.run(engineered_data, shared_context)
            results["stages"]["model_selection"] = model_selection_result
            
            recommended_algorithms = model_selection_result.get("results", {}).get("recommended_algorithms", [])
            shared_context["recommended_algorithms"] = recommended_algorithms
            
            # Stage 4: Hyperparameter Optimization
            logger.info("=" * 60)
            logger.info("STAGE 4: HYPERPARAMETER OPTIMIZATION")
            logger.info("=" * 60)
            self.progress = 55
            
            hyperparameter_result = await self.hyperparameter_agent.run(engineered_data, shared_context)
            results["stages"]["hyperparameter_optimization"] = hyperparameter_result
            
            optimized_algorithms = hyperparameter_result.get("results", {}).get("optimized_algorithms", [])
            shared_context["optimized_algorithms"] = optimized_algorithms
            
            # Stage 5: Model Training & Evaluation
            logger.info("=" * 60)
            logger.info("STAGE 5: MODEL TRAINING & EVALUATION")
            logger.info("=" * 60)
            self.progress = 70
            
            training_result = await self.training_agent.run(engineered_data, shared_context)
            results["stages"]["training"] = training_result
            
            model_results = training_result.get("results", {}).get("model_results", [])
            best_model = training_result.get("results", {}).get("best_model")
            
            shared_context["model_results"] = model_results
            shared_context["best_model"] = best_model
            
            # Stage 6: Insights & Explanations
            logger.info("=" * 60)
            logger.info("STAGE 6: INSIGHTS & EXPLANATIONS")
            logger.info("=" * 60)
            self.progress = 90
            
            insights_result = await self.insights_agent.run(engineered_data, shared_context)
            results["stages"]["insights"] = insights_result
            
            # Stage 7: LabAI Integration (Narrative Generation)
            logger.info("=" * 60)
            logger.info("STAGE 7: LABAI NARRATIVE GENERATION")
            logger.info("=" * 60)
            self.progress = 95
            
            # Prepare context for LabAI
            # We need the summary created by insights agent, 
            # or we create a provisional summary first
            provisional_summary = self._create_summary({
                "stages": {
                    "training": {"results": training_result.get("results")},
                    "insights": {"results": insights_result.get("results")}
                }
            }, shared_context, 0)
            
            shared_context["pipeline_summary"] = provisional_summary
            
            labai_result = await self.labai_agent.run(None, shared_context)
            results["stages"]["labai_narrative"] = labai_result
            
            # Finalize
            self.progress = 100
            pipeline_end = datetime.now()
            duration = (pipeline_end - pipeline_start).total_seconds()
            
            logger.info("=" * 60)
            logger.info("PIPELINE COMPLETED SUCCESSFULLY")
            logger.info(f"Total Duration: {duration:.2f} seconds")
            logger.info("=" * 60)
            
            # Create final summary
            final_summary = self._create_summary(results, shared_context, duration)
            
            return {
                "success": True,
                "pipeline_duration": duration,
                "problem_type": shared_context["problem_type"],
                "stages_completed": len(results["stages"]),
                "summary": final_summary,
                "detailed_results": results
            }
            
        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            import traceback
            traceback.print_exc()
            
            return {
                "success": False,
                "error": str(e),
                "stages_completed": len(results.get("stages", {})),
                "detailed_results": results
            }
    
    def _create_summary(self, results: Dict, context: Dict, duration: float) -> Dict[str, Any]:
        """Create executive summary of the entire pipeline"""
        
        summary = {
            "pipeline_duration_seconds": round(duration, 2),
            "problem_type": context.get("problem_type"),
            "dataset_id": context.get("dataset_id")
        }
        
        # Data summary
        data_stage = results.get("stages", {}).get("data_understanding", {})
        data_results = data_stage.get("results", {})
        basic_info = data_results.get("basic_info", {})
        quality_score = data_results.get("quality_score", {})
        
        summary["data_summary"] = {
            "rows": basic_info.get("rows", 0),
            "columns": basic_info.get("columns", 0),
            "quality_score": quality_score.get("overall_score", 0),
            "quality_rating": quality_score.get("rating", "Unknown")
        }
        
        # Feature engineering summary
        feature_stage = results.get("stages", {}).get("feature_engineering", {})
        feature_results = feature_stage.get("results", {})
        
        summary["feature_engineering_summary"] = {
            "original_features": feature_results.get("original_features", 0),
            "final_features": feature_results.get("final_features", 0),
            "features_generated": len(feature_results.get("generated_features", [])),
            "features_selected": len(feature_results.get("selected_features", []))
        }
        
        # Model training summary
        training_stage = results.get("stages", {}).get("training", {})
        training_results = training_stage.get("results", {})
        best_model = training_results.get("best_model", {})
        
        summary["model_training_summary"] = {
            "models_trained": training_results.get("models_trained", 0),
            "best_model": best_model.get("algorithm_name", "Unknown"),
            "best_score": best_model.get("metrics", {}).get("test_score", 0),
            "model_path": training_results.get("model_path")
        }
        
        # Insights summary
        insights_stage = results.get("stages", {}).get("insights", {})
        insights_results = insights_stage.get("results", {})
        
        summary["key_findings"] = insights_results.get("key_findings", [])
        summary["recommendations"] = insights_results.get("recommendations", [])[:5]  # Top 5
        
        return summary
    
    def get_progress(self) -> int:
        """Get current pipeline progress (0-100)"""
        return self.progress
    
    def get_pipeline_status(self) -> Dict[str, Any]:
        """Get detailed status of all agents"""
        return {
            "orchestrator": self.get_status(),
            "data_agent": self.data_agent.get_status(),
            "feature_agent": self.feature_agent.get_status(),
            "model_selection_agent": self.model_selection_agent.get_status(),
            "hyperparameter_agent": self.hyperparameter_agent.get_status(),
            "training_agent": self.training_agent.get_status(),
            "insights_agent": self.insights_agent.get_status(),
            "progress": self.progress
        }
