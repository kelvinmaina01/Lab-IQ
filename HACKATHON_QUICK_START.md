# Lab-IQ Hackathons - Quick Start Guide

## Access the Feature

**Development Server**: http://localhost:8081

### Navigation
- **Main Hub**: http://localhost:8081/hackathons
- **Browse**: http://localhost:8081/hackathons/browse
- **Leaderboard**: http://localhost:8081/hackathons/leaderboard
- **Challenge IDE**: http://localhost:8081/hackathons/challenge/[id]

Or click the **Trophy icon (🏆)** in the sidebar!

## Testing Checklist

### Without Database (Current State)
- [x] Navigate to /hackathons - Should show hub page
- [x] Check sidebar - Trophy icon should be visible
- [x] Browse page - Should render (empty state)
- [x] Leaderboard page - Should render (empty state)
- [ ] IDE page - Will error without challenge ID

### With Database Setup
1. Run migration: `supabase db push`
2. Sample challenge will be seeded
3. Navigate to challenges and try the IDE
4. Test code execution (Python/SQL/R)
5. Try progressive hints
6. Submit a solution
7. Check leaderboard updates

## Key Features to Demo

### 1. Hackathon Hub (`/hackathons`)
- User progress stats
- Featured challenges
- Top performers
- How it works guide

### 2. Challenge Browser (`/hackathons/browse`)
- Search bar
- Difficulty filter (beginner/intermediate/expert/advanced)
- Language filter (Python/SQL/R)
- Sort options (featured/popular/points/difficulty)

### 3. Leaderboard (`/hackathons/leaderboard`)
- Three tabs: Global, Speed Run, Accuracy
- User ranking highlight
- Top 100 performers

### 4. Challenge IDE (`/hackathons/challenge/:id`)
- Monaco editor (VS Code in browser)
- 3-panel layout: Instructions | Code | Output
- Run button - Test code
- Hint button - Progressive hints (costs points)
- Submit button - Final submission
- Timer tracking
- Success celebration with confetti!

## How It Actually Works

### Code Execution Flow
```
User writes code in IDE
    ↓
Click "Run Code"
    ↓
Code sent to WASM engine (Pyodide/DuckDB/WebR)
    ↓
Executes in browser (no server!)
    ↓
Test cases validated
    ↓
Results displayed in Output panel
```

### Scoring System
```
Base Points: 100 (per challenge)
+ Time Bonus: Up to 50 pts (if completed fast)
- Hint Penalty: 10 pts per hint used

Example:
- Base: 100 pts
- Completed in 5 mins (threshold: 10 mins): +25 pts
- Used 2 hints: -20 pts
= Final Score: 105 pts
```

### Progressive Hints (3 Levels)
```
Level 1 (Conceptual) - 10 pts penalty
↓
Level 2 (Syntax) - 25 pts penalty
↓
Level 3 (Code) - 50 pts penalty
```

## Sample Challenge Structure

```json
{
  "title": "Calculate Basic Statistics",
  "difficulty_level": "beginner",
  "language": "python",
  "incomplete_code": "df['pH'].___BLANK_1___()",
  "complete_solution": "df['pH'].mean()",
  "blanks": [
    {
      "id": "BLANK_1",
      "type": "function_name",
      "expected_answer": "mean",
      "hint_progression": [
        "Think about which function calculates average",
        "The function name is a synonym for average",
        "Use the mean() function"
      ]
    }
  ],
  "test_cases": [
    {
      "description": "Mean is calculated correctly",
      "validation_type": "numeric_tolerance",
      "tolerance": 0.01
    }
  ]
}
```

## Adding New Challenges (Manual)

### Via Supabase Dashboard
```sql
INSERT INTO hackathon_challenges (
  title,
  description,
  difficulty_level,
  language,
  incomplete_code,
  complete_solution,
  blanks,
  test_cases,
  base_points,
  is_featured
) VALUES (
  'Your Challenge Title',
  'Challenge description...',
  'beginner',
  'python',
  'import pandas as pd\ndf.___BLANK_1___()',
  'import pandas as pd\ndf.head()',
  '[{"id": "BLANK_1", "type": "function_name", "expected_answer": "head", "concept_tested": "pandas basics", "hint_progression": [...]}]'::jsonb,
  '[{"description": "Returns first 5 rows", "validation_type": "shape_match", "expected_shape": {"rows": 5}}]'::jsonb,
  100,
  true
);
```

## Future: AI Challenge Generation

When you add Gemini API, challenges can be auto-generated:

```typescript
POST /api/hackathon/generate-challenge
{
  "user_prompt": "Analyze correlation between pH and Yield",
  "language": "python",
  "difficulty": "beginner",
  "dataset_schema": {...}
}

Response: {
  "incomplete_code": "...",
  "complete_solution": "...",
  "blanks": [...],
  "test_cases": [...]
}
```

## Troubleshooting

### "Server running but pages are empty"
- Database migration not run yet
- Check browser console for errors
- Verify Supabase connection

### "Pyodide/DuckDB/WebR not loading"
- First load takes 10-15 seconds
- Check browser console
- Ensure internet connection (CDN downloads)

### "Cannot read challenge"
- Challenge ID doesn't exist
- Database not set up
- RLS policies blocking access

### "Code execution fails"
- Check browser console
- Verify WASM engine initialized
- Dataset URL might be invalid

## Performance Tips

### Initial Load Optimization
```javascript
// Pre-initialize engines on app load
const executionService = getHackathonExecutionService();
executionService.preloadEngines(['python', 'sql']);
```

### Browser Caching
- WASM engines cache in browser
- Second loads are instant
- Clear cache: DevTools → Application → Clear Storage

## Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ Full | Best performance |
| Edge | ✅ Full | Recommended |
| Firefox | ✅ Full | Good support |
| Safari | ⚠️ Limited | WASM issues |
| Mobile | ❌ No | Not optimized yet |

## Cost Breakdown

| Component | Cost | Notes |
|-----------|------|-------|
| Code Execution | $0 | Runs in browser |
| WASM Libraries | $0 | Free CDN |
| Database | $0 | Supabase free tier |
| Storage | $0 | Browser cache |
| **Total** | **$0** | Fully free! |

Only potential cost: Gemini API for AI generation (~$0.01 per challenge)

## Development Workflow

### Testing New Features
1. Make changes to components
2. Hot reload is automatic
3. Test in browser
4. Check console for errors

### Adding New Routes
```typescript
// src/App.tsx
<Route path="/hackathons/new-page" element={<NewPage />} />
```

### Adding New Services
```typescript
// src/lib/services/newService.ts
export class NewService {
  // Your service methods
}
```

## Support & Documentation

- **WASM Engines**:
  - Pyodide: https://pyodide.org/
  - DuckDB-WASM: https://duckdb.org/docs/api/wasm
  - WebR: https://docs.r-wasm.org/webr/latest/

- **Monaco Editor**: https://microsoft.github.io/monaco-editor/

- **Supabase**: https://supabase.com/docs

## Next Development Tasks

### High Priority
- [ ] Add more sample challenges
- [ ] Test full challenge completion flow
- [ ] Add loading states for WASM initialization
- [ ] Add error boundaries

### Medium Priority
- [ ] Implement AI challenge generator
- [ ] Add badge notification toasts
- [ ] Create user progress page
- [ ] Add challenge difficulty recommendations

### Low Priority
- [ ] Peer review UI
- [ ] Discussion forums
- [ ] Team challenges
- [ ] Mobile responsive design
- [ ] Dark mode optimizations

---

**Ready to Go!** The hackathon feature is live and waiting for you to explore at http://localhost:8081/hackathons
