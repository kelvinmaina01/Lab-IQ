import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotification {
  to: string;
  subject: string;
  type: "action_assignment" | "critical_bottleneck";
  data: {
    actionTitle?: string;
    actionDescription?: string;
    assignedBy?: string;
    notes?: string;
    bottleneckTitle?: string;
    bottleneckDescription?: string;
    impactScore?: number;
    suggestedAction?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    // If API key not configured, log and return success (placeholder mode)
    if (!resendApiKey) {
      console.log("⚠️ RESEND_API_KEY not configured - email notification skipped (placeholder mode)");
      const notification: EmailNotification = await req.json();
      console.log("Would send email to:", notification.to);
      console.log("Subject:", notification.subject);
      console.log("Type:", notification.type);
      console.log("Data:", JSON.stringify(notification.data, null, 2));
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email notification logged (API key not configured)" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const notification: EmailNotification = await req.json();
    
    let htmlContent = "";
    
    if (notification.type === "action_assignment") {
      htmlContent = `
        <h1>You've Been Assigned an Action</h1>
        <p>Hello,</p>
        <p>You have been assigned a new action that requires your attention:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">${notification.data.actionTitle}</h2>
          <p>${notification.data.actionDescription}</p>
          ${notification.data.notes ? `<p><strong>Additional Notes:</strong> ${notification.data.notes}</p>` : ''}
          <p style="color: #666; font-size: 14px;">Assigned by: ${notification.data.assignedBy}</p>
        </div>
        <p>Please review this action and take appropriate steps to address it.</p>
        <p>Best regards,<br>Your Lab Team</p>
      `;
    } else if (notification.type === "critical_bottleneck") {
      htmlContent = `
        <h1>⚠️ Critical Bottleneck Detected</h1>
        <p>Hello,</p>
        <p>Our AI system has detected a critical bottleneck in your lab workflow that requires immediate attention:</p>
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <h2 style="margin-top: 0; color: #ff9800;">${notification.data.bottleneckTitle}</h2>
          <p>${notification.data.bottleneckDescription}</p>
          <p><strong>Impact Score:</strong> ${notification.data.impactScore}%</p>
          ${notification.data.suggestedAction ? `
            <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin-top: 15px;">
              <p style="margin: 0;"><strong>Suggested Action:</strong></p>
              <p style="margin: 10px 0 0 0;">${notification.data.suggestedAction}</p>
            </div>
          ` : ''}
        </div>
        <p>We recommend addressing this bottleneck as soon as possible to maintain optimal lab productivity.</p>
        <p>Best regards,<br>Your Lab AI Assistant</p>
      `;
    }

    // Placeholder for Resend integration
    // Uncomment and configure when API key is added:
    /*
    const { Resend } = await import("npm:resend@2.0.0");
    const resend = new Resend(resendApiKey);
    
    const emailResponse = await resend.emails.send({
      from: "Lab Assistant <notifications@yourdomain.com>",
      to: [notification.to],
      subject: notification.subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);
    */

    console.log("Email notification prepared (waiting for API key configuration):");
    console.log("To:", notification.to);
    console.log("Subject:", notification.subject);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email notification ready (configure RESEND_API_KEY to enable sending)"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
