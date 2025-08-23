
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { userId, newEmail } = await req.json();

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Log the request details for debugging
    console.log(`Syncing email change for user ${userId} to ${newEmail}`);

    // Update the email in the profiles table
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ email: newEmail })
      .eq('id', userId);

    if (profileUpdateError) {
      console.error("Error updating profile email:", profileUpdateError);
      throw new Error(`Error updating profile email: ${profileUpdateError.message}`);
    }

    // Update the email in the user_roles table if it exists
    const { error: userRolesUpdateError } = await supabaseAdmin
      .from('user_roles')
      .update({ email: newEmail })
      .eq('user_id', userId);

    if (userRolesUpdateError) {
      console.error("Error updating user_roles email:", userRolesUpdateError);
      // This is non-fatal, so just log it
    }

    // Update the email in newsletter_subscriptions table if it exists
    const { error: newsletterUpdateError } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .update({ email: newEmail })
      .eq('user_id', userId);

    if (newsletterUpdateError) {
      console.error("Error updating newsletter subscription email:", newsletterUpdateError);
      // This is non-fatal, so just log it
    }

    console.log(`Email successfully synced for user ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email updated in all tables" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in sync-email-change function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : "An unknown error occurred" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
