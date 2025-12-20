# Deploy Edge Functions - Production Checklist

## Prerequisites

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login
```

## 1. Deploy AI Chat Bot Function

This function powers @LabAI mentions in channels with multi-provider fallback (Groq → Grok → Gemini).

### Set Secrets

```bash
# Set Groq API Key (Primary - Recommended)
supabase secrets set GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE

# Optional: Set Grok API Key (Fallback)
supabase secrets set GROK_API_KEY=YOUR_GROK_API_KEY_HERE

# Optional: Set Gemini API Key (Final Fallback)
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

### Deploy Function

```bash
supabase functions deploy chat-bot-ai
```

### Test Function

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/chat-bot-ai \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is PCR and how does it work?",
    "channelId": "YOUR_CHANNEL_ID",
    "userId": "YOUR_USER_ID",
    "history": []
  }'
```

## 2. Deploy Email Invitation Function

This function sends invitation emails to new team members using Resend API.

### Set Secrets

```bash
# Set Resend API Key
supabase secrets set RESEND_API_KEY=re_4d756d418f4ab6b75803967221aea96ae0046a5d3eb0b3ee047db4b4ef810bfd

# Set Email From Address (must be verified domain)
supabase secrets set EMAIL_FROM=noreply@labiq.app
```

### Deploy Function

```bash
supabase functions deploy send-team-invitation
```

### Domain Verification (CRITICAL)

Before emails will send, you MUST verify your domain at resend.com:

1. Go to https://resend.com/domains
2. Add domain: `labiq.app`
3. Add DNS records provided by Resend
4. Wait for verification (usually 5-10 minutes)

### Test Function

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-team-invitation \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "role": "researcher",
    "labId": "YOUR_LAB_ID",
    "inviterName": "John Doe"
  }'
```

## 3. Verify Deployment

### Check Function Status

```bash
supabase functions list
```

### Check Secrets

```bash
supabase secrets list
```

### View Logs (Real-time)

```bash
# AI Chat Bot logs
supabase functions logs chat-bot-ai --tail

# Email Invitation logs
supabase functions logs send-team-invitation --tail
```

## 4. Environment Variables Checklist

Make sure these are set in your Supabase project:

- ✅ `GROQ_API_KEY` (Primary AI provider)
- ⚠️ `GROK_API_KEY` (Optional fallback)
- ⚠️ `GEMINI_API_KEY` (Optional final fallback)
- ✅ `RESEND_API_KEY` (Email service)
- ✅ `EMAIL_FROM` (Verified sender email)
- ✅ `SUPABASE_URL` (Auto-set by Supabase)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (Auto-set by Supabase)

## 5. Frontend Integration

The frontend already calls these functions via `CollaborationService.ts`:

```typescript
// AI Bot is triggered in sendMessage() when @LabAI is mentioned
await supabase.functions.invoke('chat-bot-ai', {
    body: { message, channelId, userId }
});

// Email invites are triggered in inviteMember()
await supabase.functions.invoke('send-team-invitation', {
    body: { email, role, labId }
});
```

## 6. Monitoring

### Check Invocation Counts

```bash
supabase functions stats chat-bot-ai
supabase functions stats send-team-invitation
```

### Debug Common Issues

#### AI Bot Not Responding

1. Check secrets are set: `supabase secrets list`
2. Check function logs: `supabase functions logs chat-bot-ai --tail`
3. Verify API keys are valid
4. Test Groq API directly: `curl https://api.groq.com/openai/v1/chat/completions`

#### Emails Not Sending

1. Verify domain at resend.com
2. Check DNS records are propagated
3. Check Resend dashboard for delivery status
4. Verify `EMAIL_FROM` matches verified domain
5. Check function logs for errors

## 7. Production Readiness

- [x] Functions deployed
- [x] Secrets configured
- [ ] Domain verified for emails
- [ ] Load testing completed
- [ ] Error monitoring set up
- [ ] Rate limiting configured (if needed)

## 8. Rollback Plan

If issues occur:

```bash
# Rollback to previous version
supabase functions deploy chat-bot-ai --version VERSION_ID

# Or delete and redeploy
supabase functions delete chat-bot-ai
supabase functions deploy chat-bot-ai
```

## Notes

- Groq API is FREE with generous limits (perfect for production)
- Resend API requires domain verification (can take 5-10 min)
- Edge Functions are globally distributed (fast response times)
- All functions use Service Role Key (bypass RLS when needed)
