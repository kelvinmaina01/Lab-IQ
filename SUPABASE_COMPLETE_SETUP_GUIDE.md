# 🔧 Supabase Complete Setup Guide - Step by Step

> **NO STEPS SKIPPED** - Follow exactly in this order
> **Time Required:** 15-20 minutes

---

## 📋 Pre-Requirements

- ✅ Supabase account created
- ✅ Project created (you have the URL: `https://engqgzznccvoqeiiuchn.supabase.co`)
- ✅ You are logged in to Supabase Dashboard

---

## PART 1: Storage Bucket Setup (5 minutes)

### Step 1.1: Navigate to Storage

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (`engqgzznccvoqeiiuchn`)
3. Click **"Storage"** in the left sidebar
4. You should see the Storage page

### Step 1.2: Create Datasets Bucket

1. Click the **"New bucket"** button (green button, top right)
2. Enter bucket details:
   - **Name:** `datasets`
   - **Public bucket:** ❌ **UNCHECK THIS** (keep it private)
   - **File size limit:** `50` MB
   - **Allowed MIME types:** Leave empty (or add: `text/csv,application/vnd.ms-excel`)
3. Click **"Create bucket"**
4. ✅ You should now see "datasets" in your buckets list

### Step 1.3: Set Bucket Policies

1. Click on the **"datasets"** bucket name
2. Click the **"Policies"** tab at the top
3. You'll see "No policies yet" - click **"New Policy"**

**Policy 1: Allow authenticated users to upload**
1. Click **"Create a new policy"**
2. Choose **"For full customization"** → Click **"Get started"**
3. Fill in:
   - **Policy name:** `Allow authenticated uploads`
   - **Allowed operation:** Check **INSERT**
   - **Policy definition:** Paste this:
   ```sql
   ((bucket_id = 'datasets'::text) AND (auth.role() = 'authenticated'::text))
   ```
4. Click **"Review"** → **"Save policy"**

**Policy 2: Allow users to read their own files**
1. Click **"New Policy"** again
2. Choose **"For full customization"** → **"Get started"**
3. Fill in:
   - **Policy name:** `Allow users to read own files`
   - **Allowed operation:** Check **SELECT**
   - **Policy definition:** Paste this:
   ```sql
   ((bucket_id = 'datasets'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
   ```
4. Click **"Review"** → **"Save policy"**

**Policy 3: Allow users to delete their own files**
1. Click **"New Policy"** again
2. **"For full customization"** → **"Get started"**
3. Fill in:
   - **Policy name:** `Allow users to delete own files`
   - **Allowed operation:** Check **DELETE**
   - **Policy definition:** Paste this:
   ```sql
   ((bucket_id = 'datasets'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
   ```
4. Click **"Review"** → **"Save policy"**

✅ **Checkpoint:** You should now have 3 policies for the datasets bucket

---

## PART 2: Database Setup (10 minutes)

### Step 2.1: Navigate to SQL Editor

1. Click **"SQL Editor"** in the left sidebar
2. You'll see the SQL Editor with a text area

### Step 2.2: Run FIX_EXPERIMENTS_TABLE.sql

1. Open the file: `FIX_EXPERIMENTS_TABLE.sql`
2. Copy ALL the contents
3. Paste into Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)
5. ✅ You should see: "Success. No rows returned"

**What this does:**
- Adds `auto_created` column to experiments table
- Adds `dataset_id` column to experiments table
- Creates indexes

### Step 2.3: Run CREATE_DEVICE_STREAM_DATA_TABLE.sql

1. Click **"New query"** (+ button, top left)
2. Open the file: `CREATE_DEVICE_STREAM_DATA_TABLE.sql`
3. Copy ALL the contents
4. Paste into SQL Editor
5. Click **"Run"**
6. ✅ You should see: "Success. No rows returned"

**What this does:**
- Creates `device_stream_data` table
- Creates indexes for performance
- Sets up RLS policies
- Creates trigger for auto-updating counters

