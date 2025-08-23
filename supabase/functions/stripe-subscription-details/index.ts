import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@12.18.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';
import { corsHeaders } from "../_shared/cors.ts";

// Initialize Stripe with the secret key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

// Initialize Supabase client with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Log the request for debugging
  console.log(`Request received: ${req.method} ${req.url}`);

  try {
    let json;
    try {
      const clonedReq = req.clone();
      const text = await clonedReq.text();
      console.log('Request body:', text);
      
      try {
        json = JSON.parse(text);
      } catch (e) {
        console.error('Error parsing JSON:', e);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid JSON in request body',
            receivedText: text
          }),
          { 
            status: 400, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
    } catch (e) {
      console.error('Error reading request body:', e);
      return new Response(
        JSON.stringify({ 
          error: 'Error reading request body' 
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    if (!json || !json.userId) {
      console.error('Missing userId in request');
      return new Response(
        JSON.stringify({ 
          error: 'userId is required' 
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const userId = json.userId;
    console.log('Processing subscription details for userId:', userId);

    // Get user details from Supabase
    const { data: userData, error: userError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user role:', userError);
      // Return no subscription
      return new Response(
        JSON.stringify({ subscription: null }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    if (!userData) {
      console.log('No user role found for userId:', userId);
      return new Response(
        JSON.stringify({ subscription: null }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Get user email from Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authData?.user?.email) {
      console.error('Error fetching user email:', authError);
      // Return no subscription
      return new Response(
        JSON.stringify({ subscription: null }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    const userEmail = authData.user.email;
    console.log('Found user email:', userEmail);
    
    // Find the customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });
    
    if (customers.data.length === 0) {
      console.warn('No Stripe customer found for email:', userEmail);
      // Return no subscription
      return new Response(
        JSON.stringify({ subscription: null }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    const customerId = customers.data[0].id;
    console.log('Found customer ID:', customerId);

    // Get customer's subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
      expand: ['data.default_payment_method']
    });

    if (subscriptions.data.length === 0) {
      console.log('No subscription found for customer:', customerId);
      // No active subscription found
      return new Response(
        JSON.stringify({ subscription: null }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const subscription = subscriptions.data[0];
    console.log('Found subscription:', subscription.id);

    const paymentMethod = subscription.default_payment_method;
    let paymentMethodDetails = null;

    if (paymentMethod && typeof paymentMethod !== 'string') {
      const card = paymentMethod.card;
      if (card) {
        paymentMethodDetails = {
          id: paymentMethod.id,
          brand: card.brand,
          last4: card.last4,
          expiryMonth: card.exp_month,
          expiryYear: card.exp_year
        };
      }
    }

    // Map role back to plan name
    const roleToPlan = {
      'tier1': 'zaptrip',
      'tier2': 'zapout',
      'tier3': 'zaproad',
      'tier4': 'zappro',
      'nosubs': 'free'
    };

    const plan = roleToPlan[userData.role] || 'free';

    // Format the subscription details
    const subscriptionDetails = {
      id: subscription.id,
      status: subscription.status,
      plan: plan,
      interval: subscription.items.data[0].plan.interval,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      paymentMethod: paymentMethodDetails
    };

    return new Response(
      JSON.stringify({ subscription: subscriptionDetails }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while fetching subscription details',
        details: error.message 
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
}); 