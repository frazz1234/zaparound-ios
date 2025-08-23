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
    const { plan, userId, email, isYearly } = await req.json();
    
    console.log(`Creating checkout session for plan: ${plan}, user: ${userId}, yearly: ${isYearly}`);
    
    // Map plan to its details with clear role mappings that exactly match database enum values
    const planDetails = {
      zaptrip: {
        name: 'ZapTrip',
        monthlyPriceId: 'price_1RPYZoAIHt9nXEEBgibR4tIv',
        yearlyPriceId: 'price_1RPYZoAIHt9nXEEB35wmO9wV',
        role: 'tier1'
      },
      zapout: {
        name: 'ZapOut',
        monthlyPriceId: 'price_1RPYWCAIHt9nXEEBOeMCPih7',
        yearlyPriceId: 'price_1RPYWCAIHt9nXEEB5xZmsLkG',
        role: 'tier2'
      },
      zaproad: {
        name: 'ZapRoad',
        monthlyPriceId: 'price_1RPYY0AIHt9nXEEBoKuPI93Q',
        yearlyPriceId: 'price_1RPYY0AIHt9nXEEB2mnbrRrj',
        role: 'tier3'
      },
      zappro: {
        name: 'ZapPro',
        monthlyPriceId: 'price_1RPYeJAIHt9nXEEB0mn2LUCx',
        yearlyPriceId: 'price_1RPYeJAIHt9nXEEBxXrxFaZz',
        role: 'tier4'
      }
    };
    
    
    if (!planDetails[plan]) {
      throw new Error('Invalid plan selected');
    }
    
    const selectedPlan = planDetails[plan];
    
    // Create a checkout session with Stripe
    const sessionConfig = {
      payment_method_types: ['card'],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      customer_email: email,
      client_reference_id: userId,
      allow_promotion_codes: true,
      metadata: {
        userId,
        plan,
        role: selectedPlan.role,
        isYearly,
        paymentType: 'subscription',
      },
      line_items: [
        {
          price: isYearly ? selectedPlan.yearlyPriceId : selectedPlan.monthlyPriceId,
          quantity: 1,
        },
      ]
    };
    

    
    console.log(`Using price ID for ${plan} plan: ${isYearly ? selectedPlan.yearlyPriceId : selectedPlan.monthlyPriceId}`);
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    console.log(`Checkout session created: ${session.id} with role: ${selectedPlan.role}`);
    
    // Pre-emptively check if the user has a role entry, create one if not
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (roleCheckError) {
      console.error('Error checking existing role:', roleCheckError);
    } else if (!existingRole) {
      console.log(`No role found for user ${userId}, creating default nosubs role`);
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: userId, 
          role: 'nosubs',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error creating initial role:', insertError);
      } else {
        console.log(`Initial role created for user ${userId}`);
      }
    } else {
      console.log(`User ${userId} has existing role: ${existingRole.role}`);
    }
    
    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
