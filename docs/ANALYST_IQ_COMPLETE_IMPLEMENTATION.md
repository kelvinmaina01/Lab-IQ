# 🧠 ANALYST IQ SYSTEM - COMPLETE IMPLEMENTATION GUIDE

## 🎯 WHAT WE'RE BUILDING

A revolutionary 3-mode data science training system that measures "Analyst IQ" across:
1. **Forensic Lab** - Data debugging & quality (Data Integrity Score)
2. **Reverse Engineer** - Logic reconstruction (Logic Reasoning Score)
3. **Ghost Racer** - Code optimization (Optimization Score)

## ✅ COMPLETED SO FAR

### 1. Database Schema ✓
- **File**: `supabase/migrations/20250112_analyst_iq_system.sql`
- **Tables Created**:
  - `analyst_iq_profiles` - User skill tracking (ELO ratings)
  - `challenge_matches` - Game sessions
  - `performance_events` - Granular tracking
  - `forensic_error_catalog` - Error injection library
  - `reverse_targets` - Target outputs
  - `racer_benchmarks` - Performance benchmarks

### 2. ELO Rating System ✓
- Chess-style IQ calculation (1000-2000 range)
- Adaptive difficulty matching
- Skill-specific ratings per mode

### 3. Test Page ✓
- **URL**: http://localhost:8083/hackathons/test
- Tests Pyodide execution

## 🚀 NEXT STEPS - WHAT TO IMPLEMENT

### Step 1: Apply New Database Migration

```bash
# Copy SQL from: supabase/migrations/20250112_analyst_iq_system.sql
# Paste into: Supabase Dashboard → SQL Editor → Run
```

### Step 2: Create the Smart Agent Services

I need to create 4 key service files:

#### A. `analystIQService.ts` - Profile Management
```typescript
// Handles user IQ profiles, skill tracking, difficulty matching
- getOrCreateProfile(userId)
- calculateNextDifficulty(userId, mode)
- updateSkillRatings(userId, matchResult)
- getSkillRadarData(userId) // For visualization
```

#### B. `forensicModeService.ts` - Data Corruption
```typescript
// Injects realistic errors into datasets
- injectErrors(dataset, userIQ)
- validateCleaning(userDataset, truthDataset)
- generateHints(errorType, attemptNumber)
```

#### C. `reverseModeService.ts` - Target Generation
```typescript
// Creates analysis targets from datasets
- generateTarget(dataset, userIQ)
- validateSolution(userCode, targetOutput)
- compareOutputs(userResult, targetResult)
```

#### D. `racerModeService.ts` - Optimization Challenges
```typescript
// Creates slow code → optimize challenges
- generateSlowCode(operation, userIQ)
- benchmarkCode(userCode, testData)
- detectOptimizations(userCode)
```

### Step 3: Create React Components

#### A. Mode Selector
```tsx
<HackathonModeSelector />
// Forensic Lab | Reverse Engineer | Ghost Racer
// Shows user's IQ in each dimension
```

#### B. Forensic Lab UI
```tsx
<ForensicLab />
// Upload dataset → AI corrupts it → User debugs
// Side-by-side: Corrupted vs Your Fix
```

#### C. Reverse Engineer UI
```tsx
<ReverseEngineer />
// Shows target chart/table → User writes code
// Live comparison of outputs
```

#### D. Ghost Racer UI
```tsx
<GhostRacer />
// Shows slow code → User optimizes
// Real-time execution time comparison
```

### Step 4: Gemini Integration

Create system prompts for challenge generation:

**Forensic Mode Prompt**:
```
You are a data quality adversary. Given this dataset:
{dataset_info}

User IQ: {user_iq}

Inject {difficulty_appropriate} realistic errors:
- At IQ 800: Simple outliers
- At IQ 1200: Mixed unit conversions
- At IQ 1600: Subtle encoding issues

Return JSON with:
- corrupted_data: Modified CSV
- error_types: List of what you changed
- ground_truth: Original clean data
- hints: Progressive clues
```

### Step 5: Python Runner Component (CRITICAL FIX)

```tsx
// src/components/PythonRunner.tsx
import { useEffect, useRef, useState } from 'react';

export function PythonRunner({ code, onOutput, onError }) {
  const pyodideRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // Load from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
      script.onload = async () => {
        pyodideRef.current = await window.loadPyodide();
        await pyodideRef.current.loadPackage(['pandas', 'numpy', 'matplotlib']);
        setLoading(false);
      };
      document.head.appendChild(script);
    }
    init();
  }, []);

  const runCode = async () => {
    try {
      const result = await pyodideRef.current.runPythonAsync(code);
      onOutput(result);
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <button onClick={runCode} disabled={loading}>
      {loading ? 'Loading Pyodide...' : 'Run Code'}
    </button>
  );
}
```

## 📊 HOW THE IQ SYSTEM WORKS

### Initial Assessment (First 3 Challenges)
User gets challenges at IQ 1000 (average) across all modes to establish baseline.

