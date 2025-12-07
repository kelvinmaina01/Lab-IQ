# 🔧 Workflows Setup Guide

## Issues Fixed:

### ✅ Issue 1: Missing Database Tables
**Error**: `Could not find the table 'public.workflows' in the schema cache`

**Solution**: Run the SQL script to create the required tables

### ✅ Issue 2: Accessibility Warning
**Warning**: `Missing Description or aria-describedby for DialogContent`

**Solution**: Added DialogDescription to the Create Workflow dialog

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Database Tables

1. **Go to Supabase Dashboard**
   - Open your project: https://supabase.com/dashboard
   - Navigate to: **SQL Editor** (left sidebar)

2. **Run the Setup Script**
   - Click **"New Query"**
   - Copy and paste the contents of `DATABASE_WORKFLOWS_SETUP.sql`
   - Click **"Run"** or press `Ctrl+Enter`

3. **Verify Success**
   You should see:
   ```
   Success. No rows returned
   ```

4. **Check Tables Created**
   Go to **Table Editor** → You should see:
   - ✅ `workflows` table
   - ✅ `workflow_executions` table

### Step 2: Verify RLS Policies

1. In Table Editor, click on `workflows` table
2. Click **"RLS Policies"** tab
3. You should see 4 policies:
   - ✅ Users can view their own workflows
   - ✅ Users can insert their own workflows
   - ✅ Users can update their own workflows
   - ✅ Users can delete their own workflows

4. Click on `workflow_executions` table
5. You should see 3 policies:
   - ✅ Users can view executions of their workflows
   - ✅ Users can insert executions of their workflows
   - ✅ Users can update executions of their workflows

### Step 3: Test the Automation Page

1. **Refresh your Lab-IQ app** (http://localhost:8083)
2. Navigate to **Automation** page
3. Click **"Templates"** button
4. Select a template (e.g., "Auto-ML Pipeline")
5. You should see:
   - ✅ Workflow created successfully
   - ✅ Appears in workflows list
   - ✅ No more 404 errors

### Step 4: Test Workflow Execution

1. Click three-dot menu on a workflow
2. Click **"Run Now"**
3. You should see:
   - ✅ "Workflow Executed" toast notification
   - ✅ Stats update (Total Runs +1)
   - ✅ Last run time updates

---

## 📋 What Was Created

### Database Tables:

#### **workflows** table
```sql
Columns:
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- name (TEXT, Required)
- description (TEXT, Optional)
- trigger_type (TEXT, Required: dataset_upload, manual, schedule, threshold, event)
- trigger_config (JSONB, Default: {})
- steps (JSONB, Required: array of step objects)
- status (TEXT, Default: 'active': active, paused, disabled)
- success_count (INTEGER, Default: 0)
- failure_count (INTEGER, Default: 0)
- last_run_at (TIMESTAMPTZ, Nullable)
- created_at (TIMESTAMPTZ, Default: NOW())
- updated_at (TIMESTAMPTZ, Default: NOW(), Auto-updated)
```

#### **workflow_executions** table
```sql
Columns:
- id (UUID, Primary Key)
- workflow_id (UUID, Foreign Key to workflows)
- status (TEXT, Required: running, success, failed)
- started_at (TIMESTAMPTZ, Default: NOW())
- completed_at (TIMESTAMPTZ, Nullable)
- duration_ms (INTEGER, Nullable)
- logs (JSONB, Default: [])
- result (JSONB, Nullable)
- error (TEXT, Nullable)
```

### Indexes (for performance):
- `idx_workflows_user_id` - Fast user workflow lookups
- `idx_workflows_status` - Filter by active/paused
- `idx_workflows_trigger_type` - Filter by trigger type
- `idx_workflow_executions_workflow_id` - Fast execution history
- `idx_workflow_executions_status` - Filter by execution status

### Security (RLS Policies):
- ✅ Users can only see their own workflows
- ✅ Users can only create workflows for themselves
- ✅ Users can only modify/delete their own workflows
- ✅ Users can only see executions of their own workflows

---

## ✅ Verification Checklist

After running the setup:

- [ ] Tables created (`workflows`, `workflow_executions`)
- [ ] Indexes created (5 indexes)
- [ ] RLS enabled on both tables
- [ ] Policies created (7 total)
- [ ] Auto-update trigger created for `updated_at`
- [ ] No more 404 errors when loading Automation page
- [ ] Can create workflows from templates
- [ ] Can create custom workflows
- [ ] Can execute workflows manually
- [ ] Statistics update correctly
- [ ] DialogDescription warning fixed

---

## 🐛 Troubleshooting

### Issue: Still getting 404 error after running SQL

**Solution 1**: Refresh Schema Cache
```sql
NOTIFY pgrst, 'reload schema';
```

**Solution 2**: Restart PostgREST in Supabase
- Go to Supabase Dashboard
- Settings → API
- Click "Restart PostgREST"

### Issue: RLS policies not working

**Check if RLS is enabled**:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('workflows', 'workflow_executions');
```

Both should show `rowsecurity = true`

### Issue: Can't insert workflows

**Check your user is authenticated**:
- Make sure you're logged in
- Check browser console for auth errors
- Verify JWT token is valid

---

## 📊 Sample Workflow Data (Optional)

Want to seed some sample workflows for testing?

```sql
-- Insert sample workflow (replace YOUR_USER_ID)
INSERT INTO public.workflows (
  user_id,
  name,
  description,
  trigger_type,
  steps,
  status
) VALUES (
  'YOUR_USER_ID', -- Get from auth.users table
  'Sample Auto-ML Pipeline',
  'Automatically train models when data is uploaded',
  'dataset_upload',
  '[
    {"type": "quality_check", "config": {"threshold": 80}},
    {"type": "train_model", "config": {"auto_detect": true}},
    {"type": "notify", "config": {"recipients": []}}
  ]'::jsonb,
  'active'
);
```

To get your user ID:
```sql
SELECT id, email FROM auth.users;
```

---

## 🎉 Success!

Your Automation/Workflow system is now fully operational!

**Next Steps**:
1. Create your first workflow from a template
2. Run it manually to test
3. Check execution history
4. Monitor statistics

**Estimated Time Savings**:
- Auto-ML Pipeline: ~10 min per dataset
- Quality Checks: ~5 min per dataset
- Weekly Reports: ~30 min per week

---

## 📝 Code Changes Made

### Files Modified:
1. `src/pages/Automation.tsx`
   - Added DialogDescription to fix accessibility warning

### Files Created:
1. `DATABASE_WORKFLOWS_SETUP.sql`
   - Complete database setup script
2. `WORKFLOWS_SETUP_GUIDE.md`
   - This setup guide

---

**Ready to automate! 🚀**
