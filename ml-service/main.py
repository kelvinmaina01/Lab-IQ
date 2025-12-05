"""
Lab-IQ Multi-Agent AutoML Service
FastAPI backend with comprehensive ML automation
"""
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import logging
import json

# Import agent system
from agents.orchestrator import OrchestratorAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Lab-IQ Multi-Agent AutoML Service",
    description="Comprehensive automated machine learning powered by multi-agent system",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://localhost:5173", "http://localhost:8082", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class AutoMLRequest(BaseModel):
    dataset_id: str
    data: List[Dict[str, Any]]
    target_column: Optional[str] = None
    problem_type: Optional[str] = None  # "classification", "regression", "clustering"
    options: Optional[Dict[str, Any]] = None

class QuickAnalysisRequest(BaseModel):
    dataset_id: str
    data: List[Dict[str, Any]]

# Active orchestrators for tracking
active_orchestrators: Dict[str, OrchestratorAgent] = {}


@app.get("/")
def root():
    return {
        "service": "Lab-IQ Multi-Agent AutoML",
        "version": "2.0.0",
        "status": "running",
        "capabilities": [
            "Automated data profiling",
            "Feature engineering",
            "Model selection",
            "Hyperparameter optimization",
            "Model training & evaluation",
            "Insights & explanations"
        ]
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "active_pipelines": len(active_orchestrators)
    }


@app.post("/api/ml/automl")
async def run_automl(request: AutoMLRequest):
    """
    Run complete AutoML pipeline with multi-agent system
    """
    try:
        logger.info(f"Starting AutoML pipeline for dataset: {request.dataset_id}")
        
        # Create orchestrator
        orchestrator = OrchestratorAgent()
        active_orchestrators[request.dataset_id] = orchestrator
        
        # Prepare context
        context = {
            "dataset_id": request.dataset_id,
            "target_column": request.target_column,
            "problem_type": request.problem_type,
            "options": request.options or {}
        }
        
        # Run pipeline
        result = await orchestrator.execute(request.data, context)
        
        # Clean up
        if request.dataset_id in active_orchestrators:
            del active_orchestrators[request.dataset_id]
        
        if result.get("success"):
            return {
                "success": True,
                "dataset_id": request.dataset_id,
                "summary": result.get("summary"),
                "detailed_results": result.get("detailed_results"),
                "pipeline_duration": result.get("pipeline_duration")
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Pipeline failed")
            )
            
    except Exception as e:
        logger.error(f"AutoML pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/quick-analysis")
async def quick_analysis(request: QuickAnalysisRequest):
    """
    Quick data analysis without full AutoML pipeline
    """
    try:
        from agents.data_agent import DataAgent
        
        data_agent = DataAgent()
        result = await data_agent.run(request.data, {})
        
        return {
            "success": True,
            "dataset_id": request.dataset_id,
            "analysis": result.get("results")
        }
        
    except Exception as e:
        logger.error(f"Quick analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/pipeline-status/{dataset_id}")
def get_pipeline_status(dataset_id: str):
    """
    Get status of running AutoML pipeline
    """
    if dataset_id not in active_orchestrators:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    orchestrator = active_orchestrators[dataset_id]
    return {
        "dataset_id": dataset_id,
        "progress": orchestrator.get_progress(),
        "status": orchestrator.get_pipeline_status()
    }


@app.websocket("/ws/automl/{dataset_id}")
async def websocket_automl(websocket: WebSocket, dataset_id: str):
    """
    WebSocket endpoint for real-time AutoML updates
    """
    await websocket.accept()
    
    try:
        # Receive request
        data = await websocket.receive_json()
        
        logger.info(f"WebSocket AutoML started for dataset: {dataset_id}")
        
        # Create orchestrator
        orchestrator = OrchestratorAgent()
        active_orchestrators[dataset_id] = orchestrator
        
        # Prepare context
        context = {
            "dataset_id": dataset_id,
            "target_column": data.get("target_column"),
            "problem_type": data.get("problem_type"),
            "options": data.get("options", {})
        }
        
        # Send initial status
        await websocket.send_json({
            "type": "status",
            "message": "Pipeline started",
            "progress": 0
        })
        
        # Run pipeline with progress updates
        async def send_progress():
            while orchestrator.get_progress() < 100:
                await asyncio.sleep(2)
                progress = orchestrator.get_progress()
                await websocket.send_json({
                    "type": "progress",
                    "progress": progress,
                    "status": orchestrator.get_pipeline_status()
                })
        
        # Start progress updates in background
        progress_task = asyncio.create_task(send_progress())
        
        # Run pipeline
        result = await orchestrator.execute(data.get("data", []), context)
        
        # Cancel progress updates
        progress_task.cancel()
        
        # Send final result
        await websocket.send_json({
            "type": "complete",
            "progress": 100,
            "result": result
        })
        
        # Clean up
        if dataset_id in active_orchestrators:
            del active_orchestrators[dataset_id]
        
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for dataset: {dataset_id}")
        if dataset_id in active_orchestrators:
            del active_orchestrators[dataset_id]
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.send_json({
            "type": "error",
            "error": str(e)
        })


# Legacy endpoints for backward compatibility
@app.post("/api/ml/detect-problem")
async def detect_problem(request: Dict[str, Any]):
    """Legacy endpoint - now uses DataAgent"""
    try:
        from agents.data_agent import DataAgent
        from agents.model_selection_agent import ModelSelectionAgent
        
        data_agent = DataAgent()
        model_agent = ModelSelectionAgent()
        
        data = request.get("data", [])
        
        # Analyze data
        data_result = await data_agent.run(data, {})
        
        # Get type analysis
        import pandas as pd
        df = pd.DataFrame(data)
        
        # Simple problem detection
        if len(df.columns) > 0:
            last_col = df.columns[-1]
            context = {"target_column": last_col}
            model_result = await model_agent.run(data, context)
            
            problem_type = model_result.get("results", {}).get("problem_type")
            
            return {
                "success": True,
                "problem_type": problem_type,
                "suggested_target": last_col,
                "data_analysis": data_result.get("results")
            }
        
        return {"success": False, "error": "No columns found"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/train")
async def train_model(request: Dict[str, Any]):
    """Legacy training endpoint - redirects to AutoML"""
    try:
        automl_request = AutoMLRequest(
            dataset_id=request.get("dataset_id", "legacy"),
            data=request.get("data", []),
            target_column=request.get("target_column"),
            problem_type=request.get("model_type")
        )
        
        result = await run_automl(automl_request)
        
        # Format response for legacy compatibility
        best_model = result.get("summary", {}).get("model_training_summary", {})
        
        return {
            "success": True,
            "model_id": request.get("dataset_id"),
            "algorithm": best_model.get("best_model"),
            "metrics": {"test_score": best_model.get("best_score")},
            "summary": result.get("summary")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    print("=" * 70)
    print("🚀 Lab-IQ Multi-Agent AutoML Service")
    print("=" * 70)
    print("Powered by 6 specialized AI agents:")
    print("  🗂️  Data Understanding Agent")
    print("  ⚙️  Feature Engineering Agent")
    print("  🤖 Model Selection Agent")
    print("  🎯 Hyperparameter Optimization Agent")
    print("  📊 Training & Evaluation Agent")
    print("  💡 Insights & Explanation Agent")
    print("=" * 70)
    print("Starting server on http://0.0.0.0:8002")
    print("=" * 70)
    
    uvicorn.run(app, host="0.0.0.0", port=8002)
