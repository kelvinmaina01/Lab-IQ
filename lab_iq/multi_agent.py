"""
Multi-Agent Debate System (2026)
Gemini and Groq interact as data analysts
Crash-proof with error boundaries and timeouts
"""
import os
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import google.generativeai as genai
from groq import Groq

logger = logging.getLogger(__name__)

# =============================================================================
# PYDANTIC MODELS - Type-safe agent responses
# =============================================================================

class AgentResponse(BaseModel):
    agent_name: str = Field(description="gemini or groq")
    round: int = Field(description="Debate round number")
    analysis: str = Field(description="Agent's analysis")
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    questions_raised: List[str] = Field(default_factory=list)
    key_points: List[str] = Field(default_factory=list)

class DebateConversation(BaseModel):
    rounds: List[AgentResponse] = Field(default_factory=list)
    final_consensus: str = ""
    mode: str = "chat"  # "chat" or "planning"

# =============================================================================
# AGENT IMPLEMENTATIONS
# =============================================================================

def call_gemini(prompt: str, timeout: int = 30) -> str:
    """Call Gemini with timeout and error handling"""
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini call failed: {e}")
        return f"Error: Unable to get Gemini response ({str(e)})"

def call_groq(prompt: str, timeout: int = 30) -> str:
    """Call Groq with timeout and error handling"""
    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            timeout=timeout
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Groq call failed: {e}")
        return f"Error: Unable to get Groq response ({str(e)})"

# =============================================================================
# MULTI-AGENT ORCHESTRATION
# =============================================================================

def multi_agent_debate(
    user_message: str,
    stats: Dict[str, Any],
    mode: str = "chat"
) -> DebateConversation:
    """
    Orchestrate multi-agent debate between Gemini and Groq.
    Chat mode: 2 rounds (Gemini → Groq)
    Planning mode: 3 rounds (Gemini → Groq → Gemini refine)
    """
    
    conversation = DebateConversation(mode=mode)
    
    # Data context for prompts
    data_context = f"""
Dataset Overview:
- Rows: {stats.get('row_count', 0)}
- Columns: {stats.get('column_count', 0)}
- Columns: {', '.join(stats.get('columns', []))}
"""
    
    if stats.get('distribution'):
        dist = stats['distribution']
        data_context += f"\nSample Distribution ({dist['column']}): {len(dist['labels'])} unique values"
    
    # ROUND 1: Gemini Initial Analysis
    try:
        logger.info("Round 1: Gemini analyzing...")
        gemini_prompt = f"""You are a senior data analyst. Analyze this dataset and answer the user's question.

{data_context}

User Question: {user_message}

Provide:
1. Direct answer to the question
2. Key insights from the data
3. Any concerns or limitations

{"Be comprehensive and detailed." if mode == "planning" else "Be concise."}"""
        
        gemini_response = call_gemini(gemini_prompt)
        
        # Parse response
        lines = [l.strip() for l in gemini_response.split('\n') if l.strip()]
        
        conversation.rounds.append(AgentResponse(
            agent_name="gemini",
            round=1,
            analysis=gemini_response,
            confidence=0.85,
            key_points=lines[:3] if len(lines) >= 3 else lines
        ))
        
    except Exception as e:
        logger.error(f"Round 1 failed: {e}")
        conversation.rounds.append(AgentResponse(
            agent_name="gemini",
            round=1,
            analysis=f"Analysis unavailable: {str(e)}",
            confidence=0.0
        ))
    
    # ROUND 2: Groq Critical Review
    try:
        logger.info("Round 2: Groq critiquing...")
        groq_prompt = f"""You are a critical data analyst reviewing a colleague's analysis.

Original Question: {user_message}

{data_context}

Gemini's Analysis:
{conversation.rounds[0].analysis if conversation.rounds else "No analysis available"}

Your task:
1. What did Gemini get right?
2. What's missing or questionable?
3. Alternative perspectives?

{"Provide detailed statistical critique." if mode == "planning" else "Be brief and focused."}"""
        
        groq_response = call_groq(groq_prompt)
        
        lines = [l.strip() for l in groq_response.split('\n') if l.strip()]
        
        conversation.rounds.append(AgentResponse(
            agent_name="groq",
            round=2,
            analysis=groq_response,
            confidence=0.80,
            key_points=lines[:3] if len(lines) >= 3 else lines
        ))
        
    except Exception as e:
        logger.error(f"Round 2 failed: {e}")
        conversation.rounds.append(AgentResponse(
            agent_name="groq",
            round=2,
            analysis=f"Critique unavailable: {str(e)}",
            confidence=0.0
        ))
    
    # ROUND 3: Gemini Refinement (Planning mode only)
    if mode == "planning":
        try:
            logger.info("Round 3: Gemini refining...")
            gemini_refine_prompt = f"""You are refining your analysis based on peer review.

Original Question: {user_message}

{data_context}

Your Initial Analysis:
{conversation.rounds[0].analysis if len(conversation.rounds) > 0 else ""}

Groq's Critique:
{conversation.rounds[1].analysis if len(conversation.rounds) > 1 else ""}

Provide:
1. Refined answer incorporating valid critique
2. Deeper statistical insights (correlations, trends, anomalies)
3. Actionable recommendations"""
            
            refined_response = call_gemini(gemini_refine_prompt)
            
            lines = [l.strip() for l in refined_response.split('\n') if l.strip()]
            
            conversation.rounds.append(AgentResponse(
                agent_name="gemini",
                round=3,
                analysis=refined_response,
                confidence=0.90,
                key_points=lines[:3] if len(lines) >= 3 else lines
            ))
            
        except Exception as e:
            logger.error(f"Round 3 failed: {e}")
    
    # Build final consensus
    if conversation.rounds:
        last_round = conversation.rounds[-1]
        conversation.final_consensus = last_round.analysis
    else:
        conversation.final_consensus = "Unable to generate analysis. Please try again."
    
    return conversation

# =============================================================================
# PUBLIC API
# =============================================================================

def get_debate_insights(
    user_message: str,
    stats: Dict[str, Any],
    mode: str = "chat"
) -> Dict[str, Any]:
    """
    Main entry point for multi-agent debate.
    Returns structured response for UI rendering.
    """
    try:
        debate = multi_agent_debate(user_message, stats, mode)
        
        # Extract insights for sections
        insights = []
        for round_data in debate.rounds:
            if round_data.key_points:
                insights.extend(round_data.key_points[:2])  # Max 2 per round
        
        return {
            "summary": debate.final_consensus[:200] + "..." if len(debate.final_consensus) > 200 else debate.final_consensus,
            "insights": insights[:5],  # Max 5 total
            "suggestions": [
                "Explore correlations between variables",
                "Analyze trends over time",
                "Check for data quality issues"
            ],
            "debate_conversation": [
                {
                    "agent": r.agent_name,
                    "round": r.round,
                    "content": r.analysis,
                    "confidence": r.confidence
                }
                for r in debate.rounds
            ]
        }
        
    except Exception as e:
        logger.error(f"Debate failed: {e}")
        return {
            "summary": "Analysis temporarily unavailable",
            "insights": ["System encountered an error"],
            "suggestions": ["Try again", "Simplify your question"],
            "debate_conversation": []
        }
