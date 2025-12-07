# Quick Test Guide

## 1. Test Experiment Creation Flow

### Steps:
1. Navigate to http://localhost:8080/upload
2. Upload a CSV file (use any sample data)
3. Wait for processing to complete
4. You should be redirected to `/dashboard/datasets/{id}`
5. **Look for QuickActionsPanel** - should show 4 beautiful cards
6. Click "Create Experiment"
7. Verify you're navigated to `/experiments`
8. Verify dialog opens automatically
9. Verify form is pre-filled with dataset name
10. Select an experiment type
11. Click "Create Experiment"
12. ✅ Check that experiment appears in list

### Expected Result:
- Experiment saved to database
- Links to source dataset
- Auto-created flag set to true

---

## 2. Test ML Model Training Flow

### Steps:
1. From dataset detail page, click "Train ML Model"
2. Verify you're navigated to `/models`
3. ML Wizard should open automatically
4. **Step 1 - Detection**: Wait for auto-detection
5. **Step 2 - Configure**: Verify problem type detected
6. Select target column (if not clustering)  
7. Select algorithm
8. Click "Start Training"
9. **Step 3 - Training**: Watch progress bar
10. **Step 4 - Results**: View metrics & feature importance

### Expected Result (once ML service is running):
- Model trained successfully
- Metrics displayed (RMSE, R², accuracy, etc.)
- Feature importance chart shown
- Model saved to database

### Without ML Service:
- Will show error connecting to ML service
- This is expected until you run `python ml-service/main.py`

---

## 3. Test Workflow Creation Flow

### Steps:
1. From dataset detail page, click "Build Workflow"
2. Verify you're navigated to `/automation`
3. Workflow builder dialog should open
4. Enter workflow name: "Test Workflow"
5. Enter description
6. Add workflow steps:
   - Click "Quality Check"
   - Click "Train ML Model"
   - Click "Send Notification"
7. Verify steps appear in sequence with arrows
8. Click "Create Workflow"
9. ✅ Check workflow saved

### Expected Result:
- Workflow appears in automation list
- Steps saved correctly
- Trigger configured

---

## 4. Test Report Generation Flow (NEW)

### Steps:
1. Navigate to `/reports`
2. Click "New Report" to open the Wizard
3. **Step 1 - Configuration**: Enter title "My Lab Report", type "Executive"
4. **Step 2 - Data Source**: Select a dataset from the list (if you have one)
5. **Step 3 - Modules**: Toggle "Anomalies" and "Audit Log"
6. **Step 4 - Distribution**: Click "Generate"
7. ✅ Check the reports list

### Expected Result:
- Report appears immediately with status "Processing"
- After ~5 seconds, status updates to "Published" automatically
- Analytics cards at the top update
- Clicking "Version History" shows the initial version

---

## 5. Test AI Assistant Integration

### Steps:
1. From dataset detail page, click "Analyze with AI"
2. Verify you're navigated to `/insights`
3. AI Assistant should open
4. Dataset should be pre-selected (if AIAssistantChat supports initialDatasetId prop)
5. Type a question about the data
6. Verify AI responds

### Expected Result:
- AI chat opens
- Context includes selected dataset
- Can ask dataset-specific questions

---

## 6. Visual Verification Checklist

### QuickActionsPanel Display:
- [ ] 4 cards displayed in grid
- [ ] Each card has gradient background
- [ ] Icons show correctly (Flask, Brain, Zap, Sparkles)
- [ ] Hover effects work
- [ ] "Get started" arrows appear on hover

### Page Navigation:
- [ ] Experiment: `/experiments` with dialog open
- [ ] ML Model: `/models` with wizard open
- [ ] Workflow: `/automation` with builder open
- [ ] Reports: `/reports` page loads
- [ ] AI: `/insights` page loads

### Database Saves:
- [ ] Experiments table has new row
- [ ] ML_models table populates (when ML service runs)
- [ ] Workflows table has new row
- [ ] Reports table has new row
- [ ] Dataset_id links are correct

---

## Known Limitations (Until ML Service Starts)

1. **ML Training** will fail with connection error
   - Solution: Run `cd ml-service && python main.py`
   
2. **AIAssistantChat** may need `initialDatasetId` prop added
   - Check if component accepts this prop
   
3. **Workflow Execution** won't run automatically yet
   - Execution engine needs backend implementation

---

## Quick Fixes If Issues Found

### QuickActionsPanel doesn't appear:
- Check that dataset has `status = 'ready'`
- Verify component is imported in DatasetDetail.tsx
- Check browser console for errors

### Navigation doesn't work:
- Verify react-router-dom routes are set up
- Check for console errors
- Ensure `navigate()` function is available

### Form doesn't pre-fill:
- Check location.state is being passed
- Verify useEffect dependencies
- Console.log the state object

---

## Success Criteria

✅ **Phase 1 Success**: All 4 quick actions visible and clickable
✅ **Phase 2 Success**: Navigation works for all 4 actions
✅ **Phase 3 Success**: Dialogs/wizards open automatically
✅ **Phase 4 Success**: Data saves to database correctly
✅ **Phase 5 Success**: ML training works (once service running)
✅ **Phase 6 Success**: Enterprise Report generation works seamlessly

---

## Next Steps After Testing

1. If everything works: 🎉 Celebrate!
2. Fix any bugs found
3. Start ML service for full functionality
4. Add more ML algorithms
5. Implement workflow execution engine
6. Add more workflow step types
