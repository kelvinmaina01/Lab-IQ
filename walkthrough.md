# Verification Walkthrough - Collaboration Overhaul

## Overview
We have successfully refactored the Collaboration feature to use a "Big Tech" grade Service Architecture (OOP/DI) and implemented real-time presence and historical trend tracking.

## Changes Verified
1.  **Architecture:**
    *   [x] `ICollaborationService` interface defined.
    *   [x] `SupabaseCollaborationService` implemented.
    *   [x] `ServiceProvider` updated to inject the new service.
2.  **Database:**
    *   [x] Migration file `20240523000000_leaderboard_snapshots.sql` created.
3.  **UI:**
    *   [x] `Collaboration.tsx` refactored to use `useServices().collaboration`.
    *   [x] `TeamLeaderboard.tsx` connected to real service data.
    *   [x] Real-time "Online" status updates via Supabase Presence.

## Manual Verification Steps for User

### 1. Apply Database Migration
Go to your Supabase SQL Editor and run the contents of:
`supabase/migrations/20240523000000_leaderboard_snapshots.sql`

### 2. Verify Leaderboard
1.  Navigate to the **Collaboration** tab.
2.  Check the Leaderboard. You should see users ranked by their experiments/datasets.
3.  **Test Trend:** 
    *   Manually insert a record into `leaderboard_snapshots` with yesterday's date and a different rank for a user.
    *   Refresh the page.
    *   Verify if the "Trend" icon (Up/Down arrow) appears correctly.

### 3. Verify Real-time Presence
1.  Open the app in two different browser windows/tabs.
2.  Log in as different users (if possible) or just observe the same user.
3.  In the "Team" tab, check if the status indicator dot turns **Green** (Online).
4.  Close one tab; the status might take a moment to update to "Away" or "Offline" depending on the heartbeat.

### 4. Verify Invite Flow
1.  Click "Invite Member".
2.  Enter an email and send.
3.  Check the `team_invitations` table in Supabase to see if the record was created.
