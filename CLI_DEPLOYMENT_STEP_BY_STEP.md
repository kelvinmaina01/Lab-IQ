# Step-by-Step CLI Deployment Guide

## Step 1: Check if Supabase CLI is Installed

Open your terminal and run:

```bash
supabase --version
```

**If you see a version number** (like `1.x.x`):
- ✅ CLI is installed, skip to Step 2

**If you get "command not found"**:
- Install Supabase CLI:

```bash
# Windows (using npm - you have Node.js already)
npm install -g supabase

# Wait for installation to complete (1-2 minutes)
```

---

## Step 2: Login to Supabase

```bash
supabase login
```

**What happens**:
1. Browser window opens automatically
2. Click "Authorize" to grant access
3. You'll see: "✅ Logged in successfully"

**If browser doesn't open**:
- Copy the URL from terminal
- Paste in browser manually
- Authorize

---

## Step 3: Link Your Project

```bash
cd C:\Users\dell\Desktop\Lab-IQ

supabase link --project-ref YOUR_PROJECT_REF
```

**How to get YOUR_PROJECT_REF**:
1. Go to: https://supabase.com/dashboard
2. Open your Lab-IQ project
3. Look at URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
4. Copy the `YOUR_PROJECT_REF` part (looks like: `abcdefghijklmnop`)

**Example**:
```bash
supabase link --project-ref abcdefghijklmnop
```

**You'll see**:
```
Enter your database password (or leave blank to skip):
```

