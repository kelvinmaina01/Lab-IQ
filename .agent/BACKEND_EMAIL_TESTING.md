# 📧 Testing Resend API & Edge Function - Backend First

## Quick Backend Testing Guide

---

## 🎯 Option 1: Test Resend API Directly (Fastest)

### **Using Resend Dashboard:**
1. Go to: https://resend.com/emails
2. Login with your account
3. Click "Send Test Email"
4. Verify your API key works

### **Using curl (Command Line):**
```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_4d756d418f4ab6b75803967221aea96ae0046a5d3eb0b3ee047db4b4ef810bfd" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Lab IQ <onboarding@resend.dev>",
    "to": ["YOUR_EMAIL@example.com"],
    "subject": "Test Email from Lab-IQ",
    "html": "<h1>Testing Resend API</h1><p>If you receive this, the API works!</p>"
  }'
```

**Expected Response:**
```json
{
  "id": "email_id_here",
  "from": "Lab IQ <onboarding@resend.dev>",
  "to": ["your.email@example.com"],
  "created_at": "2025-12-20T19:42:00.000Z"
}
```

---

## 🎯 Option 2: Test Edge Function in Supabase Dashboard

### **Method A: Supabase Dashboard (No Code)**

1. **Go to Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `engqgzznccvoqeiiuchn`

2. **Open Edge Functions:**
   - Left sidebar → "Edge Functions"
   - Find `send-team-invitation`
   - Click on it

3. **Invoke Function (Test Request):**
   - Click "Invoke" or "Test" button
   - Enter this test payload:
   ```json
   {
     "email": "YOUR_EMAIL@example.com",
     "inviterName": "Test Admin",
     "labId": "test-lab-123",
     "role": "researcher",
     "invitationToken": "test-token-456"
   }
   ```
   - Click "Send Request"

4. **Check Results:**
   - ✅ Success: Status 200, email sent
   - ❌ Error: Check logs for details

### **Method B: Using curl (More Control)**

```bash
# Replace with your actual Supabase anon key
curl -i --location --request POST \
  'https://engqgzznccvoqeiiuchn.supabase.co/functions/v1/send-team-invitation' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZ3FnenpuY2N2b3FlaWl1Y2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTgwMjMsImV4cCI6MjA4MDA3NDAyM30.p8ZIvchNwsKO7ldTr47GuLJHvcwwuDuhVmhjqLjYW6I' \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "YOUR_EMAIL@example.com",
    "inviterName": "Test Admin",
    "labId": "test-lab-123",
    "role": "researcher",
    "invitationToken": "test-token-789"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "emailId": "xxx-xxx-xxx"
}
```

---

## 🎯 Option 3: PowerShell Version (Windows)

```powershell
# Test Resend API directly
$headers = @{
    "Authorization" = "Bearer re_4d756d418f4ab6b75803967221aea96ae0046a5d3eb0b3ee047db4b4ef810bfd"
    "Content-Type" = "application/json"
}

$body = @{
    from = "Lab IQ <onboarding@resend.dev>"
    to = @("YOUR_EMAIL@example.com")
    subject = "Test Email from Lab-IQ"
    html = "<h1>Testing Resend API</h1><p>If you receive this, the API works!</p>"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method POST -Headers $headers -Body $body
```

---

## 🔍 Check Edge Function Logs

### **In Supabase Dashboard:**
1. Go to Edge Functions → `send-team-invitation`
2. Click "Logs" tab
3. You'll see:
   - Function invocations
   - Errors (if any)
   - Email sending results

### **What to Look For:**
✅ **Success Log:**
```
Email sent successfully: { id: 'xxx' }
```

❌ **Common Errors:**
```
RESEND_API_KEY not configured
Failed to send email: 401 Unauthorized
Missing required fields
```

---

## 📊 Verify Email Sent in Database

After testing, check if email tracking works:

```sql
-- Check if email was tracked
SELECT 
  email,
  invitation_token,
  email_sent_at,
  created_at,
  metadata
FROM team_invitations 
WHERE email = 'YOUR_EMAIL@example.com'
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected:** `email_sent_at` should have a timestamp

---

## 🐛 Troubleshooting

### **Error: "RESEND_API_KEY not configured"**
**Fix:**
1. Go to Supabase Dashboard → Settings → Edge Functions
2. Add environment variable:
   - Key: `RESEND_API_KEY`
   - Value: `re_4d756d418f4ab6b75803967221aea96ae0046a5d3eb0b3ee047db4b4ef810bfd`
3. Redeploy function

### **Error: "401 Unauthorized"**
**Cause:** Resend API key invalid or expired
**Fix:** 
1. Go to https://resend.com/api-keys
2. Generate new API key
3. Update in Supabase edge function env vars

### **Error: "Email not received"**
**Check:**
1. Spam/Junk folder
2. Email address is correct
3. Resend dashboard logs: https://resend.com/emails
4. Free tier rate limits (you get 100 emails/day on free plan)

### **Error: "Function not found"**
**Fix:** Deploy the edge function:
```bash
# Install Supabase CLI first if needed
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref engqgzznccvoqeiiuchn

# Deploy function
supabase functions deploy send-team-invitation
```

---

## ✅ Quick Test Checklist

### **Step 1: Test Resend API (2 min)**
- [ ] Run curl command to Resend API
- [ ] Check if email arrives
- [ ] Verify response has email ID

### **Step 2: Test Edge Function (3 min)**
- [ ] Open Supabase Dashboard
- [ ] Invoke `send-team-invitation` function
- [ ] Check logs for success/errors
- [ ] Verify email received

### **Step 3: Check Database (1 min)**
- [ ] Run SQL query to check `team_invitations`
- [ ] Verify `email_sent_at` is populated

### **Step 4: Ready for UI Testing**
- [ ] Backend working ✅
- [ ] Can now test from UI with confidence

---

## 🚀 After Backend Tests Pass

Once emails are sending successfully from backend:

1. **Test from UI:**
   - Go to `http://localhost:8080/collaboration`
   - Click Invite button
   - Should work seamlessly

2. **Benefits of Backend Testing First:**
   - ✅ Isolates issues faster
   - ✅ No need to debug UI if backend broken
   - ✅ Can verify exact error messages
   - ✅ Confirms Resend API key works

---

## 📝 Test Results Template

```
RESEND API TEST:
- [ ] Direct API call successful
- [ ] Email received in inbox
- [ ] Response includes email ID

EDGE FUNCTION TEST:
- [ ] Function invoked successfully
- [ ] No errors in logs
- [ ] Email sent and received
- [ ] Database updated with email_sent_at

READY FOR UI: YES / NO
Issues found: _________________
```

---

## 🔑 Quick Reference

**Your Resend API Key:**
```
re_4d756d418f4ab6b75803967221aea96ae0046a5d3eb0b3ee047db4b4ef810bfd
```

**Your Supabase Anon Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZ3FnenpuY2N2b3FlaWl1Y2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTgwMjMsImV4cCI6MjA4MDA3NDAyM30.p8ZIvchNwsKO7ldTr47GuLJHvcwwuDuhVmhjqLjYW6I
```

**Your Supabase URL:**
```
https://engqgzznccvoqeiiuchn.supabase.co
```

**Your Supabase Project Ref:**
```
engqgzznccvoqeiiuchn
```

---

**Start with Option 1 (Resend API direct test) - it's the fastest way to verify your API key works!**
