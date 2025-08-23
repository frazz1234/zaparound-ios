
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@12.18.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';

// Initialize Stripe with the secret key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

// Initialize Supabase client with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const { sessionId, userId } = await req.json();
    
    console.log(`Checking payment status for session: ${sessionId}, user: ${userId}`);
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { 
          status: 404, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Check if the payment was successful
    const status = session.payment_status;
    console.log(`Payment status for session ${sessionId}: ${status}`);
    
    // Handle successful payment
    if (status === 'paid' && session.metadata && session.metadata.role) {
      const userIdToUpdate = userId || (session.metadata && session.metadata.userId);
      const role = session.metadata.role;
      
      if (userIdToUpdate) {
        console.log(`Payment successful, updating role for user ${userIdToUpdate} to ${role}`);
        
        // Use RPC function to update role (bypasses RLS policies)
        const { error: roleUpdateError } = await supabase.rpc('update_user_role', {
          p_user_id: userIdToUpdate,
          p_role: role
        });

        if (roleUpdateError) {
          console.error('Error updating user role:', roleUpdateError);
        } else {
          console.log(`Successfully updated role for user ${userIdToUpdate} to ${role}`);
        }
        
        // Double-check that the role was updated correctly
        const { data: verifiedRole, error: verifyError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userIdToUpdate)
          .single();
          
        if (verifyError) {
          console.error('Error verifying updated role:', verifyError);
        } else if (verifiedRole.role !== role) {
          console.error(`ROLE MISMATCH: User ${userIdToUpdate} has role ${verifiedRole.role} instead of expected ${role}`);
          
          // Try one more explicit update as a last resort
          const { error: finalUpdateError } = await supabase.rpc('update_user_role', {
            p_user_id: userIdToUpdate,
            p_role: role
          });
            
          if (finalUpdateError) {
            console.error('Final attempt to update role failed:', finalUpdateError);
          } else {
            console.log(`Final role update attempt completed for user ${userIdToUpdate}`);
          }
        } else {
          console.log(`Verified role is correctly set to ${role} for user ${userIdToUpdate}`);
        }
      }
    }
    // If payment was not successful, update role to nosubs
    else if (status !== 'paid') {
      let userIdToUpdate = userId || (session.metadata && session.metadata.userId);
      
      if (userIdToUpdate) {
        console.log(`Payment not successful, updating role for user ${userIdToUpdate} to nosubs`);
        await updateUserRoleToNoSubs(userIdToUpdate);
      }
    }
    
    // Get the user's role
    let role = null;
    let userIdToCheck = userId || (session.metadata && session.metadata.userId);
    
    if (userIdToCheck) {
      console.log(`Checking current role for user: ${userIdToCheck}`);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userIdToCheck)
        .single();
      
      if (error) {
        console.error('Error getting user role:', error);
      } else if (data) {
        role = data.role;
        console.log(`Current role for user ${userIdToCheck}: ${role}`);
      }
    } else {
      console.log('No user ID available to check role');
    }
    
    // Get subscription details if available
    let subscriptionDetails = null;
    if (session.subscription) {
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        subscriptionDetails = {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        };
        console.log(`Subscription details: ${JSON.stringify(subscriptionDetails)}`);
        
        // Check if subscription is in a problematic state (canceled, unpaid, etc.)
        const problematicStatuses = ['canceled', 'unpaid', 'incomplete_expired'];
        if (problematicStatuses.includes(subscription.status) && userIdToCheck) {
          console.log(`Subscription in ${subscription.status} state, updating role to nosubs`);
          await updateUserRoleToNoSubs(userIdToCheck);
          
          // Refresh role after update
          const { data: refreshedRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userIdToCheck)
            .single();
            
          if (refreshedRole) {
            role = refreshedRole.role;
            console.log(`Updated role for user ${userIdToCheck}: ${role}`);
          }
        }
      } catch (error) {
        console.error('Error retrieving subscription details:', error);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        status, 
        role,
        customer: session.customer,
        subscription: session.subscription,
        subscriptionDetails,
        metadata: session.metadata
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error checking payment status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

// Helper function to update user role to nosubs
async function updateUserRoleToNoSubs(userId) {
  try {
    console.log(`Updating role for user ${userId} to nosubs`);
    
    // Use RPC function to update role (bypasses RLS policies)
    const { error: roleUpdateError } = await supabase.rpc('update_user_role', {
      p_user_id: userId,
      p_role: 'nosubs'
    });

    if (roleUpdateError) {
      console.error('Error updating user role to nosubs:', roleUpdateError);
      throw roleUpdateError;
    }
    
    // Verify role was updated correctly
    const { data: verifiedRole, error: verifyError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
      
    if (verifyError) {
      console.error('Error verifying updated role:', verifyError);
    } else {
      console.log(`Role verification: User ${userId} now has role ${verifiedRole.role}`);
      if (verifiedRole.role !== 'nosubs') {
        console.error(`ROLE MISMATCH: Expected nosubs, found ${verifiedRole.role}`);
        
        // Try one more time if there's a mismatch
        const { error: retryError } = await supabase.rpc('update_user_role', {
          p_user_id: userId,
          p_role: 'nosubs'
        });
        
        if (retryError) {
          console.error('Error on retry update user role:', retryError);
        } else {
          console.log(`Retry successful: User ${userId} role updated to nosubs`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateUserRoleToNoSubs:', error);
    return false;
  }
}
