# 🚨 QUICK FIX: Database Migration

## Problem
Error: `column "category" does not exist` (status 400)

## Solution
The SQL script has been updated to handle existing tables properly. Follow these steps:

---

## ⚡ Step-by-Step Fix (2 minutes)

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard

### 2. Navigate to SQL Editor
Click **"SQL Editor"** in the left sidebar

### 3. Create New Query
Click **"New Query"** button

### 4. Copy the ENTIRE SQL Script
Open: `DATABASE_WORKFLOWS_SETUP.sql`
Select ALL (Ctrl+A) and Copy (Ctrl+C)

### 5. Paste and Run
Paste into Supabase SQL Editor
Click **"Run"** or press **Ctrl+Enter**

### 6. Verify Success
You should see:
```
Success. No rows returned
```

---

## ✅ What This Does

The updated script is **idempotent** (safe to run multiple times) and will:

### If tables DON'T exist:
- Creates all tables from scratch with all columns

### If tables ALREADY exist:
- Safely adds missing columns (`category`, `icon`, `estimated_time_saved`)
- Adds new monitoring fields to `workflow_executions`
- Creates new tables (`workflow_insights`, `workflow_reports`)
- Updates constraints to support new status values

---

## 🔍 Verification

After running the SQL, check in **Table Editor**:

### workflows table should have:
- ✅ `category` (TEXT)
- ✅ `icon` (TEXT)
- ✅ `estimated_time_saved` (TEXT)

### workflow_executions table should have:
- ✅ `insights` (JSONB)
- ✅ `metrics` (JSONB)
- ✅ `current_step` (INTEGER)
- ✅ `total_steps` (INTEGER)
- ✅ `progress_percentage` (DECIMAL)

### New tables should exist:
- ✅ `workflow_insights`
- ✅ `workflow_reports`

---

## 🎯 After Running SQL

1. **Refresh your Lab-IQ app** (hard refresh: Ctrl+Shift+R)
2. **Go to Automation page**
3. **Click "Templates"** button
4. **Select any template** (e.g., "IC50 Calculation")
5. **Workflow should create successfully** ✅

The 400 error will be **GONE**! 🎉

---

## 🛠️ Troubleshooting

### If you still get errors:

#### Error: "permission denied"
**Solution**: Make sure you're logged in as the project owner in Supabase

#### Error: "relation already exists"
**Solution**: This is fine! It means the table already exists. The script will just add missing columns.

#### Error: "constraint already exists"
**Solution**: This is also fine! The script handles this with `EXCEPTION WHEN duplicate_object`

#### After SQL runs but app still shows error:
**Solution**:
1. Go to Supabase Dashboard → Settings → API
2. Click **"Restart PostgREST"** (refreshes schema cache)
3. Hard refresh your app (Ctrl+Shift+R)

---

## 📝 What Changed in the SQL Script

### Before (❌ Would fail on existing tables):
```sql
CREATE TABLE workflows (
  ...
  category TEXT,  -- Would fail if table exists
  ...
)
```

### After (✅ Works with existing tables):
```sql
CREATE TABLE IF NOT EXISTS workflows (...)  -- Create if new

DO $$
BEGIN
  IF NOT EXISTS (SELECT ... WHERE column_name = 'category') THEN
    ALTER TABLE workflows ADD COLUMN category TEXT;  -- Add if missing
  END IF;
END $$;
```

---

## 🎉 That's It!

Once the SQL runs successfully, your automation system will be **fully operational** with:
- ✅ 18 industry-specific templates
- ✅ AI-powered analysis
- ✅ Real-time monitoring
- ✅ Comprehensive reporting
- ✅ Anomaly detection
- ✅ Smart recommendations

**Total time: ~2 minutes** ⏱️
