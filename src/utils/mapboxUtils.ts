import { supabase } from '@/integrations/supabase/client';

let cachedToken: string | null = null;
let tokenPromise: Promise<string> | null = null;

/**
 * Get Mapbox access token securely from Supabase function
 * Uses caching to avoid repeated API calls
 * Falls back to environment variable if Edge Function fails
 */
export const getMapboxToken = async (): Promise<string> => {
  // Return cached token if available
  if (cachedToken) {
    return cachedToken;
  }

  // Return existing promise if a request is already in progress
  if (tokenPromise) {
    return tokenPromise;
  }

  // Create new promise to fetch token
  tokenPromise = (async () => {
    try {
      // Try to get token from Supabase Edge Function first
      const { data, error } = await supabase.functions.invoke('get-mapbox-key');
      if (error) {
        console.warn('Supabase Edge Function failed, trying fallback:', error.message);
        throw error;
      }
      if (!data?.key) {
        throw new Error('No Mapbox token received from server');
      }
      
      cachedToken = data.key;
      return data.key;
    } catch (err) {
      console.warn('Failed to fetch Mapbox token from Edge Function, using fallback:', err);
      
      // Fallback to environment variable (for development or if Edge Function is not deployed)
      const fallbackToken = import.meta.env.VITE_MAPBOX_TOKEN || process.env.VITE_MAPBOX_TOKEN;
      if (fallbackToken) {
        console.warn('Using fallback Mapbox token from environment variable');
        cachedToken = fallbackToken;
        return fallbackToken;
      }
      
      // If no fallback is available, throw a more helpful error
      throw new Error('Mapbox token not available. Please check your environment configuration.');
    } finally {
      tokenPromise = null;
    }
  })();

  return tokenPromise;
};

/**
 * Make a Mapbox API call with secure token
 */
export const makeMapboxApiCall = async (endpoint: string, params: Record<string, string> = {}): Promise<any> => {
  const token = await getMapboxToken();
  const url = new URL(endpoint);
  
  // Add access token
  url.searchParams.set('access_token', token);
  
  // Add other parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Mapbox API error: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Geocode coordinates to location name
 */
export const reverseGeocode = async (longitude: number, latitude: number, types: string = 'place'): Promise<any> => {
  const query = `${longitude},${latitude}`;
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`);
  
  // Add access token
  const token = await getMapboxToken();
  url.searchParams.set('access_token', token);
  
  // Add other parameters
  url.searchParams.set('types', types);
  url.searchParams.set('limit', '1');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Mapbox API error: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Geocode location name to coordinates
 */
export const geocode = async (query: string, types: string = 'place,address,poi'): Promise<any> => {
  const encodedQuery = encodeURIComponent(query);
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json`);
  
  // Add access token
  const token = await getMapboxToken();
  url.searchParams.set('access_token', token);
  
  // Add other parameters
  url.searchParams.set('types', types);
  url.searchParams.set('limit', '15');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Mapbox API error: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Generate static map URL with secure token
 */
export const generateStaticMapUrl = async (
  coordinates: [number, number],
  zoom: number = 12,
  width: number = 400,
  height: number = 300,
  style: string = 'mapbox://styles/mapbox/streets-v11',
  marker?: string
): Promise<string> => {
  const token = await getMapboxToken();
  const [lng, lat] = coordinates;
  
  // Parse the style URL to extract the style ID
  // Expected format: mapbox://styles/mapbox/streets-v11
  const styleMatch = style.match(/mapbox:\/\/styles\/mapbox\/(.+)/);
  const styleId = styleMatch ? styleMatch[1] : 'streets-v11';
  
  let url = `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/`;
  
  if (marker) {
    url += `${marker}/`;
  }
  
  url += `${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${token}`;
  
  return url;
};

/**
 * Clear cached token (useful for testing or token refresh)
 */
export const clearMapboxTokenCache = () => {
  cachedToken = null;
  tokenPromise = null;
}; 