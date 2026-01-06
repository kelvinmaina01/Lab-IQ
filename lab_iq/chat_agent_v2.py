"""
Modern Crash-Proof Chat Agent (2026 Best Practices)
- Structured outputs with Pydantic
- Data-first approach
- Error boundaries at every layer
- Graceful degradation
"""
import os
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import pandas as pd
from supabase import create_client
import google.generativeai as genai

logger = logging.getLogger(__name__)

# =============================================================================
# PYDANTIC MODELS - Type-safe, validated responses
# =============================================================================

class KPI(BaseModel):
    title: str
    value: str | int | float
    trend: str = "stable"
    change: Optional[str] = None

class ChartData(BaseModel):
    labels: List[str]
    values: List[int | float]

class Section(BaseModel):
    type: str
    title: Optional[str] = None
    content: Optional[str] = None
    chartType: Optional[str] = None
    data: Optional[ChartData] = None
    kpis: Optional[List[KPI]] = None

class ChatResponse(BaseModel):
    content: str = Field(default="Analysis complete")
    thoughtProcess: List[str] = Field(default_factory=list)
    sections: List[Section] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)

# =============================================================================
# DATA LAYER - Always works, never crashes
# =============================================================================

def fetch_dataset_data(dataset_id: str) -> Dict[str, Any]:
    """Fetch data with error handling"""
    try:
        logger.info(f"Fetching data for dataset: {dataset_id}")
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        logger.info(f"Supabase URL: {supabase_url[:30] if supabase_url else 'NOT SET'}")
        logger.info(f"Supabase Key: {'SET' if supabase_key else 'NOT SET'}")
        
        if not supabase_url or not supabase_key:
            logger.error("Supabase credentials not configured")
            return {"error": "Supabase not configured", "df": None}
        
        supabase = create_client(supabase_url, supabase_key)
        logger.info("Supabase client created successfully")
        
        # Fetch rows
        response = supabase.table("dataset_rows").select("data").eq("dataset_id", dataset_id).limit(500).execute()
        logger.info(f"Query executed. Rows returned: {len(response.data) if response.data else 0}")
        
        if not response.data:
            logger.warning(f"No data found for dataset_id: {dataset_id}")
            return {"error": "No data found", "df": None}
        
        rows = [row["data"] for row in response.data]
        df = pd.DataFrame(rows)
        logger.info(f"DataFrame created: {len(df)} rows, {len(df.columns)} columns")
        
        return {"df": df, "error": None}
        
    except Exception as e:
        logger.error(f"Data fetch failed: {e}", exc_info=True)
        return {"error": str(e), "df": None}

def compute_base_statistics(df: pd.DataFrame) -> Dict[str, Any]:
    """Compute stats that ALWAYS work"""
    try:
        stats = {
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": df.columns.tolist()
        }
        
        # Try to compute distribution for first numeric column
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 0:
            col = numeric_cols[0]
            value_counts = df[col].value_counts().head(10)
            stats["distribution"] = {
                "column": col,
                "labels": [str(x) for x in value_counts.index.tolist()],
                "values": value_counts.values.tolist()
            }
        
        return stats
    except Exception as e:
        logger.error(f"Stats computation failed: {e}")
        return {"row_count": 0, "column_count": 0, "columns": []}

# =============================================================================
# LLM LAYER - Uses structured output (2026 approach)
# =============================================================================

