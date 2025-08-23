import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email templates in different languages
const emailTemplates = {
  en: {
    subject: 'Time to Level Up Your Travel Game! 🚀',
    heading: 'Your Free Trial Journey Continues!',
    greeting: (name: string) => `Hey ${name}!`,
    message: 'Guess what? You\'ve reached your monthly free trial limit! But don\'t worry, this is just the beginning of your amazing travel planning journey.',
    featuresTitle: 'Ready to unlock unlimited adventures?',
    features: [
      'Unlimited trip planning',
      'All premium features',
      'Priority support',
      'Advanced customization options'
    ],
    cta: 'Upgrade Now',
    footer: 'Keep exploring!\nThe ZapAround Team'
  },
  fr: {
    subject: 'Passez à la Vitesse Supérieure de vos Voyages ! 🚀',
    heading: 'Votre Période d\'Essai Gratuite Continue !',
    greeting: (name: string) => `Bonjour ${name} !`,
    message: 'Devinez quoi ? Vous avez atteint votre limite mensuelle d\'essai gratuit ! Mais ne vous inquiétez pas, ce n\'est que le début de votre incroyable aventure de planification de voyage.',
    featuresTitle: 'Prêt à débloquer des aventures illimitées ?',
    features: [
      'Planification de voyage illimitée',
      'Toutes les fonctionnalités premium',
      'Support prioritaire',
      'Options de personnalisation avancées'
    ],
    cta: 'Passer à la Version Premium',
    footer: 'Continuez à explorer !\nL\'équipe ZapAround'
  }
};

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
    const { email, name, language = 'en' } = await req.json();

    console.log(`Sending freenium notification to ${email} (${name}) in ${language}`);

    if (!email || !name) {
      throw new Error("Email and name are required");
    }

    const template = emailTemplates[language as keyof typeof emailTemplates] || emailTemplates.en;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${language}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${template.subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #fcfcfc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px 0;">
              <img src="https://www.zaparound.com/zaparound-uploads/transparentnoliner.png" alt="ZapAround Logo" style="max-width: 150px;">
            </div>
            
            <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #61936f; text-align: center; margin-bottom: 30px; font-size: 28px;">
                ${template.heading}
              </h1>
              
              <p style="font-size: 18px; color: #1d1d1e; margin-bottom: 20px;">
                ${template.greeting(name)}
              </p>
              
              <p style="font-size: 16px; color: #1d1d1e; margin-bottom: 30px;">
                ${template.message}
              </p>
              
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="color: #61936f; margin-top: 0;">${template.featuresTitle}</h3>
                <ul style="list-style-type: none; padding: 0; margin: 0;">
                  ${template.features.map(feature => `
                    <li style="margin-bottom: 10px; padding-left: 24px; position: relative;">
                      <span style="color: #61936f; position: absolute; left: 0;">✓</span>
                      ${feature}
                    </li>
                  `).join('')}
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://zaparound.com/pricing" 
                   style="display: inline-block; background-color: #61936f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  ${template.cta}
                </a>
              </div>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #62626a; font-size: 14px;">
              <p>${template.footer.replace('\n', '<br>')}</p>
              <p style="margin-top: 20px;">© ${new Date().getFullYear()} ZapAround. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "ZapAround <noreply@zaparound.com>",
      to: [email],
      subject: template.subject,
      html: htmlContent,
    });

    console.log("Freenium notification email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending freenium notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}); 