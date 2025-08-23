// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "std/http/server"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookConfig {
  [key: string]: string;
}

// Store webhook configurations in environment variables
const webhookConfigs: WebhookConfig = {
  zaptrip: Deno.env.get('MAKE_ZAPTRIP_WEBHOOK') || '',
  zapout: Deno.env.get('MAKE_ZAPOUT_WEBHOOK') || '',
  zaproad: Deno.env.get('MAKE_ZAPROAD_WEBHOOK') || '',
  blog: Deno.env.get('MAKE_BLOG_WEBHOOK') || '',
}

console.log("Hello from Functions!")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the webhook type from the URL
    const url = new URL(req.url)
    const webhookType = url.pathname.split('/').pop()?.toLowerCase()

    if (!webhookType) {
      throw new Error('Webhook type not specified')
    }

    // Get the webhook URL from configuration
    const webhookUrl = webhookConfigs[webhookType]
    if (!webhookUrl) {
      throw new Error(`No webhook URL configured for type: ${webhookType}`)
    }

    // Get the request body
    const requestData = await req.json()

    // Validate the request data
    if (!requestData) {
      throw new Error('Request body is required')
    }

    // Forward the data to the Make webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      throw new Error(`Failed to send data to webhook: ${response.statusText}`)
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in make-webhook function:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/make-webhook' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
