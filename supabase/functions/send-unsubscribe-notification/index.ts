import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UnsubscribeData {
  email: string;
  reason: string;
  feedback?: string;
  language?: string;
}

const reasonMap: Record<string, string> = {
  too_frequent: "Emails are too frequent",
  not_relevant: "Content is not relevant to me",
  never_signed_up: "I never signed up for this",
  poor_content: "Poor content quality",
  changed_interests: "My interests have changed",
  other: "Other reason"
};

const languageMap: Record<string, string> = {
  en: "English",
  fr: "French",
  es: "Spanish"
};

// Helper function to get goodbye email subject based on language
function getGoodbyeEmailSubject(language: string): string {
  const subjects = {
    en: "We'll miss you! 😢 - ZapAround Newsletter",
    fr: "Vous allez nous manquer ! 😢 - Newsletter ZapAround",
    es: "¡Te vamos a extrañar! 😢 - Boletín ZapAround"
  };
  return subjects[language as keyof typeof subjects] || subjects.en;
}

// Helper function to create user goodbye email
function createUserGoodbyeEmail(email: string, reason: string, feedback?: string, language: string = 'en'): string {
  const reasonMap: Record<string, string> = {
    too_frequent: "emails are too frequent",
    not_relevant: "content is not relevant to you",
    never_signed_up: "you never signed up for this",
    poor_content: "poor content quality",
    changed_interests: "your interests have changed",
    other: "other reasons"
  };

  const formattedReason = reasonMap[reason] || reason;
  
  const content = {
    en: {
      title: "We'll miss you! 😢",
      subtitle: "You've been unsubscribed from our newsletter",
      message: `We're sad to see you go! You've been successfully unsubscribed from our newsletter because ${formattedReason}.`,
      feedbackMessage: feedback ? `We've noted your feedback: "${feedback}"` : "",
      actionMessage: "We'll use your feedback to make our newsletter better for everyone.",
      comebackMessage: "You're always welcome back! You can resubscribe anytime from your account settings.",
      footer: "Thank you for being part of our travel community",
      stayConnected: "Other ways to stay connected:",
      website: "Visit our website",
      social: "Follow us on social media",
      support: "Need help? Contact us"
    },
    fr: {
      title: "Vous allez nous manquer ! 😢",
      subtitle: "Vous avez été désabonné de notre newsletter",
      message: `Nous sommes tristes de vous voir partir ! Vous avez été désabonné avec succès de notre newsletter car ${formattedReason}.`,
      feedbackMessage: feedback ? `Nous avons noté vos commentaires : "${feedback}"` : "",
      actionMessage: "Nous utiliserons vos commentaires pour améliorer notre newsletter pour tout le monde.",
      comebackMessage: "Vous êtes toujours le bienvenu ! Vous pouvez vous réabonner à tout moment depuis les paramètres de votre compte.",
      footer: "Merci d'avoir fait partie de notre communauté de voyage",
      stayConnected: "Autres façons de rester connecté :",
      website: "Visiter notre site web",
      social: "Nous suivre sur les réseaux sociaux",
      support: "Besoin d'aide ? Contactez-nous"
    },
    es: {
      title: "¡Te vamos a extrañar! 😢",
      subtitle: "Has sido desuscrito de nuestro boletín",
      message: `¡Nos entristece verte partir! Has sido desuscrito exitosamente de nuestro boletín porque ${formattedReason}.`,
      feedbackMessage: feedback ? `Hemos anotado tus comentarios: "${feedback}"` : "",
      actionMessage: "Usaremos tus comentarios para hacer nuestro boletín mejor para todos.",
      comebackMessage: "¡Siempre eres bienvenido de vuelta! Puedes volver a suscribirte en cualquier momento desde la configuración de tu cuenta.",
      footer: "Gracias por ser parte de nuestra comunidad de viajes",
      stayConnected: "Otras formas de mantenerse conectado:",
      website: "Visitar nuestro sitio web",
      social: "Síguenos en redes sociales",
      support: "¿Necesitas ayuda? Contáctanos"
    }
  };

  const langContent = content[language as keyof typeof content] || content.en;

  return `
    <!DOCTYPE html>
    <html lang="${language}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Goodbye from ZapAround</title>
        <style>
          :root {
            color-scheme: light;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #030303;
            background: linear-gradient(135deg, #fcfcfc 0%, #f8f9fa 100%);
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            margin-top: 20px;
            margin-bottom: 20px;
          }
          .header {
            background: linear-gradient(135deg, #61936f 0%, #1d1d1e 100%);
            color: white;
            padding: 40px 24px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 6s ease-in-out infinite;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          .logo {
            font-size: 48px;
            margin-bottom: 16px;
            position: relative;
            z-index: 1;
          }
          .title {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px 0;
            position: relative;
            z-index: 1;
          }
          .subtitle {
            font-size: 18px;
            opacity: 0.9;
            margin: 0;
            position: relative;
            z-index: 1;
          }
          .content {
            padding: 40px 24px;
            background: linear-gradient(180deg, #ffffff 0%, #fcfcfc 100%);
          }
          .message-section {
            text-align: center;
            margin-bottom: 32px;
          }
          .main-message {
            font-size: 18px;
            color: #1d1d1e;
            margin-bottom: 24px;
            line-height: 1.7;
          }
          .feedback-box {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 2px solid #f39c12;
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
          }
          .feedback-text {
            font-style: italic;
            color: #856404;
            margin: 0;
            font-size: 16px;
          }
          .action-section {
            background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            text-align: center;
            border: 2px solid #61936f;
          }
          .action-title {
            font-size: 20px;
            font-weight: 600;
            color: #1d1d1e;
            margin-bottom: 16px;
          }
          .action-text {
            color: #1d1d1e;
            margin-bottom: 16px;
          }
          .comeback-message {
            background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
            border: 2px solid #007bff;
          }
          .comeback-text {
            color: #1d1d1e;
            font-weight: 500;
          }
          .stay-connected {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            text-align: center;
          }
          .stay-connected-title {
            font-size: 18px;
            font-weight: 600;
            color: #1d1d1e;
            margin-bottom: 16px;
          }
          .connection-options {
            display: flex;
            justify-content: center;
            gap: 16px;
            flex-wrap: wrap;
          }
          .connection-option {
            background: white;
            border: 2px solid #61936f;
            border-radius: 8px;
            padding: 12px 20px;
            color: #61936f;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
          }
          .connection-option:hover {
            background: #61936f;
            color: white;
            transform: translateY(-2px);
          }
          .footer {
            background: linear-gradient(135deg, #1d1d1e 0%, #2d2d2e 100%);
            color: white;
            padding: 32px 24px;
            text-align: center;
          }
          .footer-text {
            color: #fcfcfc;
            font-size: 16px;
            margin: 0;
          }
          .footer-highlight {
            color: #61936f;
            font-weight: 600;
          }
          .support-link {
            color: #61936f;
            text-decoration: none;
            font-weight: 500;
          }
          .support-link:hover {
            text-decoration: underline;
          }
          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 12px;
            }
            .header, .content, .footer {
              padding: 24px 16px;
            }
            .connection-options {
              flex-direction: column;
              align-items: center;
            }
            .connection-option {
              width: 100%;
              max-width: 200px;
              text-align: center;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">✈️</div>
            <h1 class="title">${langContent.title}</h1>
            <p class="subtitle">${langContent.subtitle}</p>
          </div>
          
          <div class="content">
            <div class="message-section">
              <p class="main-message">${langContent.message}</p>
              
              ${langContent.feedbackMessage ? `
              <div class="feedback-box">
                <p class="feedback-text">${langContent.feedbackMessage}</p>
              </div>
              ` : ''}
              
              <div class="action-section">
                <h3 class="action-title">💡 We're listening</h3>
                <p class="action-text">${langContent.actionMessage}</p>
              </div>
              
              <div class="comeback-message">
                <p class="comeback-text">${langContent.comebackMessage}</p>
              </div>
            </div>
            
            <div class="stay-connected">
              <h3 class="stay-connected-title">${langContent.stayConnected}</h3>
              <div class="connection-options">
                <a href="https://zaparound.com" class="connection-option">
                  🌐 ${langContent.website}
                </a>
                <a href="https://zaparound.com" class="connection-option">
                  📱 ${langContent.social}
                </a>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              ${langContent.footer} | 
              <a href="mailto:support@zaparound.com" class="support-link">${langContent.support}</a>
            </p>
            <p class="footer-text">
              <span class="footer-highlight">ZapAround</span> - Your smart travel planning assistant
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(async (req: Request) => {
  console.log("Unsubscribe notification request received");
  
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
    const { email, reason, feedback, language = 'en' } = requestData as UnsubscribeData;

    console.log("Processing unsubscribe notification:", { email, reason, language });

    if (!email || !reason) {
      console.error("Missing required fields in unsubscribe notification");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const formattedReason = reasonMap[reason] || reason;
    const formattedLanguage = languageMap[language] || "English";

    // Create a modern, responsive email template in ZapAround's design style
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="${language}">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Newsletter Unsubscribe Notification</title>
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
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #61936f 0%, #1d1d1e 100%);
              color: white;
              padding: 32px 24px;
              text-align: center;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .subtitle {
              font-size: 16px;
              opacity: 0.9;
              margin: 0;
            }
            .content {
              padding: 32px 24px;
            }
            .section {
              margin-bottom: 24px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #1d1d1e;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .section-content {
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 16px;
              border-left: 4px solid #61936f;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 500;
              color: #62626a;
              min-width: 120px;
            }
            .info-value {
              color: #1d1d1e;
              font-weight: 500;
            }
            .feedback-box {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 6px;
              padding: 16px;
              margin-top: 16px;
            }
            .feedback-text {
              font-style: italic;
              color: #856404;
              margin: 0;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 24px;
              text-align: center;
              border-top: 1px solid #e9ecef;
            }
            .footer-text {
              color: #62626a;
              font-size: 14px;
              margin: 0;
            }
            .highlight {
              color: #61936f;
              font-weight: 600;
            }
            @media (max-width: 600px) {
              .container {
                margin: 16px;
                border-radius: 8px;
              }
              .header, .content, .footer {
                padding: 24px 16px;
              }
              .info-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 4px;
              }
              .info-label {
                min-width: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📧</div>
              <div class="subtitle">Newsletter Unsubscribe Notification</div>
            </div>
            
            <div class="content">
              <div class="section">
                <div class="section-title">
                  📊 Unsubscribe Details
                </div>
                <div class="section-content">
                  <div class="info-row">
                    <span class="info-label">User Email:</span>
                    <span class="info-value">${email}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Reason:</span>
                    <span class="info-value">${formattedReason}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Language:</span>
                    <span class="info-value">${formattedLanguage}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span class="info-value">${new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
              </div>

              ${feedback ? `
              <div class="section">
                <div class="section-title">
                  💭 User Feedback
                </div>
                <div class="feedback-box">
                  <p class="feedback-text">"${feedback}"</p>
                </div>
              </div>
              ` : ''}

              <div class="section">
                <div class="section-title">
                  📈 Action Required
                </div>
                <div class="section-content">
                  <p style="margin: 0; color: #1d1d1e;">
                    This user has been automatically removed from the newsletter list. 
                    Consider reviewing the feedback to improve future newsletter content and reduce unsubscribe rates.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p class="footer-text">
                Sent from <span class="highlight">ZapAround</span> unsubscribe system
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email to hello@zaparound.com
    const adminEmailResponse = await resend.emails.send({
      from: "ZapAround <noreply@zaparound.com>",
      to: ["hello@zaparound.com"],
      subject: `📧 Newsletter Unsubscribe: ${email}`,
      html: emailHtml,
    });

    console.log("Admin unsubscribe notification email sent successfully:", adminEmailResponse);

    // Send goodbye email to the user
    const userGoodbyeEmailHtml = createUserGoodbyeEmail(email, reason, feedback, language);
    
    const userEmailResponse = await resend.emails.send({
      from: "ZapAround <hello@zaparound.com>",
      to: [email],
      subject: getGoodbyeEmailSubject(language),
      html: userGoodbyeEmailHtml,
    });

    console.log("User goodbye email sent successfully:", userEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Unsubscribe notification sent successfully",
        adminEmailId: adminEmailResponse.data?.id,
        userEmailId: userEmailResponse.data?.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Error sending unsubscribe notification email:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send unsubscribe notification email" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
