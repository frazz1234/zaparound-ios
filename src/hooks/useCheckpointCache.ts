import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tripCache, getOrSetCache, cacheEventManager, CACHE_EVENTS } from '@/utils/cache';
import mapboxgl from 'mapbox-gl';

export interface CheckpointData {
  coordinates: [number, number];
  name: string;
  address: string;
}

// Utility function to parse coordinates
const parseCoordinates = (coordsData: any): [number, number] | null => {
  if (!coordsData) return null;
  
  try {
    // Case 1: Already an array
    if (Array.isArray(coordsData) && coordsData.length === 2) {
      const [lng, lat] = coordsData;
      if (typeof lng === 'number' && typeof lat === 'number') {
        return [lng, lat];
      }
    }
    
    // Case 2: JSON string of an array
    if (typeof coordsData === 'string') {
      try {
        const parsed = JSON.parse(coordsData);
        if (Array.isArray(parsed) && parsed.length === 2) {
          const [lng, lat] = parsed;
          if (typeof lng === 'number' && typeof lat === 'number') {
            return [lng, lat];
          }
        }
      } catch {
        // Not a valid JSON, try other formats
      }
      
      // Case 3: String format "lat, lng" (e.g., "46.8144, -71.2082")
      if (coordsData.includes(',')) {
        const parts = coordsData.split(',').map(part => parseFloat(part.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          // Convert from lat,lng to lng,lat for Mapbox
          return [parts[1], parts[0]];
        }
      }
    }
    
    return null;
  } catch (e) {
    console.error('Error parsing coordinates:', e, coordsData);
    return null;
  }
};

export function useCheckpointCache() {
  const [loading, setLoading] = useState(false);

  // Fetch ZapOut checkpoints with caching
  const fetchZapoutCheckpoints = useCallback(async (zapoutId: string, travelMode: 'driving' | 'walking' | 'cycling' = 'driving') => {
    const cacheKey = `zapout-checkpoints-${zapoutId}`;
    
    return await getOrSetCache(
      tripCache,
      cacheKey,
      async () => {
        console.log(`Fetching fresh ZapOut checkpoints for ID: ${zapoutId}`);
        
        const { data, error } = await supabase
          .from('zapout_data')
          .select('*')
          .eq('id', zapoutId)
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('No data returned for zapout ID: ' + zapoutId);

        // Parse main coordinates
        const mainCoords = parseCoordinates(data.coordinates);
        
        // Parse checkpoint coordinates
        let checkpoints: CheckpointData[] = [];
        let locationData: Array<{
          coordinates: [number, number];
          name: string;
          Adresse: string;
        }> = [];

        // Add main point first
        if (mainCoords) {
          checkpoints.push({
            coordinates: mainCoords,
            name: data.title || 'Starting Point',
            address: data.location || 'No address available'
          });
        }

        // Parse checkpoints from various possible fields
        if (data.checkpoints) {
          try {
            const parsedCheckpoints = typeof data.checkpoints === 'string'
              ? JSON.parse(data.checkpoints)
              : data.checkpoints;
              
            if (Array.isArray(parsedCheckpoints)) {
              parsedCheckpoints.forEach((checkpoint: any) => {
                if (checkpoint.coordinates) {
                  const coords = parseCoordinates(checkpoint.coordinates);
                  if (coords) {
                    checkpoints.push({
                      coordinates: coords,
                      name: checkpoint.name || checkpoint.place_name || 'Unknown Location',
                      address: checkpoint.Adresse || checkpoint.address || 'No address available'
                    });
                  }
                }
              });
            }
          } catch (e) {
            console.error('Error parsing checkpoints:', e);
          }
        }

        // Also check for geoposition field
        if (data.geoposition) {
          try {
            const geopositions = typeof data.geoposition === 'string'
              ? JSON.parse(data.geoposition)
              : data.geoposition;
              
            if (Array.isArray(geopositions)) {
              const startIndex = mainCoords ? 1 : 0;
              geopositions.slice(startIndex).forEach((pos: any) => {
                if (pos.coordinates) {
                  let coords;
                  if (Array.isArray(pos.coordinates) && pos.coordinates.length === 2) {
                    coords = pos.coordinates as [number, number];
                  } else {
                    coords = parseCoordinates(pos.coordinates);
                  }
                  
                  if (coords) {
                    checkpoints.push({
                      coordinates: coords,
                      name: pos.place_name || pos.name || pos.location || pos.city || 'Unknown Location',
                      address: pos.Adresse || pos.place || pos.formatted_address || pos.full_address || 'No address available'
                    });
                  }
                }
              });
            }
          } catch (e) {
            console.error('Error parsing geoposition data:', e);
          }
        }

        return {
          checkpoints,
          lastUpdated: Date.now()
        };
      },
      { ttl: 1000 * 60 * 10 } // 10 minutes TTL for checkpoints
    );
  }, []);

  // Fetch ZapRoad checkpoints with caching
  const fetchZaproadCheckpoints = useCallback(async (zaproadId: string, travelMode: 'driving' | 'walking' | 'cycling' = 'driving') => {
    const cacheKey = `zaproad-checkpoints-${zaproadId}-${travelMode}`;
    
    return await getOrSetCache(
      tripCache,
      cacheKey,
      async () => {
        console.log(`Fetching fresh ZapRoad checkpoints for ID: ${zaproadId} with mode: ${travelMode}`);
        
        const { data, error } = await supabase
          .from('zaproad_data')
          .select('*')
          .eq('id', zaproadId)
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('No data returned for zaproad ID: ' + zaproadId);

        // Parse main coordinates
        const mainCoords = parseCoordinates(data.starting_city_coordinates);
        const endCoords = data.end_city_coordinates 
          ? parseCoordinates(data.end_city_coordinates)
          : null;
        
        let checkpoints: CheckpointData[] = [];
        let routePoints: [number, number][] = [];

        // Add starting point first
        if (mainCoords) {
          checkpoints.push({
            coordinates: mainCoords,
            name: data.starting_city || 'Starting Point',
            address: data.starting_city || 'No address available'
          });
          routePoints.push(mainCoords);
        }

        // Add end point if available
        if (endCoords) {
          checkpoints.push({
            coordinates: endCoords,
            name: data.end_city || 'End Point',
            address: data.end_city || 'No address available'
          });
          routePoints.push(endCoords);
        }

        // Parse stopover cities
        if (data.stopover_cities) {
          try {
            const stopoverCities = typeof data.stopover_cities === 'string'
              ? JSON.parse(data.stopover_cities)
              : data.stopover_cities;
              
            if (Array.isArray(stopoverCities)) {
              stopoverCities.forEach((city: any) => {
                if (city.coordinates) {
                  const coords = parseCoordinates(city.coordinates);
                  if (coords) {
                    checkpoints.push({
                      coordinates: coords,
                      name: city.name || 'Stopover',
                      address: city.name || 'No address available'
                    });
                    routePoints.push(coords);
                  }
                }
              });
            }
          } catch (e) {
            console.error('Error parsing stopover cities:', e);
          }
        }

        // Get route between points if we have multiple points
        let routeGeometry = null;
        if (routePoints.length >= 2) {
          try {
            const coordinates = routePoints.map(p => p.join(',')).join(';');
            const response = await fetch(
              `https://api.mapbox.com/directions/v5/mapbox/${travelMode}/${coordinates}?` +
              `geometries=geojson&overview=full&radiuses=${routePoints.map(() => '50').join(';')}&` +
              `approaches=${routePoints.map(() => 'curb').join(';')}&` +
              `waypoints=${routePoints.map((_, i) => i).join(';')}&` +
              `access_token=${mapboxgl.accessToken}`
            );
            
            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
              routeGeometry = data.routes[0].geometry.coordinates;
            }
          } catch (error) {
            console.error('Error fetching route:', error);
          }
        }

        return {
          checkpoints,
          routeGeometry,
          lastUpdated: Date.now()
        };
      },
      { ttl: 1000 * 60 * 10 } // 10 minutes TTL for checkpoints
    );
  }, []);

  // Fetch ZapTrip checkpoints with caching
  const fetchZaptripCheckpoints = useCallback(async (zaptripId: string) => {
    const cacheKey = `zaptrip-checkpoints-${zaptripId}`;
    
    return await getOrSetCache(
      tripCache,
      cacheKey,
      async () => {
        console.log(`Fetching fresh ZapTrip checkpoints for ID: ${zaptripId}`);
        
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', zaptripId)
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('No data returned for zaptrip ID: ' + zaptripId);

        // Parse main coordinates
        const mainCoords = parseCoordinates(data.coordinates);
        
        let checkpoints: CheckpointData[] = [];

        // Add main point first
        if (mainCoords) {
          checkpoints.push({
            coordinates: mainCoords,
            name: data.title || 'Starting Point',
            address: data.location || 'No address available'
          });
        }

        // Parse checkpoints from various possible fields
        if (data.checkpoints) {
          try {
            const parsedCheckpoints = typeof data.checkpoints === 'string'
              ? JSON.parse(data.checkpoints)
              : data.checkpoints;
              
            if (Array.isArray(parsedCheckpoints)) {
              parsedCheckpoints.forEach((checkpoint: any) => {
                if (checkpoint.coordinates) {
                  const coords = parseCoordinates(checkpoint.coordinates);
                  if (coords) {
                    checkpoints.push({
                      coordinates: coords,
                      name: checkpoint.name || checkpoint.place_name || 'Unknown Location',
                      address: checkpoint.Adresse || checkpoint.address || 'No address available'
                    });
                  }
                }
              });
            }
          } catch (e) {
            console.error('Error parsing checkpoints:', e);
          }
        }

        // Also check for geoposition field
        if (data.geoposition) {
          try {
            const geopositions = typeof data.geoposition === 'string'
              ? JSON.parse(data.geoposition)
              : data.geoposition;
              
            if (Array.isArray(geopositions)) {
              const startIndex = mainCoords ? 1 : 0;
              geopositions.slice(startIndex).forEach((pos: any) => {
                if (pos.coordinates) {
                  let coords;
                  if (Array.isArray(pos.coordinates) && pos.coordinates.length === 2) {
                    coords = pos.coordinates as [number, number];
                  } else {
                    coords = parseCoordinates(pos.coordinates);
                  }
                  
                  if (coords) {
                    checkpoints.push({
                      coordinates: coords,
                      name: pos.place_name || pos.name || pos.location || pos.city || 'Unknown Location',
                      address: pos.Adresse || pos.place || pos.formatted_address || pos.full_address || 'No address available'
                    });
                  }
                }
              });
            }
          } catch (e) {
            console.error('Error parsing geoposition data:', e);
          }
        }

        return {
          checkpoints,
          lastUpdated: Date.now()
        };
      },
      { ttl: 1000 * 60 * 10 } // 10 minutes TTL for checkpoints
    );
  }, []);

  // Invalidate checkpoint cache for a specific trip
  const invalidateCheckpointCache = useCallback((tripId: string, tripType: 'zapout' | 'zaproad' | 'zaptrip') => {
    const cacheKey = `${tripType}-checkpoints-${tripId}`;
    tripCache.delete(cacheKey);
    console.log(`Checkpoint cache invalidated for ${tripType} trip: ${tripId}`);
  }, []);

  // Clear all checkpoint caches
  const clearAllCheckpointCaches = useCallback(() => {
    const keys = Array.from(tripCache.keys());
    keys.forEach(key => {
      if (key.includes('-checkpoints-')) {
        tripCache.delete(key);
      }
    });
    console.log('All checkpoint caches cleared');
  }, []);

  // Listen for cache invalidation events
  useEffect(() => {
    const unsubscribeCheckpointsInvalidated = cacheEventManager.subscribe(CACHE_EVENTS.CHECKPOINTS_INVALIDATED, () => {
      console.log('Checkpoints invalidated event received, clearing checkpoint caches...');
      clearAllCheckpointCaches();
    });

    const unsubscribeTripCreated = cacheEventManager.subscribe(CACHE_EVENTS.TRIP_CREATED, () => {
      console.log('Trip created event received, clearing checkpoint caches...');
      clearAllCheckpointCaches();
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeCheckpointsInvalidated();
      unsubscribeTripCreated();
    };
  }, [clearAllCheckpointCaches]);

  return {
    loading,
    fetchZapoutCheckpoints,
    fetchZaproadCheckpoints,
    fetchZaptripCheckpoints,
    invalidateCheckpointCache,
    clearAllCheckpointCaches
  };
} 