# 🚀 Deploy Edge Functions NOW - Manual Steps

## ✅ Your Info:
- Project ID: `engqgzznccvoqeiiuchn`
- Project URL: https://supabase.com/dashboard/project/engqgzznccvoqeiiuchn
- Secrets: ✅ GROK_API_KEY set, ✅ RESEND_API_KEY set

---

## 🎯 Deploy via Supabase Dashboard (3 minutes)

### Step 1: Go to Edge Functions

1. Open: https://supabase.com/dashboard/project/engqgzznccvoqeiiuchn/functions
2. You should see the Edge Functions page

---

### Step 2: Deploy chat-bot-ai Function

#### Option A: If you see "Create a new function" button:

1. Click **"Create a new function"**
2. Function name: `chat-bot-ai`
3. Click **"Create function"**
4. You'll see code editor

#### Option B: If you already see function listed:

1. Click on **"chat-bot-ai"** in the list
2. Go to the **"Code"** tab

---

### Step 3: Upload Function Code

#### Method 1: Copy-Paste Code (Recommended)

1. **Open your local file**: `C:\Users\dell\Desktop\Lab-IQ\supabase\functions\chat-bot-ai\index.ts`

2. **Copy ALL the code** from that file

3. **In Supabase dashboard**:
   - Paste the code into the editor
   - Click **"Deploy"** or **"Save and Deploy"**

#### Method 2: Upload via CLI (if you want to try again)

In PowerShell:
```powershell
cd C:\Users\dell\Desktop\Lab-IQ
npx supabase@latest functions deploy chat-bot-ai --project-ref engqgzznccvoqeiiuchn
```

---

### Step 4: Verify Deployment

After deploying, you should see:
- ✅ Status: "Deployed" or "Active"
- ✅ A green checkmark
- ✅ Function URL showing

---

### Step 5: Deploy send-team-invitation Function

Repeat Step 2-4 but for:
- Function name: `send-team-invitation`
- File location: `C:\Users\dell\Desktop\Lab-IQ\supabase\functions\send-team-invitation\index.ts`

---

## 🧪 Test @LabAI

After both functions are deployed:

1. **Make sure dev server is running**:
   ```bash
   npm run dev
   ```

2. **Open**: http://localhost:8080/collaboration

3. **Go to any channel** (like #general)

4. **Type**:
   ```
   @LabAI Hello! What is PCR?
   ```

5. **Expected Result** (1-3 seconds):
   ```
   🤖 LabAI Response
   PCR (Polymerase Chain Reaction) is a molecular biology technique...
   ```

---

## ❌ If Manual Deploy Doesn't Work

Try this PowerShell command (simpler):

```powershell
cd C:\Users\dell\Desktop\Lab-IQ

# Deploy AI function
npx -y supabase@latest functions deploy chat-bot-ai --project-ref engqgzznccvoqeiiuchn --no-verify-jwt

# Deploy email function
npx -y supabase@latest functions deploy send-team-invitation --project-ref engqgzznccvoqeiiuchn --no-verify-jwt
```

The `-y` flag auto-confirms the installation.

---

## 🔍 Check if Functions Are Deployed

Go to: https://supabase.com/dashboard/project/engqgzznccvoqeiiuchn/functions

You should see:
- ✅ chat-bot-ai | Status: Active
- ✅ send-team-invitation | Status: Active

---

## 🎉 Success = This Works

```
You: @LabAI what is PCR?

🤖 LabAI Response (appears in 1-3 seconds):
PCR (Polymerase Chain Reaction) is a molecular biology technique
used to amplify specific DNA sequences. It involves:

1. **Denaturation** (94-96°C): DNA double helix separates
2. **Annealing** (50-65°C): Primers bind to target sequence
3. **Extension** (72°C): DNA polymerase synthesizes new strand

Would you like me to help design a PCR protocol?
```

✅ **If you see this, everything is working!**

---

## 📞 Need Help?

If you get stuck:
1. Screenshot the Supabase Edge Functions page
2. Tell me what you see
3. I'll guide you through it

---

## Alternative: I Can Give You the Code to Copy-Paste

If you prefer, I can show you EXACTLY what code to paste in the Supabase dashboard editor. Just let me know!
