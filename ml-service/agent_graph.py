import os
import pandas as pd
import logging
import json
from typing import TypedDict, Annotated, List, Dict, Any, Union
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

# Import Schemas
from schemas import AgentState, AgentOutput, UIComponent
# Import Tools
from tools.data_tool import analyze_dataset_tool
from tools.training_tool import train_model_tool

# Load env vars
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# MODEL SETUP
# =============================================================================
def get_model(provider="groq"):
    """Get the appropriate model based on provider preference"""
    groq_api_key = os.getenv("GROQ_API_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    if provider == "groq" and groq_api_key:
        logger.info("Using Groq (Llama-3.3-70b-versatile)")
        return ChatGroq(
            temperature=0, 
            model_name="llama-3.3-70b-versatile",
            api_key=groq_api_key
        )
    elif provider == "gemini" and gemini_api_key:
        logger.info("Using Gemini Pro")
        return ChatGoogleGenerativeAI(
            model="gemini-pro",
            temperature=0,
            google_api_key=gemini_api_key
        )
    
    # Fallback
    if gemini_api_key:
        return ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=gemini_api_key)
    elif groq_api_key:
        return ChatGroq(model_name="llama-3.1-70b-versatile", api_key=groq_api_key)
    else:
        raise ValueError("No API Key found for Groq or Gemini.")

# Planner/Coder need speed -> Groq or Flash
llm_fast = get_model("groq")
# Insight/UI Gen need reasoning/structured -> Gemini (good at JSON)
# Gemini API having issues, using Groq (Llama 3.3 is excellent at JSON) as fallback
llm_smart = llm_fast

# =============================================================================
# NODES
# =============================================================================

def planner_node(state: AgentState):
    """Refines the user's question into a plan."""
    logger.info("--- PLANNER NODE ---")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a Senior Data Analyst. Briefly explain your thought process and the steps you will take to answer the user's question using Python options. Be conversational but concise."),
        ("human", "{question}")
    ])
    chain = prompt | llm_fast
    response = chain.invoke({"question": str(state.messages[-1].content)})
    return {"plan": response.content}

def coder_node(state: AgentState):
    """Writes Python code to answer the question."""
    logger.info("--- CODER NODE ---")
    messages = state.messages
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are an EXPERT Senior Health Data Analyst & Python Coder. \n"
            "Your Goal: Provide deep, clinical-grade insights from data.\n"
            "You have a pandas DataFrame named `df` loaded from `{file_path}`.\n"
            "Context: {dataset_context}\n"
            "Columns/Sample: {data_sample}\n\n"
            "TASK: Write Python code to answer the user's question. \n"
            "- Use `df` variable directly. Assume it is already loaded.\n"
            "- **Medical Data Safety**: Handle missing values (NaN) and outliers robustly.\n"
            "- **Visualization**: PREPARE data for charts but DO NOT use matplotlib/seaborn. \n"
            "  - Save chart data to `result` as dict: {{'type': 'chart', 'data': [...], 'title': '...', 'xKey': '...', 'yKey': '...'}}\n"
            "  - For simple metrics, save as dict: {{'type': 'kpi', 'value': ..., 'label': '...'}}\n"
            "- **Output**: The code must end by setting a variable `result` with the answer/data.\n"
            "- **Strict**: Output ONLY valid Python code inside ```python``` blocks."
        )),
        ("human", "{question}")
    ])
    
    user_q = str(messages[-1].content) if messages else ""
    
    chain = prompt | llm_fast
    response = chain.invoke({
        "dataset_context": state.dataset_context,
        "data_sample": state.data_sample,
        "file_path": state.file_path,
        "question": user_q
    })
    
    content = response.content
    code = ""
    if "```python" in content:
        code = content.split("```python")[1].split("```")[0].strip()
    elif "```" in content:
        code = content.split("```")[1].split("```")[0].strip()
    else:
        code = content 
        
    return {"code": code}

async def executor_node(state: AgentState):
    """Executes the Python code."""
    logger.info("--- EXECUTOR NODE ---")
    code = state.code
    file_path = state.file_path
    
    try:
        # Constrained Execution Environment
        local_scope = {
            "pd": pd,
            "result": None
        }
        
        # Load data if path allows
        if file_path and os.path.exists(file_path):
            logger.info(f"Loading data from {file_path}...")
            try:
                if file_path.endswith('.csv'):
                    local_scope['df'] = pd.read_csv(file_path)
                elif file_path.endswith('.xlsx'):
                    local_scope['df'] = pd.read_excel(file_path)
                elif file_path.endswith('.json'):
                    local_scope['df'] = pd.read_json(file_path)
                else:
                    # Try CSV by default if no extension match (temp files might vary)
                    local_scope['df'] = pd.read_csv(file_path)
                    
                logger.info(f"Data loaded successfully. Shape: {local_scope['df'].shape}")
            except Exception as load_err:
                return {"error": f"Failed to load dataset: {str(load_err)}"}
        else:
            logger.warning(f"File path not found or empty: {file_path}")
            return {"error": "Dataset file not found. Cannot proceed with analysis."}
        
        # Add constraints (e.g., prevent import os) in a real sandbox
        if "import os" in code:
             return {"error": "Security Alert: File system access restricted."}
             
        # Execute
        exec(code, {}, local_scope)
        
        execution_result = local_scope.get("result", "Code executed successfully, but no `result` variable was defined.")
        return {"execution_result": str(execution_result)}
        
    except Exception as e:
        return {"error": str(e)}

