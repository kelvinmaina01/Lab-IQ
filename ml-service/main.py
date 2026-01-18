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
import os

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    logging.info("Loaded environment variables from .env file")
except ImportError:
    logging.warning("python-dotenv not installed. Install with: pip install python-dotenv")

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

class GenerateDescriptionRequest(BaseModel):
    title: str
    report_type: str
    modules: List[str]

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


@app.post("/api/ml/predict")
async def predict_model(request: Dict[str, Any]):
    """
    Make predictions using a trained model
    """
    try:
        import joblib
        import pandas as pd
        import os

        model_path = request.get("model_path")
        input_data = request.get("input_data")
        
        if not model_path or not os.path.exists(model_path):
             # Try to find it in default dir if only filename provided
             if model_path and os.path.exists(os.path.join("models", model_path)):
                 model_path = os.path.join("models", model_path)
             else:
                 raise HTTPException(status_code=404, detail=f"Model file not found: {model_path}")
                 
        if not input_data:
            raise HTTPException(status_code=400, detail="No input data provided")

        # Load model
        try:
            model = joblib.load(model_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")

        # Prepare data
        df = pd.DataFrame(input_data)
        
        # Ensure primitive types for JSON serialization
        predictions = model.predict(df).tolist()
        
        return {
            "success": True,
            "predictions": predictions
        }
        
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class InsightsRequest(BaseModel):
    dataset_id: str
    data: List[Dict[str, Any]]
    columns: Optional[List[Dict[str, Any]]] = None

@app.post("/api/ml/insights")
async def generate_insights(request: InsightsRequest):
    """
    Generate comprehensive insights using DataAgent (including DomainAgent) and InsightsAgent
    """
    try:
        from agents.data_agent import DataAgent
        from agents.insights_agent import InsightsAgent
        
        data_agent = DataAgent()
        insights_agent = InsightsAgent()
        
        # 1. Run Data Analysis (includes Domain Analysis)
        data_result = await data_agent.execute(request.data, {"dataset_id": request.dataset_id})
        
        # 2. Run Insights Analysis
        context = {
            "dataset_id": request.dataset_id,
            "data_profile": data_result,
            "columns": request.columns
        }
        
        insights_result = await insights_agent.execute(request.data, context)
        
        # Merge results
        return {
            "success": True,
            "dataset_id": request.dataset_id,
            "insights": insights_result.get("key_findings", []) + data_result.get("recommendations", []),
            "correlations": insights_result.get("correlations", []),
            "recommendations": insights_result.get("recommendations", []),
            "domain_analysis": data_result.get("domain_analysis", {}),
            "data_profile": data_result
        }
        
    except Exception as e:
        logger.error(f"Insights generation failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/generate-description")
async def generate_description(request: GenerateDescriptionRequest):
    """
    Generate a professional description for a report using Gemini
    """
    try:
        from agents.content_agent import ContentAgent
        
        agent = ContentAgent()
        result = await agent.generate_report_description(
            title=request.title,
            report_type=request.report_type,
            modules=request.modules
        )
        
        if "error" in result:
             raise HTTPException(status_code=500, detail=result["error"])
             
        return {
            "success": True,
            "description": result.get("generated_text", "")
        }
        
    except Exception as e:
        logger.error(f"Description generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))




@app.post("/api/ml/generate-report")
async def generate_report_endpoint(request: Dict[str, Any]):
    """
    Generate a full PDF/HTML/Markdown report via ReportGenerator
    """
    try:
        from report_generator import ReportGenerator, ReportTemplate, ReportFormat
        
        # Extract params
        template_str = request.get("template", "GENERAL")
        format_str = request.get("format", "markdown")
        title = request.get("title", "Analysis Report")
        data = request.get("data", {})
        
        # Map strings to Enums (safe fallback)
        try:
            template = ReportTemplate(template_str)
        except ValueError:
            template = ReportTemplate.GENERAL
            
        try:
            fmt = ReportFormat(format_str)
        except ValueError:
            fmt = ReportFormat.MARKDOWN
            
        # Instantiate Generator
        # Output to a public/reports dir or tmp
        output_dir = os.path.join(os.getcwd(), "public", "reports")
        os.makedirs(output_dir, exist_ok=True)
        
        generator = ReportGenerator(output_dir=output_dir)
        
        report = generator.generate(
            template=template,
            format=fmt,
            title=title,
            data=data,
            dataset_id=request.get("dataset_id"),
        )
        
        # Return relative path for frontend to download
        # Assuming frontend serves 'public/' static files
        relative_path = f"/reports/{os.path.basename(report.file_path)}"
        
        return {
            "success": True,
            "report_id": report.id,
            "url": relative_path,
            "file_path": report.file_path
        }
        
    except Exception as e:
        logger.error(f"Report generation endpoint failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class ChatRequest(BaseModel):
    messages: List[Dict[str, Any]]
    datasetId: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None # New: Accept data directly
    mode: str = "analysis"

@app.post("/api/agent/run")
async def run_agent_endpoint(request: ChatRequest):
    """
    Run the LangGraph Expert Agent with Generative UI support
    """
    import pandas as pd
    import tempfile
    
    temp_file_path = None
    
    try:
        from agent_graph import run_agent
        
        # Extract user message
        user_msg = request.messages[-1].get('content', '') if request.messages else ""
        
        sample_str = "No specific data loaded."
        
        # Handle Data: If provided, save to temp CSV for the agent to load
        if request.data and len(request.data) > 0:
            df = pd.DataFrame(request.data)
            
            # Create rich context for the agent
            import io
            buffer = io.StringIO()
            df.info(buf=buffer)
            info_str = buffer.getvalue()
            
            sample_str = (
                f"Shape: {df.shape}\n"
                f"Columns: {list(df.columns)}\n\n"
                f"Data Types & Info:\n{info_str}\n\n"
                f"First 3 Rows:\n{df.head(3).to_markdown(index=False)}"
            )
            
            # Create temp file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as tmp:
                df.to_csv(tmp.name, index=False)
                temp_file_path = tmp.name
                
            logger.info(f"Created temp data file: {temp_file_path} with {len(df)} rows")
        
        # Run agent
        # Returns Dict: {"answer": str, "ui_components": List[Dict], "code": str}
        # We pass the temp_file_path so the agent can load `df`
        result = await run_agent(
            user_msg, 
            dataset_context=f"Dataset ID: {request.datasetId}",
            file_path=temp_file_path,
            data_sample=sample_str
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Agent run failed: {e}")
        import traceback
        traceback.print_exc()
        # Fallback structured response
        return {
            "answer": f"Agent Error: {str(e)}. Please check backend logs.",
            "ui_components": [
                {
                    "component": "InsightCard", 
                    "props": {
                        "title": "System Error", 
                        "content": str(e), 
                        "severity": "error"
                    }
                }
            ]
        }
    finally:
        # Cleanup temp file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                logger.info(f"Cleaned up temp file: {temp_file_path}")
            except Exception as cleanup_err:
                logger.warning(f"Failed to delete temp file: {cleanup_err}")


if __name__ == "__main__":
    import uvicorn
    print("=" * 70)
    print("= Lab-IQ Multi-Agent AutoML Service")
    print("= Serving on http://localhost:8002")
    print("= Documentation: http://localhost:8002/docs")
    print("=" * 70)
    
    uvicorn.run(app, host="0.0.0.0", port=8002)
