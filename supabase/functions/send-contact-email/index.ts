import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone: string;
  category: string;
  preferredTime: string;
}

const categoryMap: Record<string, string> = {
  general: "General Inquiry",
  support: "Technical Support",
  booking: "Booking Issues",
  feedback: "Feedback",
  partnership: "Business Partnership",
  other: "Other"
};

const preferredTimeMap: Record<string, string> = {
  morning: "Morning (9AM-12PM)",
  afternoon: "Afternoon (12PM-5PM)",
  evening: "Evening (5PM-8PM)",
  any: "Any Time"
};

serve(async (req: Request) => {
  console.log("Contact form submission received");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
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

    // Parse the request body
    const requestData = await req.json();
    const { 
      name, 
      email, 
      subject, 
      message, 
      phone, 
      category, 
      preferredTime 
    } = requestData as ContactFormData;

    console.log("Processing contact form submission:", { name, email, subject, category });

    if (!name || !email || !subject || !message) {
      console.error("Missing required fields in contact form submission");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const formattedCategory = categoryMap[category] || "General Inquiry";
    const formattedTime = preferredTimeMap[preferredTime] || "Any Time";

    // Create a modern, responsive email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Form Submission</title>
          <style>
            :root {
              color-scheme: light;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #030303;
              background-color: #fcfcfc;
              margin: 0;
              padding: 0;
            }
            .wrapper {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              overflow: hidden;
            }
            .header {
              background-color: #61936f;
              color: #ffffff;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 30px;
            }
            .field {
              margin-bottom: 20px;
              background-color: #fcfcfc;
              border-radius: 8px;
              padding: 15px;
            }
            .field:last-child {
              margin-bottom: 0;
            }
            .label {
              color: #62626a;
              font-size: 14px;
              font-weight: 500;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .value {
              color: #1d1d1e;
              font-size: 16px;
            }
            .message {
              white-space: pre-wrap;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #62626a;
              font-size: 14px;
              border-top: 1px solid #f0f0f0;
            }
            @media (max-width: 600px) {
              .wrapper {
                padding: 10px;
              }
              .header, .content {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>New Contact Form Submission</h1>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Category</div>
                  <div class="value">${formattedCategory}</div>
                </div>
                <div class="field">
                  <div class="label">Name</div>
                  <div class="value">${name}</div>
                </div>
                <div class="field">
                  <div class="label">Email</div>
                  <div class="value">${email}</div>
                </div>
                ${phone ? `
                <div class="field">
                  <div class="label">Phone</div>
                  <div class="value">${phone}</div>
                </div>
                ` : ''}
                <div class="field">
                  <div class="label">Preferred Contact Time</div>
                  <div class="value">${formattedTime}</div>
                </div>
                <div class="field">
                  <div class="label">Subject</div>
                  <div class="value">${subject}</div>
                </div>
                <div class="field">
                  <div class="label">Message</div>
                  <div class="value message">${message.replace(/\n/g, "<br>")}</div>
                </div>
              </div>
              <div class="footer">
                <p>This email was sent from the ZapAround contact form</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log("Sending email to admin");
    const emailResponse = await resend.emails.send({
      from: "ZapAround <contact-form@zaparound.com>",
      to: ["hello@zaparound.com"],
      reply_to: email,
      subject: `New Contact Form: ${formattedCategory} - ${subject}`,
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
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
