# 🔍 COMPLETE DEBUGGING PLAN - Lab-IQ
**Created**: December 7, 2025
**Status**: Ready to Execute

---

## 📋 IDENTIFIED ISSUES

### 1. **Missing Database Table: `notifications`**
**Error**: `Could not find the table 'public.notifications' in the schema cache`
**Location**: `NotificationBell.tsx:71`
**Impact**: HIGH - Notification system broken on all pages

### 2. **Missing Columns in `datasets` table**
**Error**: `column "preview_data" of relation "datasets" does not exist`
**Location**: Dataset upload and detail pages
**Impact**: HIGH - Dataset preview not working

### 3. **Duplicate RLS Policy**
**Error**: `policy "Users can view members of channels they belong to" for table "channel_members" already exists`
**Location**: SQL schema files
**Impact**: MEDIUM - SQL scripts fail on re-run

### 4. **Channel UI Not Visible**
**Error**: Subscription tier check blocking access
**Location**: `Collaboration.tsx:330`
**Impact**: MEDIUM - Can't test channel features

### 5. **Dataset Preview Empty**
**Error**: No data in `preview_data` field
**Location**: Existing datasets
**Impact**: HIGH - Can't view uploaded datasets

---

## 🎯 STEP-BY-STEP FIX PLAN

### **PHASE 1: Database Health Check** (5 minutes)

#### Step 1.1: Run Health Check
```bash
# File: DATABASE_HEALTH_CHECK.sql
```
**What it does**: Shows all tables, missing tables, RLS policies, and issues

**Expected output**:
- List of all existing tables
- List of missing tables (likely: `notifications`)
- Duplicate RLS policies
- Column status for `datasets` table

#### Step 1.2: Document Findings
Create a checklist:
- [ ] `notifications` table exists
- [ ] `datasets.preview_data` column exists
- [ ] `datasets.schema` column exists
- [ ] `channel_members` table exists
- [ ] No duplicate RLS policies

---

### **PHASE 2: Fix Missing Tables** (10 minutes)

#### Step 2.1: Create `notifications` Table
```sql
-- File: CREATE_NOTIFICATIONS_TABLE.sql (will create)
```

**Purpose**: Fix NotificationBell errors

#### Step 2.2: Add Missing Columns to `datasets`
```sql
-- File: ADD_PREVIEW_COLUMNS.sql (already created)
```

**Purpose**: Fix dataset preview

#### Step 2.3: Fix Duplicate Policies
```sql
-- DROP existing policies first, then recreate
```

---

### **PHASE 3: Fix Application Code** (15 minutes)

#### Step 3.1: Fix NotificationBell Component
**File**: `src/components/NotificationBell.tsx`
**Fix**: Add error handling for missing table

#### Step 3.2: Fix Dataset Upload Service
**File**: `src/lib/services/datasetService.ts`
**Fix**: Already done - saves `preview_data` and `schema`

#### Step 3.3: Fix Collaboration Page
**File**: `src/pages/Collaboration.tsx`
**Fix**: Already done - disabled subscription check

---

### **PHASE 4: Backfill Existing Data** (5 minutes)

#### Step 4.1: Add preview_data to existing datasets
```sql
-- File: FIX_EXISTING_DATASET.sql (already created)
```

---

### **PHASE 5: Testing** (10 minutes)

#### Test 1: Notifications
- [ ] No 404 errors in console
- [ ] NotificationBell loads without errors

#### Test 2: Datasets
- [ ] Upload new CSV file
- [ ] Check preview_data is saved
- [ ] View dataset detail page
- [ ] See data in "Data Preview" tab
- [ ] See columns in "Schema" tab

#### Test 3: Collaboration
- [ ] Navigate to Collaboration page
- [ ] Click "Chat" tab
- [ ] See channel sidebar
- [ ] Click "Create Channel"
- [ ] Create a new channel
- [ ] See it appear in sidebar

#### Test 4: All Pages
- [ ] Dashboard - no console errors
- [ ] Datasets - no console errors
- [ ] Upload - no console errors
- [ ] Collaboration - no console errors
- [ ] Analytics - no console errors

---

## 📊 COMPLETE TABLE REQUIREMENTS

### **Tables Used by App**

| Table Name | Status | Priority | Used By |
|-----------|---------|----------|---------|
| `datasets` | ✅ EXISTS | CRITICAL | Upload, Datasets, Dashboard |
| `dataset_columns` | ✅ EXISTS | HIGH | Dataset Detail |
| `dataset_rows` | ✅ EXISTS | HIGH | Dataset Detail |
| `dataset_quality` | ✅ EXISTS | MEDIUM | Dataset Detail |
| `notifications` | ❌ MISSING | HIGH | All pages (NotificationBell) |
| `team_members` | ✅ EXISTS | HIGH | Collaboration |
| `team_invitations` | ✅ EXISTS | MEDIUM | Collaboration |
| `chat_channels` | ✅ EXISTS | HIGH | Collaboration |
| `chat_messages` | ✅ EXISTS | HIGH | Collaboration |
| `chat_typing` | ✅ EXISTS | LOW | Collaboration |
| `chat_read_receipts` | ✅ EXISTS | LOW | Collaboration |
| `channel_members` | ❓ UNKNOWN | HIGH | Collaboration |
| `shared_projects` | ✅ EXISTS | MEDIUM | Collaboration |
| `project_members` | ✅ EXISTS | MEDIUM | Collaboration |
| `shared_files` | ✅ EXISTS | MEDIUM | Collaboration |
| `file_access_log` | ✅ EXISTS | LOW | Collaboration |
| `collaboration_activity` | ✅ EXISTS | LOW | Collaboration |
| `device_streams` | ✅ EXISTS | LOW | Upload |
| `activities` | ✅ EXISTS | LOW | Dashboard |
| `usage_stats` | ✅ EXISTS | LOW | Dashboard |

