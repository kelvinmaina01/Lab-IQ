# Quick Start Guide - Multi-Agent AutoML

## 🚀 Get Started in 5 Minutes

### Step 1: Installation Status

The system is currently installing 75+ powerful ML libraries:
- ✅ Core framework (FastAPI, Pydantic)
- ⏳ Core ML libraries (scikit-learn, XGBoost, LightGBM, CatBoost)
- ⏳ AutoML libraries (TPOT, PyCaret, Optuna)
- ⏳ Feature engineering (featuretools, category-encoders)
- ⏳ Interpretability (SHAP, LIME, ELI5)
- ⏳ Visualization (matplotlib, seaborn, plotly)
- ⏳ Deep learning (optional: PyTorch, TensorFlow)

**Note**: Installation may take 5-15 minutes depending on your internet speed.

### Step 2: Once Installation Completes

```bash
# Navigate to ml-service
cd C:\Users\dell\Desktop\Lab-IQ\ml-service

# Activate virtual environment
.\venv\Scripts\activate

# Start the service
python main.py
```

You should see:
```
══════════════════════════════════════════════════════════════════════
🚀 Lab-IQ Multi-Agent AutoML Service
══════════════════════════════════════════════════════════════════════
Powered by 6 specialized AI agents:
  🗂️  Data Understanding Agent
  ⚙️  Feature Engineering Agent
  🤖 Model Selection Agent
  🎯 Hyperparameter Optimization Agent
  📊 Training & Evaluation Agent
  💡 Insights & Explanation Agent
══════════════════════════════════════════════════════════════════════
Starting server on http://0.0.0.0:8002
══════════════════════════════════════════════════════════════════════
```

### Step 3: Test with Demo

Open a new terminal:

```bash
cd C:\Users\dell\Desktop\Lab-IQ\ml-service
.\venv\Scripts\activate
python demo.py
```

This will run 3 complete AutoML pipelines:
1. Classification (Iris dataset)
2. Regression (California Housing)
3. Auto-detection (Wine dataset)

### Step 4: Test via API

```bash
# Health check
curl http://localhost:8002/health

# Should return:
# {"status": "healthy", "active_pipelines": 0}
```

### Step 5: Use from Frontend

Once the service is running, your Upload page can send requests:

```javascript
// In your Upload.tsx handleProcess function
const response = await fetch('http://localhost:8002/api/ml/automl', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dataset_id: uploadedDatasetId,
    data: parsedData,
    target_column: selectedTargetColumn
  })
});

const result = await response.json();
console.log('AutoML Complete!', result.summary);
```

## 📊 What You'll Get

### Immediate Response
```json
{
  "success": true,
  "pipeline_duration_seconds": 45.2,
  "summary": {
    "data_summary": {...},
    "feature_engineering_summary": {...},
    "model_training_summary": {
      "models_trained": 5,
      "best_model": "XGBoost",
      "best_score": 0.94
    },
    "key_findings": [...],
    "recommendations": [...]
  }
}
```

