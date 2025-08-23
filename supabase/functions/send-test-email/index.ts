import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  to: string[];
  subject: string;
  from: string;
  replyTo?: string;
  templateContent: string;
  businessName: string;
  businessLogo: string | null;
  businessPhone: string | null;
  teamMember: string | null;
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
    const { 
      to, 
      subject, 
      from, 
      replyTo,
      templateContent, 
      businessName,
      businessLogo,
      businessPhone,
      teamMember 
    }: TestEmailRequest = await req.json();

    console.log(`Sending test email to ${to.join(', ')} from ${from}`);

    if (!to || to.length === 0 || !subject || !from || !templateContent) {
      throw new Error("Missing required fields");
    }

    // Replace placeholders with actual content
    let processedContent = templateContent
      .replace(/#teammember/g, teamMember || 'Team Member')
      .replace(/#businessname/g, businessName)
      .replace(/#businesslogo/g, businessLogo ? `<img src="${businessLogo}" alt="${businessName} Logo" style="max-width: 200px;">` : '')
      .replace(/#businessphone/g, businessPhone || 'Business Phone')
      .replace(/#content/g, ''); // Remove content placeholder as it's not needed for test emails

    // Preserve formatting by converting newlines to <br> tags
    processedContent = processedContent.replace(/\n/g, '<br>');

    // Create email HTML with template content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; padding: 20px 0;">
          <img src="https://www.zaparound.com/zaparound-uploads/transparentnoliner.png" alt="ZapAround Logo" style="max-width: 150px;">
        </div>
        
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="margin-bottom: 20px; white-space: pre-wrap;">
            ${processedContent}
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This is a test email sent from ${businessName} using ZapAround's email template system.</p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
          <p>© ${new Date().getFullYear()} ZapAround. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: `${businessName} <${from}>`,
      to: to, // Send as array of strings
      reply_to: replyTo,
      subject: subject,
      html: emailHtml,
    });

    console.log("Test email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending test email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}); 