---

## 🔧 SQL FILES TO RUN (IN ORDER)

### 1. **DATABASE_HEALTH_CHECK.sql** (RUN FIRST)
**Purpose**: Identify what's missing
**Time**: 1 minute
**Action**: Run and review output

### 2. **CREATE_NOTIFICATIONS_TABLE.sql** (will create)
**Purpose**: Create missing notifications table
**Time**: 1 minute

### 3. **ADD_PREVIEW_COLUMNS.sql**
**Purpose**: Add preview_data and schema columns
**Time**: 1 minute

### 4. **FIX_DUPLICATE_POLICIES.sql** (will create)
**Purpose**: Drop and recreate duplicate RLS policies
**Time**: 2 minutes

### 5. **FIX_EXISTING_DATASET.sql**
**Purpose**: Backfill preview data for existing datasets
**Time**: 1 minute

---

## 🚨 CRITICAL FIXES NEEDED NOW

### Priority 1: Notifications Table
**Impact**: Every page shows errors
**Fix**: Create table with proper schema
**Time**: 5 minutes

### Priority 2: Dataset Preview
**Impact**: Can't view uploaded datasets
**Fix**: Add columns + backfill data
**Time**: 5 minutes

### Priority 3: Duplicate Policies
**Impact**: Can't re-run SQL scripts
**Fix**: Use DROP IF EXISTS before CREATE
**Time**: 3 minutes

---

## 📝 PAGE-BY-PAGE ERROR ANALYSIS

### **Dashboard Page**
**Current Errors**:
- ❌ Notifications 404 error
**Impact**: Minor visual issue, doesn't break page
**Fix Required**: Create notifications table

### **Datasets Page**
**Current Errors**:
- ❌ Notifications 404 error
- ❌ Dataset preview empty
**Impact**: Can't view dataset data
**Fix Required**: Add preview_data column + backfill

### **Dataset Detail Page**
**Current Errors**:
- ❌ Notifications 404 error
- ❌ "Dataset has no preview data" console message
- ❌ Empty preview tab
- ❌ Empty schema tab
**Impact**: Page unusable
**Fix Required**: Add preview_data column + backfill

### **Upload Page**
**Current Errors**:
- ❌ Notifications 404 error
**Impact**: Upload works, but no preview after
**Fix Required**: Already fixed in code (needs column in DB)

### **Collaboration Page**
**Current Errors**:
- ❌ Notifications 404 error
- ⚠️ Channel UI hidden behind subscription check
**Impact**: Can't test collaboration features
**Fix Required**: Already fixed in code

### **Analytics Page**
**Current Errors**:
- ❌ Notifications 404 error
**Impact**: Minor, page works
**Fix Required**: Create notifications table

---

## ✅ WHAT'S ALREADY FIXED (Code Level)

1. ✅ Dataset upload saves preview_data (datasetService.ts)
2. ✅ Dataset detail handles missing preview_data gracefully (DatasetDetail.tsx)
3. ✅ Collaboration page shows channel UI (Collaboration.tsx)
4. ✅ Channel creation dialog ready (ChannelDialog.tsx)
5. ✅ Channel sidebar ready (ChannelSidebar.tsx)
6. ✅ Channel service with full CRUD (channelService.ts)

---

## 🎯 IMMEDIATE ACTION ITEMS

### **RIGHT NOW** (Do these in order):

1. **Run DATABASE_HEALTH_CHECK.sql** in Supabase
   - Copy output and paste here
   - We'll see exactly what's missing

2. **I'll create the missing SQL files based on results**
   - CREATE_NOTIFICATIONS_TABLE.sql
   - FIX_DUPLICATE_POLICIES.sql

3. **Run all SQL fixes in order**
   - Add missing tables
   - Add missing columns
   - Fix duplicate policies
   - Backfill data

4. **Test each page**
   - Document what works
   - Document what's still broken

5. **Create final fix for any remaining issues**

---

## 📊 SUCCESS METRICS

When everything is fixed, you should see:

### Console (F12)
- ✅ No 404 errors
- ✅ No "table does not exist" errors
- ✅ No "column does not exist" errors
- ✅ No RLS policy errors

### UI
- ✅ NotificationBell loads without errors on all pages
- ✅ Dataset preview shows data
- ✅ Dataset schema shows columns
- ✅ Collaboration channel sidebar visible
- ✅ Can create channels
- ✅ Can switch between channels

### Database
- ✅ All required tables exist
- ✅ All required columns exist
- ✅ No duplicate RLS policies
- ✅ RLS enabled on all protected tables

---

## 🔄 NEXT STEPS

1. **Run DATABASE_HEALTH_CHECK.sql** and share the output
2. I'll analyze and create the exact SQL fixes needed
3. You run the SQL fixes in order
4. We test each page together
5. Document any remaining issues
6. Create final fixes
7. Commit everything when working

**Let's start with Step 1 - run DATABASE_HEALTH_CHECK.sql in Supabase and share what you see!** 🚀

---

**This is the systematic approach - no more guessing, no more frustration. We'll fix everything properly.** 💪
