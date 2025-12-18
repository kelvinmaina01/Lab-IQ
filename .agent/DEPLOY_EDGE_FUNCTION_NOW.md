# 🚀 Deploy Edge Function - 3 Easy Methods

## ✅ Buckets Created!

Great! Now let's deploy the Edge Function for email invitations.

---

## 🎯 METHOD 1: Supabase Dashboard (EASIEST - 2 minutes)

### Step-by-Step:

1. **Open Supabase Dashboard**: https://supabase.com/dashboard

2. **Select your Lab IQ project**

3. **Go to Edge Functions** (left sidebar)

4. **Click "Create a new function"** or **"New Function"**

5. **Enter details:**
   - Function name: `send-team-invitation`
   - Template: Start from scratch

6. **Copy the code**:
   - Open: `C:\Users\dell\Desktop\Lab-IQ\supabase\functions\send-team-invitation\index.ts`
   - Copy **ALL** content (Ctrl+A, Ctrl+C)

7. **Paste into editor** in Supabase Dashboard

8. **Click "Deploy"** button

9. **Set environment variables**:
   - Click on the function name
   - Go to **"Settings"** tab
   - Add secret:
     - Key: `RESEND_API_KEY`
     - Value: `re_4d756d418f4ab6b75803967221aea96ae0046a5d3eb0b3ee047db4b4ef810bfd`
   - Add secret:
     - Key: `APP_URL`
     - Value: `http://localhost:5173` (or your production URL)

10. **Test it**:
    - Click **"Invoke"** tab
    - Use test payload (see below)
    - Check for success response

### Test Payload:
```json
{
  "email": "your-email@example.com",
  "inviterName": "Test User",
  "labId": "00000000-0000-0000-0000-000000000001",
  "role": "member",
  "invitationToken": "test-token-123"
}
```

---

## 🎯 METHOD 2: Install Supabase CLI & Deploy (5 minutes)

### Install CLI:

```bash
# Using npm (if you have Node.js)
npm install -g supabase

# Verify installation
supabase --version
```

### Deploy:

```bash
cd C:\Users\dell\Desktop\Lab-IQ

# Login to Supabase
supabase login

# Link your project (you'll need your project ref from dashboard)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy send-team-invitation

# Set environment variables
supabase secrets set RESEND_API_KEY=re_4d756d418f4ab6b75803967221aea96ae0046a5d3eb0b3ee047db4b4ef810bfd
supabase secrets set APP_URL=http://localhost:5173
```

---

## 🎯 METHOD 3: Skip Email Invitations (For Now)

If you want to test collaboration features first without email:

### Option A: Direct Database Insert

```sql
-- Add team members manually via SQL Editor
INSERT INTO team_invitations (
  email,
  lab_id,
  role,
  invitation_token,
  status
) VALUES (
  'colleague@example.com',
  '00000000-0000-0000-0000-000000000001',
  'member',
  gen_random_uuid()::text,
  'pending'
);
```

### Option B: Auto-add Current User

```sql
-- Add yourself as a team member
INSERT INTO team_members (user_id, lab_id, role, display_name, status)
VALUES (
  auth.uid(),
  '00000000-0000-0000-0000-000000000001',
  'admin',
  'Your Name',
  'online'
)
ON CONFLICT (user_id, lab_id) DO UPDATE
SET status = 'online';

-- Create a default general channel
INSERT INTO chat_channels (
  lab_id,
  name,
  display_name,
  description,
  type,
  created_by,
  is_default
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'general',
  '# general',
  'General discussion',
  'public',
  auth.uid(),
  true
)
ON CONFLICT (lab_id, name) DO NOTHING;

-- Get the channel ID
-- Then add yourself as a member:
INSERT INTO channel_members (channel_id, user_id)
SELECT id, (SELECT id FROM team_members WHERE user_id = auth.uid() LIMIT 1)
FROM chat_channels
WHERE name = 'general' AND lab_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;
```

---

## 🎯 MY RECOMMENDATION

**Use Method 1 (Dashboard)** - it's the easiest and takes only 2 minutes!

Steps:
1. Dashboard → Edge Functions → Create function
2. Name it `send-team-invitation`
3. Paste the code
4. Deploy
5. Add environment variables
6. Test with sample payload

---

## 📊 WHAT YOU GET

### After Edge Function Deployed:
- ✅ Click "Invite Member" in app
- ✅ Enter colleague's email
- ✅ They receive beautiful HTML email
- ✅ Email includes invitation link
- ✅ They can accept and join team
- ✅ Automatic team member creation

### Email Features:
- ✅ Professional HTML design
- ✅ Lab IQ branding
- ✅ Role permissions explained
- ✅ Features showcase
- ✅ Secure invitation token
- ✅ 7-day expiration

---

## 🚨 IF DEPLOYMENT FAILS

Tell me:
1. Which method you tried
2. What error message you got
3. Screenshot if possible

I'll help you fix it immediately!

---

## ⏱️ TIME ESTIMATE

- Method 1 (Dashboard): **2 minutes** ⭐ RECOMMENDED
- Method 2 (CLI): **5 minutes**
- Method 3 (Skip): **0 minutes** (test other features first)

---

**Buckets are ready ✅ - Now deploy the Edge Function!** 🚀

Choose Method 1 and you'll be done in 2 minutes!
