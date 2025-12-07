# Task: Lint Fixes, Settings, and Leaderboard Updates

## Status: In Progress

## Objectives

- [x] **Fix lint errors:**
    - [x] Fix `trackActivity` argument count in `Upload.tsx`.
    - [x] Fix `initialDatasetId` prop in `Insights.tsx` and `AIAssistantChat.tsx`.
    - [x] Fix Supabase type errors (using `as any` workaround for now).
    - [x] Fix syntax error in `src/pages/NotificationPreferences.tsx` (duplicated code block).
- [x] **Refactor to use `MainLayout`:**
    - [x] `Settings.tsx`
    - [x] `Upload.tsx`
    - [x] `Insights.tsx`
    - [x] `Automation.tsx`
    - [x] `Analytics.tsx`
    - [x] `Datasets.tsx`
    - [x] `Experiments.tsx`
    - [x] `Reports.tsx`
    - [x] Verify `Index.tsx` uses public navigation (Correct).
- [x] **Settings Page Updates:**
    - [x] Link all navigation cards in `Settings.tsx`.
    - [x] Implement "Coming Soon" toast for unimplemented features.
    - [x] **Dark Mode Persistence:** Implement `localStorage` saving for theme preference.
- [ ] **Leaderboard Improvements:**
    - [x] Fetch real user data from Supabase (`profiles`, `experiments`, `datasets`).
    - [x] Implement filtering logic (Time Range, Category).
    - [ ] **Implement Real Stats:** Fetch `commentsPosted` and `filesShared` (Requires schema update/backend changes, currently placeholders).
    - [ ] **Implement Trend Logic:** Compare with historical data (Currently placeholder).
- [ ] **Verification:**
    - [x] Verify `NotificationPreferences.tsx` syntax fix.
    - [x] Verify `Settings.tsx` and `App.tsx` dark mode logic.
    - [ ] Verify `TeamLeaderboard.tsx` data fetching (Tested logic, but mock data fallback exists).

## Next Steps

1.  **Resolve Leaderboard Gaps:**
    -   Decide whether to add `comments` table or use `activities` table for engagement stats.
    -   Implement trend calculation (requires storing snapshots or complex historical queries).
2.  **Type Safety:**
    -   Investigate "Type instantiation is excessively deep" in `AIAssistantChat.tsx` if it persists despite `as any`.
3.  **Testing:**
    -   Run the app and verify all pages load correctly without layout glitches.
