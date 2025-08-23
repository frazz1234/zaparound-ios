import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Duffel } from 'https://esm.sh/@duffel/api@1.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log('Request body:', JSON.stringify(requestBody, null, 2))
    
    const { location, coordinates, checkIn, checkOut, guests, rooms } = requestBody

    // Validate required fields
    if (!location || !coordinates || !checkIn || !checkOut || !guests || !rooms) {
      console.error('Missing required fields:', {
        location,
        coordinates,
        checkIn,
        checkOut,
        guests,
        rooms
      })
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: { location, coordinates, checkIn, checkOut, guests, rooms }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Initialize Duffel client
    const duffelToken = Deno.env.get('DUFFEL_API_TOKEN')
    console.log('Duffel token status:', duffelToken ? 'Present' : 'Missing')
    
    if (!duffelToken) {
      throw new Error('DUFFEL_API_TOKEN not found in environment variables')
    }

    // Create Duffel client with proper configuration
    const duffel = new Duffel({
      token: duffelToken,
      debug: true // Enable debug mode for more detailed logs
    })

    console.log('Duffel client initialized:', {
      hasStays: !!duffel.stays,
      clientMethods: Object.keys(duffel)
    })

    // Prepare the search request
    const searchRequest = {
      data: {
        location: {
          geographic_coordinates: {
            latitude: coordinates[1], // Second element is latitude
            longitude: coordinates[0] // First element is longitude
          },
          radius: {
            value: 50,
            unit: "km"
          }
        },
        check_in: checkIn,
        check_out: checkOut,
        guests: guests,
        rooms: rooms
      }
    };
    console.log('Duffel search request:', JSON.stringify(searchRequest, null, 2))

    // Search for stays using the Stays API
    console.log('Sending request to Duffel Stays API...')
    const searchResponse = await fetch('https://api.duffel.com/stays/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${duffelToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Duffel-Version': 'v1'
      },
      body: JSON.stringify(searchRequest)
    })

    // Log the raw response for debugging
    const responseText = await searchResponse.text()
    console.log('Raw API response:', responseText)

    if (!searchResponse.ok) {
      try {
        const errorData = JSON.parse(responseText)
        console.error('Duffel API error response:', errorData)
        throw new Error(`Duffel API error: ${errorData.errors?.[0]?.message || 'Unknown error'}`)
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError)
        throw new Error(`Duffel API error: ${responseText}`)
      }
    }

    try {
      const searchResults = JSON.parse(responseText)
      console.log('Duffel API response received:', JSON.stringify(searchResults, null, 2))

      // Check if we have any results
      if (!searchResults.data || !Array.isArray(searchResults.data) || searchResults.data.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: 'No hotels found',
            details: 'No hotels found for the given search criteria'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 with empty results instead of error
          }
        )
      }

      // Transform the response to match the expected format
      const transformedResults = searchResults.data.map((result: any) => ({
        id: result.id,
        hotel: {
          name: result.accommodation.name,
          rating: result.accommodation.rating || 0,
          address: {
            city: result.accommodation.location.city || '',
            country: result.accommodation.location.country || ''
          }
        },
        room_types: result.room_types.map((room: any) => ({
          name: room.name,
          description: room.description || ''
        })),
        total_amount: result.total_amount,
        total_currency: result.total_currency
      }))

      // Store search results in Supabase for later use
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      try {
        // Store the search results with their IDs for later use in booking
        await supabaseClient
          .from('hotel_search_results')
          .insert(
            searchResults.data.map((result: any) => ({
              search_result_id: result.id,
              hotel_name: result.accommodation.name,
              location: result.accommodation.location,
              check_in: checkIn,
              check_out: checkOut,
              guests: guests,
              rooms: rooms,
              created_at: new Date().toISOString()
            }))
          )
      } catch (dbError) {
        console.error('Error storing search results:', dbError)
        // Continue even if storing fails
      }

      return new Response(
        JSON.stringify({ hotels: transformedResults }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } catch (parseError) {
      console.error('Failed to parse success response:', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse Duffel API response',
          details: parseError.message,
          rawResponse: responseText
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }
  } catch (error) {
    console.error('Hotel search error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    })
    
    // Check for specific error types
    if (error.message.includes('not enabled for your account')) {
      return new Response(
        JSON.stringify({ 
          error: 'Feature not enabled',
          details: 'Hotel booking is not enabled for your Duffel account. Please contact support.',
          name: error.name
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        name: error.name,
        cause: error.cause
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 