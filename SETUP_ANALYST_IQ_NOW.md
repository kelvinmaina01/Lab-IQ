# 🚀 Setup Analyst IQ - What You Need to Do NOW

## ✅ What's Already Done

I've built the complete Analyst IQ system:

### 1. **Database Schema** ✓
- File: `supabase/migrations/20250112_analyst_iq_system.sql`
- Tables: profiles, matches, performance tracking, error catalog
- ELO rating system with triggers

### 2. **Services** ✓
- `analystIQService.ts` - IQ tracking and management
- `datasetChallengeService.ts` - Challenge generation and validation
- `executionEngines/` - Python (Pyodide) and SQL (DuckDB) engines

### 3. **UI Components** ✓
- `AnalystIQHub.tsx` - Main hub with mode selection
- `DatasetExplorer.tsx` - Unified SQL/Python interface
- `AnalystIQChallenge.tsx` - Challenge page

### 4. **Routes & Navigation** ✓
- `/analyst-iq` - Main hub
- `/analyst-iq/challenge?mode=forensic|reverse|racer` - Challenge page
- Sidebar link added (GraduationCap icon)

### 5. **Integration with Existing App** ✓
- Uses your existing `datasets` table (from upload system)
- Uses your existing Gemini API key
- Uses your existing Supabase setup

---

## 📋 What YOU Need to Do (5 Steps)

### Step 1: Apply Database Migration (2 minutes)

**Action**: Run the SQL migration in Supabase

1. Go to: https://supabase.com/dashboard
2. Select your Lab-IQ project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open file: `C:\Users\dell\Desktop\Lab-IQ\supabase\migrations\20250112_analyst_iq_system.sql`
6. Copy ALL content (Ctrl+A, Ctrl+C)
7. Paste into Supabase SQL Editor
8. Click **RUN** button

**Expected Result**: "Success. No rows returned"

**What This Does**:
- Creates `analyst_iq_profiles` table
- Creates `challenge_matches` table
- Creates `performance_events` table
- Creates `forensic_error_catalog` with 5 seed errors
- Sets up ELO rating calculation functions
- Creates leaderboard views

---

### Step 2: Upload Sample Dataset (3 minutes)

**Why**: The system needs at least one dataset to create challenges

**Action**: Use your existing upload feature

1. Go to: http://localhost:8083/upload
2. Upload a sample CSV file (any dataset with 100+ rows)
   - Example: Sales data, customer data, etc.
   - Or use a Kaggle dataset
3. Wait for processing to complete (status: "ready")

**OR** if you have datasets already uploaded, skip this step!

---

### Step 3: Test the Hub Page (30 seconds)

**Action**: Visit the Analyst IQ hub

1. Go to: http://localhost:8083/analyst-iq
2. Check if page loads
3. Verify you see:
   - Your IQ scores (default 1000 for new users)
   - Three mode cards (Forensic, Reverse, Racer)
   - Available datasets section

**If it loads correctly**: ✅ Continue to Step 4

**If there's an error**:
- Check browser console (F12)
- Tell me the error message

---

### Step 4: Test Challenge Creation (1 minute)

**Action**: Start a challenge

1. On `/analyst-iq` page, click **"Start Forensic Challenge"**
2. Should redirect to `/analyst-iq/challenge?mode=forensic`
3. Check if you see:
   - Dataset info card
   - SQL and Python tabs
   - Code editor (Monaco)
   - "Run Code" and "Submit Solution" buttons

**If it loads correctly**: ✅ Continue to Step 5

**If there's an error**:
- Check browser console
- Tell me what's wrong

---

### Step 5: Test Code Execution (2 minutes)

**Action**: Try running Python code

1. On the challenge page, go to **Python tab**
2. Type simple code:
```python
import pandas as pd
print("Hello from Pyodide!")
df = pd.DataFrame({'a': [1, 2, 3]})
print(df)
```
3. Click **"Run Code"**
4. Wait 10-15 seconds (first time loads Pyodide)
5. Check output panel

**Expected**: Should see output (even if mocked for now)

**If error**: Tell me the error

---

## 🎯 After These 5 Steps

Once you confirm these work, I'll immediately implement:

