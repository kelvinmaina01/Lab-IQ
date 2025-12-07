# 🔧 Database Fix Instructions - Lab-IQ

## ⚡ Quick Fix (5 Minutes Total)

Follow these steps **IN ORDER**:
1

### **Step 1: Run Master Setup** (3 minutes)

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Click **"+ New query"**
4. Open file: **`MASTER_DATABASE_SETUP.sql`**
5. Copy **ALL** content
6. Paste into SQL Editor
7. Click **"RUN"** (or Ctrl+Enter)
8. Wait for completion (~30 seconds)

**Expected Output**:
```
✅ LAB-IQ DATABASE SETUP COMPLETE!
📊 Summary:
  - Core tables: 5
  - RLS policies: 20+
  - Indexes: 15+

✅ Created/Updated:
  - notifications table
  - datasets.preview_data column
  - datasets.schema column
  - All RLS policies (no duplicates)
  - Performance indexes
  - Realtime replication
```

---

### **Step 2: Backfill Existing Data** (1 minute)

1. Stay in **SQL Editor**
2. Click **"+ New query"**
3. Open file: **`BACKFILL_DATASET_PREVIEWS.sql`**
4. Copy **ALL** content
5. Paste into SQL Editor
6. Click **"RUN"**
7. Wait for completion (~10 seconds)

**Expected Output**:
```
📊 Backfill Complete!
Datasets fixed: 1
Datasets skipped: 0

✅ Success! 1 dataset(s) now have preview data
```

---

### **Step 3: Verify** (1 minute)

Run this quick check:
```sql
-- Check notifications table
SELECT COUNT(*) as notification_count FROM notifications;

-- Check datasets have preview_data
SELECT
  id,
  name,
  CASE
    WHEN preview_data IS NOT NULL THEN '✅ Has preview'
    ELSE '❌ Missing'
  END as preview_status
FROM datasets
WHERE status = 'ready'
LIMIT 5;
```

**Expected Output**:
- Notifications table returns 0 (no errors)
- All datasets show "✅ Has preview"

---

## ✅ **What This Fixes**

### Before:
- ❌ Notifications 404 errors on every page
- ❌ Dataset preview empty
- ❌ "Dataset has no preview data" console errors
- ❌ Duplicate RLS policy errors
- ❌ SQL scripts fail on re-run

### After:
- ✅ No 404 errors
- ✅ Dataset preview shows data
- ✅ Clean console (no errors)
- ✅ No policy conflicts
- ✅ SQL scripts are idempotent (safe to re-run)

---

## 🧪 **Test After Running**

### 1. **Test Notifications**
- Open any page in Lab-IQ
- Press F12 (console)
- Should see: **NO** 404 errors for notifications

### 2. **Test Dataset Preview**
- Go to: http://localhost:8083/dashboard/datasets/[your-dataset-id]
- Click "Data Preview" tab
- Should see: **Data table with rows**
- Click "Schema & Stats" tab
- Should see: **Column cards with types**

### 3. **Test Collaboration**
- Go to: http://localhost:8083/collaboration
- Click "Chat" tab
- Should see: **Channel sidebar with "Create Channel" button**
- Click "Create Channel"
- Create a test channel
- Should see: **Channel appears in sidebar**

### 4. **Test Console**
- Open F12 on any page
- Should see: **ZERO red errors**
- Should see: **NO "table does not exist" messages**

---

## 🚨 **If Something Goes Wrong**

### Error: "relation already exists"
**Meaning**: Table already created
**Action**: Safe to ignore - script is idempotent

### Error: "policy already exists"
**Meaning**: Old script left duplicate
**Solution**: The master script drops duplicates first - run it again

### Error: "permission denied"
**Meaning**: Not using Supabase Dashboard
**Solution**: Make sure you're in **SQL Editor** in Supabase Dashboard

### No data in backfill
**Meaning**: dataset_rows table is empty
**Solution**: Re-upload the dataset (new uploads will work)

---

## 📊 **What Changed in Database**
1
- `datasets.preview_data` - First 100 rows (JSONB)
- `datasets.schema` - Column definitions (JSONB)

### Fixed Policies:
- All RLS policies recreated (no duplicates)
- User-scoped security on all tables
- Proper access control

### New Indexes:
- Performance indexes on all lookups
- GIN indexes on JSONB columns

### Enabled Realtime:
- chat_messages
- chat_channels
- team_members
- notifications
- chat_typing

---

## 🎯 **Success Checklist**

Run through this after executing both SQL files:

- [ ] MASTER_DATABASE_SETUP.sql ran successfully
- [ ] Saw "✅ LAB-IQ DATABASE SETUP COMPLETE!"
- [ ] BACKFILL_DATASET_PREVIEWS.sql ran successfully
- [ ] Saw "Datasets fixed: X"
- [ ] Refreshed Lab-IQ app
- [ ] No 404 errors in console (F12)
- [ ] Dataset preview shows data
- [ ] Collaboration channel sidebar visible
- [ ] Can create new channels
- [ ] No more frustration! 🎉

---

## 💡 **Pro Tips**

1. **Always use Supabase Dashboard SQL Editor** - Don't use client libraries for schema changes

2. **Scripts are idempotent** - Safe to run multiple times if needed

3. **Check console after each test** - Press F12 to see real-time errors

4. **New uploads work automatically** - The code already saves preview_data

5. **Existing datasets are backfilled** - Old data now has previews

---

## 📞 **Need Help?**

If you see ANY errors after running both scripts:

1. Copy the EXACT error message
2. Note which SQL file it came from
3. Share with Claude
4. We'll fix it immediately

**Let's do this right! 💪**

---

## ⏱️ **Time Estimate**

- Step 1 (Master Setup): 3 minutes
- Step 2 (Backfill): 1 minute
- Step 3 (Verify): 1 minute
- **Total**: 5 minutes

**Ready? Start with MASTER_DATABASE_SETUP.sql!** 🚀
