import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { Resend } from "npm:resend@2.0.0";

interface SignupRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  location: string
  language: string
  newsletter_subscribed: boolean
  captchaToken: string
}

// Welcome email templates in different languages
const welcomeEmailTemplates = {
  en: {
    subject: 'Welcome to ZapAround - Your Journey Begins Here!',
    heading: 'Welcome to ZapAround!',
    greeting: (name: string) => `Hello ${name}!`,
    message: 'Thank you for joining ZapAround! We\'re excited to help you plan your next adventure.',
    featuresTitle: 'What you can do with ZapAround:',
    features: [
      'Create personalized travel itineraries',
      'Discover unique destinations',
      'Connect with fellow travelers',
      'Access exclusive travel tips'
    ],
    cta: 'Start Your Journey',
    footer: 'Happy travels!\nThe ZapAround Team'
  },
  fr: {
    subject: 'Bienvenue sur ZapAround - Votre Voyage Commence Ici !',
    heading: 'Bienvenue sur ZapAround !',
    greeting: (name: string) => `Bonjour ${name} !`,
    message: 'Merci d\'avoir rejoint ZapAround ! Nous sommes ravis de vous aider à planifier votre prochaine aventure.',
    featuresTitle: 'Ce que vous pouvez faire avec ZapAround :',
    features: [
      'Créez des itinéraires de voyage personnalisés',
      'Découvrez des destinations uniques',
      'Connectez-vous avec d\'autres voyageurs',
      'Accédez à des conseils de voyage exclusifs'
    ],
    cta: 'Commencez Votre Voyage',
    footer: 'Bon voyage !\nL\'équipe ZapAround'
  },
  es: {
    subject: '¡Bienvenido a ZapAround - Tu Viaje Comienza Aquí!',
    heading: '¡Bienvenido a ZapAround!',
    greeting: (name: string) => `¡Hola ${name}!`,
    message: '¡Gracias por unirte a ZapAround! Estamos emocionados de ayudarte a planear tu próxima aventura.',
    featuresTitle: 'Qué puedes hacer con ZapAround:',
    features: [
      'Crea itinerarios de viaje personalizados',
      'Descubre destinos únicos',
      'Conéctate con otros viajeros',
      'Accede a consejos de viaje exclusivos'
    ],
    cta: 'Comienza Tu Viaje',
    footer: '¡Feliz viaje!\nEl equipo de ZapAround'
  }
};

async function sendWelcomeEmail(email: string, name: string, language: string = 'en') {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    console.log('RESEND_API_KEY not configured, skipping welcome email');
    return;
  }

  try {
    const resend = new Resend(resendKey);
    const template = welcomeEmailTemplates[language as keyof typeof welcomeEmailTemplates] || welcomeEmailTemplates.en;

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

    const emailResponse = await resend.emails.send({
      from: "ZapAround <noreply@zaparound.com>",
      to: [email],
      subject: template.subject,
      html: htmlContent,
    });

    console.log('Welcome email sent successfully:', emailResponse);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting signup process...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const requestData = await req.json()
    console.log('Request data:', requestData)
    
    const { email, password, first_name, last_name, location, language, newsletter_subscribed, captchaToken } = requestData as SignupRequest

    // Verify reCAPTCHA first
    console.log('Verifying reCAPTCHA...')
    const recaptchaSecretKey = Deno.env.get('RECAPTCHA_SECRET_KEY')
    if (!recaptchaSecretKey) {
      console.error('RECAPTCHA_SECRET_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${recaptchaSecretKey}&response=${captchaToken}`,
    })

    const recaptchaData = await recaptchaResponse.json()
    console.log('reCAPTCHA response:', recaptchaData)
    
    if (!recaptchaData.success) {
      console.log('reCAPTCHA verification failed:', recaptchaData['error-codes'])
      return new Response(
        JSON.stringify({ 
          error: 'reCAPTCHA verification failed',
          details: recaptchaData['error-codes']
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if email already exists
    console.log('Checking if email exists...')
    const { data: { users }, error: usersError } = await supabaseClient.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error listing users:', usersError)
      throw usersError
    }
    
    console.log('Found users:', users?.length)
    const emailExists = users?.some(user => user.email === email)

    if (emailExists) {
      console.log('Email already exists')
      return new Response(
        JSON.stringify({ error: 'Email already exists' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create user with email confirmation required
    console.log('Creating new user...')
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        residence_location: location,
        language,
        newsletter_subscribed
      }
    })

    if (authError) {
      console.error('Error creating user:', authError)
      throw authError
    }

    console.log('User created successfully')

    // Update the profiles table with residence_location
    if (authData.user && location) {
      console.log('Updating profile with residence location...')
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({ residence_location: location })
        .eq('id', authData.user.id);
      
      if (profileError) {
        console.error('Error updating profile with residence location:', profileError);
        // Don't fail the signup, just log the error
      } else {
        console.log('Profile updated with residence location successfully');
      }
    }

    // Send welcome email
    await sendWelcomeEmail(email, `${first_name} ${last_name}`, language);

    // Subscribe to newsletter if requested
    if (newsletter_subscribed && authData.user) {
      console.log('Subscribing to newsletter...')
      await supabaseClient.functions.invoke('manage-newsletter', {
        body: {
          email,
          subscribed: true,
          userId: authData.user.id
        }
      })
      console.log('Newsletter subscription complete')
    }

    return new Response(
      JSON.stringify({ 
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            user_metadata: authData.user.user_metadata
          },
          session: null
        },
        message: 'Account created successfully! Redirecting to login...'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Signup error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}) 