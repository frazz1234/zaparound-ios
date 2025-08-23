
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.0";

interface RequestBody {
  email: string;
  subscribed: boolean;
  userId?: string;
}

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Only handle POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { email, subscribed, userId } = await req.json() as RequestBody;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if the email already exists
    const { data: existingSubscription, error: queryError } = await supabaseClient
      .from("newsletter_subscriptions")
      .select("*")
      .or(`email.eq.${email}${userId ? `,user_id.eq.${userId}` : ''}`)
      .maybeSingle();

    if (queryError) {
      console.error("Error checking subscription:", queryError);
      return new Response(JSON.stringify({ error: queryError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;
    
    if (existingSubscription) {
      // Update existing subscription
      result = await supabaseClient
        .from("newsletter_subscriptions")
        .update({ 
          subscribed,
          user_id: userId || existingSubscription.user_id, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", existingSubscription.id);
    } else {
      // Create new subscription
      result = await supabaseClient
        .from("newsletter_subscriptions")
        .insert([{ email, user_id: userId, subscribed }]);
    }

    if (result.error) {
      console.error("Error managing subscription:", result.error);
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: subscribed ? "Successfully subscribed" : "Successfully unsubscribed" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
