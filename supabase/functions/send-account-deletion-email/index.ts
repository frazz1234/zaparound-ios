
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteAccountEmailRequest {
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
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
    const { email, name }: DeleteAccountEmailRequest = await req.json();

    console.log(`Sending account deletion confirmation to ${email} for ${name}`);

    if (!email) {
      throw new Error("Email is required");
    }

    // Create a fun but sad message for the user
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h1 style="color: #ff6347; text-align: center;">Farewell, ${name}!</h1>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 70px;">😢</span>
        </div>
        
        <p style="font-size: 18px; line-height: 1.6; text-align: center;">
          We're sad to see you go, but we understand that all journeys must come to an end.
        </p>
        
        <p style="font-size: 18px; line-height: 1.6; text-align: center;">
          Your account has been successfully deleted from our system, along with all your data.
        </p>
        
        <hr style="border: 1px solid #eee; margin: 30px 0;" />
        
        <p style="font-size: 16px; line-height: 1.6; text-align: center;">
          As the famous travel quote says, <em>"Not all those who wander are lost."</em>
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; text-align: center;">
          If you ever find yourself wanting a travel companion again, we'll be here to help plan your next adventure!
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 40px;">🚶‍♂️ 🌍 ✈️</span>
        </div>
        
        <p style="font-size: 14px; color: #888; text-align: center; margin-top: 40px;">
          This is an automated message, please do not reply to this email.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "ZapAround <noreply@zaparound.com>",
      to: [email],
      subject: "We're sad to see you go - Account Deleted",
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending deletion confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
