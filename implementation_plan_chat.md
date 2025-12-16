# Implementation Plan - Chat System Upgrade

## Goal
Upgrade the basic Chat System to a production-grade, Real-time Communication Hub similar to Slack/Discord.

## Gap Analysis
| Feature | Current State | Target State |
| :--- | :--- | :--- |
| **Channels** | Basic list rendering. | Real-time updates, unread badges, private/public types. |
| **Real-time** | Basic subscription. | Optimized events, presence (typing indicators). |
| **Permissions** | None visible. | RLS policies for private channels. |
| **UI/UX** | Simple sidebar. | Collapsible sections, Direct Messages (DMs). |

## Proposed Architecture (OOP)

### 1. Database Schema (`chat_channels`, `chat_messages`)
*   **`chat_channels`**:
    *   Add `type` (public, private, dm).
    *   Add `last_message_at` (for sorting).
*   **`channel_members`**:
    *   New table to link users to private channels/DMs.

### 2. Service Layer (`SupabaseCollaborationService`)
*   `getChannels(labId)`: Fetch public channels + private channels user is part of.
*   `createChannel(name, type, members)`: Transactional creation.
*   `markChannelRead(channelId)`: Update unread counts.

### 3. UI Components
*   **`ChannelSidebar`**: Update to support DMs and Unread Badges.
*   **`ChatPanel`**: Add "Typing..." indicators using Supabase Presence.

## Instructions
1.  [ ] **Migration:** Create `channel_members` table and RLS policies.
2.  [ ] **Service:** Update `ICollaborationService` and implementation.
3.  [ ] **UI:** Refactor `ChannelSidebar` to use Service + Real-time hooks.

## User Action Required
*   None (handled via Migrations).
