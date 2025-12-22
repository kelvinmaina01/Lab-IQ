# 🚀 Quick Deploy Cheat Sheet

## Prerequisites
- ✅ Node.js installed (you have this)
- ✅ Git installed (you have this)
- ✅ Supabase account (you have this)
- ✅ Terminal/Command Prompt

---

## 5-Minute Deployment

### 1. Install Supabase CLI (if not installed)
```bash
npm install -g supabase
```

### 2. Login
```bash
supabase login
```
- Browser opens → Click "Authorize"

### 3. Link Project
```bash
cd C:\Users\dell\Desktop\Lab-IQ
supabase link --project-ref YOUR_PROJECT_REF
```
- Get `YOUR_PROJECT_REF` from your Supabase dashboard URL
- Press ENTER when asked for password

### 4. Set Groq API Key (if needed)
```bash
# Check if already set
supabase secrets list

# If GROQ_API_KEY missing:
# 1. Get key: https://console.groq.com/keys
# 2. Set it:
supabase secrets set GROQ_API_KEY=gsk_your_key_here
```

### 5. Deploy Functions
```bash
supabase functions deploy chat-bot-ai
supabase functions deploy send-team-invitation
```

### 6. Verify
```bash
supabase functions list
```
Should show both functions as ACTIVE

### 7. Test
```bash
npm run dev
```
- Open: http://localhost:8080/collaboration
- Type: `@LabAI hello`
- Get response in 1-3 seconds ✅

---

## Common Commands

```bash
# View all functions
supabase functions list

# View all secrets
supabase secrets list

# Watch logs (real-time)
supabase functions logs chat-bot-ai --tail

# Redeploy after changes
supabase functions deploy chat-bot-ai

# Delete a function
supabase functions delete chat-bot-ai
```

---

## Troubleshooting One-Liners

```bash
# Problem: @LabAI not responding
supabase functions logs chat-bot-ai --tail
# Then type @LabAI in app, watch for errors

# Problem: Function not found
supabase functions deploy chat-bot-ai --no-verify-jwt

# Problem: Need to reinstall CLI
npm uninstall -g supabase
npm install -g supabase
supabase --version
```

---

## Get Your Project Info

**Project Ref**:
- Dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
- Copy the part after `/project/`

**Anon Key** (for testing):
1. Dashboard → Settings → API
2. Copy "anon public" key

**Function URL**:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/chat-bot-ai
```

---

## Test AI Function Directly

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/chat-bot-ai ^
  -H "Authorization: Bearer YOUR_ANON_KEY" ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"hello\",\"channelId\":\"test\",\"userId\":\"test\"}"
```

Expected: `{"success":true,"aiMessage":"..."}`

---

## Copy-Paste Template

Replace with your values and run:

```bash
# Set your values
$PROJECT_REF = "YOUR_PROJECT_REF_HERE"
$GROQ_KEY = "gsk_YOUR_KEY_HERE"

# Deploy
cd C:\Users\dell\Desktop\Lab-IQ
supabase link --project-ref $PROJECT_REF
supabase secrets set GROQ_API_KEY=$GROQ_KEY
supabase functions deploy chat-bot-ai
supabase functions deploy send-team-invitation
supabase functions list
```

---

## Success = This Works

```
You: @LabAI what is PCR?

🤖 LabAI Response (1-3 seconds later):
PCR (Polymerase Chain Reaction) is a molecular biology
technique used to amplify specific DNA sequences...
```

✅ **If this works, you're 100% done!**

---

## Need More Help?

📖 Full guide: `CLI_DEPLOYMENT_STEP_BY_STEP.md`

📖 Manual steps: `MANUAL_EDGE_FUNCTION_DEPLOY.md`

📖 Feature docs: `PRODUCTION_READINESS_UPDATE.md`
