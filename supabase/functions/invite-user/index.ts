import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Get current user
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }

        const { email, role, lab_id } = await req.json()

        // Validate input
        if (!email || !role || !lab_id) {
            throw new Error('Missing required fields')
        }

        // Generate token
        const token = crypto.randomUUID()

        // Insert invitation into database
        const { error: dbError } = await supabaseClient
            .from('team_invitations')
            .insert({
                email,
                role,
                lab_id,
                invited_by: user.id,
                token
            })

        if (dbError) throw dbError

        // Send email using Resend
        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        if (!resendApiKey) {
            console.error('RESEND_API_KEY is not set')
            throw new Error('Server configuration error')
        }

        const inviteLink = `${req.headers.get('origin') || 'http://localhost:5173'}/join?token=${token}`

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: 'Lab-IQ <onboarding@resend.dev>', // Update this with your verified domain
                to: [email],
                subject: 'You have been invited to join a Lab-IQ Team',
                html: `
          <h1>Welcome to Lab-IQ!</h1>
          <p>You have been invited to join a team on Lab-IQ as a <strong>${role}</strong>.</p>
          <p>Click the link below to accept the invitation:</p>
          <a href="${inviteLink}" style="padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
          <p>Or copy and paste this link into your browser:</p>
          <p>${inviteLink}</p>
        `,
            }),
        })

        const data = await res.json()

        if (!res.ok) {
            console.error('Resend API Error:', data);
            throw new Error('Failed to send email');
        }

        return new Response(
            JSON.stringify(data),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
