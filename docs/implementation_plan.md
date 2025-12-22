# Implementation Plan - Collaboration System Overhaul

# Goal Description
Transform the current `Collaboration` feature into a high-performance, production-grade system. This involves refactoring legacy code into a strict OOP Service Architecture, implementing real-time features using Supabase Channels, and adding "Trend" analytics for the Leaderboard.

## User Review Required
> [!IMPORTANT]
> **Database Changes Required:** We need to create a new properties/tables to store "Daily Leaderboard Snapshots" to calculate trends (User Rank yesterday vs today).
> **Service Migration:** Existing `teamService` logic will be migrated to `SupabaseCollaborationService`.

## Proposed Changes

### 1. Database Schema Updates
#### [NEW] Table: `leaderboard_snapshots`
*   `id` (uuid)
*   `user_id` (uuid)
*   `score` (int)
*   `rank` (int)
*   `snapshot_date` (date)
*   `metadata` (jsonb) - stores breakdown like { experiments: 10, datasets: 5 }

### 2. Core Architecture (OOP/DI)
#### [MODIFY] [src/core/interfaces.ts](file:///c:/Users/dell/Desktop/Lab-IQ/src/core/interfaces.ts)
*   Add `ICollaborationService`.
    *   `getTeamMembers(labId: string): Promise<TeamMember[]>`
    *   `inviteMember(email: string, role: string): Promise<void>`
    *   `getLeaderboard(timeRange: string): Promise<LeaderboardEntry[]>`
    *   `subscribeToChannel(channelId: string, onMessage: (msg: any) => void): Subscription`

#### [MODIFY] [src/core/services.ts](file:///c:/Users/dell/Desktop/Lab-IQ/src/core/services.ts)
*   Implement `SupabaseCollaborationService` implementing `ICollaborationService`.

### 3. UI Refactoring
#### [MODIFY] [src/pages/Collaboration.tsx](file:///c:/Users/dell/Desktop/Lab-IQ/src/pages/Collaboration.tsx)
*   Replace direct `teamService` calls with `useServices().collaboration`.
*   Implement `useEffect` to subscribe to real-time `activities` table changes for the Feed.

#### [MODIFY] [src/components/collaboration/TeamLeaderboard.tsx](file:///c:/Users/dell/Desktop/Lab-IQ/src/components/collaboration/TeamLeaderboard.tsx)
*   Connect to `collaboration.getLeaderboard()`.
*   Remove hardcoded "Trend" and "Badges" logic; replace with computed logic from `snapshots`.

## Verification Plan

### Automated Tests
*   **Unit Tests:** Test `SupabaseCollaborationService` methods (mocking Supabase client).
*   **Integration:** Verify `inviteMember` actually inserts into `team_invitations`.

### Manual Verification
1.  **Leaderboard:**
    *   Upload a dataset.
    *   Check if Leaderboard score increases.
    *   (Simulate next day) Check if "Trend" shows "Up" or "Same".
2.  **Real-time:**
    *   Open App in two browsers.
    *   Send a message in "Chat" in Browser A.
    *   Verify it appears in Browser B without refresh.
