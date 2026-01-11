from typing import Any, Dict
import pandas as pd
from agents.training_agent import TrainingAgent
from agents.model_selection_agent import ModelSelectionAgent
from agents.hyperparameter_agent import HyperparameterAgent

async def train_model_tool(df: pd.DataFrame, target_column: str, problem_type: str = "auto") -> Dict[str, Any]:
    """
    Trains models on the given DataFrame.
    
    Args:
        df: Pandas DataFrame
        target_column: The name of the target column
        problem_type: "classification", "regression", or "auto"
        
    Returns:
        Dict containing training results, best model metrics, and model path.
    """
    context = {
        "target_column": target_column,
        "dataset_id": "tool_execution", # Placeholder
        "problem_type": problem_type if problem_type != "auto" else None
    }
    
    # We need to run the pipeline steps: Selection -> Hyperparams -> Training
    # Or we can reuse Orchestrator logic... but Orchestrator is big.
    # Let's run a simplified pipeline here.
    
    # 1. Model Selection
    selection_agent = ModelSelectionAgent()
    sel_result = await selection_agent.run(df, context)
    context["recommended_algorithms"] = sel_result.get("results", {}).get("recommended_algorithms", [])
    
    # 2. Hyperparameters
    # For speed in tool execution, we might want to skip heavy tuning or limit it.
    # But let's keep it robust for now.
    hp_agent = HyperparameterAgent()
    hp_result = await hp_agent.run(df, context)
    context["optimized_algorithms"] = hp_result.get("results", {}).get("optimized_algorithms", [])
    
    # 3. Training
    training_agent = TrainingAgent()
    train_result = await training_agent.run(df, context)
    
    return train_result.get("results", {})
