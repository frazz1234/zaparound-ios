import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@12.18.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';

// Initialize Stripe with the secret key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlightPaymentRequest {
  offerId: string;
  passengers: Array<{
    id: string;
    title: string;
    given_name: string;
    family_name: string;
    email: string;
    phone_number: string;
    gender: string;
    born_on: string;
  }>;
  amount: string;
  currency: string;
  base_amount?: string;
  base_currency?: string;
  luggage_fees?: string;
  ancillaries_fees?: string;
  ancillaries?: any;
  flightDetails: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    airline: string;
    flightNumber: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Flight payment request received:', req.method, req.url);

    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      );
    }

    // Get the request body
    let requestData: FlightPaymentRequest;
    try {
      requestData = await req.json();
      console.log('Flight payment request data:', JSON.stringify(requestData, null, 2));
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate required fields
    if (!requestData.offerId || !requestData.passengers || !requestData.amount || !requestData.currency) {
      console.error('Missing required fields:', requestData);
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: {
            offerId: requestData.offerId,
            passengers: requestData.passengers,
            amount: requestData.amount,
            currency: requestData.currency
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get user ID from the request headers
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          details: 'No authorization header provided'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    try {
      const token = authHeader.replace('Bearer ', '');
      console.log('Token received:', token ? 'Present' : 'Missing');
      
      // Verify the JWT token and extract user ID
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.error('Token validation error:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid authentication token',
            details: error.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      if (!user) {
        console.error('No user found for token');
        return new Response(
          JSON.stringify({ 
            error: 'User not found',
            details: 'No user found for the provided token'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      userId = user.id;
      console.log('User authenticated:', userId);
      
    } catch (error) {
      console.error('Authentication error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed',
          details: error.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get user profile for customer information
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ 
          error: 'Unable to fetch user profile',
          details: profileError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Create or retrieve Stripe customer
    let customerId = userProfile.stripe_customer_id;
    
    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userProfile.email,
        name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
        metadata: {
          userId: userId,
          supabase_user_id: userId
        }
      });
      
      customerId = customer.id;
      
      // Update user profile with Stripe customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
      
      console.log('Created new Stripe customer:', customerId);
    } else {
      console.log('Using existing Stripe customer:', customerId);
    }

    // Calculate total amount in cents
    let amountInCents = Math.round(parseFloat(requestData.amount) * 100);
    
    // Check if we're in development mode and apply discount
    const origin = req.headers.get('origin') || '';
    const isDevMode = origin.includes('localhost') || 
                     origin.includes('127.0.0.1') || 
                     origin.includes('ngrok') ||
                     (origin.includes('vercel.app') && origin.includes('dev'));
    
    if (isDevMode) {
      console.log(`🔧 DEV MODE: Applying 100% discount to flight booking. Original amount: ${amountInCents} cents (${requestData.currency})`);
      amountInCents = 0;
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/bookings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/booking/flight-details?offerId=${requestData.offerId}`,
      customer: customerId,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        offerId: requestData.offerId,
        flightOrigin: requestData.flightDetails.origin,
        flightDestination: requestData.flightDetails.destination,
        flightDepartureDate: requestData.flightDetails.departureDate,
        flightReturnDate: requestData.flightDetails.returnDate || '',
        airline: requestData.flightDetails.airline,
        flightNumber: requestData.flightDetails.flightNumber,
        passengerCount: requestData.passengers.length.toString(),
        baseAmount: requestData.base_amount || '',
        baseCurrency: requestData.base_currency || '',
        luggageFees: requestData.luggage_fees || '0',
        ancillariesFees: requestData.ancillaries_fees || '0',
        paymentType: 'flight_booking'
      },
      line_items: [
        {
          price_data: {
            currency: requestData.currency.toLowerCase(),
            product_data: {
              name: `Flight: ${requestData.flightDetails.origin} to ${requestData.flightDetails.destination}`,
              description: `${requestData.flightDetails.airline} ${requestData.flightDetails.flightNumber} - ${requestData.passengers.length} passenger(s)`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
    });

    console.log('Checkout session created:', session.id);

    // Create a temporary booking record to track the payment
    const { data: tempBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        booking_reference: `TEMP-${session.id.slice(-8)}`,
        booking_type: 'flight',
        status: 'pending_payment',
        duffel_order_id: null, // Will be updated after Duffel booking
        duffel_booking_reference: null,
        flight_data: {
          offerId: requestData.offerId,
          passengers: requestData.passengers,
          flightDetails: requestData.flightDetails,
          ancillaries: requestData.ancillaries
        },
        passengers: requestData.passengers,
        base_amount: requestData.base_amount ? parseFloat(requestData.base_amount) : 0,
        luggage_fees: requestData.luggage_fees ? parseFloat(requestData.luggage_fees) : 0,
        ancillaries_fees: requestData.ancillaries_fees ? parseFloat(requestData.ancillaries_fees) : 0,
        commission_amount: 0, // Will be calculated after Duffel booking
        total_amount: parseFloat(requestData.amount),
        currency: requestData.currency,
        payment_method: 'stripe',
        payment_status: 'pending',
        stripe_payment_intent_id: session.payment_intent as string,
        departure_date: requestData.flightDetails.departureDate,
        return_date: requestData.flightDetails.returnDate || null,
        notes: 'Payment pending - awaiting Stripe confirmation'
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating temporary booking:', bookingError);
      // Don't fail the checkout session creation, but log the error
    } else {
      console.log('Temporary booking created:', tempBooking.id);
    }

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        customerId: customerId,
        amount: amountInCents,
        currency: requestData.currency,
        bookingId: tempBooking?.id || null
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Payment intent creation failed',
        details: error.message 
      }),
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