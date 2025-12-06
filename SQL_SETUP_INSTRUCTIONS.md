# 🚀 Quick SQL Setup Instructions

## Step-by-Step Guide to Set Up Collaboration System in Supabase

### Prerequisites
- [ ] You have a Supabase account
- [ ] You have the Lab-IQ project selected in Supabase Dashboard
- [ ] You are logged in to Supabase Dashboard

---

## ⚡ Quick Setup (5 minutes)

### **Step 1: Run Main Schema** (2 minutes)

1. Go to **Supabase Dashboard** → https://supabase.com/dashboard
2. Select your **Lab-IQ** project
3. Click **SQL Editor** in the left sidebar
4. Click **+ New query** button
5. Copy **ALL** content from `COLLABORATION_COMPLETE_SCHEMA.sql`
6. Paste into the SQL Editor
7. Click **RUN** button (or press Ctrl+Enter)
8. Wait ~30 seconds for completion
9. You should see ✅ success messages at the bottom

**What this does:**
- Creates 8 new tables (team_members, chat_messages, shared_projects, etc.)
- Sets up Row-Level Security (RLS) policies
- Creates indexes for performance
- Adds helper functions

---

### **Step 2: Configure Realtime & Storage** (2 minutes)

1. In the same SQL Editor, click **+ New query**
2. Copy **ALL** content from `SUPABASE_SETUP_COMMANDS.sql`
3. Paste into the SQL Editor
4. Click **RUN** button
5. Wait ~10 seconds for completion
6. You should see ✅ success messages

**What this does:**
- Enables Realtime for chat tables
- Creates `lab-iq-files` storage bucket (private, 50MB limit)
- Sets up storage policies
- Creates test data (optional)

---

### **Step 3: Verify Everything Works** (1 minute)

Run these verification queries in SQL Editor:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%team%'
  OR table_name LIKE '%chat%'
ORDER BY table_name;

-- Check Realtime is enabled
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Check storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'lab-iq-files';
```

Expected results:
- ✅ 8+ tables listed
- ✅ 4 tables with Realtime enabled (chat_messages, chat_typing, team_members, collaboration_activity)
- ✅ 1 storage bucket (lab-iq-files)

---

## 🎯 What You'll Have After Setup

### Database Tables (8 new tables)
1. **team_members** - User profiles in labs
2. **team_invitations** - Email invitations
3. **chat_channels** - Chat rooms
4. **chat_messages** - All messages
5. **chat_typing** - Typing indicators
6. **chat_read_receipts** - Read status
7. **shared_projects** - Projects
8. **project_members** - Project access
9. **shared_files** - File metadata
10. **file_access_log** - Audit trail
11. **collaboration_activity** - Activity feed

### Security (RLS Policies)
- ✅ Row-Level Security on ALL tables
- ✅ Users can only see data in their lab
- ✅ Messages restricted to channel members
- ✅ Files restricted to project members

### Real-time Features
- ✅ Chat messages appear instantly
- ✅ Typing indicators work
- ✅ Online/offline status updates
- ✅ Activity feed updates live

### Storage
- ✅ Private bucket for files (50MB limit)
- ✅ Secure signed URLs
- ✅ Upload/download policies

---

## 🔧 Troubleshooting

### Error: "relation already exists"
**Solution:** Tables already exist. Safe to ignore or drop tables first:
```sql
DROP TABLE IF EXISTS collaboration_activity CASCADE;
DROP TABLE IF EXISTS shared_files CASCADE;
DROP TABLE IF EXISTS file_access_log CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS shared_projects CASCADE;
DROP TABLE IF EXISTS chat_read_receipts CASCADE;
DROP TABLE IF EXISTS chat_typing CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_channels CASCADE;
DROP TABLE IF EXISTS team_invitations CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
```
Then re-run the main schema.

### Error: "permission denied"
**Solution:** Make sure you're using the **SQL Editor** in Supabase Dashboard, not a client library.

### Error: "publication does not exist"
**Solution:** Your Supabase project might not have Realtime enabled. Contact Supabase support or check project settings.

### Storage bucket not created
**Solution:** Run this manually in SQL Editor:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('lab-iq-files', 'lab-iq-files', false)
ON CONFLICT DO NOTHING;
```

### Can't see storage bucket in UI
**Solution:** Go to **Storage** tab in Supabase Dashboard. If `lab-iq-files` doesn't appear, refresh the page.

---

## 📝 Next Steps After SQL Setup

Once SQL setup is complete:

1. **Test in your app:**
   - Log in to Lab-IQ
   - Go to `/collaboration` page
   - You should see the team/chat/files tabs

2. **Create your first team member:**
   - The app will auto-create a team member record when you first visit the collaboration page
   - Or run this SQL (replace YOUR_EMAIL):
   ```sql
   INSERT INTO team_members (user_id, lab_id, role, display_name, status)
   SELECT
     id,
     '00000000-0000-0000-0000-000000000001',
     'admin',
     'Your Name',
     'online'
   FROM auth.users WHERE email = 'YOUR_EMAIL@example.com';
   ```

3. **Create a test channel:**
   ```sql
   INSERT INTO chat_channels (name, lab_id, type, created_by)
   SELECT
     'General',
     '00000000-0000-0000-0000-000000000001',
     'general',
     id
   FROM auth.users WHERE email = 'YOUR_EMAIL@example.com';
   ```

4. **Ready to chat!**
   - Send messages in real-time
   - Upload files
   - Invite team members

---

## ✅ Quick Checklist

Copy this checklist and track your progress:

- [ ] Opened Supabase Dashboard
- [ ] Selected Lab-IQ project
- [ ] Went to SQL Editor
- [ ] Ran `COLLABORATION_COMPLETE_SCHEMA.sql` (2 min)
- [ ] Saw success messages
- [ ] Ran `SUPABASE_SETUP_COMMANDS.sql` (2 min)
- [ ] Saw success messages
- [ ] Ran verification queries
- [ ] All tables exist (8+ tables)
- [ ] Realtime enabled (4 tables)
- [ ] Storage bucket exists (lab-iq-files)
- [ ] Logged into Lab-IQ app
- [ ] Visited /collaboration page
- [ ] Everything works! 🎉

---

## 🆘 Need Help?

If you run into issues:

1. **Check verification queries** - Run the queries in Step 3 to see what's missing
2. **Check Supabase logs** - Go to Database → Logs in Supabase Dashboard
3. **Review error messages** - Copy the full error message and search for it
4. **Ask for help** - Share the error message and what step you're on

---

## 📚 Files Reference

- **COLLABORATION_COMPLETE_SCHEMA.sql** - Main database schema (run first)
- **SUPABASE_SETUP_COMMANDS.sql** - Realtime & storage setup (run second)
- **COLLABORATION_IMPLEMENTATION_GUIDE.md** - Full technical documentation
- **SQL_SETUP_INSTRUCTIONS.md** - This file (quick setup guide)

---

**Estimated Total Time:** 5 minutes
**Difficulty:** Easy (just copy/paste and click run!)

Good luck! 🚀
