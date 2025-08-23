// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("Hello from Functions!")

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { token } = await req.json();
    if (!token) {
      throw new Error('Token is required');
    }

    const secretKey = Deno.env.get('CAPTCHA_KEY');
    if (!secretKey) {
      throw new Error('Server configuration error: CAPTCHA_KEY not set');
    }

    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    const verifyResponse = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      body: params,
    });

    if (!verifyResponse.ok) {
      throw new Error('Failed to verify reCAPTCHA');
    }

    const result = await verifyResponse.json();

    return new Response(
      JSON.stringify({
        success: result.success,
        message: result.success ? 'Verification successful' : 'Verification failed',
        errors: result['error-codes'] || [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 400,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error instanceof Error && error.message === 'Method not allowed' ? 405 : 500,
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/verify-recaptcha' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
