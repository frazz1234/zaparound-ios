import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email templates in different languages
const emailTemplates = {
  en: {
    subject: 'Your Free Features Are Back! 🎉',
    heading: 'Time for New Adventures!',
    greeting: (name: string) => `Hey ${name}!`,
    message: 'Great news! Your free features have been reset and you can start planning new adventures again!',
    featuresTitle: 'What you can do now:',
    features: [
      'Create new free trips',
      'Plan exciting adventures',
      'Explore new destinations',
      'Share your travel plans'
    ],
    cta: 'Start Planning',
    footer: 'Happy travels!\nThe ZapAround Team'
  },
  fr: {
    subject: 'Vos Fonctionnalités Gratuites Sont de Retour ! 🎉',
    heading: 'C\'est l\'Heure de Nouvelles Aventures !',
    greeting: (name: string) => `Bonjour ${name} !`,
    message: 'Bonne nouvelle ! Vos fonctionnalités gratuites ont été réinitialisées et vous pouvez recommencer à planifier de nouvelles aventures !',
    featuresTitle: 'Ce que vous pouvez faire maintenant :',
    features: [
      'Créer de nouveaux voyages gratuits',
      'Planifier des aventures passionnantes',
      'Explorer de nouvelles destinations',
      'Partager vos plans de voyage'
    ],
    cta: 'Commencer à Planifier',
    footer: 'Bon voyage !\nL\'équipe ZapAround'
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user ID from request
    const { userId } = await req.json();

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Get user data
    const { data: userData, error: userError } = await supabaseClient
      .from('user_roles')
      .select('email, first_name, last_name, language')
      .eq('user_id', userId)
      .single();

    if (userError) {
      throw userError;
    }

    // Update freenium status to false
    const { error: updateError } = await supabaseClient
      .from('user_roles')
      .update({ freenium: false })
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }

    // Send email notification
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const template = emailTemplates[userData.language as keyof typeof emailTemplates] || emailTemplates.en;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${userData.language || 'en'}">
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
                ${template.greeting(userData.first_name || userData.last_name || userData.email.split('@')[0])}
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
                <a href="https://zaparound.com/dashboard" 
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

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ZapAround <noreply@zaparound.com>',
        to: [userData.email],
        subject: template.subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send reset notification email');
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error resetting freenium status:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to reset freenium status" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}); 