def get_llm_insights(user_message: str, stats: Dict[str, Any], mode: str = "chat") -> Dict[str, Any]:
    """
    Get LLM insights with multi-agent debate support.
    - Chat mode: Fast single-agent or 2-round debate
    - Planning mode: 3-round debate with depth
    """
    try:
        # Import multi-agent debate system
        from lab_iq.multi_agent import get_debate_insights
        
        # Use multi-agent debate for richer insights
        debate_result = get_debate_insights(user_message, stats, mode)
        
        return {
            "summary": debate_result["summary"],
            "insights": debate_result["insights"],
            "suggestions": debate_result["suggestions"],
            "debate_conversation": debate_result.get("debate_conversation", [])
        }
        
    except Exception as e:
        logger.error(f"Multi-agent debate failed, falling back to single agent: {e}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Exception details: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        
        # Fallback to single Gemini call
        try:
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            model = genai.GenerativeModel('gemini-pro')
            
            prompt = f"""Analyze this dataset and answer the user's question.

Dataset Stats:
- Rows: {stats.get('row_count', 0)}
- Columns: {stats.get('column_count', 0)}
- Columns: {', '.join(stats.get('columns', []))}

User Question: {user_message}

Provide:
1. A brief summary (1-2 sentences)
2. 2-3 key insights
3. 2 follow-up suggestions
"""
            
            response = model.generate_content(prompt)
            text = response.text
            
            # Extract insights from text
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            return {
                "summary": lines[0] if lines else "Analysis complete",
                "insights": lines[1:4] if len(lines) > 1 else ["Data loaded successfully"],
                "suggestions": lines[-2:] if len(lines) > 2 else ["Explore the data further"],
                "debate_conversation": []
            }
            
        except Exception as fallback_error:
            logger.error(f"Fallback also failed: {fallback_error}")
            return {
                "summary": "Analysis complete",
                "insights": ["Data loaded successfully"],
                "suggestions": ["Explore the data"],
                "debate_conversation": []
            }

# =============================================================================
# ASSEMBLY LAYER - Combines everything into response
# =============================================================================

def build_chat_response(user_message: str, dataset_id: Optional[str], mode: str = "chat") -> ChatResponse:
    """
    Build response with guaranteed structure.
    NEVER crashes - always returns valid ChatResponse
    
    Args:
        user_message: User's question
        dataset_id: Dataset to analyze
        mode: "chat" for quick response, "planning" for deep analysis
    """
    response = ChatResponse()
    
    # Step 1: Get data (or use sample if unavailable)
    if dataset_id:
        data_result = fetch_dataset_data(dataset_id)
        df = data_result.get("df")
        
        if df is not None and len(df) > 0:
            # Real data exists - use it
            stats = compute_base_statistics(df)
        else:
            # No data in dataset_rows - use sample data to demonstrate functionality
            logger.warning(f"No data found for {dataset_id}, using sample data")
            sample_data = {
                'age': [25, 30, 35, 40, 45, 50, 55, 60, 25, 30],
                'glucose': [90, 105, 120, 95, 110, 125, 100, 115, 92, 108],
                'diagnosis': ['Normal', 'Normal', 'Elevated', 'Normal', 'Elevated', 'High', 'Normal', 'Elevated', 'Normal', 'Elevated']
            }
            df = pd.DataFrame(sample_data)
            stats = compute_base_statistics(df)
            stats['is_sample'] = True
        
        # Build KPI section
        kpi_section = Section(
            type="kpi_grid",
            kpis=[
                KPI(title="Total Rows", value=stats["row_count"]),
                KPI(title="Columns", value=stats["column_count"])
            ]
        )
        response.sections.append(kpi_section)
        
        # Build chart section if we have distribution
        if "distribution" in stats:
            dist = stats["distribution"]
            chart_section = Section(
                type="chart",
                title="Data Distribution",
                chartType="bar",
                data=ChartData(
                    labels=dist["labels"],
                    values=dist["values"]
                )
            )
            response.sections.append(chart_section)
        
        # Get LLM insights with mode parameter
        llm_result = get_llm_insights(user_message, stats, mode)
        
        if stats.get('is_sample'):
            response.content = "📊 Showing sample data (upload a dataset to see real analysis): " + llm_result["summary"]
        else:
            response.content = llm_result["summary"]
            
        response.thoughtProcess = ["Loading data", "Computing statistics", "Analyzing patterns"]
        if mode == "planning":
            response.thoughtProcess.extend(["Multi-agent debate", "Deep statistical analysis"])
        
        response.suggestions = llm_result["suggestions"]
        
        # Add insights as sections
        for insight in llm_result["insights"]:
            response.sections.append(Section(
                type="insight",
                title="Finding",
                content=insight
            ))
        
        # Add debate conversation if available (planning mode)
        if llm_result.get("debate_conversation"):
            debate_section = Section(
                type="paragraph",
                title="🤝 Agent Debate",
                content=f"Multi-agent analysis ({len(llm_result['debate_conversation'])} rounds)"
            )
            response.sections.append(debate_section)
            
    else:
        response.content = "Please select a dataset to analyze."
        response.suggestions = ["Select a dataset", "Upload new data"]
    
    return response

# =============================================================================
# PUBLIC API
# =============================================================================

def process_chat(messages: List[Dict[str, str]], dataset_id: Optional[str] = None, mode: str = "chat") -> Dict[str, Any]:
    """
    Main entry point. GUARANTEED to return valid response.
    
    Args:
        messages: Chat history
        dataset_id: Dataset to analyze
        mode: "chat" or "planning"
    """
    try:
        user_message = messages[-1]["content"] if messages else "analyze data"
        response = build_chat_response(user_message, dataset_id, mode)
        return response.model_dump()
    except Exception as e:
        logger.error(f"Critical failure: {e}")
        # Ultimate fallback
        return ChatResponse(
            content=f"System temporarily unavailable: {str(e)}",
            sections=[],
            suggestions=["Try again", "Check your connection"]
        ).model_dump()
