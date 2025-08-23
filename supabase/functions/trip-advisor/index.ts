// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Get the Trip Advisor API key from environment variables
// @ts-ignore: Deno API
const TRIP_ADVISOR_API_KEY = Deno.env.get('TRIP_ADVISOR_API_KEY');
const TRIP_ADVISOR_API_HOST = 'https://api.content.tripadvisor.com/api/v1';

// Define supported endpoints and operations
const ENDPOINTS = {
  SEARCH_LOCATIONS: `${TRIP_ADVISOR_API_HOST}/location/search`,
  LOCATION_DETAILS: `${TRIP_ADVISOR_API_HOST}/location`,
  NEARBY_SEARCH: `${TRIP_ADVISOR_API_HOST}/location/nearby_search`,
  LOCATION_PHOTOS: `${TRIP_ADVISOR_API_HOST}/location/{locationId}/photos`,
  LOCATION_REVIEWS: `${TRIP_ADVISOR_API_HOST}/location/{locationId}/reviews`,
}

// Handler for all Trip Advisor API requests
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!TRIP_ADVISOR_API_KEY) {
      throw new Error('Trip Advisor API key not configured');
    }

    const { action, params } = await req.json();

    if (!action) {
      throw new Error('Action is required');
    }

    let endpoint: string;
    let queryParams: Record<string, string> = {};
    let locationId: string | undefined;

    // Configure endpoint and parameters based on the requested action
    switch (action) {
      case 'searchLocations':
        // Search for locations (attractions, restaurants, hotels, etc.)
        endpoint = ENDPOINTS.SEARCH_LOCATIONS;
        
        if (!params.searchQuery) {
          throw new Error('Search query is required');
        }
        
        queryParams = {
          searchQuery: params.searchQuery,
          category: params.category || '', // attractions, restaurants, hotels
          language: params.language || 'en',
          latLong: params.latLong || '',
          radius: params.radius ? params.radius.toString() : '',
          limit: params.limit ? params.limit.toString() : '10',
        };
        break;

      case 'locationDetails':
        // Get details for a specific location
        if (!params.locationId) {
          throw new Error('Location ID is required');
        }
        
        locationId = params.locationId;
        endpoint = `${ENDPOINTS.LOCATION_DETAILS}/${locationId}`;
        
        queryParams = {
          language: params.language || 'en',
          currency: params.currency || 'USD',
        };
        break;

      case 'nearbySearch':
        // Search for nearby attractions
        endpoint = ENDPOINTS.NEARBY_SEARCH;
        
        if (!params.latLong) {
          throw new Error('Latitude and longitude are required');
        }
        
        queryParams = {
          latLong: params.latLong,
          category: params.category || '', // attractions, restaurants, hotels
          language: params.language || 'en',
          radius: params.radius ? params.radius.toString() : '5',
          limit: params.limit ? params.limit.toString() : '10',
        };
        break;

      case 'locationPhotos':
        // Get photos for a specific location
        if (!params.locationId) {
          throw new Error('Location ID is required');
        }
        
        locationId = params.locationId;
        // Ensure locationId is treated as a string
        const photosEndpoint: string = ENDPOINTS.LOCATION_PHOTOS;
        endpoint = photosEndpoint.replace('{locationId}', String(locationId));
        
        queryParams = {
          language: params.language || 'en',
          limit: params.limit ? params.limit.toString() : '10',
        };
        break;

      case 'locationReviews':
        // Get reviews for a specific location
        if (!params.locationId) {
          throw new Error('Location ID is required');
        }
        
        locationId = params.locationId;
        // Ensure locationId is treated as a string
        const reviewsEndpoint: string = ENDPOINTS.LOCATION_REVIEWS;
        endpoint = reviewsEndpoint.replace('{locationId}', String(locationId));
        
        queryParams = {
          language: params.language || 'en',
          limit: params.limit ? params.limit.toString() : '10',
        };
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    // Build URL with query parameters
    const url = new URL(endpoint);
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    // Make the request to Trip Advisor API
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-TripAdvisor-API-Key': TRIP_ADVISOR_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Trip Advisor API error:', errorData);
      throw new Error(`Trip Advisor API error: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('Trip Advisor API response:', {
      action,
      endpoint: url.toString(),
      result: data,
    });

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing request:', {
      message: error.message,
      stack: error.stack,
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
}); 