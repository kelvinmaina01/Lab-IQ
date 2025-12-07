# 🌐 LAB-IQ - LIVE DEMO ACCESS

**Status**: ✅ **RUNNING**  
**Last Updated**: December 5, 2025, 12:40 PM

---

## 🔗 ACCESS LINKS

### **Local Development**
```
http://localhost:8081
```
Access this from your local machine (where the app is running).

---

### **Network Access** (Share with Testers on Same Network)

Your current network URL:
```
http://192.168.100.240:8081
```

Anyone connected to your WiFi can access this URL to test Lab-IQ! 📱💻

**Note**: Testers must be on the **same WiFi network** as you.

---

### **Public Internet Access** (Share with Anyone, Anywhere)

To make Lab-IQ accessible over the internet (for remote testers):

#### **Option 1: ngrok (Recommended for Testing)** ⭐

**Free & Easy** (2 minutes setup):

1. **Install ngrok**: 
   - Download from https://ngrok.com/download
   - Or use: `winget install --id ngrok.ngrok`

2. **Run ngrok**:
   ```bash
   ngrok http 8080
   ```

3. **Copy the HTTPS URL** (looks like):
   ```
   https://abc123.ngrok-free.app
   ```

4. **Share this URL** with anyone, anywhere! 🌍

**Advantages**:
- ✅ FREE (no credit card required)
- ✅ HTTPS (secure)
- ✅ Works anywhere
- ✅ 2-minute setup

**Limitations**:
- URL changes each time you restart ngrok
- Session timeout after 2 hours (free tier)
- Rate limits on free tier

---

#### **Option 2: Cloudflare Tunnel** (Better for Long-term)

**Free & Permanent URL**:

1. **Install cloudflared**:
   ```bash
   winget install --id Cloudflare.cloudflared
   ```

2. **Create tunnel**:
   ```bash
   cloudflared tunnel --url http://localhost:8080
   ```

3. **Get permanent URL** (first time):
   ```bash
   cloudflare tunnel login
   cloudflared tunnel create lab-iq
   cloudflared tunnel route dns lab-iq lab-iq.yourdomain.com
   ```

**Advantages**:
- ✅ FREE forever
- ✅ Permanent URL
- ✅ HTTPS
- ✅ DDoS protection

---

#### **Option 3: Deploy to Production** (Best for Real Testing)

**Free Hosting Options**:

**Vercel** (Recommended):
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy (from Lab-IQ directory)
vercel

# Follow prompts, get URL like:
# https://lab-iq.vercel.app
```

**Netlify**:
```bash
# Build first
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod

# Get URL like: https://lab-iq.netlify.app
```

**Advantages**:
- ✅ FREE tier available
- ✅ Permanent URL
- ✅ CDN (fast globally)
- ✅ Automatic HTTPS
- ✅ CI/CD integration

---

## 🚀 QUICK START FOR TESTERS

### **What Testers Need to Know**:

**Lab-IQ Demo Login** (if auth required):
```
Email: demo@lab-iq.com
Password: [provide test password]
```

**Or**: Use **Sign Up** to create new account (Supabase Auth)

---

### **Demo Workflow for Testers**:

**1. Landing Page** (`/`)
- Beautiful hero section
- Feature showcase
- "Get Started" CTA

**2. Dashboard** (`/dashboard`)
- Overview metrics
- Recent activity
- Quick actions

**3. Upload Data** (`/upload`)
- **Drag & drop** CSV/Excel file
- Or click to browse
- File validation
- Preview data

**4. Run AutoML** (NEW! 🎉)
- Click **"Run AutoML"** button
- Watch real-time progress (6 stages)
- Get comprehensive results in 30-60 seconds
- View insights, recommendations

**5. Explore Features**:
- **Experiments** (`/experiments`) - Track experiments
- **Models** (`/models`) - View trained models
- **Analytics** (`/analytics`) - Data analytics
- **Collaboration** (`/collaboration`) - Team features
- **Assistant** (`/assistant`) - AI chat assistant

---

## 🎯 TESTING CHECKLIST

### **Critical Flows**:
- [ ] Sign up / Login works
- [ ] Upload CSV file
- [ ] Data preview loads
- [ ] Run AutoML (if integrated)
- [ ] View results
- [ ] Create experiment
- [ ] Navigate between pages
- [ ] Mobile responsive

### **Performance**:
- [ ] Page loads < 3 seconds
- [ ] Smooth animations
- [ ] No console errors
- [ ] Works on Chrome, Firefox, Safari

### **UX/UI**:
- [ ] Beautiful design
- [ ] Intuitive navigation
- [ ] Clear CTAs
- [ ] Helpful error messages

---

## 💻 CURRENT STATUS

### **Services Running**:

✅ **Frontend** (React)
- Port: `8080`
- Status: RUNNING
- URL: `http://localhost:8080`

