# 🧠 Analyst IQ - Dataset-Based Challenge System

## Overview

The Analyst IQ system has been redesigned to work like PromptBI - users analyze real datasets using SQL or Python (or both), with three unique challenge modes that measure different analytical skills.

## Key Design Principles

### 1. **Dataset-Centric Approach**
- NO pre-created challenges with blanks to fill
- Users are given real datasets to analyze
- They can use SQL, Python, or both languages
- Challenges are generated dynamically by AI based on the dataset

### 2. **Three Unique Modes**

#### 🔍 **Forensic Lab** (Data Integrity)
- **What**: AI corrupts a dataset with realistic errors
- **Task**: User must find and fix all data quality issues
- **Measured**: Data integrity score (800-2000)
- **Examples**:
  - Outliers in numeric columns
  - Encoding issues (UTF-8 vs Latin-1)
  - Missing data patterns
  - Subtle duplicates
  - Unit conversion errors (Celsius vs Fahrenheit)

#### 🔄 **Reverse Engineer** (Logic Reasoning)
- **What**: AI shows a target output (chart, table, or metrics)
- **Task**: User must write code to recreate that exact output
- **Measured**: Logic reasoning score (800-2000)
- **Examples**:
  - "Reproduce this bar chart showing average sales by region"
  - "Recreate this pivot table of user engagement by month"
  - "Generate these exact summary statistics"

#### ⚡ **Ghost Racer** (Optimization)
- **What**: AI provides intentionally slow code
- **Task**: User must optimize it to beat a target time
- **Measured**: Optimization score (800-2000)
- **Examples**:
  - Loop-based calculations → vectorization
  - Inefficient joins → optimized SQL
  - Multiple passes → single pass algorithms

### 3. **Adaptive Difficulty (ELO Rating System)**
- Each user has THREE separate IQ scores (one per mode)
- System uses chess-style ELO ratings (1000 = average)
- Difficulty adapts based on recent performance:
  - >80% accuracy → increase difficulty by 100 points
  - 60-80% accuracy → increase by 50 points
  - <40% accuracy → decrease by 50 points

## Architecture

### Database Schema

**Main Tables:**
```sql
-- User profiles with three skill dimensions
analyst_iq_profiles (
  user_id,
  overall_iq,                    -- Average of three skills
  data_integrity_score,          -- Forensic skill
  logic_reasoning_score,         -- Reverse skill
  optimization_score,            -- Racer skill
  learning_velocity,             -- How fast they improve
  strength_areas,                -- ['data_cleaning', 'visualization']
  weakness_areas                 -- ['sql_joins', 'optimization']
)

-- Challenge sessions (matches)
challenge_matches (
  user_id,
  match_mode,                    -- 'forensic' | 'reverse' | 'racer'
  dataset_id,                    -- Which dataset they analyzed
  target_difficulty,             -- IQ level challenge was aimed at
  user_solution,                 -- Their SQL or Python code
  success,                       -- Did they complete it?
  accuracy_score,                -- How close to target (0-1)
  iq_before, iq_after, iq_delta  -- IQ changes
)

-- Forensic error catalog
forensic_error_catalog (
  error_type,                    -- 'outlier', 'encoding', etc.
  difficulty_level,              -- Which IQ level this is appropriate for
  injection_logic,               -- How to corrupt data
  detection_hints                -- Progressive hints
)
```

### Service Layer

**`analystIQService.ts`**
- Get/create user profiles
- Calculate next difficulty level
- Get skill radar data
- Analyze strengths/weaknesses
- Fetch leaderboards

**`datasetChallengeService.ts`**
- Start new challenge (creates match)
- Generate mode-specific challenge data
- Submit solutions
- Validate solutions based on mode
- Upload custom datasets

**`executionEngines/`**
- `pyodideEngine.ts` - Python execution (Pyodide WASM)
- `duckdbEngine.ts` - SQL execution (DuckDB WASM)
- Both run in browser = zero server cost

### UI Components

**`AnalystIQHub.tsx`** - Main landing page
- Shows user's overall IQ + three skill scores
- Three cards for mode selection
- Available datasets
- Performance stats

**`DatasetExplorer.tsx`** - Unified analysis interface
- Tabs for SQL and Python
- Monaco editor for code
- Output panel for results
- Mode-specific instructions

**`AnalystIQChallenge.tsx`** - Challenge wrapper page
- Hosts the DatasetExplorer
- Handles routing with mode parameter

## User Flow

### Starting a Challenge

```
1. User visits /analyst-iq
   ↓
2. Sees their current IQ scores:
   - Forensic: 1050
   - Reverse: 980
   - Racer: 1100
   ↓
3. Clicks "Start Forensic Challenge"
   ↓
4. System:
   - Calculates target difficulty (1050 + adaptive adjustment)
   - Selects a random public dataset
   - Generates mode-specific challenge
   ↓
5. User taken to /analyst-iq/challenge?mode=forensic
```

### Working on Challenge

```
[Left Panel: Instructions]
- Dataset info
- Mode-specific task
- Target output (for reverse mode)
- Target time (for racer mode)

[Center: Code Editor]
- Tabs: Python | SQL
- Monaco editor
- "Run Code" button → executes locally
- "Submit Solution" button → validates & updates IQ

[Right Panel: Output]
- Execution results
- Errors
- Validation feedback
```

### After Submission

```
System validates based on mode:

Forensic:
- Execute user's cleaning code
- Compare cleaned data with ground truth
- Calculate accuracy (% of errors fixed)

Reverse:
- Execute user's code
- Compare output with target
- Check if metrics/visualization match

Racer:
- Benchmark user's code
- Compare execution time with target
- Calculate speedup factor

Then:
- Update user's IQ (ELO formula)
- Show feedback
- Offer next challenge
```