def answer_node(state: AgentState):
    """Synthesizes the final answer + Generative UI JSON."""
    logger.info("--- ANSWER NODE (Generative UI) ---")
    
    user_q = str(state.messages[-1].content) if state.messages else ""
    
    # Using Pydantic output parser logic via Gemini structured output (if supported) or JSON mode
    # For robust LangChain usage:
    structured_llm = llm_smart.with_structured_output(AgentOutput)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are a Senior Health Data Analyst and Expert UI Designer. \n"
            "Your role is to interpret analysis results with deep reasoning, clinical relevance, and statistical rigor.\n"
            "Synthesize the analysis results into a structured format containing a natural language answer and UI components.\n\n"
            "User Question: {question}\n"
            "Code Used: {code}\n"
            "Execution Result: {result}\n\n"
            "**ANALYSIS GUIDELINES**:\n"
            "- **Tone**: Professional, insightful, expert. NOT generic.\n"
            "- **Context**: If data is medical, interpret it with clinical context (e.g., normal ranges, risk factors, trends).\n"
            "- **Bias Check**: Be aware of potential biases in health data; mention them if relevant.\n"
            "- **Clarity**: Explain complex metrics in simple terms for stakeholders.\n"
            "- **Reasoning**: Don't just state numbers; explain *why* they matter and what the implications are.\n\n"
            "**VISUALIZATION GUIDELINES**:\n"
            "Generate 1-3 distinct UI components to visualize findings effectively:\n"
            "   - **StatCard**: For critical vitals, KPIs, or single summary metrics. Props: {{title, value, trend (up/down/neutral), sentiment (success/warning/danger), description}}.\n"
            "   - **InsightCard**: For detailed textual findings, risks, or recommendations. Props: {{title, content, severity (info/warning/critical)}}.\n"
            "   - **Chart**: For trends and distributions. Props: {{type, title, data, xKey, yKey}}.\n"
            "     - Data MUST be an array of objects: [{{ 'name': 'A', 'value': 10 }}, ...]\n"
            "     - Use 'line' for time-series (e.g., Patient Vitals over time).\n"
            "     - Use 'bar' for categorical comparisons (e.g., Diagnosis counts).\n"
            "     - Use 'pie' for compositional data (e.g., Demographics) - use sparingly.\n"
        )),
        ("human", "Generate the response.")
    ])
    
    chain = prompt | structured_llm
    
    try:
        response = chain.invoke({
            "question": user_q,
            "code": state.code,
            "result": state.execution_result or state.error
        })
        
        # Manually inject code and plan into response object before dumping
        response.plan = state.plan
        response.code = state.code
        
        return {"execution_result": json.dumps(response.model_dump())} # Store detailed JSON in result for API
        
    except Exception as e:
        logger.error(f"UI Generation Failed: {e}")
        # Fallback text
        return {"execution_result": json.dumps({
            "answer": f"Analysis complete but UI generation failed: {state.execution_result}",
            "code": state.code,
            "ui_components": []
        })}

# =============================================================================
# GRAPH BUILDER
# =============================================================================

workflow = StateGraph(AgentState)

workflow.add_node("planner", planner_node)
workflow.add_node("coder", coder_node)
workflow.add_node("executor", executor_node)
workflow.add_node("answer", answer_node)

workflow.set_entry_point("planner")

workflow.add_edge("planner", "coder")
workflow.add_edge("coder", "executor")
workflow.add_edge("executor", "answer")
workflow.add_edge("answer", END)

agent_chain = workflow.compile()

async def run_agent(question: str, dataset_context: str = "", file_path: str = None, data_sample: str = "Loaded from file"):
    """Entry point for API"""
    
    inputs = AgentState(
        messages=[HumanMessage(content=question)],
        dataset_context=dataset_context,
        file_path=file_path,
        data_sample=data_sample
    )
    
    result = await agent_chain.ainvoke(inputs)
    
    # result is the final state. The 'execution_result' field in answer_node holds the JSON.
    # We parse it back.
    if isinstance(result, dict):
        final_json = result.get("execution_result", "{}")
    else:
        final_json = result.execution_result
        
    try:
        return json.loads(final_json)
    except:
        return {"answer": str(final_json), "ui_components": [], "code": ""}

if __name__ == "__main__":
    import asyncio
    # flexible path for testing
    res = asyncio.run(run_agent("What is the average of age?", file_path="c:/Users/dell/Desktop/Lab-IQ/test.csv"))
    print(json.dumps(res, indent=2))
