"""
LLM Response Transformer
Converts ANY LLM output into UI-ready structure.
No more relying on perfect LLM JSON - we handle the transformation!
"""
import json
import re
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

def transform_llm_response(raw_response: str, computed_data: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Transform ANY LLM response into our UI format.
    This is the intelligence layer that makes the system robust.
    """
    
    # Initialize UI structure
    ui_response = {
        "content": "",
        "thoughtProcess": [],
        "sections": [],
        "suggestions": []
    }
    
    # Try to parse as JSON first (if LLM cooperated)
    try:
        if raw_response.strip().startswith("{"):
            parsed = json.loads(raw_response)
            # If valid, use it but ensure all fields exist
            ui_response["content"] = parsed.get("content", extract_summary(raw_response))
            ui_response["thoughtProcess"] = parsed.get("thoughtProcess", [])
            ui_response["sections"] = parsed.get("sections", [])
            ui_response["suggestions"] = parsed.get("suggestions", generate_suggestions(raw_response))
            return ui_response
    except:
        pass
    
    # LLM didn't give JSON - extract structure from natural text
    ui_response["content"] = extract_summary(raw_response)
    ui_response["thoughtProcess"] = extract_thought_process(raw_response)
    ui_response["sections"] = build_sections_from_text(raw_response, computed_data)
    ui_response["suggestions"] = generate_suggestions(raw_response)
    
    return ui_response

def extract_summary(text: str) -> str:
    """Extract a concise summary from LLM output"""
    # Take first meaningful paragraph
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if lines:
        return lines[0][:200]  # First 200 chars
    return "Analysis completed successfully"

def extract_thought_process(text: str) -> List[str]:
    """Extract reasoning steps from text"""
    thoughts = []
    
    # Look for numbered lists or bullet points
    for line in text.split('\n'):
        line = line.strip()
        # Check for patterns like "1.", "•", "-", "Step:"
        if re.match(r'^(\d+\.|\-|\•|Step:)', line):
            thoughts.append(line)
        # Look for "thinking" indicators
        elif any(word in line.lower() for word in ['first', 'then', 'analyzing', 'checking']):
            thoughts.append(line)
    
    if not thoughts:
        thoughts = ["Analyzing data", "Computing statistics", "Generating insights"]
    
    return thoughts[:5]  # Max 5 thoughts

def build_sections_from_text(text: str, computed_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Build UI sections from text AND computed data.
    This is the magic - we ALWAYS have data to show!
    """
    sections = []
    
    # 1. KPI Grid (from computed data)
    if computed_data:
        kpis = []
        if 'row_count' in computed_data:
            kpis.append({"title": "Total Rows", "value": computed_data['row_count'], "trend": "stable"})
        if 'column_count' in computed_data:
            kpis.append({"title": "Columns", "value": computed_data['column_count'], "trend": "stable"})
        if 'avg_value' in computed_data:
            kpis.append({"title": "Average", "value": round(computed_data['avg_value'], 2), "trend": "up"})
        
        if kpis:
            sections.append({"type": "kpi_grid", "kpis": kpis})
    
    # 2. Chart (from computed distribution)
    if computed_data and 'distribution_data' in computed_data:
        dist = computed_data['distribution_data']
        sections.append({
            "type": "chart",
            "title": "Data Distribution",
            "chartType": "bar",
            "data": {
                "labels": dist.get("labels", []),
                "values": dist.get("values", [])
            },
            "xLabel": dist.get("column", "Categories"),
            "yLabel": "Count"
        })
    
    # 3. Insights (extract from text)
    insights = extract_insights(text)
    for insight in insights:
        sections.append({
            "type": "insight",
            "title": "Key Finding",
            "content": insight,
            "priority": "high"
        })
    
    # 4. Always include a paragraph with the analysis
    sections.append({
        "type": "paragraph",
        "content": extract_analysis_text(text)
    })
    
    return sections

def extract_insights(text: str) -> List[str]:
    """Extract key insights from text"""
    insights = []
    
    # Look for sentences with insight indicators
    sentences = text.split('.')
    for sentence in sentences:
        if any(word in sentence.lower() for word in ['shows', 'indicates', 'reveals', 'suggests', 'finding']):
            insights.append(sentence.strip() + '.')
    
    return insights[:3]  # Max 3 insights

def extract_analysis_text(text: str) -> str:
    """Extract the main analysis content"""
    # Remove JSON artifacts, code blocks, etc.
    clean = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
    clean = re.sub(r'\{.*?\}', '', clean, flags=re.DOTALL)
    
    # Get meaningful paragraphs
    paragraphs = [p.strip() for p in clean.split('\n\n') if len(p.strip()) > 50]
    
    if paragraphs:
        return paragraphs[0][:500]  # First substantial paragraph
    return "The data has been analyzed and insights are displayed above."

def generate_suggestions(text: str) -> List[str]:
    """Generate follow-up suggestions"""
    suggestions = [
        "Explore correlations between variables",
        "Analyze trends over time",
        "Identify outliers and anomalies"
    ]
    
    # Add context-specific suggestions based on text content
    if 'distribution' in text.lower():
        suggestions.insert(0, "Compare distributions across groups")
    if 'correlation' in text.lower():
        suggestions.insert(0, "Create a correlation heatmap")
    
    return suggestions[:4]
