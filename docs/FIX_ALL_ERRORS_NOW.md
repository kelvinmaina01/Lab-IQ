# 🚨 FIX ALL ERRORS - COMPLETE GUIDE

## 🔍 Problems Diagnosed

You're seeing these errors:
1. ❌ **404 on `subscriptions` table** - Table doesn't exist
2. ❌ **404 on `usage_stats` table** - Table doesn't exist
3. ❌ **400 on `datasets` table** - Missing columns or schema mismatch
4. ❌ **Sample dataset failing** - Can't insert due to schema issues
5. ❌ **Device data service failing** - Same schema issues

**Root Cause**: Database schema is incomplete/mismatched with code.

---

## ✅ SOLUTION (10 Minutes)

### Step 1: Run Complete Database Setup (5 min)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard
   - Select project: `engqgzznccvoqeiiuchn`
   - Click: **SQL Editor** (left sidebar)
   - Click: **New Query**

2. **Copy and Run This File**
   - Open file: `COMPLETE_DATABASE_SETUP.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)
   - Paste into SQL Editor (Ctrl+V)
   - Click: **Run** (or press Ctrl+Enter)

3. **Wait for Success Message**
   ```
   ✅ COMPLETE DATABASE SETUP - SUCCESS!
   📊 Tables Created/Fixed:
     ✓ datasets (with all required columns)
     ✓ dataset_metadata
     ✓ subscriptions
     ✓ usage_stats
     ✓ data_ingestion_jobs
   ```

### Step 2: Refresh Browser (1 min)

1. **Hard Refresh**
   - Windows/Linux: `Ctrl+F5`
   - Mac: `Cmd+Shift+R`

2. **Clear Cache** (if still having issues)
   - Press F12
   - Right-click refresh button
   - Select "Empty Cache and Hard Reload"

### Step 3: Test Everything (4 min)

1. **Go to Upload Page**
   - Navigate to: `http://localhost:8083/upload`

2. **Verify No Errors**
   - Press F12 (open console)
   - Look for errors
   - Should see NO red errors about 404 or 400

3. **Test Sample Dataset**
   - Click: "Run Demo Pipeline"
   - Should work without errors

4. **Test Enhanced Upload**
   - Click: "Enhanced Upload" tab
   - Drag and drop a CSV file
   - Should upload with progress bar

---

## 📊 What the SQL Does

### Creates/Fixes These Tables:

1. **`datasets`** - Main dataset storage
   - Adds: `file_size` (bytes, not MB)
   - Adds: `file_type`, `columns_info`, `status`
   - Adds: `source_type`, `source_id`
   - Fixes: ALL schema mismatches

2. **`subscriptions`** - User subscription data
   - Tracks: tier (free/pro), limits
   - Default: free tier for all users
   - Fixes: 404 error

3. **`usage_stats`** - Usage tracking
   - Tracks: monthly usage
   - Auto-creates: current month for all users
   - Fixes: 404 error

4. **`dataset_metadata`** - Quality metrics
   - Stores: quality scores, schema info
   - Links to: datasets table
   - Enables: quality dashboard

5. **`data_ingestion_jobs`** - Upload tracking
   - Tracks: ALL upload methods
   - Real-time: progress updates
   - Enables: Enhanced Upload features

### Sets Up Storage:

- **Creates**: `datasets` bucket
- **Configures**: 50MB file size limit
- **Allows**: CSV, Excel files only
- **Secures**: RLS policies (users only see their own)

### Creates Functions:

- **`get_upload_statistics()`** - Analytics for upload dashboard
- Returns: upload counts, success rates, quality scores

---

## 🔍 Verification Steps

### After Running SQL, Check:

```sql
-- 1. Check tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('datasets', 'subscriptions', 'usage_stats', 'dataset_metadata', 'data_ingestion_jobs');

-- Should return 5 rows

-- 2. Check datasets table has required columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'datasets'
AND column_name IN ('file_size', 'file_type', 'columns_info', 'status');

-- Should return 4 rows

-- 3. Check function exists
SELECT proname FROM pg_proc WHERE proname = 'get_upload_statistics';

-- Should return: get_upload_statistics

-- 4. Check storage bucket
SELECT name FROM storage.buckets WHERE name = 'datasets';

-- Should return: datasets

-- 5. Check your subscription created
SELECT tier, status FROM subscriptions WHERE user_id = auth.uid();

-- Should return: free, active
```

---

## 🧪 Testing Checklist

