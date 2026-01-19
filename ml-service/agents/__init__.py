"""
Multi-Agent AutoML System
"""
from .base_agent import BaseAgent, AgentStatus
from .data_agent import DataAgent
from .feature_agent import FeatureEngineeringAgent
from .model_selection_agent import ModelSelectionAgent
from .model_selection_agent import ModelSelectionAgent
try:
    from .hyperparameter_agent import HyperparameterAgent
except Exception:
    HyperparameterAgent = None
from .training_agent import TrainingAgent
from .training_agent import TrainingAgent
from .insights_agent import InsightsAgent
from .orchestrator import OrchestratorAgent
from .domain_agent import DomainAgent

__all__ = [
    'BaseAgent',
    'AgentStatus',
    'DataAgent',
    'FeatureEngineeringAgent',
    'ModelSelectionAgent',
    'HyperparameterAgent',
    'TrainingAgent',
    'InsightsAgent',
    'InsightsAgent',
    'OrchestratorAgent',
    'DomainAgent'
]
