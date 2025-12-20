// Follow this setup guide to integrate the Deno runtime into your favorite editor:
// https://deno.land/manual/getting_started/setup_your_environment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_4d756d418f4ab6b75803967221aea96ae0046a5d3eb0b3ee047db4b4ef810bfd';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173';

interface InvitationRequest {
  email: string;
  inviterName: string;
  labId: string;
  role: string;
  invitationToken: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Get request body
    const { email, inviterName, labId, role, invitationToken }: InvitationRequest = await req.json();

    // Validate required fields
    if (!email || !inviterName || !labId || !role || !invitationToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get lab details (optional, for better email content)
    const { data: labData } = await supabase
      .from('team_members')
      .select('lab_id')
      .eq('lab_id', labId)
      .limit(1)
      .single();

    // Generate invitation URL
    const invitationUrl = `${APP_URL}/accept-invitation?token=${invitationToken}`;

    // Prepare email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lab IQ Team Invitation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #6366f1;
      margin-bottom: 10px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .content {
      color: #4b5563;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      background-color: #6366f1;
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background-color: #4f46e5;
    }
    .info-box {
      background-color: #f9fafb;
      border-left: 4px solid #6366f1;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box strong {
      color: #1f2937;
      display: block;
      margin-bottom: 8px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
      text-align: center;
    }
    .features {
      margin: 30px 0;
    }
    .feature {
      display: flex;
      align-items: start;
      margin: 16px 0;
    }
    .feature-icon {
      font-size: 24px;
      margin-right: 12px;
    }
    .feature-text {
      flex: 1;
    }
    .feature-title {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }
    .feature-desc {
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🔬 Lab IQ</div>
      <div class="title">You've Been Invited to Join a Lab Team!</div>
    </div>

    <div class="content">
      <p>Hi there,</p>
      <p><strong>${inviterName}</strong> has invited you to join their lab team on <strong>Lab IQ</strong> as a <strong>${role}</strong>.</p>

      <div class="info-box">
        <strong>What is Lab IQ?</strong>
        Lab IQ is an AI-powered lab data analysis platform that helps research teams collaborate on experiments, analyze data, and generate insights faster.
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${invitationUrl}" class="button">Accept Invitation</a>
    </div>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">💬</div>
        <div class="feature-text">
          <div class="feature-title">Real-Time Collaboration</div>
          <div class="feature-desc">Chat with your team, share files, and discuss experiments in dedicated channels</div>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">🤖</div>
        <div class="feature-text">
          <div class="feature-title">AI-Powered Analysis</div>
          <div class="feature-desc">Automated data analysis, insights generation, and statistical testing</div>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">📊</div>
        <div class="feature-text">
          <div class="feature-title">Experiment Management</div>
          <div class="feature-desc">Track experiments, protocols, and results in one centralized platform</div>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">🔒</div>
        <div class="feature-text">
          <div class="feature-title">Secure & Compliant</div>
          <div class="feature-desc">Enterprise-grade security with audit trails and access controls</div>
        </div>
      </div>
    </div>

    <div class="content">
      <p><strong>Your Role: ${role.charAt(0).toUpperCase() + role.slice(1)}</strong></p>
      <p>As a ${role}, you'll be able to:</p>
      <ul>
        ${getRolePermissions(role)}
      </ul>
    </div>

    <div class="footer">
      <p>This invitation will expire in 7 days.</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      <p>© ${new Date().getFullYear()} Lab IQ. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email via Resend API
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lab IQ <onboarding@resend.dev>',  // Using Resend's verified test domain
        to: [email],
        subject: `You've been invited to join Lab IQ`,
        html: emailHtml,
        reply_to: 'noreply@labiq.app',  // Optional: set reply-to to your domain
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error('Resend API error:', errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const resendData = await resendResponse.json();

    // Update invitation record with email sent timestamp
    await supabase
      .from('team_invitations')
      .update({
        email_sent_at: new Date().toISOString(),
        metadata: { email_id: resendData.id },
      })
      .eq('invitation_token', invitationToken);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully',
        emailId: resendData.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getRolePermissions(role: string): string {
  const permissions: Record<string, string[]> = {
    admin: [
      'Full access to all lab features',
      'Manage team members and permissions',
      'Create and manage projects',
      'Access all experiments and data',
      'Configure lab settings',
    ],
    member: [
      'Create and manage experiments',
      'Collaborate in team channels',
      'Share files and datasets',
      'Run AI analysis',
      'View team activity',
    ],
    researcher: [
      'Create and manage experiments',
      'Collaborate in team channels',
      'Share files and datasets',
      'Run AI analysis',
      'View team activity',
    ],
    guest: [
      'View shared experiments',
      'Participate in discussions',
      'Comment on data',
      'Limited file access',
    ],
  };

  const rolePermissions = permissions[role.toLowerCase()] || permissions.member;
  return rolePermissions.map(p => `<li>${p}</li>`).join('');
}

/* To invoke this function locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-team-invitation' \
    --header 'Authorization: Bearer YOUR_ANON_KEY' \
    --header 'Content-Type: application/json' \
    --data '{"email":"test@example.com","inviterName":"John Doe","labId":"123","role":"member","invitationToken":"abc123"}'

*/
