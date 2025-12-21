# 🧪 Complete Invitation System Test Script

## Step 1: Test Resend API Directly (2 minutes)

### PowerShell Test (Windows):
```powershell
# Test 1: Direct Resend API Test
$headers = @{
    "Authorization" = "Bearer re_4d756d418f4ab6b75803967221aea96ae0046a5d3eb0b3ee047db4b4ef810bfd"
    "Content-Type" = "application/json"
}

$body = @{
    from = "Lab IQ <onboarding@resend.dev>"
    to = @("YOUR_EMAIL@gmail.com")  # REPLACE WITH YOUR EMAIL
    subject = "Lab-IQ API Test"
    html = "<h1>✅ Resend API Works!</h1><p>If you see this, the API key is valid.</p>"
} | ConvertTo-Json

Write-Host "Testing Resend API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method POST -Headers $headers -Body $body
    Write-Host "✅ SUCCESS! Email sent. ID: $($response.id)" -ForegroundColor Green
    Write-Host "Check your inbox (and spam folder)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
```

### Expected Result:
- ✅ Email arrives in your inbox within 1-2 minutes
- If not, check spam folder

---

## Step 2: Quick Database Health Check

Run in Supabase SQL Editor:
```sql
-- Check all required tables exist
SELECT 
    'team_invitations' as table_name, 
    COUNT(*) as row_count 
FROM team_invitations
UNION ALL
SELECT 'team_members', COUNT(*) FROM team_members
UNION ALL
SELECT 'collaboration_activity', COUNT(*) FROM collaboration_activity
UNION ALL
SELECT 'chat_channels', COUNT(*) FROM chat_channels
UNION ALL
SELECT 'labs', COUNT(*) FROM labs;
```

Expected: All tables should show (even with 0 rows = OK)

---

## Step 3: Run Full Test Suite

```powershell
# Complete Test - Copy and run this whole block
Write-Host "=== LAB-IQ INVITATION TEST SUITE ===" -ForegroundColor Cyan

# Test 1: Resend API
Write-Host "`n[1/2] Testing Resend API..." -ForegroundColor Yellow
$h1 = @{ "Authorization" = "Bearer re_4d756d418f4ab6b75803967221aea96ae0046a5d3eb0b3ee047db4b4ef810bfd"; "Content-Type" = "application/json" }
$b1 = @{ from = "Lab IQ <onboarding@resend.dev>"; to = @("YOUR_EMAIL@gmail.com"); subject = "Test Direct API"; html = "<h1>Test 1</h1>" } | ConvertTo-Json
try { $r1 = Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method POST -Headers $h1 -Body $b1; Write-Host "  ✅ PASS - Email ID: $($r1.id)" -ForegroundColor Green } catch { Write-Host "  ❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red }

Start-Sleep -Seconds 2

# Test 2: Edge Function
Write-Host "`n[2/2] Testing Edge Function..." -ForegroundColor Yellow
$h2 = @{ "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZ3FnenpuY2N2b3FlaWl1Y2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTgwMjMsImV4cCI6MjA4MDA3NDAyM30.p8ZIvchNwsKO7ldTr47GuLJHvcwwuDuhVmhjqLjYW6I"; "Content-Type" = "application/json" }
$b2 = @{ email = "YOUR_EMAIL@gmail.com"; inviterName = "Admin"; labId = "test"; role = "researcher"; invitationToken = "test-$((Get-Random))" } | ConvertTo-Json
try { $r2 = Invoke-RestMethod -Uri "https://engqgzznccvoqeiiuchn.supabase.co/functions/v1/send-team-invitation" -Method POST -Headers $h2 -Body $b2; Write-Host "  ✅ PASS - $($r2.message)" -ForegroundColor Green } catch { Write-Host "  ❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`n=== CHECK YOUR EMAIL (2 messages expected) ===" -ForegroundColor Cyan
```

**ACTION: Replace `YOUR_EMAIL@gmail.com` with your email in BOTH places, then run!**

---

**After running, tell me:** How many tests passed? (0, 1, or 2)
