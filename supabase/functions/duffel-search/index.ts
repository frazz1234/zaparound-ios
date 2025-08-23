import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlightSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: string;
  maxConnections?: number;
  currency?: string; // Added currency field
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
    let requestData: FlightSearchRequest;
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
    if (!requestData.origin || !requestData.destination || !requestData.departureDate || !requestData.cabinClass) {
      console.error('Missing required fields:', requestData);
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: {
            origin: requestData.origin,
            destination: requestData.destination,
            departureDate: requestData.departureDate,
            passengers: requestData.passengers,
            cabinClass: requestData.cabinClass
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate IATA codes
    if (!/^[A-Z]{3}$/.test(requestData.origin)) {
      console.error(`Invalid origin IATA code: ${requestData.origin}`);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid origin IATA code',
          details: `Origin code "${requestData.origin}" must be a 3-letter IATA code`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!/^[A-Z]{3}$/.test(requestData.destination)) {
      console.error(`Invalid destination IATA code: ${requestData.destination}`);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid destination IATA code',
          details: `Destination code "${requestData.destination}" must be a 3-letter IATA code`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestData.departureDate)) {
      console.error(`Invalid departure date format: ${requestData.departureDate}`);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid departure date format',
          details: `Date "${requestData.departureDate}" must be in YYYY-MM-DD format`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (requestData.returnDate && !/^\d{4}-\d{2}-\d{2}$/.test(requestData.returnDate)) {
      console.error(`Invalid return date format: ${requestData.returnDate}`);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid return date format',
          details: `Date "${requestData.returnDate}" must be in YYYY-MM-DD format`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Accept currency from request or detect from IP
    let currency = requestData.currency;
    if (!currency) {
      try {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
        if (ip) {
          const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            currency = geoData.currency || 'USD';
          } else {
            currency = 'USD';
          }
        } else {
          currency = 'USD';
        }
      } catch (e) {
        currency = 'USD';
      }
    }

    // Create Duffel API request
    const duffelToken = Deno.env.get('DUFFEL_API_TOKEN');
    if (!duffelToken) {
      console.error('Duffel API token not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Duffel API token not configured'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Creating search request with token:', duffelToken.substring(0, 10) + '...');

    // Prepare the search request for Duffel API
    const searchRequest = {
      data: {
        slices: [
          {
            origin: requestData.origin,
            destination: requestData.destination,
            departure_date: requestData.departureDate,
            max_connections: requestData.maxConnections || 1
          },
          ...(requestData.returnDate ? [{
            origin: requestData.destination,
            destination: requestData.origin,
            departure_date: requestData.returnDate,
            max_connections: requestData.maxConnections || 1
          }] : [])
        ],
        passengers: Array(requestData.passengers).fill({
          type: "adult"
        }),
        cabin_class: requestData.cabinClass.toLowerCase(),
        currency,
        supplier_timeout: 20000
      }
    };

    console.log('Search request:', JSON.stringify(searchRequest, null, 2));

    try {
      // Make request to Duffel API
      const response = await fetch('https://api.duffel.com/air/offer_requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${duffelToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Duffel-Version': 'v2'
        },
        body: JSON.stringify(searchRequest)
      });

      console.log('Duffel API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Duffel API error:', JSON.stringify(errorData, null, 2));
        return new Response(
          JSON.stringify({ 
            error: 'Duffel API error',
            details: errorData,
            status: response.status
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
        );
      }

      const searchResults = await response.json();
      console.log('Search results received:', JSON.stringify(searchResults, null, 2));

      // Add timing information to the response
      const responseWithTiming = {
        ...searchResults,
        timing: {
          search_started_at: new Date().toISOString(),
          supplier_timeout: 20000, // 20 seconds default
          expires_at: searchResults.data?.expires_at || null,
          created_at: searchResults.data?.created_at || null
        }
      };

      // Return the search results with timing information
      return new Response(
        JSON.stringify(responseWithTiming),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error calling Duffel API:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to call Duffel API',
          details: error.message,
          stack: error.stack
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 