✅ **ML Service** (FastAPI)
- Port: `8002`
- Status: RUNNING
- URL: `http://localhost:8002`
- Health: `http://localhost:8002/health`

✅ **Database** (Supabase)
- Status: CONNECTED
- Storage: Available
- Auth: Enabled

---

## 🐛 TROUBLESHOOTING

### **Can't Access on Network**:
```bash
# Check Windows Firewall
# Allow port 8080 inbound:
netsh advfirewall firewall add rule name="Lab-IQ Dev" dir=in action=allow protocol=TCP localport=8080
```

### **ngrok Not Working**:
```bash
# Make sure port 8080 is running first
curl http://localhost:8080

# Then start ngrok
ngrok http 8080
```

### **App Not Loading**:
```bash
# Restart frontend
cd C:\Users\dell\Desktop\Lab-IQ
npm run dev
```

---

## 📊 DEMO DATA

### **Sample CSV for Testing**:

**Download**: [sample-lab-data.csv]

Or create a simple CSV:
```csv
experiment_id,temperature,pressure,yield,success
EXP001,25,100,85.2,1
EXP002,30,120,92.1,1
EXP003,35,110,78.5,0
EXP004,28,105,89.3,1
EXP005,32,115,91.8,1
```

Save as `test-data.csv` and upload to Lab-IQ!

---

## 🎉 FEEDBACK

### **Where to Send Feedback**:

**Bugs/Issues**:
- GitHub Issues: [link]
- Email: bugs@lab-iq.com
- Slack: #bug-reports

**Feature Requests**:
- Email: features@lab-iq.com
- Slack: #feature-requests

**General Feedback**:
- Email: feedback@lab-iq.com
- Twitter: @LabIQ

---

## 🔐 SECURITY NOTES

### **For Public Testing**:
- ⚠️ Don't upload **real/sensitive data** to demo
- ⚠️ Use **test accounts only**
- ⚠️ Demo data will be **wiped regularly**
- ⚠️ Not for **production use** yet

### **For Production**:
- ✅ All data encrypted at rest
- ✅ HTTPS only
- ✅ Supabase RLS (Row Level Security)
- ✅ Audit logs enabled

---

## 🚀 DEPLOYMENT CHECKLIST

Before sharing widely:

### **Pre-Launch**:
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Create demo account
- [ ] Prepare sample data
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics (PostHog/Mixpanel)

### **Launch**:
- [ ] Deploy to Vercel/Netlify
- [ ] Set up custom domain (optional)
- [ ] Enable HTTPS
- [ ] Configure environment variables
- [ ] Set up monitoring

### **Post-Launch**:
- [ ] Monitor error rates
- [ ] Track user behavior
- [ ] Collect feedback
- [ ] Iterate quickly

---

## 📞 QUICK COMMANDS

### **Restart Everything**:
```bash
# Frontend
cd C:\Users\dell\Desktop\Lab-IQ
npm run dev

# ML Service
cd C:\Users\dell\Desktop\Lab-IQ\ml-service
.\venv\Scripts\activate
python main.py
```

### **Check Status**:
```bash
# Frontend
curl http://localhost:8080

# ML Service
curl http://localhost:8002/health
```

### **Build for Production**:
```bash
# Frontend
npm run build

# Preview production build
npm run preview
```

---

**Happy Testing! 🧪🔬**

*For questions, contact: [your-email]*
