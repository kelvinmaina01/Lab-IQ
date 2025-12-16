# 🚀 Hackathon V2 - Complete Implementation Plan

## Overview
Major improvements to make hackathons production-ready with adaptive AI and better UX.

## Key Changes

### 1. **Notebook Interface for Python** 📓
- Replace Monaco editor with Jupyter-style notebooks for Python
- Users can run code cell-by-cell
- Better for data exploration and visualization
- SQL/R keep the regular editor

### 2. **Adaptive AI Agent** 🧠
- Measures user's analytical IQ based on performance
- Tracks: speed, accuracy, code quality, problem-solving approach
- Generates personalized challenges matching their level
- Adjusts difficulty dynamically

### 3. **Comment-Based Challenges** 💬
Instead of blanks:
```python
# Task 1: Load the dataset and display first 5 rows
# YOUR CODE HERE

# Task 2: Calculate mean, median, std for 'price' column
# YOUR CODE HERE

# Task 3: Create a histogram of the price distribution
# YOUR CODE HERE
```

### 4. **Visual Output Pinning** 📌
- Capture all plots/tables generated
- Users can "pin" best visualizations
- Build a portfolio dashboard
- Share insights

### 5. **GitHub Integration** 🔗
- Export analysis as Jupyter notebooks
- Auto-sync to GitHub repo
- Create portfolio website
- Share with employers

### 6. **Custom Dataset Upload** 📊
- Users upload their own CSV/Excel
- AI analyzes dataset and suggests challenges
- Practice with real-world data

## Implementation Steps

### Phase 1: Fix Current Issues (URGENT)
- [ ] Debug why "Run Code" isn't working
- [ ] Create test page at `/hackathons/test`
- [ ] Verify Pyodide loads correctly
- [ ] Test with simple code execution

### Phase 2: Notebook Interface
- [ ] Install/integrate Jupyter notebook component
- [ ] Create cell-based execution system
- [ ] Add cell output display
- [ ] Support markdown cells for documentation

### Phase 3: Adaptive AI Agent
- [ ] Create user performance tracking schema
- [ ] Build IQ/ability measurement algorithm
- [ ] Implement adaptive difficulty system
- [ ] Generate personalized challenges

### Phase 4: Enhanced Features
- [ ] Visual output capture system
- [ ] Portfolio dashboard page
- [ ] GitHub export/sync
- [ ] Custom dataset upload

## Technical Architecture

### Notebook Component Options
1. **@nteract/notebook-render** - React notebook renderer
2. **jupyterlab-react** - Full JupyterLab in React
3. **Custom** - Build our own with Monaco + cell management

### AI Performance Tracking
```typescript
interface UserPerformanceProfile {
  user_id: string;
  analytical_iq_score: number; // 0-100
  strengths: string[]; // ["visualization", "statistics"]
  weaknesses: string[]; // ["data cleaning", "sql joins"]
  learning_pace: 'fast' | 'medium' | 'slow';
  preferred_difficulty: string;
  recommended_next_challenge: string;
}
```

### Challenge Format V2
```typescript
interface ChallengeTask {
  task_number: number;
  instruction: string; // What to do
  hint_levels: string[]; // Progressive hints
  expected_code_patterns: string[]; // For quality assessment
  expected_output_type: 'plot' | 'table' | 'metric' | 'text';
  difficulty_weight: number; // For IQ calculation
}
```

## Database Updates Needed

```sql
-- User performance tracking
CREATE TABLE user_performance_profiles (
  user_id UUID PRIMARY KEY,
  analytical_iq_score INTEGER DEFAULT 50,
  coding_speed_percentile INTEGER,
  accuracy_rate DECIMAL,
  avg_attempts_per_challenge DECIMAL,
  strengths JSONB,
  weaknesses JSONB,
  learning_velocity DECIMAL,
  last_assessed TIMESTAMPTZ
);

-- Performance events for ML
CREATE TABLE performance_events (
  id UUID PRIMARY KEY,
  user_id UUID,
  event_type TEXT, -- 'challenge_attempt', 'hint_used', 'time_taken'
  challenge_id UUID,
  metrics JSONB,
  created_at TIMESTAMPTZ
);

-- Notebook cells
CREATE TABLE challenge_notebook_cells (
  id UUID PRIMARY KEY,
  challenge_id UUID,
  cell_order INTEGER,
  cell_type TEXT, -- 'code' | 'markdown'
  content TEXT,
  expected_output JSONB
);
```

## Adaptive Algorithm

```python
def calculate_analytical_iq(user_history):
    """
    Calculates user's analytical IQ (0-100)
    Based on multiple factors
    """
    factors = {
        'speed': weight_speed(user_history.avg_time),
        'accuracy': user_history.success_rate,
        'code_quality': analyze_code_patterns(user_history),
        'problem_solving': measure_approach_sophistication(user_history),
        'learning_rate': calculate_improvement_velocity(user_history)
    }

    # Weighted average
    iq_score = (
        factors['speed'] * 0.2 +
        factors['accuracy'] * 0.3 +
        factors['code_quality'] * 0.2 +
        factors['problem_solving'] * 0.2 +
        factors['learning_rate'] * 0.1
    ) * 100

    return min(100, max(0, iq_score))

def generate_next_challenge(user_iq, user_profile):
    """
    Generates challenge at appropriate difficulty
    """
    # Target: slightly above current ability (zone of proximal development)
    target_difficulty = user_iq + 5

    # Consider weaknesses
    focus_areas = user_profile.weaknesses[:2]

    # Generate with AI
    challenge = ai_generator.create_challenge(
        difficulty=map_iq_to_difficulty(target_difficulty),
        focus_areas=focus_areas,
        user_style=user_profile.preferred_learning_style
    )

    return challenge
```

## UI Flow Updates

### New Challenge Start Flow
```
1. User clicks "Start New Challenge"
   ↓
2. Choose Challenge Type:
   - [Python] → Opens Notebook Interface
   - [SQL] → Opens SQL Editor
   - [R] → Opens R Editor
   ↓
3. AI generates challenge based on user's IQ
   ↓
4. User works through tasks
   ↓
5. System tracks:
   - Time per task
   - Code quality
   - Number of attempts
   - Hint usage
   ↓
6. On completion:
   - Update IQ score
   - Show performance feedback
   - Suggest next challenge
   - Option to pin outputs
```

## Quick Wins (Do First)

1. **Fix Run Code** - Test page at `/hackathons/test`
2. **Comment-Based Format** - Update challenge structure
3. **AI Generation** - Hook up Gemini API
4. **Performance Tracking** - Add basic metrics

## Long Term (Nice to Have)

1. **ML Model** - Train on user data for better predictions
2. **Peer Comparison** - "You're faster than 87% of users"
3. **Skill Tree** - Visual representation of mastery
4. **Certifications** - Issue certificates for milestones
5. **Competitions** - Timed challenges with prizes

## Success Metrics

- **Engagement**: Users complete 3+ challenges per session
- **Retention**: Users return within 7 days
- **Learning**: Measurable IQ improvement over time
- **Satisfaction**: 4+ star ratings on challenges
- **Sharing**: Users share portfolios on LinkedIn/GitHub

## Next Actions

1. Go to http://localhost:8083/hackathons/test
2. Test if Pyodide works
3. Check browser console for errors
4. Report back what you see!

---

**This is a game-changer feature!** 🎯
Users will love the adaptive challenges and portfolio building.
