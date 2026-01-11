from typing import Any, Dict
import pandas as pd
from agents.data_agent import DataAgent

async def analyze_dataset_tool(df: pd.DataFrame, context: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Analyzes a pandas DataFrame and returns a comprehensive profile including:
    - Basic info (rows, cols, memory)
    - Missing values analysis
    - Type analysis
    - Statistical summary
    - Outliers
    - Quality score
    """
    if context is None:
        context = {}
        
    agent = DataAgent()
    # DataAgent expects raw data compatible with pd.DataFrame constructor, or we can pass df directly if the agent handles it.
    # Looking at DataAgent code: df = pd.DataFrame(data). It handles dataframe, list of dicts, etc.
    # To avoid copy overhead if it's already a DF, we can pass it as records or just pass the df if we modify the agent.
    # But for now, let's pass a safe format. 
    # Actually, pd.DataFrame(df) is cheap if it's already a df (copy=False by default usually, or checks type).
    
    result = await agent.execute(df, context)
    return result
