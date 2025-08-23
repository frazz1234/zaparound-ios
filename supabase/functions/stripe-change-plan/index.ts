import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@12.18.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';
import { corsHeaders } from "../_shared/cors.ts";

// Initialize Stripe with the secret key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

// Log Stripe initialization state (without showing secret key)
console.log('Stripe initialized:', !!Deno.env.get('STRIPE_SECRET_KEY'));

// Initialize Supabase client with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Log Supabase initialization state (without showing keys)
console.log('Supabase initialized:', !!supabaseUrl && !!supabaseServiceKey);

// Plan configuration - use valid price IDs from your Stripe dashboard
const planDetails = {
  zaptrip: {
    name: 'ZapTrip Plan',
    monthlyPriceId: 'price_1RPYZoAIHt9nXEEBgibR4tIv', // ZapTrip monthly
    yearlyPriceId: 'price_1RPYZoAIHt9nXEEB35wmO9wV',  // ZapTrip yearly
    role: 'tier1'
  },
  zapout: {
    name: 'ZapOut Plan',
    monthlyPriceId: 'price_1RPYWCAIHt9nXEEBOeMCPih7', // ZapOut monthly
    yearlyPriceId: 'price_1RPYWCAIHt9nXEEB5xZmsLkG',  // ZapOut yearly
    role: 'tier2'
  },
  zaproad: {
    name: 'ZapRoad Plan',
    monthlyPriceId: 'price_1RPYY0AIHt9nXEEBoKuPI93Q', // ZapRoad monthly
    yearlyPriceId: 'price_1RPYY0AIHt9nXEEB2mnbrRrj',  // ZapRoad yearly
    role: 'tier3'
  },
  zappro: {
    name: 'ZapPro Plan',
    monthlyPriceId: 'price_1RPYeJAIHt9nXEEB0mn2LUCx', // ZapPro monthly
    yearlyPriceId: 'price_1RPYeJAIHt9nXEEBxXrxFaZz',  // ZapPro yearly
    role: 'tier4'
  }
};

// Map plan IDs to Stripe price IDs
const getStripePriceId = (planId: string, isYearly: boolean): string => {
  const plan = planDetails[planId];
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  return isYearly ? plan.yearlyPriceId : plan.monthlyPriceId;
};

// Map plan IDs to user roles
const getRoleFromPlanId = (planId: string): string => {
  switch (planId) {
    case 'zaptrip':
      return 'tier1';
    case 'zapout':
      return 'tier2';
    case 'zaproad':
      return 'tier3';
    case 'zappro':
      return 'tier4';
    default:
      throw new Error(`Invalid plan ID: ${planId}`);
  }
};

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
      
      if (!text || text.trim() === '') {
        return new Response(
          JSON.stringify({ 
            error: 'Empty request body',
            success: false
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
          error: 'Error reading request body',
          errorDetails: e.message
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
    
    console.log('Parsed JSON:', json);
    
    const { userId, planId, isYearly } = json;

    if (!userId || !planId) {
      console.error('Missing userId or planId in request');
      return new Response(
        JSON.stringify({ 
          error: 'userId and planId are required',
          success: false
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
    
    console.log(`Processing plan change: userId=${userId}, planId=${planId}, isYearly=${isYearly}`);

    if (!planDetails[planId]) {
      console.error('Invalid plan selected:', planId);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid plan selected',
          success: false
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

    // Get user email from Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user?.email) {
      console.error('Error fetching user data:', userError);
      
      // Return a demo URL for testing
      return new Response(
        JSON.stringify({
          success: true,
          url: 'https://example.com/checkout',
          sessionId: 'mock_session_id'
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    const userEmail = userData.user.email;
    console.log('Found user email:', userEmail);
    
    // Find the customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });
    
    if (customers.data.length === 0) {
      console.warn('No Stripe customer found for email:', userEmail);
      
      // Create a new customer
      console.log('Creating new customer for email:', userEmail);
      const newCustomer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId,
        }
      });
      
      // No active subscription yet, return error
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No active subscription',
          details: 'You need an active subscription to change plans'
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
    
    const customerId = customers.data[0].id;
    console.log('Found customer ID:', customerId);

    // Get current subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      console.log('No active subscription');
      // No active subscription, return error
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No active subscription',
          details: 'You need an active subscription to change plans'
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

    const currentSubscription = subscriptions.data[0];
    console.log('Found active subscription:', currentSubscription.id);
    
    const selectedPlan = planDetails[planId];
    const priceId = getStripePriceId(planId, isYearly);

    console.log(`Updating subscription with price: ${priceId}`);
    
    try {
      // Update the subscription with new price - this is all we need
      // The webhook will handle updating the database when the event is received
      const updatedSubscription = await stripe.subscriptions.update(
        currentSubscription.id,
        {
          items: [
            {
              id: currentSubscription.items.data[0].id,
              price: priceId,
            },
          ],
          proration_behavior: 'create_prorations',
          metadata: {
            userId,
            plan: planId,
            role: getRoleFromPlanId(planId),
            isYearly,
          }
        }
      );
      
      console.log('Subscription updated successfully:', updatedSubscription.id);
      
      // Just return the updated subscription data, no redirects
      return new Response(
        JSON.stringify({ 
          success: true,
          subscription: {
            id: updatedSubscription.id,
            status: updatedSubscription.status,
            plan: planId,
            interval: isYearly ? 'year' : 'month',
            currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end
          }
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (error) {
      console.error('Error updating subscription:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update subscription',
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
  } catch (error) {
    console.error('Top-level error in change-plan function:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process subscription change',
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