### Visual Output (in logs)
```
══════════════════════════════════════════════════════════════
STAGE 1: DATA UNDERSTANDING
══════════════════════════════════════════════════════════════
🚀 Data Understanding Agent 🗂️ started
✅ Data Understanding Agent 🗂️ completed in 2.34s

══════════════════════════════════════════════════════════════
STAGE 2: FEATURE ENGINEERING
══════════════════════════════════════════════════════════════
🚀 Feature Engineering Agent ⚙️ started
✅ Feature Engineering Agent ⚙️ completed in 5.67s

══════════════════════════════════════════════════════════════
STAGE 3: MODEL SELECTION
══════════════════════════════════════════════════════════════
🚀 Model Selection Agent 🤖 started
✅ Model Selection Agent 🤖 completed in 1.23s

══════════════════════════════════════════════════════════════
STAGE 4: HYPERPARAMETER OPTIMIZATION
══════════════════════════════════════════════════════════════
🚀 Hyperparameter Optimization Agent 🎯 started
Optimizing XGBoost...
Optimizing Random Forest...
Optimizing LightGBM...
✅ Hyperparameter Optimization Agent 🎯 completed in 8.91s

══════════════════════════════════════════════════════════════
STAGE 5: MODEL TRAINING & EVALUATION
══════════════════════════════════════════════════════════════
🚀 Training & Evaluation Agent 📊 started
Training XGBoost...
Training Random Forest...
Training LightGBM...
Training Voting Ensemble...
✅ Training & Evaluation Agent 📊 completed in 12.45s

══════════════════════════════════════════════════════════════
STAGE 6: INSIGHTS & EXPLANATIONS
══════════════════════════════════════════════════════════════
🚀 Insights & Explanation Agent 💡 started
✅ Insights & Explanation Agent 💡 completed in 3.21s

══════════════════════════════════════════════════════════════
PIPELINE COMPLETED SUCCESSFULLY
Total Duration: 34.81 seconds
══════════════════════════════════════════════════════════════
```

## 🔍 Monitoring Installation

### Check current status:
```bash
# In ml-service directory
pip list | findstr "scikit-learn xgboost lightgbm"
```

### If installation is stuck:
```bash
# Cancel (Ctrl+C) and try with specific versions
pip install scikit-learn==1.5.0 xgboost==2.0.0 lightgbm==4.0.0 --no-cache-dir
```

### Minimal installation (faster):
```bash
# Just core libraries for testing
pip install fastapi uvicorn pydantic pandas numpy scikit-learn joblib
```

## 🧪 Testing Without Full Installation

If you want to test the architecture before all libraries are installed:

```python
# test_agents.py
import asyncio
from agents.base_agent import BaseAgent

class TestAgent(BaseAgent):
    def __init__(self):
        super().__init__("test", "Test Agent")
    
    async def execute(self, data, context):
        return {"message": "Agent system working!"}

async def test():
    agent = TestAgent()
    result = await agent.run({"test": "data"}, {})
    print(result)

asyncio.run(test())
```

## 📋 Troubleshooting

### Issue: Import error for SHAP/LIME
**Solution**: These are optional. The system will work without them.

### Issue: Out of memory during installation
**Solution**: Install in batches:
```bash
pip install fastapi uvicorn pydantic pandas numpy scikit-learn
pip install xgboost lightgbm catboost
pip install optuna mlflow
# etc.
```

### Issue: Installation very slow
**Solution**: Use slim requirements:
```txt
# requirements-minimal.txt
fastapi==0.115.5
uvicorn==0.34.0
pydantic==2.10.3
pandas==2.2.3
numpy==2.2.0
scikit-learn==1.6.0
xgboost==2.1.2
lightgbm==4.5.0
joblib==1.4.2
```

## 🎯 Next Steps After Installation

1. ✅ Test with `python demo.py`
2. 🔗 Update frontend Upload page to call `/api/ml/automl`
3. 🎨 Add progress bar visualization
4. 📊 Create results dashboard component
5. 💾 Add export to PDF functionality
6. 🚀 Deploy and celebrate! 🎉

## 💡 Pro Tips

1. **Start small**: Test with small datasets first (< 1000 rows)
2. **Monitor logs**: Watch the console for agent progress
3. **Check metrics**: Validate model performance makes sense
4. **Use WebSocket**: For real-time progress in frontend
5. **Save models**: Models are automatically saved to `models/` directory

## 🆘 Need Help?

- Check logs: `python main.py` console output
- Test agents individually: See demo.py for examples
- Reduce complexity: Start with fewer algorithms
- Use minimal requirements: Focus on core functionality first

---

**Current Status**: ⏳ Installing dependencies
**ETA**: 5-15 minutes
**Ready to use**: After installation completes + `python main.py`
