 # 🚀 Edge Function Deployment Guide

## 📋 You Have 3 Options

---

## ✅ OPTION 1: Deploy via Supabase Dashboard (EASIEST - 2 minutes)

### Step-by-Step:

1. **Go to Supabase Dashboard** → **Edge Functions** (left sidebar)

2. **Click "Deploy new function"** or **"Create function"**

3. **Configure:**
   - Function name: `send-team-invitation`
   - Runtime: Deno

4. **Copy the code** from:
   ```
   C:\Users\dell\Desktop\Lab-IQ\supabase\functions\send-team-invitation\index.ts
   ```

5. **Paste into the code editor** in Supabase Dashboard

6. **Click "Deploy"**

7. **Set environment variables** (in function settings):
   - `RESEND_API_KEY` = `re_4d756d418f4ab6b75803967221aea96ae0046a5d3eb0b3ee047db4b4ef810bfd`
   - `APP_URL` = `http://localhost:5173` (or your production URL)

8. **Test the function** (there's a test button in the dashboard)

---

## ✅ OPTION 2: Deploy via Supabase CLI (If you want to install it)

### Install Supabase CLI:

**On Windows:**
```bash
# Using npm
npm install -g supabase

# OR using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Then Deploy:

```bash
cd C:\Users\dell\Desktop\Lab-IQ

# Link your project (first time only)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy send-team-invitation

# Set secrets
supabase secrets set RESEND_API_KEY=re_4d756d418f4ab6b75803967221aea96ae0046a5d3eb0b3ee047db4b4ef810bfd
supabase secrets set APP_URL=http://localhost:5173
```

---

## ✅ OPTION 3: Skip for Now (Use Later)

You can skip the Edge Function deployment for now and:
- ✅ Test all other collaboration features (chat, files, channels)
- ✅ Deploy Edge Function later when you need email invitations
- ✅ For testing, you can manually add team members via SQL

### Manually Add Team Member (for testing):

```sql
-- In Supabase SQL Editor
INSERT INTO team_members (user_id, lab_id, role, display_name, status)
VALUES (
  auth.uid(),  -- Your user ID
  '00000000-0000-0000-0000-000000000001',  -- Default lab ID
  'admin',
  'Your Name',
  'online'
);
```

---

## 🎯 RECOMMENDED: Option 1 (Dashboard)

**Why?**
- ✅ Fastest (no CLI installation needed)
- ✅ Visual interface
- ✅ Can test immediately
- ✅ Easy to debug

**Time**: 2 minutes

---

## 📊 AFTER DEPLOYMENT

### Test the Edge Function:

1. Go to **Edge Functions** → Click `send-team-invitation`

2. Click **"Invoke"** or **"Test"**

3. Use this test payload:
```json
{
  "email": "test@example.com",
  "inviterName": "Your Name",
  "labId": "00000000-0000-0000-0000-000000000001",
  "role": "member",
  "invitationToken": "test-token-123"
}
```

4. Check response:
   - ✅ Status: 200
   - ✅ `"success": true`
   - ✅ Email sent to test@example.com

5. **Check your email** (test@example.com) - you should receive a beautiful invitation!

---

## 🐛 TROUBLESHOOTING

### Issue: "RESEND_API_KEY not configured"
**Solution**:
1. Go to Edge Functions → `send-team-invitation` → **Settings**
2. Add environment variable: `RESEND_API_KEY`
3. Value: `re_4d756d418f4ab6b75803967221aea96ae0046a5d3eb0b3ee047db4b4ef810bfd`

### Issue: "Failed to send email"
**Solution**:
1. Check Resend API key is correct
2. Make sure you've verified your sending domain in Resend
3. For testing, Resend allows sending to verified emails only

### Issue: Function times out
**Solution**: Edge Functions can take 30-60 seconds on first deploy (cold start). Try again.

---

## ✅ VERIFICATION

Function deployed successfully when:
- ✅ Shows "Deployed" status in dashboard
- ✅ Test invocation returns status 200
- ✅ No errors in function logs
- ✅ Email received in inbox

---

## 🎯 NEXT STEPS

After Edge Function is deployed:

1. **Test invitation flow**:
   - Go to Collaboration page
   - Click "Invite Member"
   - Enter email and role
   - Click "Send Invitation"
   - Check email arrives ✅

2. **Tell me it's working!**
   - I'll build the remaining components
   - Full integration with Experiments/Workflows
   - Final optimizations

---

**Choose Option 1 (Dashboard) - it's the fastest!** 🚀
