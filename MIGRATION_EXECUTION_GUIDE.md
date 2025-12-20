## 🎯 STEP-BY-STEP MIGRATION EXECUTION GUIDE

**IMPORTANT:** Run these scripts IN ORDER!

---

## ✅ STEP 1: CHECK WHAT YOU ALREADY HAVE (5 minutes)

### 1.1 Run Diagnostic Script
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of: **`CHECK_EXISTING_SCHEMA.sql`**
3. Paste and click **Run**
4. Review the output - it will show you:
   - ✓ Which tables already exist
   - ✓ Which columns exist in key tables
   - ✓ Current RLS policies
   - ✓ Storage buckets
   - ✓ Your user ID
   - ✓ Existing data counts

### 1.2 What to Look For:
Check if these CRITICAL tables exist:
- [ ] `labs` table - **PROBABLY MISSING** (required!)
- [ ] `team_members` table - Should exist
- [ ] `chat_channels` table - Should exist
- [ ] `channel_members` table - **MIGHT BE MISSING** (required!)
- [ ] `direct_messages` table - **PROBABLY MISSING** (required!)
- [ ] `typing_indicators` table - Might be missing
- [ ] `shared_canvases` table - Might be missing
- [ ] `shared_lists` table - Might be missing

**Save this output** - you'll need it to verify the migration worked!

---

## ✅ STEP 2: RUN INCREMENTAL MIGRATION (10 minutes)

### 2.1 Execute Migration
1. Stay in Supabase SQL Editor
2. Copy entire contents of: **`INCREMENTAL_MIGRATION_SAFE.sql`**
3. Paste and click **Run**
4. Wait for completion (should take 30-60 seconds)

### 2.2 Expected Output:
You should see messages like:
```
✓ Added status_message to team_members
✓ Added status_emoji to team_members
✓ Added timezone to team_members
✓ Added is_private to chat_channels
✓ Added is_archived to chat_channels
✓✓✓ INCREMENTAL MIGRATION COMPLETE ✓✓✓
```

### 2.3 Verification:
Run this quick check:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('labs', 'channel_members', 'direct_messages', 'typing_indicators')
ORDER BY table_name;
```

You should see all 4 tables!

---

## ✅ STEP 3: CREATE STORAGE BUCKETS (5 minutes)

### Option A: Via Dashboard (RECOMMENDED)
1. Go to **Storage** in Supabase Dashboard
2. Click **New bucket**
3. Create these buckets:

**Bucket 1: collaboration-files**
- Name: `collaboration-files`
- Public: ☐ NO (private)
- File size limit: `50 MB`
- Click **Create**

**Bucket 2: collaboration-avatars** (Optional but recommended)
- Name: `collaboration-avatars`
- Public: ☑ YES
- File size limit: `5 MB`
- Click **Create**

**Bucket 3: collaboration-canvases** (Optional)
- Name: `collaboration-canvases`
- Public: ☐ NO
- File size limit: `10 MB`
- Click **Create**

### Option B: Via SQL (Alternative)
1. In SQL Editor, copy: **`CREATE_STORAGE_BUCKETS.sql`**
2. Paste and click **Run**
3. Check Dashboard → Storage to verify buckets were created

---

## ✅ STEP 4: BOOTSTRAP YOUR USER ACCOUNT (2 minutes)

### 4.1 Get Your User ID
Run this first:
```sql
SELECT auth.uid() as your_user_id;
```
**Copy this UUID** - you'll need it!

### 4.2 Run Bootstrap Script
1. In SQL Editor, copy: **`SETUP_COLLABORATION.sql`**
2. Paste and click **Run**
3. This will:
   - ✓ Create default lab
   - ✓ Add you as admin to the lab
   - ✓ Create 3 default channels (general, announcements, random)

### 4.3 Verification:
Run this to verify:
```sql
SELECT
  (SELECT COUNT(*) FROM labs) as labs_count,
  (SELECT COUNT(*) FROM team_members WHERE user_id = auth.uid()) as your_memberships,
  (SELECT COUNT(*) FROM chat_channels) as channels_count;
```

Expected results:
- `labs_count`: 1
- `your_memberships`: 1
- `channels_count`: 3 or more

---

## ✅ STEP 5: FINAL VERIFICATION (3 minutes)

### 5.1 Complete Data Check
Run this comprehensive check:
```sql
-- Check all critical tables
SELECT 'TABLES' as type, COUNT(*) as count FROM information_schema.tables
WHERE table_name IN (
  'labs', 'team_members', 'chat_channels', 'channel_members',
  'chat_messages', 'direct_messages', 'typing_indicators',
  'shared_canvases', 'shared_lists', 'notifications'
);

-- Check your access
SELECT 'YOUR ACCESS' as type,
  (SELECT name FROM labs l JOIN team_members tm ON l.id = tm.lab_id WHERE tm.user_id = auth.uid() LIMIT 1) as lab_name,
  (SELECT role FROM team_members WHERE user_id = auth.uid() LIMIT 1) as your_role,
  (SELECT COUNT(*) FROM chat_channels WHERE lab_id IN (SELECT lab_id FROM team_members WHERE user_id = auth.uid())) as accessible_channels;

