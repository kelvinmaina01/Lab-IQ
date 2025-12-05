# ML Service Quick Start Guide

## Setup Instructions

### 1. Navigate to ML Service Directory
```bash
cd c:\Users\dell\Desktop\Lab-IQ\ml-service
```

### 2. Create Virtual Environment
```bash
python -m venv venv
```

### 3. Activate Virtual Environment
```bash
# Windows
venv\Scripts\activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Start the ML Service
```bash
python main.py
```

The service will start on `http://localhost:8000`

## Verify Installation

Open a browser and navigate to:
- http://localhost:8000 - Should show: `{"message": "Lab-IQ ML Service", "status": "running"}`
- http://localhost:8000/docs - FastAPI automatic documentation

## Testing the ML Service

### From the Lab-IQ Frontend:
1. Make sure the ML service is running (steps above)
2. Navigate to any dataset detail page
3. Click "Train ML Model" in Quick Actions
4. The wizard will automatically:
   - Detect problem type
   - Suggest target column
   - Recommend algorithm
   - Train the model
   - Show results with metrics

### Manual API Test (Optional):
```bash
curl http://localhost:8000/
```

## Troubleshooting

### "python not found"
- Make sure Python 3.8+ is installed
- Try `python3` instead of `python`

### "Module not found"
- Make sure virtual environment is activated
- Re-run `pip install -r requirements.txt`

### Port 8000 already in use
- Change port in main.py: `uvicorn.run(app, host="0.0.0.0", port=8001)`
- Update ML_SERVICE_URL in `src/lib/services/mlService.ts`

## Next Steps

Once the service is running, test the ML training flow:
1. Upload a CSV dataset
2. Click "Train ML Model" in Quick Actions
3. Follow the wizard steps
4. View your trained model metrics!
