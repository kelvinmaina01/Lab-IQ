# 🔧 UPLOAD FIX - TESTING GUIDE

**Date**: December 5, 2025  
**Issue**: Datasets not being saved to database after upload  
**Status**: FIXED ✅

---

## 🐛 WHAT WAS WRONG

1. **Project name not being used** - Dataset was saved with just filename, not user's chosen name
2. **No error validation** - Button could be clicked without name
3. **Missing error details** - Errors weren't showing what went wrong
4. **No auto-fill** - User had to manually type name
5. **No form reset** - After upload, form stayed filled

---

## ✅ WHAT WAS FIXED

### **1. Auto-fill Dataset Name**
- When you upload a file, the dataset name now auto-fills from the filename
- Example: Upload "experiment_data.csv" → Name becomes "experiment_data"

### **2. Better Validation**
- Can't click"Process & Analyze" without a dataset name
- Can't click without file parsed
- Shows clear error messages

### **3. Uses Your Custom Name**
- Whatever you type in "Dataset Name" field is used
- Your name > auto-filled name

### **4. Better Error Messages**
- Shows exactly what went wrong
- Console logs for debugging
- Progress messages throughout

### **5. Form Reset After Success**
- Clears file
- Clears name
- Ready for next upload

### **6. Auto-refresh**
- Dataset list refreshes after upload
- Shows in "Dataset Registry" tab immediately
- Available in AI Assistant dropdown

---

## 🧪 HOW TO TEST

### **Step 1: Upload a Dataset**

1. Go to: `http://localhost:8081/upload`
2. Either:
   - **Drag & drop** a CSV/Excel file
   - **Click "Drop your file"** to browse

3. **Wait for parse** (should see toast: "File parsed successfully")

4. **Check auto-filled name**:
   - Look at "Dataset Name" field
   - Should be auto-filled with filename

5. **Optional**: Change the name to something descriptive
   - Example: "Q4 Lab Results"

6. **Click "Process & Analyze Dataset"**

7. **Watch progress**:
   - Should see: "Starting upload..."
   - Then: "Creating dataset record..."
   - Then: "Saving schema information..."
   - Then: "Analyzing data quality..."
   - Then: "Uploading data rows..."
   - Finally: "Upload complete!"

8. **Success toast appears**: "Dataset uploaded and processed successfully"

9. **Auto-redirect** to dataset detail page

---

### **Step 2: Verify Dataset Saved**

**Option A: Check Dataset Registry**
1. Go back to `/upload`
2. Click "Dataset Registry" tab
3. Your dataset should appear there

**Option B: Check Dashboard**
1. Go to `/dashboard`
2. Look at "Recent Datasets" section
3. Your dataset should be listed

**Option C: Check AI Assistant**
1. Open AI Assistant (from sidebar)
2. Click dataset dropdown
3. Your dataset should be in the list

**Option D: Check Database (Supabase)**
1. Open Supabase Dashboard
2. Go to Table Editor
3. Select `datasets` table
4. Your dataset should be there with status "ready"

---

### **Step 3: Test Different Scenarios**

#### **Test 1: No Name**
1. Upload file (auto-fills name)
2. Delete the name (make it blank)
3. Click "Process & Analyze"
4. **Expected**: Error toast "Missing dataset name"

