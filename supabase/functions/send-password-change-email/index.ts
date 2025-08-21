import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  email: string;
  name: string;
  language: string;
}

// Email templates in different languages
const emailTemplates = {
  en: {
    subject: 'Password Changed Successfully - ZapAround',
    heading: 'Password Changed Successfully',
    greeting: (name: string) => `Hello ${name},`,
    message: 'Your password has been successfully changed. If you did not make this change, please contact our support team immediately.',
    securityNote: 'For security reasons, you have been signed out of all devices. Please log in again with your new password.',
    footer: 'Best regards,\nThe ZapAround Team'
  },
  fr: {
    subject: 'Mot de passe modifié avec succès - ZapAround',
    heading: 'Mot de passe modifié avec succès',
    greeting: (name: string) => `Bonjour ${name},`,
    message: 'Votre mot de passe a été modifié avec succès. Si vous n\'êtes pas à l\'origine de ce changement, veuillez contacter notre équipe support immédiatement.',
    securityNote: 'Pour des raisons de sécurité, vous avez été déconnecté de tous les appareils. Veuillez vous reconnecter avec votre nouveau mot de passe.',
    footer: 'Cordialement,\nL\'équipe ZapAround'
  },
  es: {
    subject: 'Contraseña cambiada exitosamente - ZapAround',
    heading: 'Contraseña cambiada exitosamente',
    greeting: (name: string) => `Hola ${name},`,
    message: 'Tu contraseña ha sido cambiada exitosamente. Si no realizaste este cambio, por favor contacta a nuestro equipo de soporte inmediatamente.',
    securityNote: 'Por razones de seguridad, has sido desconectado de todos los dispositivos. Por favor, inicia sesión nuevamente con tu nueva contraseña.',
    footer: 'Saludos cordiales,\nEl equipo de ZapAround'
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, name, language = 'en' } = await req.json() as EmailRequest;

    // Get the appropriate template based on language, fallback to English
    const template = emailTemplates[language as keyof typeof emailTemplates] || emailTemplates.en;

    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${language}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${template.subject}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #61936f;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .content {
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .security-note {
              background-color: #fff3cd;
              border: 1px solid #ffeeba;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 0.9em;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${template.heading}</h1>
          </div>
          <div class="content">
            <p>${template.greeting(name)}</p>
            <p>${template.message}</p>
            <div class="security-note">
              <p>${template.securityNote}</p>
            </div>
            <div class="footer">
              <p>${template.footer.replace('\n', '<br>')}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend API directly
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ZapAround Security <security@zaparound.com>',
        to: email,
        subject: template.subject,
        html: htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
}); 