-- Check storage buckets
SELECT 'STORAGE' as type, name, public FROM storage.buckets WHERE name LIKE 'collaboration%';
```

### 5.2 Expected Results:
- ✓ All 10 tables exist
- ✓ Lab name: "Default Lab"
- ✓ Your role: "admin"
- ✓ Accessible channels: 3 or more
- ✓ Storage buckets: 2-3 buckets

---

## ✅ STEP 6: TEST THE APPLICATION (2 minutes)

### 6.1 Start Dev Server
```bash
npm run dev
```

### 6.2 Navigate to Collaboration
Go to: `http://localhost:5173/collaboration`

### 6.3 What You Should See:
- ✅ **NO 406 errors!**
- ✅ Default lab loaded
- ✅ 3 channels visible (general, announcements, random)
- ✅ Team members section (you should see yourself)
- ✅ Direct messages section
- ✅ Can click channels and see empty message area
- ✅ Can type in message box
- ✅ Can send a test message

### 6.4 Test Checklist:
- [ ] Send message in #general channel
- [ ] Add reaction to your message
- [ ] Try to upload a file
- [ ] Check direct messages section
- [ ] Look at your avatar/profile
- [ ] Create a new channel
- [ ] Check console - no errors

---

## 🚨 TROUBLESHOOTING

### Issue: "relation labs does not exist"
**Cause:** Migration didn't run or failed
**Fix:** Re-run `INCREMENTAL_MIGRATION_SAFE.sql`

### Issue: Still getting 406 on team_members
**Cause:** You're not added to the lab
**Fix:** Re-run `SETUP_COLLABORATION.sql`

### Issue: Can't see channels
**Cause:** RLS policies blocking access
**Fix:** Verify you're in team_members:
```sql
SELECT * FROM team_members WHERE user_id = auth.uid();
```
If empty, run `SETUP_COLLABORATION.sql` again

### Issue: Can't upload files
**Cause:** Storage buckets don't exist
**Fix:**
1. Check: `SELECT * FROM storage.buckets;`
2. If empty, create manually in Dashboard (Step 3)

### Issue: Direct messages not working
**Cause:** Table or policies missing
**Fix:**
1. Check: `SELECT * FROM information_schema.tables WHERE table_name = 'direct_messages';`
2. If empty, re-run `INCREMENTAL_MIGRATION_SAFE.sql`

### Issue: TypeScript errors in browser console
**Cause:** Old build cache
**Fix:**
```bash
rm -rf node_modules/.vite
npm run dev
```

---

## 📋 EXECUTION CHECKLIST

Use this to track your progress:

### Pre-Migration:
- [ ] Read this guide completely
- [ ] Have Supabase Dashboard open
- [ ] Have SQL Editor ready
- [ ] Saved your current database state (optional backup)

### Migration Steps:
- [ ] Step 1: Ran `CHECK_EXISTING_SCHEMA.sql` - Saved output
- [ ] Step 2: Ran `INCREMENTAL_MIGRATION_SAFE.sql` - Success!
- [ ] Step 3: Created storage buckets - All 3 exist
- [ ] Step 4: Ran `SETUP_COLLABORATION.sql` - User added to lab
- [ ] Step 5: Ran verification queries - All passed
- [ ] Step 6: Tested application - Everything works!

### Post-Migration:
- [ ] No 406 errors
- [ ] Can see channels
- [ ] Can send messages
- [ ] Can start DMs
- [ ] File upload works
- [ ] No console errors

---

## 🎉 SUCCESS CRITERIA

You're done when ALL of these are true:
1. ✅ All tables exist (10+ tables)
2. ✅ You're in team_members table with role='admin'
3. ✅ Default lab exists with 3 channels
4. ✅ Storage buckets created (2-3 buckets)
5. ✅ No 406 errors in browser
6. ✅ Can navigate to /collaboration
7. ✅ Can see and send messages
8. ✅ Direct messages section visible
9. ✅ No console errors
10. ✅ TypeScript builds without errors

---

## 📊 ESTIMATED TIME

| Step | Time | Complexity |
|------|------|-----------|
| 1. Check existing schema | 5 min | Easy |
| 2. Run migration | 10 min | Easy |
| 3. Create storage buckets | 5 min | Easy |
| 4. Bootstrap user | 2 min | Easy |
| 5. Verification | 3 min | Easy |
| 6. Test application | 2 min | Easy |
| **TOTAL** | **27 min** | **Easy** |

---

## 🆘 NEED HELP?

If something goes wrong:

1. **Check the error message** - SQL errors are usually clear
2. **Re-run diagnostic** - `CHECK_EXISTING_SCHEMA.sql` shows current state
3. **Check browser console** - Look for network errors
4. **Verify RLS policies** - Most issues are permission-related
5. **Check Supabase logs** - Dashboard → Logs → Postgres Logs

---

## ✅ WHAT'S SAFE

This migration is safe because:
- ✅ Uses `IF NOT EXISTS` - won't break existing tables
- ✅ Uses `DO $$` blocks - adds columns only if missing
- ✅ Uses `DROP POLICY IF EXISTS` - safely recreates policies
- ✅ Uses `ON CONFLICT DO NOTHING` - safe inserts
- ✅ No destructive operations - won't delete data
- ✅ Idempotent - can run multiple times safely

**You can run these scripts multiple times without breaking anything!**

---

**Ready to start? Begin with Step 1!** 🚀