### Adaptive Difficulty
```typescript
function calculateNextDifficulty(userIQ: number, recentPerformance: Performance[]): number {
  const baseTarget = userIQ;

  // If user is crushing it (>80% accuracy), increase difficulty
  const avgAccuracy = recentPerformance.map(p => p.accuracy).average();

  if (avgAccuracy > 0.8) {
    return baseTarget + 100; // Challenge them more
  } else if (avgAccuracy < 0.4) {
    return baseTarget - 50; // Ease up a bit
  }

  return baseTarget + 20; // Slight progressive challenge
}
```

### ELO Rating Update
```typescript
// After each match:
Expected Score = 1 / (1 + 10^((OpponentIQ - UserIQ) / 400))
Actual Score = Success ? (0.5 + performance*0.5) : (performance*0.5)
IQ Change = K * (Actual - Expected)

// K-factor = 32 (how much IQ can change per match)
```

### Skill Radar Chart
```typescript
{
  data_integrity: 1200,    // Forensic skill
  logic_reasoning: 950,    // Reverse skill
  optimization: 1150,      // Racer skill
  overall_iq: 1100        // Average
}
```

## 🎮 USER FLOW EXAMPLE

### Forensic Lab Mode:
```
1. User uploads "sales_data.csv"
2. AI (at user IQ 1050) injects:
   - 3% outliers in price column
   - Mixed date formats (ISO vs US)
   - Silent duplicates with 1 char difference
3. User sees corrupted data
4. User writes cleaning code
5. System compares:
   - User's cleaned data vs Ground Truth
   - Accuracy: 95% match → Success!
   - IQ gain: +15 points
6. New challenge at IQ 1065
```

### Reverse Engineer Mode:
```
1. AI shows bar chart: "Average Yield by Region"
2. User must write code to reproduce it
3. System validates:
   - Did they group by region? ✓
   - Did they calculate mean? ✓
   - Is output identical? ✓
4. Logic reasoning +20 IQ
```

### Ghost Racer Mode:
```
1. AI shows slow code:
   for i in range(len(df)):
     df.loc[i, 'new'] = df.loc[i, 'old'] * 2
   # Execution: 5.2 seconds

2. Challenge: "Beat 1.0 seconds"
3. User optimizes:
   df['new'] = df['old'] * 2
   # Execution: 0.05 seconds

4. Speedup: 104x → Optimization +30 IQ
```

## 🔧 ENVIRONMENT SETUP

Add to `.env`:
```
VITE_GEMINI_API_KEY=your_actual_key_here
```

## 📝 IMPLEMENTATION CHECKLIST

- [x] Database schema created
- [x] ELO rating system designed
- [x] Test page created
- [ ] Apply database migration
- [ ] Create `analystIQService.ts`
- [ ] Create `forensicModeService.ts`
- [ ] Create `reverseModeService.ts`
- [ ] Create `racerModeService.ts`
- [ ] Build `HackathonModeSelector` component
- [ ] Build `ForensicLab` component
- [ ] Build `ReverseEngineer` component
- [ ] Build `GhostRacer` component
- [ ] Fix `PythonRunner` component
- [ ] Test all 3 modes
- [ ] Add Gemini AI generation
- [ ] Deploy

## 🚀 IMMEDIATE ACTION

**RIGHT NOW - Do these 3 things:**

1. **Apply Migration**:
   - Go to Supabase Dashboard
   - SQL Editor → New Query
   - Copy content from `20250112_analyst_iq_system.sql`
   - Run it

2. **Test Python Execution**:
   - Go to: http://localhost:8083/hackathons/test
   - Click "Test Pyodide Directly"
   - Wait 10-15 seconds
   - Tell me: Does it work?

3. **Check Gemini API**:
   - Verify your `.env` has `VITE_GEMINI_API_KEY`
   - Test: https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY
   - Should return list of models

## 📊 WHAT THIS UNLOCKS

With this system, you'll have:

✅ **First-of-its-kind** data science training platform
✅ **Adaptive difficulty** that grows with the user
✅ **3 unique game modes** no one else has
✅ **Scientific IQ measurement** (like chess ratings)
✅ **Portfolio building** (coming next)
✅ **GitHub integration** (coming next)
✅ **Zero server costs** (WASM execution)

## 🎯 COMPETITIVE ADVANTAGE

| Feature | PromptBI | Kaggle | DataCamp | **Lab-IQ** |
|---------|----------|--------|----------|------------|
| Adaptive AI | ❌ | ❌ | ❌ | ✅ |
| IQ Measurement | ❌ | ❌ | ❌ | ✅ |
| Data Debugging | ❌ | ❌ | ❌ | ✅ |
| Reverse Engineering | ❌ | ❌ | ❌ | ✅ |
| Code Optimization | ❌ | ✅ | ❌ | ✅ |
| Custom Datasets | ❌ | ✅ | ❌ | ✅ (coming) |
| GitHub Sync | ❌ | ✅ | ❌ | ✅ (coming) |

---

**This is revolutionary. Let's build it! 🚀**

Tell me when you've:
1. Applied the migration
2. Tested the Python runner
3. Confirmed Gemini API works

Then I'll create all the service files and components!
