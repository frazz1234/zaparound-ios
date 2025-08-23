import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BusinessStatusEmailRequest {
  businessName: string;
  businessId: string;
  ownerEmail: string;
  ownerName: string;
  status: 'active' | 'inactive' | 'pending';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("Missing RESEND_API_KEY environment variable");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    const resend = new Resend(resendKey);
    const { businessName, businessId, ownerEmail, ownerName, status }: BusinessStatusEmailRequest = await req.json();

    console.log(`Sending business status update notification for ${businessName} (ID: ${businessId})`);

    // Create email template based on status
    const getEmailTemplate = () => {
      switch (status) {
        case 'active':
          return {
            subject: `Your Business ${businessName} is Now Active!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f9f9f9; border-radius: 10px;">
                <div style="text-align: center; padding: 20px 0;">
                  <img src="https://www.zaparound.com/zaparound-uploads/transparentnoliner.png" alt="ZapAround Logo" style="max-width: 150px;">
                </div>
                
                <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <h1 style="color: #3b82f6; text-align: center; margin-bottom: 30px;">Congratulations! 🎉</h1>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 70px;">✨ 🚀 💼</span>
                  </div>
                  
                  <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
                    Hello ${ownerName},
                  </p>
                  
                  <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
                    Great news! Your business <strong>${businessName}</strong> has been approved and is now active on ZapAround.
                  </p>
                  
                  <div style="background-color: #f0f7ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px;">
                    <h3 style="margin-top: 0; color: #3b82f6;">What's Next?</h3>
                    <ul style="list-style-type: none; padding: 0; margin: 0;">
                      <li style="margin-bottom: 10px;">✨ Access your business dashboard</li>
                      <li style="margin-bottom: 10px;">👥 Start managing your team members</li>
                      <li style="margin-bottom: 10px;">📊 Set up your business profile</li>
                      <li style="margin-bottom: 0;">📧 Configure your email templates</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://zaparound.com/business/dashboard" 
                       style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                      Go to Dashboard
                    </a>
                  </div>
                  
                  <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
                    If you have any questions or need assistance, our support team is here to help!
                  </p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
                  <p>This is an automated message from ZapAround Business Platform.</p>
                  <p>© ${new Date().getFullYear()} ZapAround. All rights reserved.</p>
                </div>
              </div>
            `
          };
        case 'inactive':
          return {
            subject: `Important: Your Business ${businessName} Status Update`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f9f9f9; border-radius: 10px;">
                <div style="text-align: center; padding: 20px 0;">
                  <img src="https://www.zaparound.com/zaparound-uploads/transparentnoliner.png" alt="ZapAround Logo" style="max-width: 150px;">
                </div>
                
                <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <h1 style="color: #ef4444; text-align: center; margin-bottom: 30px;">Business Status Update</h1>
                  
                  <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
                    Hello ${ownerName},
                  </p>
                  
                  <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
                    We're writing to inform you that your business <strong>${businessName}</strong> has been marked as inactive.
                  </p>
                  
                  <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 4px;">
                    <h3 style="margin-top: 0; color: #ef4444;">Next Steps</h3>
                    <p>Please contact our support team to understand why your business was marked as inactive and what steps you can take to reactivate it.</p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://zaparound.com/contact" 
                       style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                      Contact Support
                    </a>
                  </div>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
                  <p>This is an automated message from ZapAround Business Platform.</p>
                  <p>© ${new Date().getFullYear()} ZapAround. All rights reserved.</p>
                </div>
              </div>
            `
          };
        default:
          return {
            subject: `Business Status Update: ${businessName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f9f9f9; border-radius: 10px;">
                <div style="text-align: center; padding: 20px 0;">
                  <img src="https://www.zaparound.com/zaparound-uploads/transparentnoliner.png" alt="ZapAround Logo" style="max-width: 150px;">
                </div>
                
                <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <h1 style="color: #3b82f6; text-align: center; margin-bottom: 30px;">Business Status Update</h1>
                  
                  <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
                    Hello ${ownerName},
                  </p>
                  
                  <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
                    This email is to inform you that the status of your business <strong>${businessName}</strong> has been updated.
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://zaparound.com/business/status" 
                       style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                      Check Status
                    </a>
                  </div>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
                  <p>This is an automated message from ZapAround Business Platform.</p>
                  <p>© ${new Date().getFullYear()} ZapAround. All rights reserved.</p>
                </div>
              </div>
            `
          };
      }
    };

    const emailTemplate = getEmailTemplate();

    // Send email to business owner
    await resend.emails.send({
      from: "ZapAround Business <business@zaparound.com>",
      to: [ownerEmail],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    console.log("Business status update notification email sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending business status update notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}); 