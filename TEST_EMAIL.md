# 🧪 Test Email Invitation

## Quick Test Steps:

### 1. Open Your App
Go to: http://localhost:8080/collaboration

### 2. Click "Invite Member"
Look for the invite button in the collaboration page

### 3. Enter Email Details
- **Email**: Use YOUR actual email (Gmail, Yahoo, etc.)
- **Role**: Select "Researcher" or "Admin"
- **Click**: Send Invitation

### 4. Check Results

**In App**: Should show "✅ Invitation sent successfully!"

**In Your Email** (check in 10-30 seconds):
- **Check Inbox first**
- **Then check Spam folder**
- **Look for email from**: "Lab IQ <onboarding@resend.dev>"
- **Subject**: "You've been invited to join Lab IQ"

---

## ✅ What the Email Contains:

- 🔬 Lab IQ branding
- Invitation from: [Your Name]
- Your role: [Researcher/Admin/etc]
- Blue "Accept Invitation" button
- Features overview
- Permissions list

---

## 🔍 If Email Doesn't Arrive:

### Option 1: Check Resend Dashboard
1. Go to: https://resend.com/emails
2. Login to your Resend account
3. Look for the most recent email
4. Check status:
   - ✅ Delivered = Email sent successfully
   - ❌ Bounced = Email address invalid
   - ⏳ Queued = Still processing

### Option 2: Check Browser Console
1. Open browser console (F12)
2. Go to "Network" tab
3. Send invitation again
4. Look for request to `send-team-invitation`
5. Check response for errors

---

## 🚨 Common Issues:

### Issue 1: "Success" but no email
**Cause**: Domain not verified OR API key wrong
**Fix**: Using `onboarding@resend.dev` (should work now)

### Issue 2: Email in spam
**Cause**: First email from new sender
**Fix**: Mark as "Not Spam" - future emails will go to inbox

### Issue 3: Resend API error
**Cause**: API key expired or rate limit
**Check**: https://resend.com/settings/api-keys
**Fix**: Make sure API key is active

---

## 📧 Test Email Address Format

**Any of these work**:
- ✅ Gmail: `yourname@gmail.com`
- ✅ Yahoo: `yourname@yahoo.com`
- ✅ Outlook: `yourname@outlook.com`
- ✅ Corporate: `yourname@company.com`
- ✅ Any valid email!

The `onboarding@resend.dev` domain is verified by Resend, so it can send to ANY email address.

---

## 🎯 Expected Timeline:

1. **Click "Send"** → Instant success message
2. **Wait 5-10 seconds** → Email processing
3. **Check inbox** → Email should arrive
4. **If not in inbox** → Check spam (wait 30 seconds)
5. **Still nothing?** → Check Resend dashboard

---

## ✅ Success Indicators:

- ✅ App shows "Invitation sent successfully"
- ✅ Email arrives within 30 seconds
- ✅ Email looks professional with Lab IQ branding
- ✅ "Accept Invitation" button works
- ✅ Can send to multiple emails

---

**TRY IT NOW!** Send an invitation to your email and report back! 🚀