**Action**:
- Just press ENTER (skip password, we don't need it for Edge Functions)

**Success message**:
```
✅ Linked to project: Lab-IQ
```

---

## Step 4: Verify Your API Keys

Before deploying, let's make sure you have the AI API key set:

```bash
supabase secrets list
```

**You should see**:
```
┌─────────────────────────┬─────────────┐
│ NAME                    │ DIGEST      │
├─────────────────────────┼─────────────┤
│ GROQ_API_KEY            │ gsk_***     │
│ RESEND_API_KEY          │ re_***      │
│ SUPABASE_URL            │ https://*** │
│ SUPABASE_SERVICE_ROLE   │ ***         │
└─────────────────────────┴─────────────┘
```

**If GROQ_API_KEY is missing**:

### Get Free Groq API Key:

1. **Open browser**: https://console.groq.com

2. **Sign up/Login** (use Google or GitHub - takes 30 seconds)

3. **Click "API Keys"** in left sidebar

4. **Click "Create API Key"**
   - Name: "Lab-IQ"
   - Click "Create"

5. **Copy the key** (starts with `gsk_...`)
   - ⚠️ IMPORTANT: Copy it now! You won't see it again

6. **Set in Supabase**:
```bash
supabase secrets set GROQ_API_KEY=gsk_paste_your_key_here
```

**Success message**:
```
✅ Finished supabase secrets set GROQ_API_KEY
```

---

## Step 5: Deploy AI Function

Now let's deploy the chat bot function:

```bash
supabase functions deploy chat-bot-ai
```

**What you'll see**:
```
Bundling chat-bot-ai...
Deploying chat-bot-ai (script)...
```

**Progress bar**:
```
[████████████████████] 100% - chat-bot-ai
```

**Success message**:
```
✅ Deployed Function chat-bot-ai on project YOUR_PROJECT_REF

Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/chat-bot-ai
```

**✅ DONE! AI function is live!**

---

## Step 6: Deploy Email Function (Optional)

```bash
supabase functions deploy send-team-invitation
```

**Same process as Step 5**:
```
Bundling send-team-invitation...
Deploying send-team-invitation (script)...
✅ Deployed Function send-team-invitation
```

---

## Step 7: Verify Deployment

Check that both functions are deployed:

```bash
supabase functions list
```

**Expected output**:
```
┌─────────────────────────┬──────────┬───────────┬─────────────┐
│ NAME                    │ STATUS   │ VERSION   │ CREATED AT  │
├─────────────────────────┼──────────┼───────────┼─────────────┤
│ chat-bot-ai             │ ACTIVE   │ v1        │ Just now    │
│ send-team-invitation    │ ACTIVE   │ v1        │ Just now    │
└─────────────────────────┴──────────┴───────────┴─────────────┘
```

**✅ If you see both functions with STATUS = ACTIVE, you're done!**

---

## Step 8: Test @LabAI in Your App

1. **Make sure dev server is running**:
```bash
npm run dev
```

2. **Open browser**: http://localhost:8080/collaboration

3. **Go to any channel** (like #general)

4. **Type a message**:
```
@LabAI Hello! Can you explain what PCR is?
```

5. **Press ENTER**

6. **Expected Result** (1-3 seconds later):
```
🤖 LabAI Response
Hello! PCR (Polymerase Chain Reaction) is a molecular biology technique used to amplify DNA sequences...
[Full response with formatting]
```

**✅ If you see AI response, IT WORKS!**

---

## Troubleshooting

### Problem: "supabase: command not found"

**Solution**:
```bash
# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version
```

---

### Problem: "Failed to link project"

**Solution 1** - Check project ref:
```bash
# Make sure you copied the correct project ref from your Supabase dashboard
supabase link --project-ref YOUR_CORRECT_PROJECT_REF
```

**Solution 2** - Use access token:
1. Go to: https://supabase.com/dashboard/account/tokens
2. Create new token
3. Run:
```bash
supabase link --project-ref YOUR_PROJECT_REF --access-token YOUR_TOKEN
```

---

### Problem: "@LabAI not responding"

**Check 1** - Function deployed?
```bash
supabase functions list
# Should show: chat-bot-ai | ACTIVE
```

**Check 2** - API key set?
```bash
supabase secrets list | findstr GROQ_API_KEY
# Should show: GROQ_API_KEY | gsk_***
```

**Check 3** - Check logs:
```bash
supabase functions logs chat-bot-ai --tail
```

**Then type @LabAI in app and watch terminal for errors**

**Check 4** - Test function directly:
```bash
# Get your anon key from: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api
# Copy the "anon public" key

curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/chat-bot-ai ^
  -H "Authorization: Bearer YOUR_ANON_KEY" ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"test\",\"channelId\":\"123\",\"userId\":\"456\"}"
```

**Expected response**:
```json
{"success": true, "aiMessage": "Hello! How can I help..."}
```

---

### Problem: "Deployment failed"

**Solution 1** - Check you're in correct directory:
```bash
cd C:\Users\dell\Desktop\Lab-IQ
pwd
# Should show: C:\Users\dell\Desktop\Lab-IQ
```

**Solution 2** - Re-link project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**Solution 3** - Try with no-verify flag:
```bash
supabase functions deploy chat-bot-ai --no-verify-jwt
```

---

## Complete Command Summary

```bash
# 1. Check CLI installed
supabase --version

# 2. Login
supabase login

# 3. Link project
cd C:\Users\dell\Desktop\Lab-IQ
supabase link --project-ref YOUR_PROJECT_REF

# 4. Set API key (if needed)
supabase secrets set GROQ_API_KEY=gsk_your_key_here

# 5. Deploy AI function
supabase functions deploy chat-bot-ai

# 6. Deploy email function
supabase functions deploy send-team-invitation

# 7. Verify
supabase functions list

# 8. Test
npm run dev
# Go to http://localhost:8080/collaboration
# Type: @LabAI hello
```

---

## What Each Command Does

| Command | What It Does |
|---------|-------------|
| `supabase login` | Connects CLI to your Supabase account |
| `supabase link` | Connects local project to cloud project |
| `supabase secrets set` | Stores API keys securely in Supabase |
| `supabase functions deploy` | Uploads function code to Supabase cloud |
| `supabase functions list` | Shows all deployed functions |
| `supabase functions logs` | Shows real-time function execution logs |

---

## Expected Time

- **Step 1-2**: 2 minutes (install + login)
- **Step 3**: 30 seconds (link project)
- **Step 4**: 2 minutes (get Groq key if needed)
- **Step 5-6**: 1 minute (deploy functions)
- **Step 7-8**: 30 seconds (verify + test)

**Total: ~5-6 minutes** ⚡

---

## Success Checklist

After running all commands, you should have:

- ✅ Supabase CLI installed
- ✅ Logged into Supabase account
- ✅ Project linked to local folder
- ✅ GROQ_API_KEY secret set
- ✅ chat-bot-ai function deployed
- ✅ send-team-invitation function deployed
- ✅ @LabAI responding in app
- ✅ Full collaboration feature working

---

## Need Help?

If you get stuck, send me:

1. **Screenshot of terminal error**
2. **Output of**:
   ```bash
   supabase functions list
   supabase secrets list
   ```
3. **Project URL** from Supabase dashboard

I'll help you debug immediately!

---

## Pro Tips

🔥 **View logs in real-time**:
```bash
supabase functions logs chat-bot-ai --tail
```
(Keep this running in a separate terminal while testing)

🔥 **Redeploy after code changes**:
```bash
supabase functions deploy chat-bot-ai
```
(Run whenever you update the AI function)

🔥 **Delete a function** (if needed):
```bash
supabase functions delete chat-bot-ai
```

---

You're ready to go! 🚀