### Step 2.4: Run DEVICE_DATA_PROCESSING_PIPELINE.sql

**IMPORTANT:** This is the BIG one - 500+ lines

1. Click **"New query"**
2. Open the file: `DEVICE_DATA_PROCESSING_PIPELINE.sql`
3. Copy **ALL** the contents (scroll to the bottom to make sure you got everything)
4. Paste into SQL Editor
5. Click **"Run"**
6. ⏳ Wait 5-10 seconds (this creates many functions)
7. ✅ You should see: "Success. No rows returned"

**What this does:**
- Creates 10 major SQL functions:
  - `auto_create_dataset_from_stream()` - Auto-creates datasets
  - `auto_create_experiment_from_device()` - Auto-creates experiments
  - `aggregate_device_data()` - Aggregates data for charts
  - `export_device_data_as_csv()` - Exports to CSV
  - `prepare_ml_training_data()` - Prepares ML data
  - `trigger_workflow_from_device_data()` - Triggers workflows
  - `get_device_context_for_ai()` - AI context function
  - `validate_device_data()` - Data validation
  - Plus helper views and indexes
- Sets up all triggers
- Creates views for easy querying

### Step 2.5: Verify Database Setup

Run this verification query:

```sql
-- Check if all functions were created
SELECT
  proname as function_name,
  pg_get_functiondef(oid) as definition_length
FROM pg_proc
WHERE proname LIKE '%device%'
ORDER BY proname;
```

✅ You should see at least 8-10 functions with "device" in the name

---

## PART 3: Enable Realtime (CRITICAL - 3 minutes)

### Step 3.1: Navigate to Database Replication