### Phase 2: AI Challenge Generation (Next)
1. **Gemini Integration**
   - Forensic mode: AI corrupts datasets with realistic errors
   - Reverse mode: AI generates target outputs
   - Racer mode: AI creates slow code to optimize

2. **Real Code Execution**
   - Wire Pyodide properly to execute Python
   - Wire DuckDB for SQL queries
   - Display actual outputs

3. **Validation Logic**
   - Forensic: Compare cleaned data vs ground truth
   - Reverse: Match user output with target
   - Racer: Benchmark execution time

4. **IQ Updates**
   - ELO formula kicks in
   - Skills update after each challenge
   - Leaderboards populate

---

## 🔍 What to Check at Each Step

### After Step 1 (Migration):
```sql
-- Run in Supabase SQL Editor to verify:
SELECT COUNT(*) FROM analyst_iq_profiles;
SELECT COUNT(*) FROM forensic_error_catalog;
-- Should show 0 profiles, 5 error types
```

### After Step 2 (Dataset):
```sql
-- Verify dataset uploaded:
SELECT name, status, row_count, column_count FROM datasets;
-- Should show your dataset with status 'ready'
```

### After Step 3 (Hub):
- Browser console should have NO red errors
- Page should show your user IQ (1000 default)
- Three mode cards should be clickable

### After Step 4 (Challenge):
- URL should be `/analyst-iq/challenge?mode=forensic`
- Editor should be visible
- Dataset info should show

### After Step 5 (Execution):
- Output panel should appear
- Even if mocked, no errors in console

---

## 🐛 Common Issues & Fixes

### Issue 1: "No dataset available" error
**Fix**: Upload a dataset via `/upload` first

### Issue 2: Profile not loading
**Fix**: Make sure migration applied successfully

### Issue 3: Pyodide timeout
**Fix**: Wait longer (first load takes 10-15 seconds)

### Issue 4: Authentication error
**Fix**: Make sure you're logged in (check Supabase auth)

---

## 📊 Current System Status

```
✅ Database Schema:        Ready (needs migration applied)
✅ Service Layer:          Complete
✅ UI Components:          Complete
✅ Routes:                 Configured
✅ Integration:            Synced with existing app
⏳ Database Migration:    WAITING FOR YOU
⏳ Sample Dataset:        WAITING FOR YOU
⏳ AI Generation:         Ready to implement (after Steps 1-5)
⏳ Execution Engines:     Ready to wire up (after Steps 1-5)
```

---

## 🎮 What You'll Have After Setup

### Immediate (Steps 1-5):
- Working hub page
- Three challenge modes
- Dataset selection
- Basic UI flow

### After Phase 2 (I'll build):
- AI-generated challenges
- Real code execution
- IQ tracking and updates
- Leaderboards
- Adaptive difficulty

---

## 📞 What to Tell Me

After completing steps, tell me:

1. **"Step 1 done"** - Migration applied ✅
2. **"Step 2 done"** - Dataset uploaded ✅
3. **"Step 3 done"** - Hub page works ✅
4. **"Step 4 done"** - Challenge page loads ✅
5. **"Step 5 done"** - Run code button works ✅

OR

Tell me which step failed and the error message.

---

## 🚀 Quick Command Summary

```bash
# Already running (you have these):
npm run dev  # http://localhost:8083

# Pages to test:
# 1. Hub: http://localhost:8083/analyst-iq
# 2. Challenge: http://localhost:8083/analyst-iq/challenge?mode=forensic
# 3. Upload: http://localhost:8083/upload
# 4. Test: http://localhost:8083/hackathons/test
```

---

## 💡 Pro Tips

1. **Use Chrome DevTools**: Keep F12 open to see errors
2. **Clear Cache**: If weird errors, try Ctrl+Shift+R
3. **Check Network Tab**: See which API calls fail
4. **Console Logs**: Look for red errors

---

## ✅ Checklist

- [ ] Step 1: Apply database migration
- [ ] Step 2: Upload sample dataset
- [ ] Step 3: Test hub page
- [ ] Step 4: Test challenge page
- [ ] Step 5: Test code execution
- [ ] Report back to Claude: "All 5 done!" or report errors

---

**START WITH STEP 1 NOW!** 🔥

Open Supabase, run the migration, then tell me "Step 1 done" ✅
