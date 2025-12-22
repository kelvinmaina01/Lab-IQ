# Manual Edge Function Deployment Guide

## Prerequisites
You mentioned your API keys are already set in Supabase. Let me verify what you need:

---

## Step 1: Deploy AI Chat Bot Function

This enables @LabAI mentions in channels.

### A. Via Supabase Dashboard (EASIEST)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   - Click "Edge Functions" in sidebar

2. **Deploy chat-bot-ai**
   - Click "Deploy a new function"
   - Select "Deploy from local project" OR use CLI

### B. Via Supabase CLI (RECOMMENDED)

Open terminal and run:

```bash
# 1. Login to Supabase
supabase login

# 2. Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# 3. Deploy the function
supabase functions deploy chat-bot-ai
```

### C. Verify Deployment

```bash
# Check function is live
supabase functions list

# Test it manually
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/chat-bot-ai \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how does PCR work?",
    "channelId": "test-channel-id",
    "userId": "test-user-id"
  }'
```

---

## Step 2: Verify API Keys in Supabase

### Check Existing Secrets

```bash
# List all secrets
supabase secrets list
```

You should see:
- ✅ `GROQ_API_KEY` (for AI)
- ✅ `RESEND_API_KEY` (for emails)
- ✅ `SUPABASE_URL` (auto-set)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (auto-set)

### If Missing GROQ_API_KEY

**Get Free Groq API Key** (takes 2 minutes):
1. Go to: https://console.groq.com/keys
2. Sign up with Google/GitHub (free, no credit card)
3. Click "Create API Key"
4. Copy the key (starts with `gsk_...`)

**Set in Supabase**:
```bash
supabase secrets set GROQ_API_KEY=gsk_your_key_here
```

OR via Supabase Dashboard:
1. Go to Project Settings → Edge Functions
2. Click "Manage secrets"
3. Add new secret: `GROQ_API_KEY` = `gsk_your_key_here`

---

## Step 3: Test @LabAI in App

1. **Start Dev Server**
   ```bash
   npm run dev
   ```

2. **Go to Collaboration Page**
   - Open: http://localhost:8080/collaboration

3. **Test AI**
   - Type in any channel: `@LabAI hello`
   - Should get response in 1-3 seconds
   - Response will have `[AI]` prefix

4. **Check Logs (if issues)**
   ```bash
   supabase functions logs chat-bot-ai --tail
   ```

---

## Step 4: Deploy Email Invitation Function (Optional)

This enables team invitation emails.

### A. Deploy Function

```bash
supabase functions deploy send-team-invitation
```

### B. Verify RESEND_API_KEY

```bash
# Check if set
supabase secrets list | grep RESEND_API_KEY

# If missing, set it
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set EMAIL_FROM=noreply@labiq.app
```

### C. Verify Domain (CRITICAL for emails to send)

**This is why emails aren't sending right now!**

1. Go to: https://resend.com/domains
2. Login with your Resend account
3. Click "Add Domain"
4. Enter: `labiq.app`
5. Add DNS records (Resend will provide):
   ```
   Type: TXT
   Name: _resend
   Value: [Resend will provide this]

   Type: MX
   Name: @
   Value: [Resend will provide this]
   Priority: 10
   ```

6. Wait 5-10 minutes for DNS propagation
7. Click "Verify" in Resend dashboard

**Without domain verification, emails will fail silently!**

---

## Step 5: Troubleshooting

### Issue: "Function not found"
```bash
# Redeploy
supabase functions deploy chat-bot-ai --no-verify-jwt
```

### Issue: "@LabAI not responding"

**Check 1: Function deployed?**
```bash
supabase functions list
# Should show: chat-bot-ai | deployed
```

**Check 2: API key set?**
```bash
supabase secrets list | grep GROQ_API_KEY
```

**Check 3: Function logs**
```bash
supabase functions logs chat-bot-ai --tail
# Type @LabAI in app, watch for errors
```

**Check 4: Test directly**
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/chat-bot-ai \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message":"test","channelId":"123","userId":"456"}'
```

### Issue: "Emails not sending"

**Check 1: Domain verified?**
- Go to https://resend.com/domains
- Status should be "Verified" (green checkmark)

**Check 2: Function deployed?**
```bash
supabase functions list | grep send-team-invitation
```

**Check 3: Secrets set?**
```bash
supabase secrets list | grep RESEND
```

**Check 4: Check Resend logs**
- Go to: https://resend.com/emails
- See if emails are being attempted
- Check bounce/failure reasons

---

## Quick Start (If Keys Already Set)

If you already have keys in Supabase, just deploy:

```bash
# 1. Deploy AI function
supabase functions deploy chat-bot-ai

# 2. Deploy email function
supabase functions deploy send-team-invitation

# 3. Verify
supabase functions list

# 4. Test in app
npm run dev
# Go to http://localhost:8080/collaboration
# Type: @LabAI hello
```

---

## Expected Results

### ✅ Success Indicators:

**AI Working:**
- Type `@LabAI hello` in channel
- Get response in 1-3 seconds
- Response has `[AI]` prefix
- Appears in chat like normal message

**Emails Working:**
- Click "Invite Member" in collaboration page
- Enter email and send
- Email arrives in 10-30 seconds
- Contains invitation link

### ❌ Failure Indicators:

**AI Not Working:**
- No response after 10 seconds
- Check: `supabase functions logs chat-bot-ai`
- Likely: GROQ_API_KEY not set

**Emails Not Working:**
- "Success" message but no email
- Check: Domain verification at resend.com
- Check: `supabase functions logs send-team-invitation`

---

## Get Help

If stuck, send me:
1. Output of: `supabase functions list`
2. Output of: `supabase secrets list`
3. Screenshot of error in browser console
4. Output of: `supabase functions logs chat-bot-ai`

I'll debug it immediately!
