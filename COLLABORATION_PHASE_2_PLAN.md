# 🚀 Lab-IQ Collaboration System - Phase 2 Implementation Plan

**Date**: December 7, 2025
**Priority**: HIGH
**Status**: Ready to Implement
**Goal**: Build a complete Slack-like collaboration system with channels, file sharing, and team features

---

## 📋 **Current State (What We Have)**

### ✅ **Completed (Phase 1)**
- Database schema (11 tables)
- Row-Level Security policies
- Real-time chat hooks (useRealtimeChat, usePresence, useTypingIndicator)
- Team and file services (teamService, fileService)
- Basic ChatPanel component
- TypeScript types

### ⚠️ **Issues (What's Missing)**
- No channel creation UI
- No channel selector/switcher
- "Select a channel to start chatting" message shows
- File sharing UI not connected to backend
- Activity timeline not connected to backend
- Team invitation UI not fully functional
- No channel management (create, edit, delete, archive)

---

## 🎯 **Phase 2 Goals - Complete Collaboration System**

### **Vision**: Slack-like Experience for Lab Teams
- Create and manage channels (like #general, #experiments, #data-analysis)
- Share files within channels with preview
- Track all team activity in real-time
- Invite team members with email
- Direct messaging between users
- Channel permissions and privacy settings
- Notifications for mentions and activity

---

## 📊 **Implementation Plan - Detailed Breakdown**

---

## **WEEK 1: CHANNELS & CHANNEL MANAGEMENT** 🎨

### **Day 1-2: Channel Creation & Management UI**

#### **Features to Build:**

1. **Channel Creation Dialog** ⭐ HIGH PRIORITY
   ```
   Location: src/components/collaboration/ChannelDialog.tsx

   Features:
   - Create new channel button (+ icon)
   - Channel name input (e.g., "experiments")
   - Channel description (optional)
   - Channel type selector:
     * 🌐 Public - Everyone can join
     * 🔒 Private - Invite only
     * 📁 Project - Linked to a project
   - Channel icon/emoji picker (optional)
   - Auto-create on submit
   - Real-time updates when channels are created
   ```

2. **Channel Sidebar/Switcher** ⭐ HIGH PRIORITY
   ```
   Location: src/components/collaboration/ChannelSidebar.tsx

   Features:
   - List all channels user has access to
   - Group by type (Public, Private, Direct Messages)
   - Show unread message count badge
   - Show active/selected channel
   - Quick channel search/filter
   - Star/favorite channels
   - Channel settings button (gear icon)
   - "Create Channel" button at top

   Layout:
   ┌─────────────────────────┐
   │ [+ Create Channel]      │
   │ ─────────────────────   │
   │ 🌐 PUBLIC CHANNELS      │
   │   # general      [12]   │ ← Unread count
   │   # experiments   [3]   │
   │   # data-analysis       │
   │ ─────────────────────   │
   │ 🔒 PRIVATE CHANNELS     │
   │   🔒 admin-only         │
   │   🔒 research-team      │
   │ ─────────────────────   │
   │ 💬 DIRECT MESSAGES      │
   │   👤 Sarah Chen   [2]   │
   │   👤 John Smith         │
   └─────────────────────────┘
   ```

3. **Channel Settings/Edit** ⭐ MEDIUM PRIORITY
   ```
   Location: src/components/collaboration/ChannelSettings.tsx

   Features:
   - Edit channel name and description
   - Change channel type (public/private)
   - Archive/delete channel (with confirmation)
   - Manage channel members
   - Channel permissions settings
   - Channel notifications settings
   ```

#### **Database Additions Needed:**
```sql
-- Channel members table (who's in which channel)
CREATE TABLE IF NOT EXISTS channel_members (
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  notifications_enabled BOOLEAN DEFAULT true,
  PRIMARY KEY (channel_id, user_id)
);

-- Add privacy field to chat_channels
ALTER TABLE chat_channels ADD COLUMN IF NOT EXISTS privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'private'));
ALTER TABLE chat_channels ADD COLUMN IF NOT EXISTS icon TEXT;

-- Unread message counts (for performance)
CREATE TABLE IF NOT EXISTS channel_unread_counts (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  unread_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, channel_id)
);
```

#### **React Components Structure:**
```
src/components/collaboration/
├── ChannelDialog.tsx          (NEW - Create/Edit channel)
├── ChannelSidebar.tsx         (NEW - Channel list & switcher)
├── ChannelSettings.tsx        (NEW - Settings dialog)
├── ChannelHeader.tsx          (NEW - Channel info header)
├── ChatPanel.tsx              (UPDATE - Connect to channel sidebar)
└── DirectMessageDialog.tsx    (NEW - Start DM)
```

---

### **Day 3-4: Channel Switching & Real-time Updates**

#### **Features to Build:**

1. **Channel Switching Logic**
   ```typescript
   // src/hooks/useChannelSwitcher.ts

   Features:
   - Switch between channels
   - Load channel-specific messages
   - Update URL with channel ID
   - Mark messages as read on switch
   - Update unread counts
   - Subscribe to channel updates
   ```

2. **Unread Message Tracking**
   ```typescript
   // src/hooks/useUnreadMessages.ts

   Features:
   - Track last read message per channel
   - Calculate unread count
   - Update badge in real-time
   - Mark as read when viewing
   - Notifications for new messages
   ```

3. **Channel Membership Management**
   ```typescript
   // src/services/channelService.ts

   Functions:
   - createChannel(name, type, privacy)
   - joinChannel(channelId)
   - leaveChannel(channelId)
   - inviteToChannel(channelId, userId)
   - getChannelMembers(channelId)
   - updateChannel(channelId, updates)
   - archiveChannel(channelId)
   ```

---

## **WEEK 2: FILE SHARING & PREVIEW** 📁

### **Day 5-6: File Upload & Management**

#### **Features to Build:**

1. **File Upload Component** ⭐ HIGH PRIORITY
   ```
   Location: src/components/collaboration/FileUploadZone.tsx

   Features:
   - Drag & drop file upload
   - Click to browse files
   - Multiple file upload
   - Progress indicator
   - File type restrictions (50MB max)
   - Preview before upload
   - Cancel upload option
   - Upload to specific channel or project
   ```

2. **File Browser/Gallery** ⭐ HIGH PRIORITY
   ```
   Location: src/components/collaboration/FileBrowser.tsx

   Features:
   - Grid or list view toggle
   - File thumbnails (images, PDFs)
   - Filter by file type (images, documents, data, code)
   - Sort by date, name, size
   - Search files by name
   - Bulk actions (download, delete)
   - File details panel
   - Download button
   - Share button (get link)

   Layout:
   ┌─────────────────────────────────────┐
   │ 📁 Files    [Grid] [List]  [Search] │
   │ ─────────────────────────────────── │
   │ Filters: [All] [Images] [Docs]      │
   │ ─────────────────────────────────── │
   │ ┌───────┐ ┌───────┐ ┌───────┐      │
   │ │ 🖼️    │ │ 📄    │ │ 📊    │      │
   │ │ img1  │ │ doc1  │ │ data  │      │
   │ │ 2MB   │ │ 1MB   │ │ 5MB   │      │
   │ └───────┘ └───────┘ └───────┘      │
   └─────────────────────────────────────┘
   ```

3. **File Preview Modal** ⭐ MEDIUM PRIORITY
   ```
   Location: src/components/collaboration/FilePreview.tsx

   Features:
   - Preview images inline
   - Preview PDFs
   - Preview CSV/Excel (data table)
   - Preview code files (syntax highlight)
   - Download button
   - Share button
   - Delete button (if owner)
   - Next/Previous navigation
   - Full-screen mode
   ```

#### **Integration with fileService:**
```typescript
// Already built! Just need to wire up UI
- fileService.uploadFile()
- fileService.downloadFile()
- fileService.deleteFile()
- fileService.getProjectFiles()
- fileService.searchFiles()
```

---

### **Day 7: File Sharing in Chat**

#### **Features to Build:**

1. **Inline File Attachments in Messages**
   ```
   Features:
   - Attach files to chat messages
   - Show file preview in message
   - Download from message
   - Click to open full preview
   - Multiple files per message
   ```

2. **File Activity Tracking**
   ```
   Features:
   - Log when file is uploaded
   - Log when file is downloaded
   - Log when file is deleted
   - Show in activity timeline
   ```

---

## **WEEK 3: ACTIVITY TRACKING & NOTIFICATIONS** 📊

### **Day 8-9: Activity Timeline**

#### **Features to Build:**

1. **Activity Feed Component** ⭐ HIGH PRIORITY
   ```
   Location: src/components/collaboration/ActivityFeed.tsx

   Features:
   - Show all lab activity in real-time
   - Filter by type (messages, files, members, projects)
   - Filter by user
   - Filter by date range
   - Infinite scroll / pagination
   - Click to jump to activity source

   Activity Types:
   - 💬 Message sent in #channel
   - 📁 File uploaded to #channel
   - ⬇️ File downloaded
   - 👥 User joined lab
   - ➕ Channel created
   - 🔔 User mentioned in #channel
   - 🎯 Task assigned
   - ✅ Task completed

   Layout:
   ┌─────────────────────────────────────┐
   │ 📊 Activity Feed                    │
   │ Filters: [All] [Files] [Messages]   │
   │ ─────────────────────────────────── │
   │ 💬 Sarah sent a message in #general │
   │    "Check out the new results!"     │
   │    2 minutes ago                    │
   │ ─────────────────────────────────── │
   │ 📁 John uploaded file.csv           │
   │    in #experiments                  │
   │    5 minutes ago                    │
   │ ─────────────────────────────────── │
   │ 👥 Emma joined the lab              │
   │    1 hour ago                       │
   └─────────────────────────────────────┘
   ```

2. **Activity Service**
   ```typescript
   // src/services/activityService.ts

   Functions:
   - logActivity(type, entityType, entityId, metadata)
   - getLabActivity(labId, filters)
   - getUserActivity(userId)
   - getChannelActivity(channelId)
   - subscribeToActivity(labId, callback)
   ```

---

### **Day 10: Notifications System**

#### **Features to Build:**

1. **Notification Bell Component** ⭐ HIGH PRIORITY
   ```
   Location: src/components/collaboration/NotificationCenter.tsx

   Features:
   - Bell icon with unread count badge
   - Dropdown with recent notifications
   - Mark as read
   - Mark all as read
   - Navigate to source
   - Notification preferences link

   Notification Types:
   - 🔔 @mentioned in message
   - 💬 Reply to your message
   - 📁 File shared with you
   - 👥 Invited to channel
   - ✅ Task assigned to you
   ```

2. **Notification Preferences**
   ```
   Location: src/pages/NotificationPreferences.tsx (Update existing)

   Settings:
   - Email notifications on/off
   - Desktop notifications (browser)
   - @mention alerts
   - Direct message alerts
   - File upload alerts
   - Per-channel notification settings
   - Quiet hours (mute notifications)
   ```

#### **Database Additions:**
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

---

## **WEEK 4: TEAM MANAGEMENT & POLISH** 👥

### **Day 11-12: Team Invitation System**

#### **Features to Build:**

1. **Invite Team Members UI** ⭐ HIGH PRIORITY
   ```
   Location: src/components/collaboration/InviteDialog.tsx

   Features:
   - Email input (validate email)
   - Role selector (admin, researcher, analyst, viewer)
   - Custom invitation message
   - Send invite button
   - Copy invite link option
   - Show pending invitations
   - Resend invitation
   - Cancel invitation
   ```

2. **Accept Invitation Flow**
   ```
   Location: src/pages/AcceptInvitation.tsx (NEW)

   Features:
   - Accept invite page (/invite/:token)
   - Show lab/team name
   - Show who invited you
   - Accept or decline button
   - Auto-join on accept
   - Email notification on accept/decline
   ```

3. **Team Member Management**
   ```
   Location: src/components/collaboration/TeamMemberList.tsx

   Features:
   - View all team members
   - Filter by role
   - Search members
   - Change member role (if admin)
   - Remove member (if admin)
   - View member activity
   - Send direct message button
   ```

---

### **Day 13-14: Direct Messages (DMs)**

#### **Features to Build:**

1. **Direct Message System**
   ```
   Features:
   - Start DM with any team member
   - DM channels auto-created
   - Unread DM badge
   - DM list in sidebar
   - Same chat interface (reuse ChatPanel)
   ```

2. **DM Channel Creation Logic**
   ```typescript
   // Automatically create DM channel between two users
   // Channel type = 'direct'
   // Channel name = concatenated user IDs
   // Auto-add both users as members
   ```

---

## **BONUS FEATURES** (If Time Permits) 🎁

### **Advanced Features:**

1. **Message Threads/Replies**
   - Reply to specific messages
   - Threaded view
   - Thread summary

2. **Message Reactions**
   - Add emoji reactions (already in schema)
   - Reaction picker
   - Show who reacted

3. **Message Search**
   - Search across all channels
   - Filter by channel, user, date
   - Jump to message

4. **Channel Analytics**
   - Most active channels
   - Most active users
   - File upload trends
   - Message volume over time

5. **Pinned Messages**
   - Pin important messages
   - Show pinned at top
   - Admin can pin/unpin

---

## 📂 **File Structure - New Components**

```
src/
├── components/
│   └── collaboration/
│       ├── ChannelDialog.tsx           (NEW - Create channel)
│       ├── ChannelSidebar.tsx          (NEW - Channel list)
│       ├── ChannelSettings.tsx         (NEW - Channel settings)
│       ├── ChannelHeader.tsx           (NEW - Channel header)
│       ├── DirectMessageDialog.tsx     (NEW - Start DM)
│       ├── FileUploadZone.tsx          (NEW - Upload files)
│       ├── FileBrowser.tsx             (NEW - Browse files)
│       ├── FilePreview.tsx             (NEW - Preview modal)
│       ├── ActivityFeed.tsx            (NEW - Activity timeline)
│       ├── NotificationCenter.tsx      (NEW - Notifications)
│       ├── InviteDialog.tsx            (UPDATE - Full invite UI)
│       ├── TeamMemberList.tsx          (NEW - Member management)
│       ├── ChatPanel.tsx               (UPDATE - Connect to channels)
│       └── FileSharing.tsx             (UPDATE - Connect to backend)
│
├── hooks/
│   ├── useChannelSwitcher.ts          (NEW - Switch channels)
│   ├── useUnreadMessages.ts           (NEW - Track unread)
│   ├── useNotifications.ts            (NEW - Notification hook)
│   └── useDirectMessage.ts            (NEW - DM hook)
│
├── services/
│   ├── channelService.ts              (NEW - Channel CRUD)
│   ├── activityService.ts             (NEW - Activity logging)
│   ├── notificationService.ts         (NEW - Notifications)
│   ├── teamService.ts                 (UPDATE - Add more features)
│   └── fileService.ts                 (EXISTS - Already built!)
│
└── pages/
    ├── Collaboration.tsx              (UPDATE - Wire everything)
    └── AcceptInvitation.tsx           (NEW - Accept invite page)
```

---

## 🗄️ **Database Schema Updates**

### **New Tables Needed:**

```sql
-- 1. Channel members
CREATE TABLE channel_members (
  channel_id UUID,
  user_id UUID,
  role TEXT,
  joined_at TIMESTAMP,
  last_read_at TIMESTAMP,
  notifications_enabled BOOLEAN,
  PRIMARY KEY (channel_id, user_id)
);

-- 2. Unread counts (for performance)
CREATE TABLE channel_unread_counts (
  user_id UUID,
  channel_id UUID,
  unread_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP,
  PRIMARY KEY (user_id, channel_id)
);

-- 3. Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  metadata JSONB
);

-- 4. Direct messages (uses existing chat_channels with type='direct')
-- No new table needed, just use existing structure!
```

---

## 🎯 **Implementation Priority**

### **🔴 CRITICAL (Do First)**
1. ✅ Channel creation UI + backend
2. ✅ Channel sidebar/switcher
3. ✅ Channel switching logic
4. ✅ Unread message tracking
5. ✅ File upload UI
6. ✅ File browser UI

### **🟡 HIGH (Do Second)**
7. ✅ Activity feed
8. ✅ Notification center
9. ✅ Team invitation UI (complete)
10. ✅ Direct messages

### **🟢 MEDIUM (Do Third)**
11. ✅ File preview modal
12. ✅ Channel settings/edit
13. ✅ Team member management

### **⚪ NICE-TO-HAVE (If Time)**
14. Message threads
15. Message search
16. Channel analytics
17. Pinned messages

---

## 📅 **Daily Implementation Schedule**

### **Day 1: Channels Foundation**
- [ ] Create ChannelDialog.tsx
- [ ] Add channel creation form
- [ ] Wire up to Supabase
- [ ] Test channel creation

### **Day 2: Channel Sidebar**
- [ ] Create ChannelSidebar.tsx
- [ ] List all channels
- [ ] Add channel switcher
- [ ] Show unread counts

### **Day 3: Channel Switching**
- [ ] Create useChannelSwitcher hook
- [ ] Implement channel switching
- [ ] Update ChatPanel
- [ ] Test real-time switching

### **Day 4: Unread Tracking**
- [ ] Create useUnreadMessages hook
- [ ] Track last read message
- [ ] Update unread badges
- [ ] Mark as read on view

### **Day 5: File Upload**
- [ ] Create FileUploadZone.tsx
- [ ] Drag & drop support
- [ ] Progress indicator
- [ ] Wire to fileService

### **Day 6: File Browser**
- [ ] Create FileBrowser.tsx
- [ ] Grid/list view
- [ ] Filter and sort
- [ ] Download/delete actions

### **Day 7: File Preview**
- [ ] Create FilePreview.tsx
- [ ] Image preview
- [ ] PDF preview
- [ ] CSV preview

### **Day 8: Activity Feed**
- [ ] Create ActivityFeed.tsx
- [ ] Load from database
- [ ] Real-time updates
- [ ] Filter options

### **Day 9: Activity Logging**
- [ ] Create activityService
- [ ] Log all actions
- [ ] Subscribe to updates
- [ ] Test logging

### **Day 10: Notifications**
- [ ] Create NotificationCenter.tsx
- [ ] Create notifications table
- [ ] Bell icon with badge
- [ ] Mark as read

### **Day 11: Team Invites**
- [ ] Complete InviteDialog.tsx
- [ ] Email validation
- [ ] Send invitation email
- [ ] Show pending invites

### **Day 12: Accept Invite**
- [ ] Create AcceptInvitation.tsx
- [ ] Accept/decline flow
- [ ] Auto-join on accept
- [ ] Notification on action

### **Day 13: Direct Messages**
- [ ] Create DirectMessageDialog.tsx
- [ ] Auto-create DM channels
- [ ] DM sidebar section
- [ ] Test DM flow

### **Day 14: Polish & Testing**
- [ ] Fix bugs
- [ ] Improve UI/UX
- [ ] Add loading states
- [ ] Test everything end-to-end

---

## 🧪 **Testing Checklist**

### **Channel Features:**
- [ ] Create public channel
- [ ] Create private channel
- [ ] Switch between channels
- [ ] Send messages in each
- [ ] Edit channel settings
- [ ] Archive channel
- [ ] Unread counts update

### **File Features:**
- [ ] Upload file (drag & drop)
- [ ] Upload file (click browse)
- [ ] View files in grid
- [ ] View files in list
- [ ] Preview image
- [ ] Preview PDF
- [ ] Download file
- [ ] Delete file
- [ ] Search files

### **Activity Features:**
- [ ] Message logged
- [ ] File upload logged
- [ ] Member join logged
- [ ] Activity feed updates live
- [ ] Filter activity by type
- [ ] Click to navigate

### **Team Features:**
- [ ] Invite member
- [ ] Accept invitation
- [ ] Decline invitation
- [ ] Remove member
- [ ] Change member role
- [ ] View team list

### **Notification Features:**
- [ ] @mention notification
- [ ] DM notification
- [ ] File share notification
- [ ] Mark as read
- [ ] Bell badge updates

---

## 🚀 **Success Metrics**

### **Functional:**
- ✅ All CRITICAL features working
- ✅ No console errors
- ✅ Real-time updates < 500ms
- ✅ File upload success rate > 95%

### **UX:**
- ✅ Intuitive channel navigation
- ✅ Fast channel switching
- ✅ Clear unread indicators
- ✅ Smooth file upload experience

### **Performance:**
- ✅ Page load < 2 seconds
- ✅ Channel switch < 300ms
- ✅ File list loads < 1 second
- ✅ Activity feed scrolls smoothly

---

## 💡 **Key Design Principles**

1. **Keep it Simple**: Don't over-complicate. Follow Slack's lead.
2. **Real-time First**: Everything should update live.
3. **Mobile Responsive**: Works on phone, tablet, desktop.
4. **Keyboard Shortcuts**: Power users love them.
5. **Error Handling**: Graceful failures with retry.

---

## 📚 **Resources & References**

- **Slack Design**: https://slack.com/
- **Discord UI**: https://discord.com/
- **Microsoft Teams**: https://www.microsoft.com/en-us/microsoft-teams

---

## 🎉 **Summary**

**What We're Building:**
A complete Slack-like collaboration system with:
- ✅ Channel creation and management
- ✅ Real-time messaging
- ✅ File sharing with preview
- ✅ Activity tracking
- ✅ Team invitations
- ✅ Direct messages
- ✅ Notifications

**Timeline:** 2-3 weeks
**Complexity:** Medium-High
**Impact:** HUGE (transforms Lab-IQ into a collaboration platform!)

---

**Ready to Start Tomorrow!** 🚀

Let's build an amazing collaboration system that makes Lab-IQ the best research platform!
