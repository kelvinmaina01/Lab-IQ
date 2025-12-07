# High Priority: ML Service Testing (Pending Python Installation)

## ⚠️ High Priority Task

**Once Python is installed**, immediately test:

### ML Training Flow - End to End
```bash
# 1. Start ML Service
cd ml-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Critical Tests:
1. **Problem Detection**
   - Upload iris.csv or any dataset
   - Click "Train ML Model"
   - Verify auto-detection works
   - Check suggested target column

2. **Model Training**
   - Select algorithm
   - Click "Start Training"
   - Verify progress bar reaches 100%
   - Check no errors in ML service logs

3. **Results Display**
   - Verify metrics display correctly
   - Check feature importance chart
   - Confirm model saved to database
   - Verify model_id returned

4. **Database Verification**
   ```sql
   SELECT * FROM ml_models ORDER BY created_at DESC LIMIT 1;
   ```

### Expected Outcomes:
✅ ML service starts without errors  
✅ Health check returns `{"message": "Lab-IQ ML Service", "status": "running"}`  
✅ Problem detection responds in < 2 seconds  
✅ Training completes for small dataset (< 100 rows) in < 10 seconds  
✅ Metrics are accurate (can verify with known dataset)  
✅ Model saves to Supabase correctly  

### Potential Issues & Solutions:

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError` | Re-run `pip install -r requirements.txt` |
| Port 8000 in use | Change port in main.py or kill process |
| CORS errors | Verify ML service allows localhost:8081 |
| Timeout errors | Check firewall settings |
| Training hangs | Check dataset isn't too large |

### Performance Benchmarks:
- Small dataset (< 100 rows): < 10s
- Medium dataset (100-1000 rows): < 30s
- Large dataset (1000-10000 rows): < 2min

If training takes longer, add progress websocket support.

---

## Post-Testing Checklist
- [ ] ML service health check passes
- [ ] Problem detection works
- [ ] Model training completes
- [ ] Metrics display correctly
- [ ] Database saves work
- [ ] No memory leaks
- [ ] Error handling graceful
- [ ] Ready for production

---

**Status**: ⏸️ PENDING PYTHON INSTALLATION  
**Priority**: 🔥 HIGH  
**ETA**: As soon as Python installed (~5 min setup)
