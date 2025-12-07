"""
Base Agent Class for Multi-Agent AutoML System
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentStatus:
    """Status tracking for agents"""
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class BaseAgent(ABC):
    """Base class for all ML agents"""
    
    def __init__(self, agent_id: str, name: str):
        self.agent_id = agent_id
        self.name = name
        self.status = AgentStatus.IDLE
        self.results = {}
        self.errors = []
        self.start_time = None
        self.end_time = None
        
    @abstractmethod
    async def execute(self, data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the agent's main task
        
        Args:
            data: Input data for the agent
            context: Shared context from other agents
            
        Returns:
            Dict containing agent results
        """
        pass
    
    async def run(self, data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Wrapper method that handles execution with error handling and logging
        """
        try:
            self.status = AgentStatus.RUNNING
            self.start_time = datetime.now()
            logger.info(f"🚀 {self.name} started")
            
            self.results = await self.execute(data, context)
            
            self.status = AgentStatus.COMPLETED
            self.end_time = datetime.now()
            duration = (self.end_time - self.start_time).total_seconds()
            logger.info(f"✅ {self.name} completed in {duration:.2f}s")
            
            return {
                "agent_id": self.agent_id,
                "name": self.name,
                "status": self.status,
                "results": self.results,
                "duration": duration,
                "timestamp": self.end_time.isoformat()
            }
            
        except Exception as e:
            self.status = AgentStatus.FAILED
            self.end_time = datetime.now()
            error_msg = f"Error in {self.name}: {str(e)}"
            self.errors.append(error_msg)
            logger.error(f"❌ {error_msg}")
            
            return {
                "agent_id": self.agent_id,
                "name": self.name,
                "status": self.status,
                "error": error_msg,
                "timestamp": self.end_time.isoformat()
            }
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "status": self.status,
            "results": self.results if self.status == AgentStatus.COMPLETED else None,
            "errors": self.errors
        }
