# 🔧 QUICK FIX - Message Not Sending

## The Problem:
Error: `invalid input syntax for type uuid: "general"`

This means somewhere the word "general" is being used as a channel ID instead of the actual UUID.

## ✅ IMMEDIATE FIX - Try These (In Order):

### Fix 1: Clear Browser Data
```
1. Press F12 (open DevTools)
2. Go to "Application" tab
3. Click "Clear storage" → "Clear site data"
4. Refresh page (F5)
5. Log in again
6. Try sending message
```

### Fix 2: Check URL
**Look at your browser URL bar:**
- If you see: `/collaboration?channel=general` ❌ WRONG
- Should be: `/collaboration` ✅ CORRECT

**If URL has `?channel=general`:**
1. Just go to: `http://localhost:8080/collaboration`
2. Let it auto-select the first channel

### Fix 3: Create a Fresh Channel
```
1. Go to collaboration page
2. Click "+" button in sidebar
3. Create new channel: "test-channel"
4. Click on that channel
5. Try sending message
```

### Fix 4: Check if Channels Exist
**In browser console (F12), run:**
```javascript
// Check what channels exist
console.log("Checking channels...");
```

Then look in the sidebar - do you see any channels listed?

## 🎯 What's Happening:

The code is trying to use "general" as a channel ID, but UUIDs look like:  
`a1b2c3d4-e5f6-7890-abcd-ef1234567890`

Somewhere this got mixed up.

## ✅ AFTER FIXING:

Once you can see channels in the sidebar:
1. Click on a channel
2. Type a message
3. Press Enter
4. Should send successfully!

## 📝 To Test Bot:

Once messages work, try:
```
@LabAI what is PCR?
```

Bot should respond in 3-5 seconds! 🤖

---

**TRY FIX #1 FIRST** (clear browser data) - this usually solves it! 
