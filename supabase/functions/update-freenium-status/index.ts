import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Update freenium status
    const { error: updateError } = await supabaseClient
      .from('user_roles')
      .update({ freenium: true })
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }

    // Send email notification
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-freenium-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        email: userData.email,
        name: userData.first_name || userData.last_name || userData.email.split('@')[0],
        language: userData.language || 'en'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send freenium notification email');
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error updating freenium status:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update freenium status" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}); 