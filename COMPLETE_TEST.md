# 🧪 COMPLETE TEST - Step by Step

## I understand you're frustrated. Let me help you test everything properly.

---

## ✅ **STEP 1: Restart Your Dev Server**

**Close your current terminal** and open a NEW one:

```bash
cd C:\Users\dell\Desktop\Lab-IQ
npm run dev
```

Wait until you see:
```
VITE ready in XXXms
Local: http://localhost:8080
```

---

## ✅ **STEP 2: Test @LabAI Bot**

1. **Open browser**: http://localhost:8080/collaboration

2. **Click on #general channel**

3. **Type EXACTLY this**:
   ```
   @LabAI hello
   ```

4. **Press ENTER**

5. **WAIT 5 seconds**

### **Expected Result:**
You should see a response that starts with `[AI]` or `🤖 LabAI Response`

### **If NO response:**
- Open browser console (F12)
- Type `@LabAI hello` again
- Copy ALL red errors and send them to me
- Also run this command:
  ```bash
  curl -X POST https://engqgzznccvoqeiiuchn.supabase.co/functions/v1/chat-bot-ai \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZ3FnenpuY2N2b3FlaWl1Y2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxMjg5OTEsImV4cCI6MjA0ODcwNDk5MX0.qfuXaXW3E1dD50HmRsWGb-OZgKAOa8wLOiXtI6-QHUM" \
    -d '{"message":"test","channelId":"test","userId":"test"}'
  ```

---

## ✅ **STEP 3: Test Email Invitations**

1. **In the app**, click "Invite Member"

2. **Enter YOUR real email**

3. **Select role**: Researcher

4. **Click Send**

5. **Open browser console (F12)** → Look for errors

### **Expected Result:**
- App shows: "✅ Invitation dispatched!"
- Console shows: "Email sent successfully"
- Email arrives in 10-30 seconds

### **If fails:**
- Copy the EXACT error from console
- Tell me what it says

---

## 🔍 **DEBUGGING INFO I NEED:**

If nothing works, please send me:

### 1. Browser Console Errors
- Press F12
- Go to Console tab
- Screenshot or copy ALL red errors

### 2. Network Tab
- Press F12
- Go to Network tab
- Try sending invitation
- Click on the failed request
- Screenshot the Response tab

### 3. Server Logs
In your terminal where `npm run dev` is running, check for errors

---

## 📋 **CHECKLIST - Tell me YES or NO for each:**

- [ ] Dev server is running on port 8080?
- [ ] Can you see the collaboration page?
- [ ] Can you see channels in the sidebar?
- [ ] When you type @LabAI, does ANYTHING happen?
- [ ] When you click Invite Member, does the modal open?
- [ ] What EXACT error do you see in console?

---

## 🚨 **QUICK SANITY CHECK:**

Run these commands and tell me the output:

```bash
# Check Edge Functions
npx -y supabase@latest functions list --project-ref engqgzznccvoqeiiuchn

# Check if tables exist
# Go to: https://supabase.com/dashboard/project/engqgzznccvoqeiiuchn/editor
# Look for: team_invitations, collaboration_activity
# Tell me: YES or NO
```

---

## 💡 **What I Need From You:**

Please do the tests above and tell me:

1. **For @LabAI test**: Did bot respond? If not, what error?
2. **For Invitations**: Did it work? If not, exact error message?
3. **Screenshots** of any errors in console

Then I can fix the exact issue instead of guessing.

---

I'm here to help - let's solve this together! 🚀
