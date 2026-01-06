"""
LabAI Agent - Bridges technical ML results with health domain context
"""
from typing import Dict, Any, List
from .base_agent import BaseAgent
import logging

logger = logging.getLogger(__name__)

class LabAIAgent(BaseAgent):
    """
    Agent responsible for translating ML technical outputs into 
    health-domain narratives and actionable insights.
    """
    
    def __init__(self):
        super().__init__("labai_agent", "LabAI Agent 🩺")
        
    async def execute(self, data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Synthesize results into a cohesive narrative
        """
        logger.info("Synthesizing LabAI narrative...")
        
        pipeline_summary = context.get("pipeline_summary", {})
        recommendations = pipeline_summary.get("recommendations", [])
        key_findings = pipeline_summary.get("key_findings", [])
        
        narrative = self._generate_narrative(pipeline_summary, context)
        health_context = self._generate_health_context(context)
        
        return {
            "narrative": narrative,
            "health_implications": health_context,
            "suggested_actions": self._prioritize_actions(recommendations),
            "generated_at": datetime.now().isoformat()
        }
    
    def _generate_narrative(self, summary: Dict, context: Dict) -> str:
        """Generate a natural language summary of the analysis"""
        problem_type = summary.get("problem_type", "analysis")
        target = context.get("target_column", "the target")
        
        # Structure matches clinical_summary template conceptually
        lines = [
            f"# Analysis Report for {target}",
            f"**Date:** {datetime.now().strftime('%Y-%m-%d')}",
            "",
            "## Executive Summary",
            f"This analysis focused on '{target}' using {problem_type} techniques.",
            f"The primary goal was to identify patterns and predictive factors within the dataset.",
            f"The best model achieved a performance score of **{summary.get('model_training_summary', {}).get('best_score', 0):.3f}**.",
            "",
            "## Key Findings",
        ]
        
        findings = summary.get("key_findings", [])
        if findings:
            for finding in findings[:5]:
                lines.append(f"- {finding}")
        else:
            lines.append("- No specific key findings were isolated in this run.")
            
        lines.extend([
            "",
            "## Model Interpretation",
            "The model relies on several key features to make its predictions. Understanding these drivers is crucial for clinical validation.",
            "Higher values in the top features generally correlate with the target outcome as described in the Feature Importance section.",
        ])

        return "\n".join(lines)

    def _generate_health_context(self, context: Dict) -> Dict:
        """
        Add health-specific context based on variable names/domain.
        (Placeholder for V1 - would connect to medical ontology in V2)
        """
        target = context.get("target_column", "").lower()
        
        context_map = {
            "glucose": "Metabolic health indicator",
            "bp": "Cardiovascular indicator",
            "heart_rate": "Vital sign",
            "bmi": "Body composition metric"
        }
        
        domain_note = "General Health Data"
        for key, value in context_map.items():
            if key in target:
                domain_note = value
                break
                
        return {
            "domain": domain_note,
            "sensitivity_level": "PHI" if "patient" in str(context).lower() else "Anonymized"
        }

    def _prioritize_actions(self, recommendations: List[str]) -> List[str]:
        """Prioritize recommendations for the user"""
        # Simple pass-through for V1, could rank by impact/urgency
        return recommendations

from datetime import datetime
