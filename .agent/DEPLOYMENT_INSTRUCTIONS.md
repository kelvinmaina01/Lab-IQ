# 🚀 Lab-IQ Collaboration - Deployment Instructions

## ✅ NO DATABASE MIGRATIONS NEEDED

The chat system already has all required tables and columns:
- ✅ `chat_messages` table exists
- ✅ `is_bot` column exists
- ✅ `bot_metadata` JSONB column exists
- ✅ All RLS policies configured

**You don't need to run any SQL migrations!**

---

## 📦 Edge Function Deployment

### Step 1: Deploy AI Bot Function

The `chat-bot-ai` function has been enhanced with:
- ✅ Comprehensive logging with `[LabAI]` prefix
- ✅ Latest GROQ model: `llama-3.3-70b-versatile`
- ✅ Better error handling
- ✅ Multi-provider fallback (GROQ → Grok → Gemini)

**Deploy via Supabase Dashboard:**

1. Go to: https://supabase.com/dashboard/project/engqgzznccvoqeiiuchn/functions
2. Find: `chat-bot-ai` function
3. Click: **"Deploy"** or **"Redeploy"**
4. Confirm deployment

---

## 🔑 Environment Variables

### Required (at least one):

1. **GROQ_API_KEY** (Recommended - fastest and best quality)
   - Get from: https://console.groq.com/keys
   - Your key: `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`

2. **GEMINI_API_KEY** (Fallback)
   - Already set: `AIzaSyBywjakOPecdzFRJ1KJ-UrgYRKI8nfiVwI`

3. **GROK_API_KEY** (Optional)
   - Get from: https://x.ai/api

### How to Set in Supabase:

1. Go to: **Settings → Edge Functions → Environment Variables**
2. Click: **Add Variable**
3. Set:
   ```
   Name: GROQ_API_KEY
   Value: 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
   ```
4. Click: **Save**
5. **Redeploy** the edge function

---

## 🧪 Test the Bot Function

### Quick Test (PowerShell):

```powershell
# Test the bot edge function
$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZ3FnenpuY2N2b3FlaWl1Y2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTgwMjMsImV4cCI6MjA4MDA3NDAyM30.p8ZIvchNwsKO7ldTr47GuLJHvcwwuDuhVmhjqLjYW6I"
    "Content-Type" = "application/json"
}

$body = @{
    message = "What is the molecular weight of water?"
    userId = "test-user-id"
    channelId = "test-channel-id"
    history = @()
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://engqgzznccvoqeiiuchn.supabase.co/functions/v1/chat-bot-ai" -Method POST -Headers $headers -Body $body
```

**Expected Response:**
```json
{
  "success": true,
  "aiMessage": "The molecular weight of water (H₂O) is approximately 18.015 g/mol...",
  "model": "llama-3.3-70b"
}
```

---

## 📝 What's Next

After deploying the edge function:

1. ✅ **Phase 1 Complete:** AI bot backend ready
2. 🔄 **Phase 2 In Progress:** Wiring up frontend
3. ⏭️ **Phase 3 Next:** Scientific UI redesign
4. ⏭️ **Phase 4 Later:** Performance optimization

---

## 🔍 Troubleshooting

### If bot doesn't respond:

1. **Check Edge Function Logs:**
   - Supabase Dashboard → Edge Functions → `chat-bot-ai` → Logs
   - Look for `[LabAI]` prefix logs

2. **Verify API Key:**
   - Settings → Edge Functions → Environment Variables
   - Ensure `GROQ_API_KEY` is set

3. **Check Console Logs:**
   - Browser F12 → Console
   - Look for frontend errors

### Common Issues:

❌ **"AI service not configured"**
- Solution: Set GROQ_API_KEY environment variable

❌ **"GROQ API failed: 401"**
- Solution: Check API key is valid

❌ **No response from bot**
- Solution: Check edge function deployment status

---

## ✅ Deployment Checklist

- [ ] Deploy `chat-bot-ai` edge function
- [ ] Set `GROQ_API_KEY` environment variable
- [ ] Test bot with PowerShell command
- [ ] Check edge function logs for `[LabAI]` messages
- [ ] Verify response contains scientific content

**Once deployed, the bot will automatically respond to @LabAI mentions!**
