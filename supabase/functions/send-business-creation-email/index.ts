import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BusinessCreationEmailRequest {
  businessName: string;
  businessId: string;
  description: string;
  website: string;
  logo_url: string;
  ownerEmail: string;
  ownerName: string;
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
    const { businessName, businessId, description, website, logo_url, ownerEmail, ownerName }: BusinessCreationEmailRequest = await req.json();

    console.log(`Sending business creation notifications for ${businessName} (ID: ${businessId})`);

    // Admin notification email template
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f9f9f9; border-radius: 10px;">
        <div style="text-align: center; padding: 20px 0;">
          <img src="https://www.zaparound.com/zaparound-uploads/transparentnoliner.png" alt="ZapAround Logo" style="max-width: 150px;">
        </div>
        
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #3b82f6; text-align: center; margin-bottom: 30px;">New Business Registration</h1>
          
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 70px;">🏢 📝 ✨</span>
          </div>
          
          <div style="background-color: #f0f7ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #3b82f6;">Business Details:</h3>
            <p style="margin-bottom: 10px;"><strong>Business Name:</strong> ${businessName}</p>
            <p style="margin-bottom: 10px;"><strong>Business ID:</strong> ${businessId}</p>
            <p style="margin-bottom: 10px;"><strong>Description:</strong> ${description || 'No description provided'}</p>
            <p style="margin-bottom: 10px;"><strong>Website:</strong> ${website || 'No website provided'}</p>
            <p style="margin-bottom: 0;"><strong>Logo URL:</strong> ${logo_url || 'No logo provided'}</p>
          </div>
          
          <div style="background-color: #f0f7ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #3b82f6;">Owner Information:</h3>
            <p style="margin-bottom: 10px;"><strong>Name:</strong> ${ownerName}</p>
            <p style="margin-bottom: 0;"><strong>Email:</strong> ${ownerEmail}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://zaparound.com/admin" 
               style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Review Business
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
          <p>This is an automated message from ZapAround Business Platform.</p>
          <p>© ${new Date().getFullYear()} ZapAround. All rights reserved.</p>
        </div>
      </div>
    `;

    // Business owner welcome email template
    const ownerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f9f9f9; border-radius: 10px;">
        <div style="text-align: center; padding: 20px 0;">
          <img src="https://www.zaparound.com/zaparound-uploads/transparentnoliner.png" alt="ZapAround Logo" style="max-width: 150px;">
        </div>
        
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #3b82f6; text-align: center; margin-bottom: 30px;">Welcome to ZapAround Business!</h1>
          
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 70px;">🎉 🚀 💼</span>
          </div>
          
          <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
            Hello ${ownerName},
          </p>
          
          <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
            Thank you for creating your business account with ZapAround! We're excited to have you on board.
          </p>
          
          <div style="background-color: #f0f7ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #3b82f6;">Your Business Details:</h3>
            <p style="margin-bottom: 10px;"><strong>Business Name:</strong> ${businessName}</p>
            <p style="margin-bottom: 10px;"><strong>Business ID:</strong> ${businessId}</p>
            <p style="margin-bottom: 10px;"><strong>Description:</strong> ${description || 'No description provided'}</p>
            <p style="margin-bottom: 10px;"><strong>Website:</strong> ${website || 'No website provided'}</p>
            <p style="margin-bottom: 0;"><strong>Logo URL:</strong> ${logo_url || 'No logo provided'}</p>
          </div>
          
          <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
            Your business account is currently under review. This process typically takes 1-2 business days. You can check your business status at any time through our status page.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://zaparound.com/business/status" 
               style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Check Business Status
            </a>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
            If you have any questions during this process, please don't hesitate to contact our support team.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
          <p>This is an automated message from ZapAround Business Platform.</p>
          <p>© ${new Date().getFullYear()} ZapAround. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send admin notification email
    await resend.emails.send({
      from: "ZapAround Business <business@zaparound.com>",
      to: ["business@zaparound.com"],
      subject: `A new Business have been created and waiting for your approuval`,
      html: adminEmailHtml,
    });

    // Send welcome email to business owner
    await resend.emails.send({
      from: "ZapAround Business <business@zaparound.com>",
      to: [ownerEmail],
      subject: `Welcome to ZapAround Business - ${businessName}`,
      html: ownerEmailHtml,
    });

    console.log("Business creation notification emails sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending business creation notification emails:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send emails" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}); 