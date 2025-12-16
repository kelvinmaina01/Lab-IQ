# Implementation Plan - Email Invitations (Resend)

## Goal
Enable real email invitations for invited members using **Resend**.

## Architecture
We will use a **Supabase Edge Function** (`invite-user`) to handle the secure operation of creating an invite token and sending the email in one go.

### 1. Supabase Edge Function (`supabase/functions/invite-user/index.ts`)
*   **Security:** Verifies user is authenticated.
*   **Logic:**
    1.  Generates a secure token.
    2.  Inserts record into `team_invitations` table.
    3.  Calls **Resend API** to send an HTML email with the invite link.
    4.  Returns success.

### 2. Frontend Service Update (`src/core/services.ts`)
*   Update `SupabaseCollaborationService.inviteMember` to invoke this Edge Function instead of direct DB insert.

## Required Environment Variables (Supabase)
*   `RESEND_API_KEY`: The API key from Resend.com.

## Steps
1.  [ ] Create Edge Function `invite-user`.
2.  [ ] Implement Resend email sending logic inside the function.
3.  [ ] Update `SupabaseCollaborationService` to call `supabase.functions.invoke('invite-user', ...)`.
4.  [ ] Update `task.md`.

## User Action Required
*   Sign up at **Resend.com**.
*   Generate API Key.
*   Run: `supabase secrets set RESEND_API_KEY=re_123...`
