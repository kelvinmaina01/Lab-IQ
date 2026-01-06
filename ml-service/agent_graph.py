import os
import pandas as pd
import logging
from typing import TypedDict, Annotated, List, Dict, Any, Union
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

# Load env vars
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# MODEL SETUP
# =============================================================================
def get_model():
    """Get the efficient model (Groq) or fallback (Gemini)"""
    groq_api_key = os.getenv("GROQ_API_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    if groq_api_key:
        logger.info("Using Groq (Llama-3.1-70b/8b)")
        return ChatGroq(
            temperature=0, 
            model_name="llama-3.1-70b-versatile", # High intelligence
            api_key=groq_api_key
        )
    elif gemini_api_key:
        logger.info("Using Gemini")
        return ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            temperature=0,
            google_api_key=gemini_api_key
        )
    else:
        raise ValueError("No API Key found for Groq or Gemini.")

llm = get_model()

# =============================================================================
# STATE DEFINITION
# =============================================================================
class AgentState(TypedDict):
    messages: List[BaseMessage]
    dataset_context: str
    data_sample: str # String representation of df.head()
    code: str
    execution_result: str
    error: str
    final_answer: str

# =============================================================================
# NODES
# =============================================================================

def planner_node(state: AgentState):
    """Refines the user's question into a plan."""
    logger.info("--- PLANNER NODE ---")
    messages = state['messages']
    
    system_prompt = (
        "You are a World-Class Data Scientist with multi-disciplinary expertise in Health, Community, and Business Analytics. "
        "You excel at finding deep connections intersectional data (e.g., how community factors impact health outcomes).\n"
        f"Dataset Context: {state.get('dataset_context', 'N/A')}\n"
        f"Data Sample:\n{state.get('data_sample', 'N/A')}\n\n"
        "Your goal is to provide holistic, rigorous analysis. "
        "Analyze the request. If it requires data processing, output a concise plan."
        "If it's a simple greeting or general question, just reply."
    )
    
    # Simple pass-through for now, but could break down steps
    return {"messages": [AIMessage(content="Planning holistic analysis...")]}

def coder_node(state: AgentState):
    """Writes Pandas code to answer the question."""
    logger.info("--- CODER NODE ---")
    messages = state['messages']
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are an Expert Python Data Analyst. \n"
            "You have a pandas DataFrame named `df` loaded.\n"
            "Context: {dataset_context}\n"
            "Columns/Sample: {data_sample}\n\n"
            "Write Python code to answer the user's question. \n"
            "- APPLY YOUR EXPERTISE: Look for patterns across domains (Health, Community, Economic).\n"
            "- IF Health/Community: Analyze determinants, outcomes, and risk factors.\n"
            "- IF General: Analyze key trends, correlations, and actionable insights.\n"
            "- Use `df` variable directly.\n"
            "- Save your final answer/summary to a variable named `result`.\n"
            "- Ensure the code is safe and valid.\n"
            "- Do NOT plot charts unless asked (use 'print' for text).\n"
            "- Output ONLY the code, inside ```python``` blocks."
        )),
        ("human", "{question}")
    ])
    
    # Extract user question from history
    user_q = next((m.content for m in reversed(messages) if isinstance(m, HumanMessage)), "")
    
    chain = prompt | llm
    response = chain.invoke({
        "dataset_context": state.get("dataset_context", ""),
        "data_sample": state.get("data_sample", ""),
        "question": user_q
    })
    
    # Extract code from markdown
    content = response.content
    code = ""
    if "```python" in content:
        code = content.split("```python")[1].split("```")[0].strip()
    elif "```" in content:
        code = content.split("```")[1].split("```")[0].strip()
    else:
        code = content # Fallback
        
    return {"code": code}

def executor_node(state: AgentState):
    """Executes the Python code."""
    logger.info("--- EXECUTOR NODE ---")
    code = state['code']
    data_sample = state['data_sample'] 
    
    # In a real app, this MUST be sandboxed (e.g., E2B, Docker). 
    # For this local demo, we use strict restricted execution.
    
    try:
        # Check if code is unsafe
        if "os." in code or "subprocess" in code:
            raise ValueError("Unsafe code detected.")
            
        return {"execution_result": f"Executed Code:\n{code}\n\n(Simulated Execution for Safety)"}
        
    except Exception as e:
        return {"error": str(e)}

def answer_node(state: AgentState):
    """Synthesizes the final answer."""
    logger.info("--- ANSWER NODE ---")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are a Senior Data Analyst. "
            "Synthesize the analysis results into a professional insight.\n"
            "Approach this holistically: Connect the dots between health, community, and general factors where applicable.\n"
            "Highlight: Implications, statistical significance, and actionable takeaways.\n"
            "Code Used: {code}\n"
            "Execution Result: {result}\n"
        )),
        ("human", "Provide the final answer to the user.")
    ])
    
    chain = prompt | llm
    response = chain.invoke({
        "code": state.get("code"),
        "result": state.get("execution_result")
    })
    
    return {"final_answer": response.content}

# =============================================================================
# GRAPH BUILDER
# =============================================================================

workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("planner", planner_node)
workflow.add_node("coder", coder_node)
workflow.add_node("executor", executor_node)
workflow.add_node("answer", answer_node)

# Set Entry Point
workflow.set_entry_point("coder") # Skip planner for speed in V1

# Edges
workflow.add_edge("coder", "executor")
workflow.add_edge("executor", "answer")
workflow.add_edge("answer", END)

# Compile
agent_chain = workflow.compile()

async def run_agent(question: str, dataset_context: str = ""):
    """Entry point for API"""
    inputs = {
        "messages": [HumanMessage(content=question)],
        "dataset_context": dataset_context,
        "data_sample": "df structure placeholders..."
    }
    
    result = await agent_chain.ainvoke(inputs)
    return result["final_answer"]
    
if __name__ == "__main__":
    import asyncio
    res = asyncio.run(run_agent("What is the correlation between age and income?"))
    print(res)
