# 🧪 LAB-IQ BOT - QUICK TEST SCRIPT

## ⚡ Test the Bot Edge Function (2 minutes)

**Copy and paste this into PowerShell:**

```powershell
# Test LabAI Bot Function
Write-Host "`n🧪 TESTING LAB-IQ BOT..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZ3FnenpuY2N2b3FlaWl1Y2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTgwMjMsImV4cCI6MjA4MDA3NDAyM30.p8ZIvchNwsKO7ldTr47GuLJHvcwwuDuhVmhjqLjYW6I"
    "Content-Type" = "application/json"
}

$body = @{
    message = "@LabAI what is the molecular weight of aspirin (C9H8O4)?"
    channelId = "test-channel-123"
    userId = "test-user-456"
    history = @()
} | ConvertTo-Json

Write-Host "📤 Sending request to bot..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "https://engqgzznccvoqeiiuchn.supabase.co/functions/v1/chat-bot-ai" -Method POST -Headers $headers -Body $body
    
    Write-Host "`n✅ SUCCESS! BOT RESPONDED!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "`n🤖 Model Used: $($response.model)" -ForegroundColor Cyan
    Write-Host "`n📝 Bot Response:" -ForegroundColor White
    Write-Host $response.aiMessage -ForegroundColor Gray
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
} catch {
    Write-Host "`n❌ FAILED!" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    Write-Host "`n💡 Troubleshooting:" -ForegroundColor Cyan
    Write-Host "1. Check if edge function is deployed" -ForegroundColor White
    Write-Host "2. Verify API keys are set in Supabase dashboard" -ForegroundColor White
    Write-Host "3. Check Supabase edge function logs" -ForegroundColor White
}

Write-Host ""
```

---

## 📋 What This Tests:

✅ Edge function is deployed and accessible  
✅ API keys (GROQ/GROK/GEMINI) are configured  
✅ Bot can process scientific questions  
✅ Response formatting works  

---

## ✅ Expected Success Output:

```
🧪 TESTING LAB-IQ BOT...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 Sending request to bot...

✅ SUCCESS! BOT RESPONDED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 Model Used: llama-3.3-70b-versatile

📝 Bot Response:
The molecular weight of aspirin (C9H8O4) is approximately 180.16 g/mol.

To calculate this:
- Carbon (C): 9 atoms × 12.01 g/mol = 108.09 g/mol
- Hydrogen (H): 8 atoms × 1.008 g/mol = 8.064 g/mol
- Oxygen (O): 4 atoms × 16.00 g/mol = 64.00 g/mol

Total: 108.09 + 8.064 + 64.00 = 180.154 g/mol ≈ 180.16 g/mol
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ❌ Common Errors & Solutions:

### Error: "Function not found"
**Solution:** Deploy the edge function first
1. Go to Supabase Dashboard → Edge Functions
2. Deploy `chat-bot-ai`

### Error: "AI service not configured"
**Solution:** Set API keys
1. Supabase Dashboard → Settings → Edge Functions → Environment Variables
2. Add at least one:
   - `GROQ_API_KEY`
   - `GROK_API_KEY`
   - `GEMINI_API_KEY`

### Error: "401 Unauthorized" or "403 Forbidden"
**Solution:** Check API key validity
1. Verify the API key isn't expired
2. Check API provider dashboard (Groq/Grok/Gemini)
3. Try a different provider

---

## 🚀 Next Step After Success:

Once the bot responds successfully, we can wire it up to automatically respond to @LabAI mentions in the chat!

**RUN THE TEST NOW!** 🎯
