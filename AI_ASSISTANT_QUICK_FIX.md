# 🤖 AI Assistant - Quick Fix Guide

## 🎯 Problem
AI Assistant shows error: **"Failed to get response from AI Assistant"**

## 🔍 Root Cause
Missing `GEMINI_API_KEY` environment variable

---

## ✅ QUICK FIX (5 Minutes)

### Step 1: Get Free Gemini API Key (2 minutes)

1. Go to: **https://aistudio.google.com/app/apikey**
2. Click **"Get API Key"** or **"Create API Key"**
3. Select or create a Google Cloud project
4. Copy the API key (starts with `AIza...`)

### Step 2: Create .env File (1 minute)

1. Navigate to `ml-service` folder:
   ```bash
   cd C:\Users\dell\Desktop\Lab-IQ\ml-service
   ```

2. Create `.env` file:
   ```bash
   # Copy the template
   copy .env.template .env

   # Or create manually with this content:
   GEMINI_API_KEY=your-api-key-here
   ```

3. **Replace `your-api-key-here` with your actual API key**

### Step 3: Install python-dotenv (1 minute)

```bash
cd ml-service
pip install python-dotenv
```

### Step 4: Restart ML Service (1 minute)

Stop the current service (Ctrl+C) and restart:
```bash
python main.py
```

You should see:
```
INFO: Loaded environment variables from .env file
======================================================================
= Lab-IQ Multi-Agent AutoML Service
= Serving on http://localhost:8002
======================================================================
```

### Step 5: Test AI Assistant (30 seconds)

1. Open Lab-IQ: http://localhost:8083
2. Go to **AI Assistant** page
3. Type: **"Hello, can you help me?"**
4. Press Send
5. You should get a response! 🎉

---

## 🎓 What the AI Assistant Does

### 3 Modes:

1. **Analysis Mode** 📊
   - General data analysis questions
   - Pattern recognition
   - Statistical insights

2. **Insights Mode** 🔍
   - Deep correlations
   - Domain-specific analysis (biotech, chemistry)
   - Actionable recommendations

3. **AutoML Mode** 🤖
   - Automated machine learning
   - Model selection and training
   - Performance evaluation

---

## 💡 Making It More Powerful

See **AI_ASSISTANT_DIAGNOSIS_AND_FIX.md** for:
- Complete architecture overview
- Enhancement roadmap
- Advanced features
- Performance tuning

---

## 🚨 Troubleshooting

### Still getting 500 error?
1. Check .env file exists: `dir .env` in ml-service folder
2. Check API key is valid (no extra spaces)
3. Restart ML service
4. Check console logs for errors

### "python-dotenv not installed" warning?
```bash
pip install python-dotenv
```

### API key not working?
- Make sure it starts with `AIza`
- Check no quotes around the key in .env
- Try generating a new key

---

## ✅ Success Checklist

- [ ] Got Gemini API key
- [ ] Created .env file
- [ ] Added API key to .env
- [ ] Installed python-dotenv
- [ ] Restarted ML service
- [ ] Saw "Loaded environment variables" message
- [ ] Tested chat - got response
- [ ] No more 500 errors

---

**That's it! Your AI Assistant should now be working! 🚀**