#### **Test 2: No File**
1. Type a dataset name
2. Don't upload file
3. Click "Process & Analyze"
4. **Expected**: Button is disabled (can't click)

#### **Test 3: Custom Name**
1. Upload file
2. Change auto-filled name to "My Custom Dataset"
3. Click "Process & Analyze"
4. **Expected**: Dataset saved as "My Custom Dataset"

#### **Test 4: Large File**
1. Upload a large CSV (>1000 rows)
2. Watch progress bar
3. **Expected**: See percentage increasing, smooth upload

#### **Test 5: Multiple Uploads**
1. Upload first dataset
2. After success, upload another
3. **Expected**: Form clears, can upload again

---

## 🚨 IF IT STILL DOESN'T WORK

### **Check Console Logs**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Upload a file and click Process
4. Look for:
   ```
   Starting upload for: [your dataset name]
   User ID: [uuid]
   Parsed data: {object}
   Progress: 10% - Creating dataset record...
   Progress: 20% - Saving schema information...
   ...
   Dataset saved with ID: [uuid]
   ```

### **Common Errors & Solutions**

#### **Error: "Failed to create dataset"**
```
Problem: Database permission issue
Solution: Check Supabase RLS policies for `datasets` table
```

#### **Error: "Failed to save columns"**
```
Problem: Schema mismatch or permission issue  
Solution: Check `dataset_columns` table exists and RLS allows insert
```

#### **Error: "Failed to save rows batch"**
```
Problem: Data too large or malformed
Solution: Check file format, try smaller file first
```

#### **Error: "Authentication required"**
```
Problem: Not signed in
Solution: Sign in again, refresh page
```

#### **File parses but Process button disabled**
```
Problem: Missing dataset name or parsedData null
Solution: Check dataset name field has text, re-upload file
```

---

## 📊 EXPECTED FLOW

```
1. User uploads file
   ↓
2. File parses (preview shown)
   ↓
3. Dataset name auto-fills
   ↓
4. User clicks "Process & Analyze"
   ↓
5. Progress shows (10% → 100%)
   ↓
6. Success toast
   ↓
7. Dataset saved to database
   ↓
8. Form clears
   ↓
9. Redirect to dataset detail page
   ↓
10. Dataset appears in:
    - Dashboard (Recent Datasets)
    - Upload (Dataset Registry tab)
    - AI Assistant (dropdown)
```

---

## 🎯 TEST WITH SAMPLE DATA

If you don't have data, use this sample CSV:

**Create file: `test_data.csv`**
```csv
name,age,score,category
Alice,25,95,A
Bob,30,87,B
Charlie,28,92,A
Diana,22,88,B
Eve,35,90,A
```

**Expected result:**
- Rows: 5
- Columns: 4
- Name auto-fills as "test_data"
- Quality score: ~90%+
- All data visible in preview

---

## ✅ SUCCESS CRITERIA

Upload is working if:
- ✅ File parses without errors
- ✅ Dataset name auto-fills
- ✅ Progress bar shows smoothly
- ✅ Success toast appears
- ✅ Dataset appears in Registry tab
- ✅ Dataset appears in Dashboard
- ✅ Dataset selectable in AI Assistant
- ✅ Can view dataset details
- ✅ Can upload multiple datasets
- ✅ Form clears after each upload

---

## 🔍 DEBUGGING CHECKLIST

If upload fails:

1. ☐ Check browser console for errors
2. ☐ Check Supabase logs (Database → Logs)
3. ☐ Verify user is authenticated
4. ☐ Verify `datasets` table exists
5. ☐ Verify `dataset_columns` table exists  
6. ☐ Verify `dataset_rows` table exists
7. ☐ Verify `dataset_quality` table exists
8. ☐ Verify RLS policies allow insert
9. ☐ Check file format (valid CSV/Excel/JSON)
10. ☐ Check file size (under tier limit)

---

## 🚀 NEXT STEPS

After confirming upload works:

1. **Test AI Assistant**:
   - Select your uploaded dataset
   - Ask a question
   - Verify it uses your data

2. **Test AutoML**:
   - Go to Models page
   - Train a model on your dataset
   - Verify it works

3. **Test Data Explorer**:
   - View dataset details
   - Check statistics
   - Verify all data loaded

4. **Test Experiments**:
   - Create experiment using your dataset
   - Verify dataset shows up

---

**Last Updated**: December 5, 2025  
**Status**: Ready to test  
**Priority**: CRITICAL - Core functionality

---

## 📝 SHARE RESULTS

After testing, please share:
1. ✅ What worked
2. ❌ What didn't work
3. 📸 Screenshots of any errors
4. 📋 Console logs if issues

This helps ensure the fix is solid! 🎉
