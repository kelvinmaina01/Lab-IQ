# 🗺️ YOUR EXISTING SCHEMA MAP

## ✅ CONFIRMED EXISTING TABLES

Based on AI Debugger analysis:

### Core Tables (Already Exist):
1. ✅ `team_members` - Has `user_id` column
2. ✅ `team_invitations` - Missing `invitation_token` column
3. ✅ `chat_channels` - Exists
4. ✅ `channel_members` - Has `team_member_id` (NOT `user_id`)
5. ✅ `chat_messages` - Exists
6. ✅ `shared_files` - Exists
7. ✅ `shared_projects` - Exists
8. ✅ `project_members` - Has `user_id` column (correct)
9. ✅ `notifications` - Exists
10. ✅ `collaboration_activity` - EXISTS (NOT `activity_feed`)
11. ✅ `activities` - Also exists (different table)

### Missing Tables (Need to Create):
- ❌ `typing_indicators` - Doesn't exist
- ❌ `user_presence` - Doesn't exist
- ❌ `direct_messages` - Doesn't exist
- ❌ `bookmarks` - Doesn't exist
- ❌ `activity_feed` - Doesn't exist (use `collaboration_activity` instead)

---

## 🔧 KEY CORRECTIONS NEEDED

### 1. Use `collaboration_activity` NOT `activity_feed`
```sql
-- WRONG:
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- CORRECT:
ALTER TABLE collaboration_activity ENABLE ROW LEVEL SECURITY;
```

### 2. `channel_members` structure
```sql
-- Has: team_member_id (FK → team_members.id)
-- NOT: user_id
-- Must JOIN through team_members to get user_id
```

### 3. `project_members` structure
```sql
-- Has: user_id (FK → auth.users.id) directly
-- This is CORRECT - no join needed
```

---

## 🎯 CORRECT SCHEMA MAPPING

### Tables That Reference Users DIRECTLY:
- ✅ `team_members.user_id` → `auth.users.id`
- ✅ `project_members.user_id` → `auth.users.id`
- ✅ `chat_messages.user_id` → `auth.users.id`
- ✅ `notifications.user_id` → `auth.users.id`
- ✅ `collaboration_activity.user_id` → `auth.users.id`
- ✅ `shared_files.uploaded_by` → `auth.users.id`

### Tables That Reference Users INDIRECTLY:
- ❌ `channel_members` → Uses `team_member_id` (must join)

---

## 🚀 ACTION PLAN

Create new migration that:
1. Uses `collaboration_activity` instead of `activity_feed`
2. Only creates tables that don't exist
3. Only adds columns that are missing
4. Uses correct joins for `channel_members`
5. Uses direct references for `project_members`
