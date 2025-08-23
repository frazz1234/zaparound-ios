import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const MAPBOX_KEY = Deno.env.get('MAPBOX_KEY');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { latitude, longitude } = await req.json()

    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required');
    }

    if (!MAPBOX_KEY) {
      throw new Error('Mapbox key not configured');
    }

    // Use Mapbox's reverse geocoding API
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_KEY}&types=place,region,country&language=en`
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Mapbox API error:', error);
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      throw new Error('Location not found');
    }

    // Extract location data from Mapbox response
    const features = data.features;
    const place = features.find((f: any) => f.place_type[0] === 'place');
    const region = features.find((f: any) => f.place_type[0] === 'region');
    const country = features.find((f: any) => f.place_type[0] === 'country');

    // Format the response
    const locationData = {
      city: place?.text || '',
      region: region?.text || '',
      country: country?.text || '',
      formatted: features[0].place_name,
      context: features[0].context || [],
      coordinates: {
        longitude,
        latitude
      },
      raw_features: features // Include raw features for debugging
    };

    console.log('Location found:', {
      query: `${longitude},${latitude}`,
      result: locationData
    });

    return new Response(
      JSON.stringify(locationData),
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