1. Click **"Database"** in the left sidebar
2. Click **"Replication"** in the sub-menu (you'll see it below "Database")
3. You'll see a list of tables

### Step 3.2: Find device_stream_data Table

1. Scroll down or use Ctrl+F to search for `device_stream_data`
2. You'll see a table row with:
   - Table name: `public.device_stream_data`
   - A toggle switch on the right

### Step 3.3: Enable Replication

1. Click the **toggle switch** next to `device_stream_data`
2. It should turn **green/blue** (enabled)
3. A popup may appear saying "Replication enabled" - click OK

**Visual confirmation:**
- ✅ Toggle is ON (colored, not gray)
- ✅ Status shows "Enabled" or similar

### Step 3.4: (Optional but Recommended) Enable for Other Tables

While you're here, also enable replication for:
- `device_streams` - Toggle ON
- `datasets` - Toggle ON
- `experiments` - Toggle ON
- `workflow_executions` - Toggle ON

This enables real-time updates across the platform.

---

## PART 4: Verify Everything Works (5 minutes)

### Test 1: Check Storage Bucket

1. Go to **Storage** → **datasets**
2. Try to upload a test file:
   - Click **"Upload file"**
   - Select any CSV file
   - Path: `test/test.csv`
   - Click **"Upload"**
3. ✅ File should upload successfully

### Test 2: Check Database Functions

Run this test query:

```sql
-- Test the AI context function (should return JSON)
SELECT get_device_context_for_ai(auth.uid(), 10);
```

✅ You should see a JSON result (even if empty for now)

### Test 3: Check Realtime

Run this to verify realtime is active:

```sql
-- Check which tables have realtime enabled
SELECT
  schemaname,
  tablename,
  rulename
FROM pg_rules
WHERE rulename LIKE '%realtime%'
  AND tablename IN ('device_stream_data', 'device_streams');
```

✅ You should see entries for device_stream_data

---

## PART 5: Test in Application (Final Verification)

### Test 5.1: Demo Pipeline

1. Go to your app: http://localhost:8083 (or your deployed URL)
2. Navigate to **Upload** page
3. Click **"Run Demo Pipeline"**
4. ✅ Should succeed now (no bucket error)
5. ✅ Dataset should appear in Datasets page

### Test 5.2: Device Stream

1. Go to **Upload** → **Live Devices** tab
2. Click **"Connect Device"**
3. Enter:
   - Name: "Test Device"
   - Type: MQTT Broker
4. Click **"Create Stream"**
5. ✅ Stream should be created
6. Click on the stream
7. ✅ Should see credentials tab

### Test 5.3: Real-time Updates

1. Keep the device stream detail page open
2. Go to Supabase SQL Editor
3. Run this query (replace with your stream ID):

```sql
INSERT INTO device_stream_data (stream_id, payload)
VALUES (
  'YOUR-STREAM-ID-HERE',
  '{"temperature": 25.5, "humidity": 60, "pressure": 1013}'::jsonb
);
```

4. ✅ Watch the UI - data should appear **instantly** (within 1 second)
5. ✅ Status should turn green
6. ✅ "Live Data" tab should show the new data point

---

## 🎯 Summary Checklist

After completing all steps, verify:

- [ ] Storage bucket "datasets" exists and is private
- [ ] Storage has 3 policies (upload, read, delete)
- [ ] FIX_EXPERIMENTS_TABLE.sql ran successfully
- [ ] CREATE_DEVICE_STREAM_DATA_TABLE.sql ran successfully
- [ ] DEVICE_DATA_PROCESSING_PIPELINE.sql ran successfully (all 500+ lines)
- [ ] At least 8 database functions exist with "device" in name
- [ ] Realtime is enabled for `device_stream_data` table
- [ ] Demo pipeline works (no bucket error)
- [ ] Can create device streams
- [ ] Real-time updates work (data appears instantly)

---

## 🔍 Troubleshooting

### Issue: "Bucket not found" error

**Solution:**
1. Go to Storage → Check if "datasets" bucket exists
2. If not, create it manually (see Part 1.2)
3. Verify policies are set (see Part 1.3)
4. Check if you're authenticated in the app

### Issue: "Function does not exist" error

**Solution:**
1. Go to SQL Editor
2. Run verification query:
```sql
SELECT proname FROM pg_proc WHERE proname LIKE '%device%';
```
3. If empty, re-run DEVICE_DATA_PROCESSING_PIPELINE.sql
4. Make sure you copied the ENTIRE file (scroll to bottom)

### Issue: Real-time not working

**Solution:**
1. Go to Database → Replication
2. Verify `device_stream_data` toggle is ON (colored, not gray)
3. Try disabling and re-enabling
4. Check browser console for WebSocket errors
5. Verify you're using the correct Supabase URL in .env

### Issue: "Permission denied" when uploading

**Solution:**
1. Go to Storage → datasets → Policies
2. Verify you have the 3 policies created
3. Check the policy SQL matches exactly
4. Try logging out and back in
5. Check if auth.uid() is returning a value:
```sql
SELECT auth.uid();
```

### Issue: SQL functions not working

**Solution:**
1. Check function exists:
```sql
SELECT * FROM pg_proc WHERE proname = 'get_device_context_for_ai';
```
2. If missing, re-run DEVICE_DATA_PROCESSING_PIPELINE.sql
3. Check for syntax errors in Supabase SQL Editor logs
4. Try running functions one by one to find which failed

---

## 📞 Support

If you're still stuck after following this guide:

1. Check Supabase logs:
   - Go to **Settings** → **Logs**
   - Check for errors in the last 24 hours

2. Verify .env file has correct values:
```env
VITE_SUPABASE_URL=https://engqgzznccvoqeiiuchn.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

3. Clear browser cache and reload

4. Check network tab in browser DevTools for failed requests

---

## ✅ Success!

If all checkboxes are marked, you've successfully:
- ✅ Set up Supabase Storage with proper security
- ✅ Created all database tables and functions
- ✅ Enabled real-time subscriptions
- ✅ Verified everything works end-to-end

**Your Lab-IQ device integration is now fully operational!** 🚀
