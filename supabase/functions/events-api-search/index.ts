import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface TicketmasterEvent {
  id: string;
  name: string;
  description?: string;
  url: string;
  dates: {
    start: {
      localDate: string;
      localTime: string;
      dateTime: string;
      timezone?: string;
    };
    end?: {
      localDate: string;
      localTime: string;
      dateTime: string;
      timezone?: string;
    };
    status: {
      code: string;
    };
  };
  images: Array<{
    url: string;
    ratio?: string;
    width?: number;
    height?: number;
  }>;
  _embedded?: {
    venues?: Array<{
      id: string;
      name: string;
      address: {
        line1?: string;
        line2?: string;
        city?: {
          name: string;
        };
        state?: {
          name: string;
          stateCode: string;
        };
        country?: {
          name: string;
          countryCode: string;
        };
        postalCode?: string;
      };
      location?: {
        latitude: string;
        longitude: string;
      };
    }>;
  };
  classifications?: Array<{
    segment?: {
      name?: string;
    };
  }>;
}

// Cache TTL in seconds (5 minutes)
const CACHE_TTL = 300;

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get and validate API key
    const TICKETMASTER_KEY = Deno.env.get('TICKETMASTER_KEY') || 'chMgHHHb3axdtMUoGuBAMKK9mMwpMnBs';
    if (!TICKETMASTER_KEY) {
      console.error('TICKETMASTER_KEY environment variable is not set');
      throw new Error('Configuration error: API key not set');
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { city, latitude, longitude } = body;

    if (!city && (!latitude || !longitude)) {
      return new Response(
        JSON.stringify({ error: 'Either city or both latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching for events in: ${city || `coordinates (${latitude}, ${longitude})`}`);

    // Build search parameters for Ticketmaster API
    const searchParams = new URLSearchParams({
      'apikey': TICKETMASTER_KEY,
      'size': '20', // Number of events to return
      'sort': 'date,asc',
      'startDateTime': new Date().toISOString().split('.')[0] + 'Z', // Current time in ISO format
      'classificationName': 'music,sports,arts,theatre,family,comedy,film,food,festival,business' // Add classifications
    });

    // Add city or coordinates based on what's provided
    if (city) {
      searchParams.append('city', city);
    } else {
      searchParams.append('latlong', `${latitude},${longitude}`);
      searchParams.append('radius', '50'); // 50 mile radius
    }

    const baseUrl = 'https://app.ticketmaster.com/discovery/v2';
    const eventsUrl = `${baseUrl}/events.json?${searchParams}`;

    console.log('Making request to Ticketmaster API...');
    console.log('Full URL:', eventsUrl.replace(TICKETMASTER_KEY, 'API_KEY_HIDDEN'));
    console.log('Search parameters:', Object.fromEntries(searchParams));

    const eventsResponse = await fetch(eventsUrl);

    if (!eventsResponse.ok) {
      const errorData = await eventsResponse.json().catch(() => null);
      console.error('Ticketmaster API error details:', {
        status: eventsResponse.status,
        statusText: eventsResponse.statusText,
        url: eventsUrl.replace(TICKETMASTER_KEY, 'API_KEY_HIDDEN'),
        error: errorData,
        headers: Object.fromEntries(eventsResponse.headers.entries())
      });
      
      return new Response(
        JSON.stringify({
          error: `Ticketmaster API error: ${eventsResponse.statusText}`,
          details: errorData
        }),
        {
          status: eventsResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData._embedded?.events || [];
    console.log(`Found ${events.length} events`);

    const formattedEvents = events
      .filter(event => {
        // Basic validity checks
        const hasVenue = event._embedded?.venues?.[0];
        const isActive = event.dates?.status?.code === 'onsale';
        const hasUrl = Boolean(event.url);
        const hasImages = Array.isArray(event.images) && event.images.length > 0;

        return hasVenue && isActive && hasUrl && hasImages;
      })
      .map((event: TicketmasterEvent) => {
        // Get the best quality image
        const bestImage = event.images
          .sort((a, b) => (b.width || 0) - (a.width || 0))
          .find(img => img.ratio === '16_9') || event.images[0];

        // Determine event type based on classifications
        let eventType = 'other';
        if (event.classifications?.some(c => c.segment?.name?.toLowerCase().includes('music'))) {
          eventType = 'music';
        } else if (event.classifications?.some(c => c.segment?.name?.toLowerCase().includes('sports'))) {
          eventType = 'sports';
        } else if (event.classifications?.some(c => 
          c.segment?.name?.toLowerCase().includes('arts') || 
          c.segment?.name?.toLowerCase().includes('theatre')
        )) {
          eventType = 'arts';
        } else if (event.classifications?.some(c => c.segment?.name?.toLowerCase().includes('family'))) {
          eventType = 'family';
        } else if (event.classifications?.some(c => c.segment?.name?.toLowerCase().includes('comedy'))) {
          eventType = 'comedy';
        } else if (event.classifications?.some(c => 
          c.segment?.name?.toLowerCase().includes('film') || 
          c.segment?.name?.toLowerCase().includes('movie')
        )) {
          eventType = 'film';
        } else if (event.classifications?.some(c => 
          c.segment?.name?.toLowerCase().includes('food') || 
          c.segment?.name?.toLowerCase().includes('drink') ||
          c.segment?.name?.toLowerCase().includes('dining')
        )) {
          eventType = 'food';
        } else if (event.classifications?.some(c => 
          c.segment?.name?.toLowerCase().includes('festival') || 
          c.segment?.name?.toLowerCase().includes('fair')
        )) {
          eventType = 'festival';
        } else if (event.classifications?.some(c => 
          c.segment?.name?.toLowerCase().includes('business') || 
          c.segment?.name?.toLowerCase().includes('conference') ||
          c.segment?.name?.toLowerCase().includes('expo')
        )) {
          eventType = 'business';
        }

        return {
          id: event.id,
          name: event.name,
          description: event.description || '',
          url: event.url,
          startDate: event.dates.start.dateTime || `${event.dates.start.localDate}T${event.dates.start.localTime || '00:00:00'}`,
          endDate: event.dates.end?.dateTime || null,
          timezone: event.dates.start.timezone || null,
          imageUrl: bestImage?.url || null,
          type: eventType,
          venue: event._embedded?.venues?.[0] ? {
            name: event._embedded.venues[0].name,
            address: {
              address_1: event._embedded.venues[0].address.line1 || '',
              address_2: event._embedded.venues[0].address.line2 || '',
              city: event._embedded.venues[0].address.city?.name || '',
              region: event._embedded.venues[0].address.state?.name || '',
              postal_code: event._embedded.venues[0].address.postalCode || '',
              country: event._embedded.venues[0].address.country?.name || '',
              latitude: event._embedded.venues[0].location?.latitude || '',
              longitude: event._embedded.venues[0].location?.longitude || ''
            }
          } : null
        };
      });

    const responseData = {
      events: formattedEvents,
      total: formattedEvents.length
    };

    // Return successful response with cache headers
    return new Response(
      JSON.stringify(responseData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
          'ETag': `"${JSON.stringify(responseData).length}"`,
          'Vary': 'Accept-Encoding'
        },
      }
    );
  } catch (error) {
    // Log the full error for debugging
    console.error('Unexpected error:', {
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}); 