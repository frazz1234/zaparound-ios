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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Stripe flight webhook received:', req.method, req.url);

    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      );
    }

    // Get the webhook secret - use a different environment variable for flight webhook
    const webhookSecret = Deno.env.get('STRIPE_FLIGHT_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('Missing STRIPE_FLIGHT_WEBHOOK_SECRET');
      return new Response(
        JSON.stringify({ error: 'Flight webhook secret not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return new Response(
        JSON.stringify({ error: 'No signature found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verify the webhook
    let event: Stripe.Event;
    try {
      console.log('Attempting to verify webhook signature...');
      console.log('Signature header:', signature);
      console.log('Webhook secret length:', webhookSecret?.length);
      console.log('Body length:', body.length);
      
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log('Webhook signature verification successful');
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      console.error('Error details:', {
        message: err.message,
        signature: signature,
        secretLength: webhookSecret?.length,
        bodyLength: body.length
      });
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Webhook event type:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Function to determine passenger type based on age
function getPassengerType(bornOn: string): string {
  const birthDate = new Date(bornOn);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  if (age < 2) {
    return 'infant_without_seat';
  } else if (age < 12) {
    return 'child';
  } else {
    return 'adult';
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Flight checkout session completed:', session.id);
  console.log('Session metadata:', JSON.stringify(session.metadata, null, 2));
  
  // Only process flight bookings
  const paymentType = session.metadata?.paymentType;
  if (paymentType !== 'flight_booking') {
    console.log(`Skipping non-flight booking in flight webhook. Payment type: ${paymentType}`);
    return;
  }
  
  console.log('Processing flight booking in flight webhook...');
  
  // Check if this is a development mode payment
  const isDevMode = session.amount_total === 0;
  if (isDevMode) {
    console.log(`🔧 DEV MODE: Processing $0 flight booking for development testing`);
  }
  
  try {
    // Find the temporary booking record using session ID or payment intent
    console.log('Looking for booking with session ID:', session.id);
    console.log('Payment intent:', session.payment_intent);
    
    let booking: any = null;
    let bookingError: any = null;
    
    // First try to find by session ID (for $0 payments in dev mode)
    if (!session.payment_intent) {
      console.log('No payment intent found, looking by session ID...');
      const { data: sessionBooking, error: sessionError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_reference', `TEMP-${session.id.slice(-8)}`)
        .eq('status', 'pending_payment')
        .single();
      
      booking = sessionBooking;
      bookingError = sessionError;
    } else {
      // Try to find by payment intent (for regular payments)
      console.log('Looking for booking with payment intent:', session.payment_intent);
      const { data: intentBooking, error: intentError } = await supabase
        .from('bookings')
        .select('*')
        .eq('stripe_payment_intent_id', session.payment_intent as string)
        .eq('status', 'pending_payment')
        .single();
      
      booking = intentBooking;
      bookingError = intentError;
    }

    if (bookingError || !booking) {
      console.error('Booking not found for checkout session:', session.id);
      console.error('Payment intent:', session.payment_intent);
      console.error('Booking error:', bookingError);
      
      // Try to find any booking with this session ID
      const { data: anyBooking, error: anyBookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_reference', `TEMP-${session.id.slice(-8)}`);
      
      if (anyBooking && anyBooking.length > 0) {
        console.log('Found bookings with this session ID:', anyBooking);
      } else {
        console.log('No bookings found with this session ID');
      }
      
      return;
    }

    console.log('Found booking for checkout session:', booking.id);

    // Extract flight details from metadata
    const metadata = session.metadata;
    const offerId = metadata.offerId;
    const passengers = booking.flight_data.passengers;
    const ancillaries = booking.flight_data.ancillaries;

    // Get the offer's original amount and currency from flight_data
    const offerAmount = booking.flight_data.total_amount;
    const offerCurrency = booking.flight_data.total_currency;

    // Validate and format passenger data (same logic as duffel-booking function)
    const formattedPassengers = passengers.map(passenger => {
      console.log(`Processing passenger ${passenger.id}: original phone = "${passenger.phone_number}"`);
      
      // Convert gender from 'male'/'female' to 'm'/'f'
      let gender = passenger.gender;
      if (gender === 'male') gender = 'm';
      if (gender === 'female') gender = 'f';
      
      if (gender !== 'm' && gender !== 'f') {
        throw new Error(`Invalid gender value: ${passenger.gender}. Must be 'male', 'female', 'm', or 'f'`);
      }

      // Format phone number to E.164 format
      let phoneNumber = passenger.phone_number;
      
      // Remove all non-digit characters except +
      phoneNumber = phoneNumber.replace(/[^\d+]/g, '');
      console.log(`After removing non-digits: "${phoneNumber}"`);
      
      // Ensure it starts with + and has proper format
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = `+${phoneNumber}`;
      }
      
      // Remove any duplicate + signs
      phoneNumber = phoneNumber.replace(/\++/g, '+');
      console.log(`After formatting: "${phoneNumber}"`);
      
      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        console.error(`Invalid phone number format: ${passenger.phone_number} -> ${phoneNumber}`);
        throw new Error(`Invalid phone number format for passenger ${passenger.id}: ${passenger.phone_number}`);
      }
      
      // Validate phone number length (E.164 standard: +[country code][number], max 15 digits total)
      if (phoneNumber.length < 8 || phoneNumber.length > 15) {
        console.error(`Phone number length invalid: ${phoneNumber} (length: ${phoneNumber.length})`);
        throw new Error(`Phone number length invalid for passenger ${passenger.id}: ${phoneNumber}`);
      }

      console.log(`Final phone number for passenger ${passenger.id}: "${phoneNumber}"`);

      // Ensure passenger ID is valid (Duffel expects specific format)
      let passengerId = passenger.id;
      if (!passengerId.startsWith('pas_')) {
        // Generate a new passenger ID if the format is wrong
        passengerId = `pas_${Math.random().toString(36).substr(2, 9)}`;
      }

      return {
        ...passenger,
        id: passengerId,
        type: getPassengerType(passenger.born_on),
        gender: gender,
        phone_number: phoneNumber
      };
    });

    // In development mode, we still call Duffel API but handle payment differently
    if (isDevMode) {
      console.log(`🔧 DEV MODE: Processing flight booking with Duffel API (dev mode)`);
    }

    // Create booking request for Duffel
    const bookingRequest = {
      offerId: offerId,
      passengers: formattedPassengers,
      payments: [{
        type: "balance", // Use balance payment type
        currency: offerCurrency, // Use offer's currency
        amount: offerAmount // Use offer's amount (even in dev mode, Duffel needs the real amount)
      }],
      luggage_fees: booking.luggage_fees.toString(),
      ancillaries_fees: booking.ancillaries_fees.toString(),
      base_amount: booking.base_amount.toString(),
      base_currency: booking.currency,
      ancillaries: ancillaries
    };

    console.log('Creating Duffel booking with request:', JSON.stringify(bookingRequest, null, 2));

    // Call Duffel API to create the actual booking
    const duffelToken = Deno.env.get('DUFFEL_API_TOKEN');
    if (!duffelToken) {
      console.error('Duffel API token not found in environment variables');
      throw new Error('Duffel API token not configured');
    }
    
    const duffelResponse = await fetch('https://api.duffel.com/air/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${duffelToken}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2'
      },
      body: JSON.stringify({
        data: {
          selected_offers: [offerId],
          passengers: formattedPassengers,
          payments: [{
            type: "balance",
            currency: booking.currency,
            amount: booking.total_amount.toString()
          }]
        }
      })
    });

    if (!duffelResponse.ok) {
      const errorData = await duffelResponse.json();
      console.error('Duffel booking failed:', errorData);
      
      // Update booking status to failed
      await supabase
        .from('bookings')
        .update({
          status: 'failed',
          payment_status: 'failed',
          notes: `Duffel booking failed: ${JSON.stringify(errorData)}`
        })
        .eq('id', booking.id);
      
      return;
    }

    const duffelData = await duffelResponse.json();
    console.log('Duffel booking successful:', duffelData);

    // Calculate commission using the same tiered system as duffel-booking function
    const totalAmountForCommission = parseFloat(booking.total_amount);
    let commission = 0;
    if (totalAmountForCommission < 250) {
      commission = Math.floor(Math.random() * (20 - 15 + 1)) + 15;
    } else if (totalAmountForCommission < 600) {
      commission = Math.floor(Math.random() * (30 - 25 + 1)) + 25;
    } else if (totalAmountForCommission < 1000) {
      commission = Math.floor(Math.random() * (40 - 35 + 1)) + 35;
    } else {
      commission = Math.floor(Math.random() * (60 - 40 + 1)) + 40;
    }
    const totalWithCommission = (totalAmountForCommission + commission).toFixed(2);

    // Generate proper ZAP booking reference
    const bookingReference = `ZAP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString().slice(2, 7)}`;

    // Extract departure and return dates from Duffel booking data
    const departureDate = duffelData.data?.slices?.[0]?.segments?.[0]?.departing_at 
      ? new Date(duffelData.data.slices[0].segments[0].departing_at).toISOString().split('T')[0]
      : null;
    
    const returnDate = duffelData.data?.slices?.[1]?.segments?.[0]?.departing_at
      ? new Date(duffelData.data.slices[1].segments[0].departing_at).toISOString().split('T')[0]
      : null;

    // Update booking with Duffel order details
    await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        booking_reference: bookingReference,
        duffel_order_id: duffelData.data.id,
        duffel_booking_reference: duffelData.data.booking_reference,
        flight_data: duffelData.data,
        passengers: formattedPassengers,
        commission_amount: commission,
        total_amount: parseFloat(totalWithCommission),
        departure_date: departureDate,
        return_date: returnDate,
        notes: 'Flight booked successfully via Duffel API'
      })
      .eq('id', booking.id);

    console.log(`Flight booking ${booking.id} confirmed successfully with ZAP reference: ${bookingReference}`);

  } catch (error) {
    console.error('Error processing flight checkout session:', error);
    
    // Try to update booking status to failed if we have the booking ID
    try {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('stripe_payment_intent_id', session.payment_intent as string)
        .eq('status', 'pending_payment')
        .single();
      
      if (booking && !bookingError) {
        await supabase
          .from('bookings')
          .update({
            status: 'failed',
            payment_status: 'failed',
            notes: `Error processing checkout: ${error.message}`
          })
          .eq('id', booking.id);
      }
    } catch (updateError) {
      console.error('Failed to update booking status:', updateError);
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  // Check if this is a development mode payment
  const isDevMode = paymentIntent.amount === 0;
  if (isDevMode) {
    console.log(`🔧 DEV MODE: Processing $0 payment for development testing`);
  }
  
  try {
    // Find the temporary booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .eq('status', 'pending_payment')
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found for payment intent:', paymentIntent.id);
      return;
    }

    console.log('Found booking:', booking.id);

    // Extract flight details from metadata
    const metadata = paymentIntent.metadata;
    const offerId = metadata.offerId;
    const passengers = booking.flight_data.passengers;
    const ancillaries = booking.flight_data.ancillaries;

    // Get the offer's original amount and currency from flight_data
    const offerAmount = booking.flight_data.total_amount;
    const offerCurrency = booking.flight_data.total_currency;

    // Validate and format passenger data (same logic as duffel-booking function)
    const formattedPassengers = passengers.map(passenger => {
      console.log(`Processing passenger ${passenger.id}: original phone = "${passenger.phone_number}"`);
      
      // Convert gender from 'male'/'female' to 'm'/'f'
      let gender = passenger.gender;
      if (gender === 'male') gender = 'm';
      if (gender === 'female') gender = 'f';
      
      if (gender !== 'm' && gender !== 'f') {
        throw new Error(`Invalid gender value: ${passenger.gender}. Must be 'male', 'female', 'm', or 'f'`);
      }

      // Format phone number to E.164 format
      let phoneNumber = passenger.phone_number;
      
      // Remove all non-digit characters except +
      phoneNumber = phoneNumber.replace(/[^\d+]/g, '');
      console.log(`After removing non-digits: "${phoneNumber}"`);
      
      // Ensure it starts with + and has proper format
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = `+${phoneNumber}`;
      }
      
      // Remove any duplicate + signs
      phoneNumber = phoneNumber.replace(/\++/g, '+');
      console.log(`After formatting: "${phoneNumber}"`);
      
      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        console.error(`Invalid phone number format: ${passenger.phone_number} -> ${phoneNumber}`);
        throw new Error(`Invalid phone number format for passenger ${passenger.id}: ${passenger.phone_number}`);
      }
      
      // Validate phone number length (E.164 standard: +[country code][number], max 15 digits total)
      if (phoneNumber.length < 8 || phoneNumber.length > 15) {
        console.error(`Phone number length invalid: ${phoneNumber} (length: ${phoneNumber.length})`);
        throw new Error(`Phone number length invalid for passenger ${passenger.id}: ${phoneNumber}`);
      }

      console.log(`Final phone number for passenger ${passenger.id}: "${phoneNumber}"`);

      // Ensure passenger ID is valid (Duffel expects specific format)
      let passengerId = passenger.id;
      if (!passengerId.startsWith('pas_')) {
        // Generate a new passenger ID if the format is wrong
        passengerId = `pas_${Math.random().toString(36).substr(2, 9)}`;
      }

      return {
        ...passenger,
        id: passengerId,
        type: getPassengerType(passenger.born_on),
        gender: gender,
        phone_number: phoneNumber
      };
    });

    // Create booking request for Duffel
    const bookingRequest = {
      offerId: offerId,
      passengers: formattedPassengers,
      payments: [{
        type: "balance", // Use balance payment type
        currency: offerCurrency, // Use offer's currency
        amount: offerAmount // Use offer's amount
      }],
      luggage_fees: booking.luggage_fees.toString(),
      ancillaries_fees: booking.ancillaries_fees.toString(),
      base_amount: booking.base_amount.toString(),
      base_currency: booking.currency,
      ancillaries: ancillaries
    };

    console.log('Creating Duffel booking with request:', JSON.stringify(bookingRequest, null, 2));

    // In development mode, we still call Duffel API but handle payment differently
    if (isDevMode) {
      console.log(`🔧 DEV MODE: Processing flight booking with Duffel API (dev mode)`);
    }

    // Call Duffel API to create the actual booking
    const duffelToken = Deno.env.get('DUFFEL_API_TOKEN');
    if (!duffelToken) {
      console.error('Duffel API token not found in environment variables');
      throw new Error('Duffel API token not configured');
    }
    
    const duffelResponse = await fetch('https://api.duffel.com/air/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${duffelToken}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2'
      },
      body: JSON.stringify({
        data: {
          selected_offers: [offerId],
          passengers: formattedPassengers,
          payments: [{
            type: "balance",
            currency: offerCurrency,
            amount: offerAmount
          }]
        }
      })
    });

    if (!duffelResponse.ok) {
      const errorData = await duffelResponse.json();
      console.error('Duffel booking failed:', errorData);
      
      // Update booking status to failed
      await supabase
        .from('bookings')
        .update({
          status: 'failed',
          payment_status: 'failed',
          notes: `Duffel booking failed: ${JSON.stringify(errorData)}`
        })
        .eq('id', booking.id);
      
      return;
    }

    const duffelBooking = await duffelResponse.json();
    console.log('Duffel booking successful:', duffelBooking.data.id);

    // Calculate commission using the same tiered system as duffel-booking function
    const totalAmountForCommission = parseFloat(booking.total_amount);
    let commission = 0;
    if (totalAmountForCommission < 250) {
      commission = Math.floor(Math.random() * (20 - 15 + 1)) + 15;
    } else if (totalAmountForCommission < 600) {
      commission = Math.floor(Math.random() * (30 - 25 + 1)) + 25;
    } else if (totalAmountForCommission < 1000) {
      commission = Math.floor(Math.random() * (40 - 35 + 1)) + 35;
    } else {
      commission = Math.floor(Math.random() * (60 - 40 + 1)) + 40;
    }
    const totalWithCommission = (totalAmountForCommission + commission).toFixed(2);

    // Generate proper ZAP booking reference
    const bookingReference = `ZAP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString().slice(2, 7)}`;

    // Extract departure and return dates from Duffel booking data
    const departureDate = duffelBooking.data?.slices?.[0]?.segments?.[0]?.departing_at 
      ? new Date(duffelBooking.data.slices[0].segments[0].departing_at).toISOString().split('T')[0]
      : null;
    
    const returnDate = duffelBooking.data?.slices?.[1]?.segments?.[0]?.departing_at
      ? new Date(duffelBooking.data.slices[1].segments[0].departing_at).toISOString().split('T')[0]
      : null;

    // Update booking with Duffel information and mark as confirmed
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        booking_reference: bookingReference,
        duffel_order_id: duffelBooking.data.id,
        duffel_booking_reference: duffelBooking.data.booking_reference,
        flight_data: duffelBooking.data,
        passengers: formattedPassengers,
        commission_amount: commission,
        total_amount: parseFloat(totalWithCommission),
        departure_date: departureDate,
        return_date: returnDate,
        notes: 'Booking confirmed - payment successful and Duffel booking completed'
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
    } else {
      console.log('Booking updated successfully with ZAP reference:', bookingReference);
    }

    // Send confirmation email (you can implement this)
    // await sendBookingConfirmationEmail(booking.user_id, duffelBooking.data);

  } catch (error) {
    console.error('Error processing successful payment:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  
  try {
    // Update booking status to failed
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'failed',
        payment_status: 'failed',
        notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating failed booking:', error);
    } else {
      console.log('Booking marked as failed');
    }
  } catch (error) {
    console.error('Error processing failed payment:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment canceled:', paymentIntent.id);
  
  try {
    // Update booking status to canceled
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'canceled',
        payment_status: 'canceled',
        notes: 'Payment was canceled by user'
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating canceled booking:', error);
    } else {
      console.log('Booking marked as canceled');
    }
  } catch (error) {
    console.error('Error processing canceled payment:', error);
  }
} 