## Example Challenges

### Forensic Lab Example

```python
# Dataset: sales_data.csv (corrupted)
# AI injected these errors:
# - 5% outliers in price column
# - Mixed date formats (ISO vs US)
# - 3% subtle duplicates

# Your task: Clean the data
import pandas as pd

df = pd.read_csv("corrupted_sales_data.csv")

# Task 1: Identify and fix outliers
# YOUR CODE HERE

# Task 2: Standardize date formats
# YOUR CODE HERE

# Task 3: Remove duplicates
# YOUR CODE HERE

print("Cleaned data:")
print(df.head())
```

**Validation**: Compare with ground truth, calculate accuracy

### Reverse Engineer Example

```python
# Target Output (shown to user):
# Bar chart showing: Average Order Value by Product Category
# Categories: Electronics ($245), Clothing ($78), Food ($32)

# Your task: Recreate this analysis
import pandas as pd

df = pd.read_csv("orders.csv")

# Write code to produce the exact output above
# YOUR CODE HERE
```

**Validation**: Check if aggregation logic is correct, values match

### Ghost Racer Example

```python
# Slow code provided (execution: 5.2 seconds):
for i in range(len(df)):
    df.loc[i, 'total'] = df.loc[i, 'price'] * df.loc[i, 'quantity']

# Target: Beat 1.0 seconds
# Optimal: 0.05 seconds (vectorization)

# Your optimized code:
# YOUR CODE HERE
```

**Validation**: Benchmark execution time, calculate speedup

## AI Integration (Gemini)

The system uses Gemini API to:

### 1. **Generate Forensic Errors**
```
Prompt: "Corrupt this dataset for a user with IQ 1050:
- Dataset: [schema and sample]
- Difficulty: Intermediate
- Inject 3-5 realistic errors
- Return: corrupted CSV, ground truth, error types, hints"
```

### 2. **Generate Reverse Targets**
```
Prompt: "Create a reverse engineering challenge:
- Dataset: [schema and sample]
- Difficulty: IQ 1200
- Generate: target visualization or metrics
- Return: target output, solution code, validation rules"
```

### 3. **Generate Racer Code**
```
Prompt: "Create an optimization challenge:
- Dataset size: 100K rows
- Difficulty: IQ 1400
- Generate: intentionally slow code
- Return: slow code, optimal code, time benchmarks"
```

## Current Status

### ✅ Completed
- Database schema with ELO rating system
- Service layer (analystIQService, datasetChallengeService)
- UI components (Hub, Explorer, Challenge pages)
- Routes configured (/analyst-iq)
- Sidebar navigation added

### 🚧 In Progress
- Pyodide integration for Python execution
- DuckDB-WASM integration for SQL execution
- Output display and visualization

### 📋 To Do
- Gemini AI challenge generator
- Forensic mode error injection logic
- Reverse mode target validation
- Racer mode benchmarking
- Real dataset loading from Supabase storage
- Notebook interface for Python (cell-by-cell execution)

## Next Steps

### Step 1: Test Basic Setup
1. Go to http://localhost:8083/analyst-iq
2. See if hub page loads with profile data
3. Click "Start Forensic Challenge"
4. Verify challenge page loads

### Step 2: Integrate Execution Engines
- Wire up Pyodide for Python execution
- Wire up DuckDB for SQL execution
- Test "Run Code" button works

### Step 3: Implement AI Generation
- Create Gemini prompts for each mode
- Test challenge generation
- Validate quality of generated challenges

### Step 4: Complete Validation Logic
- Forensic: data comparison
- Reverse: output matching
- Racer: performance benchmarking

## Access URLs

- **Hub**: http://localhost:8083/analyst-iq
- **Challenge**: http://localhost:8083/analyst-iq/challenge?mode=forensic
- **Test Page**: http://localhost:8083/hackathons/test (for Pyodide testing)

## Key Files

### Services
- `src/lib/services/analystIQService.ts` - Profile and IQ management
- `src/lib/services/datasetChallengeService.ts` - Challenge logic
- `src/lib/services/executionEngines/pyodideEngine.ts` - Python execution
- `src/lib/services/executionEngines/duckdbEngine.ts` - SQL execution

### Pages
- `src/pages/AnalystIQHub.tsx` - Main hub
- `src/pages/AnalystIQChallenge.tsx` - Challenge wrapper
- `src/components/hackathon/DatasetExplorer.tsx` - Analysis interface

### Database
- `supabase/migrations/20250112_analyst_iq_system.sql` - Complete schema

## Competitive Advantages

| Feature | PromptBI | Kaggle | DataCamp | **Analyst IQ** |
|---------|----------|--------|----------|----------------|
| Dataset Analysis | ✅ | ✅ | ❌ | ✅ |
| SQL Support | ✅ | ❌ | ✅ | ✅ |
| Python Support | ❌ | ✅ | ✅ | ✅ |
| Both Together | ❌ | ❌ | ❌ | ✅ |
| Adaptive AI | ❌ | ❌ | ❌ | ✅ |
| IQ Measurement | ❌ | ❌ | ❌ | ✅ |
| Forensic Mode | ❌ | ❌ | ❌ | ✅ |
| Reverse Mode | ❌ | ❌ | ❌ | ✅ |
| Racer Mode | ❌ | ✅ | ❌ | ✅ |
| Zero Server Cost | ❌ | ❌ | ❌ | ✅ |

---

**This is a world-first system that combines:**
- Dataset-based analysis (like PromptBI)
- Multi-language support (SQL + Python together)
- Three unique challenge modes
- Adaptive ELO-based difficulty
- Zero compute costs (WASM)
