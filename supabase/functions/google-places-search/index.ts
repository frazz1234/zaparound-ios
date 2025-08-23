import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'
import { corsHeaders } from '../_shared/cors.ts'

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACE_API_KEY');

interface PlaceSearchRequest {
  query: string;
  location?: {
    lat: number;
    lng: number;
  };
  radius?: number;
  types?: string;
  language?: string;
}

interface PlaceDetailsRequest {
  placeId: string;
  fields?: string;
  language?: string;
}

interface PlacePhotoRequest {
  photoReference: string;
  maxWidth?: number;
  maxHeight?: number;
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
  };
  website?: string;
  international_phone_number?: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!GOOGLE_API_KEY) {
      throw new Error('Google API key not configured');
    }

    const { action, ...params } = await req.json()

    if (!action) {
      throw new Error('Action is required: "search", "details", "autocomplete", or "photo"');
    }

    let result;

    switch (action) {
      case 'search':
        result = await handlePlaceSearch(params as PlaceSearchRequest);
        break;
      case 'details':
        result = await handlePlaceDetails(params as PlaceDetailsRequest);
        break;
      case 'autocomplete':
        result = await handlePlaceAutocomplete(params as PlaceSearchRequest);
        break;
      case 'photo':
        result = await handlePlacePhoto(params as PlacePhotoRequest);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
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
        details: error.stack
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

async function handlePlaceSearch(params: PlaceSearchRequest) {
  const { query, location, radius = 5000, types, language = 'en' } = params;

  if (!query) {
    throw new Error('Query is required for place search');
  }

  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&language=${language}`;

  if (location) {
    url += `&location=${location.lat},${location.lng}&radius=${radius}`;
  }

  if (types) {
    url += `&type=${types}`;
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }

  return {
    status: data.status,
    results: data.results || [],
    next_page_token: data.next_page_token
  };
}

async function handlePlaceDetails(params: PlaceDetailsRequest) {
  const { placeId, fields = 'place_id,name,formatted_address,geometry,types,photos,rating,user_ratings_total,opening_hours,website,international_phone_number,reviews', language = 'en' } = params;

  if (!placeId) {
    throw new Error('Place ID is required for place details');
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}&language=${language}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }

  return {
    status: data.status,
    result: data.result
  };
}

async function handlePlacePhoto(params: PlacePhotoRequest) {
  const { photoReference, maxWidth = 800, maxHeight = 600 } = params;

  if (!photoReference) {
    throw new Error('Photo reference is required for place photo');
  }

  // Check if we have this photo cached in our database
  const cacheKey = `photo_${photoReference}_${maxWidth}_${maxHeight}`;
  
  // For now, return the URL directly to avoid server-side image processing
  // This is more scalable as it lets Google's CDN handle the image serving
  let url = `https://maps.googleapis.com/maps/api/place/photo?photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;

  if (maxWidth) {
    url += `&maxwidth=${maxWidth}`;
  }

  if (maxHeight) {
    url += `&maxheight=${maxHeight}`;
  }

  return url;
}

async function handlePlaceAutocomplete(params: PlaceSearchRequest) {
  const { query, location, radius = 5000, types, language = 'en' } = params;

  if (!query) {
    throw new Error('Query is required for place autocomplete');
  }

  let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&language=${language}`;

  if (location) {
    url += `&location=${location.lat},${location.lng}&radius=${radius}`;
  }

  if (types) {
    url += `&types=${types}`;
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }

  return {
    status: data.status,
    predictions: data.predictions || []
  };
} 