### Test 1: Page Loads Without Errors
- [ ] Navigate to `/upload`
- [ ] Open console (F12)
- [ ] No 404 errors on subscriptions
- [ ] No 404 errors on usage_stats
- [ ] No 400 errors on datasets

### Test 2: Sample Dataset Works
- [ ] Click "Run Demo Pipeline"
- [ ] No console errors
- [ ] Creates 1000 rows
- [ ] Redirects to dataset page

### Test 3: Enhanced Upload Works
- [ ] Click "Enhanced Upload" tab
- [ ] Statistics show (even if zeros)
- [ ] Drag and drop CSV file
- [ ] Progress bar appears
- [ ] Upload completes successfully

### Test 4: Legacy Upload Works
- [ ] Click "Legacy Upload" tab
- [ ] Select file
- [ ] Enter dataset name
- [ ] Click upload
- [ ] Success message appears

---

## 🐛 If Still Having Issues

### Issue: 404 errors still appearing
**Solution**:
```sql
-- Run this to verify tables exist
SELECT COUNT(*) FROM subscriptions;
SELECT COUNT(*) FROM usage_stats;

-- If you get "relation does not exist":
-- The SQL didn't run successfully
-- Check for error messages in SQL editor
```

### Issue: 400 errors still appearing
**Solution**:
```sql
-- Check if datasets table has all columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'datasets'
ORDER BY ordinal_position;

-- Must have: file_size (bigint), file_type (varchar), columns_info (jsonb)
```

### Issue: Can't create bucket
**Error**: `new row violates row-level security policy`

**Solution**:
- Go to: Supabase Dashboard → Storage
- Click: "New bucket"
- Name: `datasets`
- Public: OFF
- File size limit: 50MB
- Allowed types: text/csv, application/vnd.ms-excel

### Issue: Upload fails silently
**Check**:
1. Browser console for errors
2. File type (CSV or Excel only)
3. File size (max 50MB)
4. User is logged in

---

## 📞 Quick Commands

### Check Everything is Working:
```sql
-- All-in-one verification
SELECT
  'datasets' as table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'datasets') as column_count
UNION ALL
SELECT 'subscriptions', (SELECT COUNT(*) FROM subscriptions)
UNION ALL
SELECT 'usage_stats', (SELECT COUNT(*) FROM usage_stats)
UNION ALL
SELECT 'dataset_metadata', (SELECT COUNT(*) FROM dataset_metadata)
UNION ALL
SELECT 'ingestion_jobs', (SELECT COUNT(*) FROM data_ingestion_jobs);
```

### Get Your Current Stats:
```sql
SELECT * FROM subscriptions WHERE user_id = auth.uid();
SELECT * FROM usage_stats WHERE user_id = auth.uid();
SELECT get_upload_statistics(auth.uid(), 30);
```

---

## 🎯 Expected Results

### Before Fix:
```
❌ 404: subscriptions not found
❌ 404: usage_stats not found
❌ 400: datasets insert failed
❌ Sample dataset: error
❌ Enhanced upload: crashes
```

### After Fix:
```
✅ All tables exist
✅ All columns present
✅ No 404 errors
✅ No 400 errors
✅ Sample dataset works
✅ Enhanced upload works
✅ Statistics show
✅ Job monitoring works
```

---

## 🚀 Summary

### What You Need to Do:
1. ✅ Run `COMPLETE_DATABASE_SETUP.sql` in Supabase
2. ✅ Refresh browser (Ctrl+F5)
3. ✅ Test upload page

### What Gets Fixed:
1. ✅ All 404 errors (subscriptions, usage_stats)
2. ✅ All 400 errors (datasets schema)
3. ✅ Sample dataset functionality
4. ✅ Enhanced upload pipeline
5. ✅ Upload statistics
6. ✅ Job monitoring
7. ✅ Storage bucket

### Time Required:
- **SQL**: 2 minutes to run
- **Browser refresh**: 30 seconds
- **Testing**: 5 minutes
- **Total**: ~10 minutes

---

## ✨ Status After Fix

**You'll Have**:
- ✅ Complete database schema
- ✅ All tables with correct columns
- ✅ Proper RLS security
- ✅ Storage bucket configured
- ✅ Upload statistics working
- ✅ Enhanced upload functional
- ✅ Sample dataset working
- ✅ Zero 404/400 errors

**Ready for**:
- ✅ Production deployment
- ✅ User testing
- ✅ Demo
- ✅ Full feature usage

---

**JUST RUN THE SQL AND REFRESH! 🚀**

**File to run**: `COMPLETE_DATABASE_SETUP.sql`
**Time**: 10 minutes
**Result**: Everything works!
