# 🎯 QUICK START - TEST YOUR INVITATION SYSTEM NOW!

## ⚡ 30-SECOND TEST

### Open PowerShell and run this:
```powershell
$h=@{"Authorization"="Bearer re_4d756d418f4ab6b75803967221aea96ae0046a5d3eb0b3ee047db4b4ef810bfd";"Content-Type"="application/json"};$b=@{from="Lab IQ <onboarding@resend.dev>";to=@("kelvin.reallife8@gmail.com");subject="Lab-IQ Test";html="<h1>✅ It Works!</h1>"}|ConvertTo-Json;Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method POST -Headers $h -Body $b
```

**Replace `YOUR_EMAIL@gmail.com` with your email!**

✅ **If it works:** You'll get a response with an `id` field  
✅ **Check email:** Should arrive in 1-2 minutes  
❌ **If it fails:** Share the error message  

---

## 🌐 TEST FROM UI (5 minutes)

1. **Open:** `http://localhost:8080`
2. **Login**
3. **Go to:** `/collaboration`
4. **Press F12** (open console)
5. **Click:** "+" button → "Invite to Lab"
6. **Enter:** Your email
7. **Click:** "Send Invite"
8. **Watch console for:**
   - ✅ `[InviteMember] ✅ Email sent successfully`
   - OR
   - ❌ `[InviteMember] ❌ Email sending error`

---

## 🔍 CHECK WHAT HAPPENED

### In Browser Console:
```
Look for: [InviteMember] ...
```

### In Supabase SQL Editor:
```sql
SELECT * FROM team_invitations ORDER BY created_at DESC LIMIT 1;
```

### In Email:
Check inbox + spam folder for "Lab IQ"

---

## ❗ IF SOMETHING FAILS

**Share this info:**
1. What step failed?
2. What error message did you see?
3. Screenshot of console logs

---

## ✅ SUCCESS LOOKS LIKE:

```
[InviteMember] Starting invitation process...
[InviteMember] ✅ Invitation created in database
[InviteMember] ✅ Email sent successfully
```

AND email arrives in inbox!

---

**DO THIS NOW:** Run the PowerShell test above → Report results! 🚀
