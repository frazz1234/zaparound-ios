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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Log the request for debugging
  console.log(`Request received: ${req.method} ${req.url}`);
  
  try {
    // Parse request body
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

    const { userId, limit = 10 } = json;

    if (!userId) {
      console.error('Missing userId in request');
      return new Response(
        JSON.stringify({ 
          error: 'userId is required',
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
      return new Response(
        JSON.stringify({ 
          error: 'User not found',
          details: userError?.message || 'Could not retrieve user information'
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
    
    const userEmail = userData.user.email;
    console.log('Found user email:', userEmail);
    
    // Find the customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });
    
    if (customers.data.length === 0) {
      console.warn('No Stripe customer found for email:', userEmail);
      return new Response(
        JSON.stringify({ 
          success: true,
          invoices: [] 
        }),
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

    // Get invoices for the customer
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: limit
    });

    // Format invoices for the frontend
    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      created: new Date(invoice.created * 1000).toISOString(),
      period_start: new Date(invoice.period_start * 1000).toISOString(),
      period_end: new Date(invoice.period_end * 1000).toISOString(),
      amount_paid: invoice.amount_paid / 100, // Convert from cents to dollars
      currency: invoice.currency,
      status: invoice.status,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      description: invoice.description || '',
      paid: invoice.paid
    }));

    console.log(`Found ${formattedInvoices.length} invoices for customer`);

    return new Response(
      JSON.stringify({ 
        success: true,
        invoices: formattedInvoices 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error fetching billing history:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to fetch billing history',
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