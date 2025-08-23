import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingRequest {
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
  payments: Array<{
    type: string;
    currency: string;
    amount: string;
  }>;
  luggage_fees?: string;
  ancillaries_fees?: string;
  base_amount?: string;
  base_currency?: string;
  ancillaries?: any;
}

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Request received:', req.method, req.url);

    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      );
    }

    // Get the request body
    let requestData: BookingRequest;
    try {
      requestData = await req.json();
      console.log('Request data:', JSON.stringify(requestData, null, 2));
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate required fields
    if (!requestData.offerId || !requestData.passengers || !requestData.payments) {
      console.error('Missing required fields:', requestData);
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: {
            offerId: requestData.offerId,
            passengers: requestData.passengers,
            payments: requestData.payments
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Backend validation: Check if offer is expired before sending to Duffel
    // This provides an additional layer of protection beyond frontend validation
    const now = new Date().toISOString();
    console.log(`Backend validation: Current time: ${now}`);
    
    // Note: We can't check the exact offer expiry without fetching it from Duffel first
    // But we can add a timestamp check if the frontend sends the offer expiry time
    // For now, we'll rely on Duffel's validation and handle the error gracefully

    // Validate and format passenger data
    const formattedPassengers = requestData.passengers.map(passenger => {
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

    // Store the original amount for Duffel API (without commission)
    const originalAmount = requestData.payments[0].amount;
    const baseAmount = requestData.base_amount || originalAmount; // Use base amount if available, otherwise use total amount
    
    // Calculate total amount including additional fees for commission calculation
    let totalAmountForCommission = parseFloat(originalAmount);
    
    // Add luggage fees if provided
    if (requestData.luggage_fees) {
      totalAmountForCommission += parseFloat(requestData.luggage_fees);
    }
    
    // Add ancillaries fees if provided
    if (requestData.ancillaries_fees) {
      totalAmountForCommission += parseFloat(requestData.ancillaries_fees);
    }
    
    // Calculate commission for our records (TIER 0) based on total amount
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
    
    console.log(`Commission calculation: Base=${originalAmount}, Additional fees=${totalAmountForCommission - parseFloat(originalAmount)}, Total for commission=${totalAmountForCommission}, Commission=${commission}, Final total=${totalWithCommission}`);
    
    // Keep the original amount for Duffel API (they expect the exact offer amount)
    const paymentForDuffel = {
      ...requestData.payments[0],
      amount: originalAmount // Send original amount to Duffel
    };

    // Create Duffel API request
    const duffelToken = Deno.env.get('DUFFEL_API_TOKEN');
    if (!duffelToken) {
      console.error('Duffel API token not found in environment variables');
      throw new Error('Duffel API token not configured');
    }
    // Prepare the booking request for Duffel API
    const bookingRequest = {
      data: {
        selected_offers: [requestData.offerId],
        passengers: formattedPassengers,
        payments: [paymentForDuffel]
      }
    };

    console.log('Booking request:', JSON.stringify(bookingRequest, null, 2));

    // Make request to Duffel API
    const response = await fetch('https://api.duffel.com/air/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${duffelToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Duffel-Version': 'v2'
      },
      body: JSON.stringify(bookingRequest)
    });

    console.log('Duffel API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Duffel API error:', JSON.stringify(errorData, null, 2));
      
      // Provide more specific error messages for common issues
      let errorMessage = 'Duffel API error';
      if (errorData.errors && errorData.errors.length > 0) {
        const firstError = errorData.errors[0];
        if (firstError.code === 'offer_expired') {
          errorMessage = 'This flight offer has expired and is no longer available for booking. Please refresh your search to get current prices.';
        } else if (firstError.code === 'invalid_phone_number') {
          errorMessage = `Invalid phone number format: ${firstError.message}. Please ensure the phone number is in international format (e.g., +1234567890).`;
        } else if (firstError.code === 'validation_error') {
          errorMessage = `Validation error: ${firstError.message}`;
        } else {
          errorMessage = firstError.message || 'Duffel API validation error';
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    const bookingResults = await response.json();
    console.log('Booking results received:', JSON.stringify(bookingResults, null, 2));

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
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase configuration');
        return new Response(
          JSON.stringify({ 
            error: 'Server configuration error',
            details: 'Missing Supabase configuration'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
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
      
      // Check if user has sufficient balance for the booking
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Error fetching user balance:', profileError);
        return new Response(
          JSON.stringify({ 
            error: 'Unable to verify user balance',
            details: profileError.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      const requiredAmount = parseFloat(requestData.payments[0].amount);
      const userBalance = userProfile?.balance || 0;
      
      if (userBalance < requiredAmount) {
        console.error(`Insufficient balance: ${userBalance} < ${requiredAmount}`);
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient balance',
            details: `Required: ${requiredAmount}, Available: ${userBalance}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      console.log(`Balance check passed: ${userBalance} >= ${requiredAmount}`);
      
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

    // Save booking to database
    let savedBooking = null;
    if (userId) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          // Generate booking reference
          const bookingReference = `ZAP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString().slice(2, 7)}`;
          
          // Extract departure date from the first segment
          const departureDate = bookingResults.data?.slices?.[0]?.segments?.[0]?.departing_at 
            ? new Date(bookingResults.data.slices[0].segments[0].departing_at).toISOString().split('T')[0]
            : null;
          
          // Extract return date from the last segment (if round trip)
          const returnDate = bookingResults.data?.slices?.[1]?.segments?.[0]?.departing_at
            ? new Date(bookingResults.data.slices[1].segments[0].departing_at).toISOString().split('T')[0]
            : null;
          
          const bookingData = {
            user_id: userId,
            booking_reference: bookingReference,
            booking_type: 'flight',
            status: 'confirmed',
            duffel_order_id: bookingResults.data?.id,
            duffel_booking_reference: bookingResults.data?.booking_reference,
            flight_data: bookingResults.data,
            passengers: formattedPassengers,
            base_amount: parseFloat(baseAmount),
            luggage_fees: requestData.luggage_fees ? parseFloat(requestData.luggage_fees) : 0,
            ancillaries_fees: requestData.ancillaries_fees ? parseFloat(requestData.ancillaries_fees) : 0,
            commission_amount: commission,
            total_amount: parseFloat(totalWithCommission),
            currency: requestData.payments[0].currency,
            payment_method: 'balance',
            payment_status: 'paid',
            departure_date: departureDate,
            return_date: returnDate,
            notes: requestData.ancillaries ? 'Includes ancillaries' : null
          };
          
          const { data: savedData, error: saveError } = await supabase
            .from('bookings')
            .insert(bookingData)
            .select()
            .single();
          
          if (saveError) {
            console.error('Error saving booking to database:', saveError);
          } else {
            savedBooking = savedData;
            console.log('Booking saved to database:', savedData);
          }
        }
      } catch (error) {
        console.error('Error saving booking to database:', error);
      }
    }

    // Add commission information and saved booking to the response
    const responseWithCommission = {
      ...bookingResults,
      commission_info: {
        base_amount: totalAmountForCommission,
        commission_amount: commission,
        total_with_commission: totalWithCommission,
        commission_percentage: ((commission / totalAmountForCommission) * 100).toFixed(2) + '%'
      },
      saved_booking: savedBooking,
      // Include base amount information for frontend display
      base_amount: baseAmount,
      base_currency: requestData.base_currency || requestData.payments[0].currency
    };

    // Return the booking results with commission info
    return new Response(
      JSON.stringify(responseWithCommission),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in edge function:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        type: error.constructor.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 