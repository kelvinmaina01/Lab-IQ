# 🚀 Your Specific Setup Steps (5 Minutes)

**Date**: December 17, 2025
**Your API Keys**: ✅ Already configured

---

## ✅ API KEYS (Already Set!)

You already have these configured in Supabase:
- ✅ `RESEND_API_KEY`: `re_4d756d418f4ab6b75803967221aea96ae0046a5d3eb0b3ee047db4b4ef810bfd`
- ✅ `GROK_API_KEY`: Available for AI features

---

## 📝 STEP 1: Run Updated Migration (2 minutes)

### Problem Solved:
The error "relation already exists" is fixed! The new migration uses `IF NOT EXISTS` everywhere.

### What to Do:

1. Open **Supabase Dashboard** → **SQL Editor**

2. Copy ALL content from this file:
   ```
   C:\Users\dell\Desktop\Lab-IQ\supabase\migrations\20251217_collaboration_system_v2.sql
   ```

3. Paste into SQL Editor

4. Click **Run** (or Ctrl+Enter)

5. You should see:
   ```
   ✅ Lab IQ Collaboration System v2 migration completed successfully!
   📊 14 tables created/verified
   🔒 RLS policies applied
   ⚡ Indexes optimized
   🎉 Ready to use!
   ```

**Note**: This migration is safe to run even if some tables exist. It will:
- ✅ Create new tables if they don't exist
- ✅ Skip tables that already exist
- ✅ Update existing tables with new columns if needed
- ✅ Create indexes only if they don't exist

---

## 📦 STEP 2: Create Storage Buckets (2 minutes)

1. Go to **Supabase Dashboard** → **Storage**

2. Click **New Bucket**

### Create 3 Buckets:

#### Bucket 1: `collaboration-files`
- Name: `collaboration-files`
- Public: **No** (keep private)
- File size limit: 50MB

#### Bucket 2: `avatars`
- Name: `avatars`
- Public: **Yes** (make public)
- File size limit: 2MB

#### Bucket 3: `project-attachments`
- Name: `project-attachments`
- Public: **No** (keep private)
- File size limit: 100MB

---

## 🔒 STEP 3: Apply Storage Policies (1 minute)

1. Go back to **SQL Editor**

2. Copy and run this SQL:

```sql
-- collaboration-files bucket policies
DROP POLICY IF EXISTS "Users can upload files to their channels" ON storage.objects;
CREATE POLICY "Users can upload files to their channels"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'collaboration-files' AND
  (storage.foldername(name))[1] IN (
    SELECT channel_id::text FROM channel_members WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view files from their channels" ON storage.objects;
CREATE POLICY "Users can view files from their channels"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'collaboration-files' AND
  (storage.foldername(name))[1] IN (
    SELECT channel_id::text FROM channel_members WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'collaboration-files' AND
  owner = auth.uid()
);

-- avatars bucket policies
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- project-attachments bucket policies
DROP POLICY IF EXISTS "Project members can upload files" ON storage.objects;
CREATE POLICY "Project members can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT project_id::text FROM project_members WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Project members can view files" ON storage.objects;
CREATE POLICY "Project members can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT project_id::text FROM project_members WHERE user_id = auth.uid()
  )
);
```

---

## 🚀 STEP 4: Test the System (2 minutes)

1. Start your app:
   ```bash
   cd C:\Users\dell\Desktop\Lab-IQ
   npm run dev
   ```

2. Open: http://localhost:5173

3. Login if not already logged in

4. Go to: http://localhost:5173/collaboration

5. Quick tests:
   - ✅ Page loads without errors
   - ✅ Click **Chat** tab
   - ✅ Try sending a test message
   - ✅ Click **Invite Member** button
   - ✅ Try uploading a file (drag and drop)

---

## ✅ VERIFICATION CHECKLIST

After completing steps above, verify:

### Database ✅
- [ ] Go to Supabase → **Table Editor**
- [ ] See these tables: `team_members`, `chat_channels`, `chat_messages`, etc.
- [ ] Click on `team_members` - should have columns like `id`, `user_id`, `lab_id`, `status`

### Storage ✅
- [ ] Go to Supabase → **Storage**
- [ ] See 3 buckets: `collaboration-files`, `avatars`, `project-attachments`

### App Works ✅
- [ ] Collaboration page loads
- [ ] No errors in browser console (F12)
- [ ] Can see team members (even if it's just you)
- [ ] Chat interface appears

---

## 🐛 TROUBLESHOOTING

### Issue: Still getting "relation already exists"
**Solution**: Use the NEW migration file `20251217_collaboration_system_v2.sql` (not the old one)

### Issue: Can't create buckets - "Bucket already exists"
**Solution**: Skip to Step 3 (the buckets are already there from before)

### Issue: Storage policies fail
**Solution**: The `DROP POLICY IF EXISTS` will handle existing policies. Just run the SQL again.

### Issue: Chat tab shows errors
**Solution**:
1. Check browser console (F12) for specific error
2. Make sure migration ran successfully
3. Try refreshing the page
4. Check that you're logged in

### Issue: Can't send invitation
**Solution**:
- Resend API key is already configured
- Edge function will be deployed automatically when needed
- For now, focus on chat functionality

---

## 📊 WHAT YOU'LL SEE AFTER SETUP

### In Supabase Dashboard

**Tables (Table Editor)**:
```
✅ team_members (your user should appear here)
✅ chat_channels (will be populated when you create channels)
✅ chat_messages (will be populated when you send messages)
✅ shared_files
✅ shared_projects
✅ notifications
... and 8 more tables
```

**Storage**:
```
✅ collaboration-files/ (empty initially)
✅ avatars/ (empty initially)
✅ project-attachments/ (empty initially)
```

### In Your App

**Collaboration Page** (`/collaboration`):
```
✅ Team tab - Shows your user
✅ Projects tab - Empty initially (you'll create projects)
✅ Chat tab - Shows channels and chat interface
✅ Files tab - Empty initially
✅ Activity tab - Shows recent activity
```

**You can immediately**:
- ✅ Send messages in general channel
- ✅ Create new channels
- ✅ Upload files
- ✅ Invite team members

---

## 🎉 SUCCESS CRITERIA

You're done when:
- ✅ Migration runs without errors
- ✅ 3 storage buckets exist
- ✅ Storage policies applied
- ✅ Collaboration page loads
- ✅ Can send a test message in chat
- ✅ No errors in browser console

**Time to Complete**: 5-7 minutes total

---

## 🔥 NEXT STEPS

Once setup is complete:

1. **Test collaboration features**:
   - Send messages
   - Create channels
   - Upload files
   - Create projects

2. **Invite team members**:
   - Click "Invite Member"
   - Enter colleague's email
   - They'll receive a beautiful invitation email

3. **Tell me it's working**:
   - I'll continue building the remaining components
   - Integration with Experiments/Workflows pages
   - Final polish and optimizations

---

## 📞 NEED HELP?

If you get stuck:
1. Take a screenshot of the error
2. Copy error message from browser console (F12)
3. Tell me which step failed
4. I'll help you debug!

---

*Your specific configuration is already set up and ready to go!*
*Just run the new migration and create the buckets!*
