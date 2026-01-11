from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

class UIComponent(BaseModel):
    """
    Represents a dynamic UI component to be rendered by the frontend.
    """
    component: str = Field(..., description="The name of the React component to render (e.g., 'InsightCard', 'StatCard', 'Chart')")
    props: Dict[str, Any] = Field(default_factory=dict, description="The props to pass to the React component")

class AgentState(BaseModel):
    """
    The state of the agent workflow, compatible with LangGraph.
    Note: LangGraph usually uses TypedDict, but we define Pydantic models for structured output.
    """
    messages: List[Any]
    dataset_context: str = ""
    data_sample: str = ""
    file_path: Optional[str] = None
    plan: Optional[str] = ""
    code: str = ""
    execution_result: str = ""
    error: str = ""
    
class AgentOutput(BaseModel):
    """
    The final structured output returned to the client.
    """
    plan: Optional[str] = Field(None, description="The reasoning plan generated before coding.")
    answer: str = Field(..., description="The core textual answer/analysis in Markdown.")
    code: Optional[str] = Field(None, description="The Python code generated and executed to produce the result.")
    ui_components: List[UIComponent] = Field(default_factory=list, description="A list of UI components to visually represent the findings.")

# --- Specific UI Prop Schemas (for documentation/validation) ---

class ChartProps(BaseModel):
    type: str = Field(..., description="line, bar, scatter, pie")
    title: str
    data: List[Dict[str, Any]]
    xKey: str
    yKey: str
    description: Optional[str] = None

class InsightCardProps(BaseModel):
    title: str
    severity: str = Field("info", description="info, warning, success, error")
    content: str
