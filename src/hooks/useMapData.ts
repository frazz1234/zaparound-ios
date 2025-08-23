import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tripCache, getOrSetCache, cacheEventManager, CACHE_EVENTS } from '@/utils/cache';
import { useToast } from '@/hooks/use-toast';

export interface MapTripData {
  id: string;
  title: string;
  type: 'zapout' | 'zaproad' | 'zaptrip';
  coordinates: [number, number] | null;
  location: string | null;
  description?: string | null;
  created_at: string;
  updated_at?: string;
  // ZapRoad specific fields
  starting_city?: string | null;
  starting_city_coordinates?: string | null;
  end_city?: string | null;
  end_city_coordinates?: string | null;
}

export interface MapFavoriteData {
  id: number;
  place_id: string;
  place_name: string;
  place_address: string;
  place_rating: number;
  place_lat: number;
  place_lng: number;
  place_types: string[];
  created_at: string;
}

interface MapData {
  trips: MapTripData[];
  favorites: MapFavoriteData[];
  lastUpdated: number;
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

export function useMapData() {
  const [mapData, setMapData] = useState<MapData>({
    trips: [],
    favorites: [],
    lastUpdated: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all map data with caching
  const fetchMapData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const cacheKey = `map-data-${user.id}`;
      
      const data = await getOrSetCache(
        tripCache,
        cacheKey,
        async () => {
          console.log('Fetching fresh map data from server...');
          
          // Fetch all trip types in parallel
          const [zapoutResponse, zaproadResponse, zaptripResponse, favoritesResponse] = await Promise.all([
            supabase
              .from('zapout_data')
              .select('id, title, description, coordinates, location, created_at, updated_at')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false }),
            
            supabase
              .from('zaproad_data')
              .select('id, title, description, starting_city_coordinates, starting_city, end_city, end_city_coordinates, created_at, updated_at')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false }),
            
            supabase
              .from('trips')
              .select('id, title, description, coordinates, location, created_at, updated_at')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false }),

            supabase
              .from('favorites')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
          ]);

          // Check for errors
          if (zapoutResponse.error) throw zapoutResponse.error;
          if (zaproadResponse.error) throw zaproadResponse.error;
          if (zaptripResponse.error) throw zaptripResponse.error;
          if (favoritesResponse.error) throw favoritesResponse.error;

          // Process trip data
          const trips: MapTripData[] = [
            ...(zapoutResponse.data || []).map(trip => ({
              ...trip,
              type: 'zapout' as const,
              coordinates: parseCoordinates(trip.coordinates)
            })),
            ...(zaproadResponse.data || []).map(trip => ({
              ...trip,
              type: 'zaproad' as const,
              coordinates: parseCoordinates(trip.end_city_coordinates || trip.starting_city_coordinates),
              location: trip.end_city || trip.starting_city,
              starting_city: trip.starting_city,
              starting_city_coordinates: trip.starting_city_coordinates,
              end_city: trip.end_city,
              end_city_coordinates: trip.end_city_coordinates
            })),
            ...(zaptripResponse.data || []).map(trip => ({
              ...trip,
              type: 'zaptrip' as const,
              coordinates: parseCoordinates(trip.coordinates)
            }))
          ];

          const result = {
            trips,
            favorites: favoritesResponse.data || [],
            lastUpdated: Date.now()
          };

          console.log('Map data fetched successfully:', result);
          return result;
        },
        { ttl: 1000 * 60 * 5, force: forceRefresh }
      );

      setMapData(data);
      return data;
    } catch (err: any) {
      console.error('Error fetching map data:', err);
      setError(err.message || 'Failed to fetch map data');
      toast({
        title: 'Error',
        description: 'Failed to load map data. Please try again.',
        variant: 'destructive',
      });
      return mapData;
    } finally {
      setLoading(false);
    }
  }, [mapData, toast]);

  // Fetch incremental data (for real-time updates)
  const fetchIncrementalData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const cacheKey = `map-data-${user.id}`;
      
      // Fetch fresh data from server
      const [zapoutResponse, zaproadResponse, zaptripResponse, favoritesResponse] = await Promise.all([
        supabase
          .from('zapout_data')
          .select('id, title, description, coordinates, location, created_at, updated_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('zaproad_data')
          .select('id, title, description, starting_city_coordinates, starting_city, end_city, end_city_coordinates, created_at, updated_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('trips')
          .select('id, title, description, coordinates, location, created_at, updated_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('favorites')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      // Check for errors
      if (zapoutResponse.error) throw zapoutResponse.error;
      if (zaproadResponse.error) throw zaproadResponse.error;
      if (zaptripResponse.error) throw zaptripResponse.error;
      if (favoritesResponse.error) throw favoritesResponse.error;

      // Process new trip data
      const newTrips: MapTripData[] = [
        ...(zapoutResponse.data || []).map(trip => ({
          ...trip,
          type: 'zapout' as const,
          coordinates: parseCoordinates(trip.coordinates)
        })),
        ...(zaproadResponse.data || []).map(trip => ({
          ...trip,
          type: 'zaproad' as const,
          coordinates: parseCoordinates(trip.end_city_coordinates || trip.starting_city_coordinates),
          location: trip.end_city || trip.starting_city,
          starting_city: trip.starting_city,
          starting_city_coordinates: trip.starting_city_coordinates,
          end_city: trip.end_city,
          end_city_coordinates: trip.end_city_coordinates
        })),
        ...(zaptripResponse.data || []).map(trip => ({
          ...trip,
          type: 'zaptrip' as const,
          coordinates: parseCoordinates(trip.coordinates)
        }))
      ];

      // Merge new data with existing data
      const updatedTrips = [...mapData.trips];
      const updatedFavorites = [...mapData.favorites];

      // Update existing trips or add new ones
      newTrips.forEach(newTrip => {
        const existingIndex = updatedTrips.findIndex(trip => trip.id === newTrip.id);
        if (existingIndex >= 0) {
          updatedTrips[existingIndex] = newTrip;
        } else {
          updatedTrips.unshift(newTrip); // Add new trips at the beginning
        }
      });

      // Add new favorites
      (favoritesResponse.data || []).forEach(newFavorite => {
        const existingIndex = updatedFavorites.findIndex(fav => fav.id === newFavorite.id);
        if (existingIndex === -1) {
          updatedFavorites.unshift(newFavorite);
        }
      });

      const updatedData = {
        trips: updatedTrips,
        favorites: updatedFavorites,
        lastUpdated: Date.now()
      };

      // Update cache
      tripCache.set(cacheKey, updatedData, { ttl: 1000 * 60 * 5 });
      setMapData(updatedData);

      return updatedData;
    } catch (err) {
      console.error('Error fetching incremental data:', err);
      // Fall back to full refresh on error
      return fetchMapData(true);
    }
  }, [mapData, fetchMapData]);

  // Invalidate cache when new trip is created
  const invalidateCache = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const cacheKey = `map-data-${user.id}`;
        tripCache.delete(cacheKey);
        console.log('Map data cache invalidated');
      }
    } catch (err) {
      console.error('Error invalidating cache:', err);
    }
  }, []);

  // Remove trip from cache
  const removeTripFromCache = useCallback((tripId: string) => {
    setMapData(prev => ({
      ...prev,
      trips: prev.trips.filter(trip => trip.id !== tripId)
    }));
  }, []);

  // Remove favorite from cache
  const removeFavoriteFromCache = useCallback((favoriteId: number) => {
    setMapData(prev => ({
      ...prev,
      favorites: prev.favorites.filter(fav => fav.id !== favoriteId)
    }));
  }, []);

  // Debounced refresh function to prevent multiple rapid refreshes
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      console.log('Debounced refresh triggered');
      fetchMapData(true);
    }, 100); // 100ms debounce
  }, [fetchMapData]);

  // Listen for cache invalidation events
  useEffect(() => {
    const unsubscribeTripCreated = cacheEventManager.subscribe(CACHE_EVENTS.TRIP_CREATED, () => {
      console.log('Trip created event received, refreshing map data...');
      debouncedRefresh();
    });

    const unsubscribeMapDataInvalidated = cacheEventManager.subscribe(CACHE_EVENTS.MAP_DATA_INVALIDATED, () => {
      console.log('Map data invalidated event received, refreshing map data...');
      debouncedRefresh();
    });

    const unsubscribeFavoritesInvalidated = cacheEventManager.subscribe(CACHE_EVENTS.FAVORITES_INVALIDATED, () => {
      console.log('Favorites invalidated event received, refreshing map data...');
      debouncedRefresh();
    });

    const unsubscribeFavoriteAdded = cacheEventManager.subscribe(CACHE_EVENTS.FAVORITE_ADDED, () => {
      console.log('Favorite added event received, refreshing map data...');
      debouncedRefresh();
    });

    const unsubscribeFavoriteRemoved = cacheEventManager.subscribe(CACHE_EVENTS.FAVORITE_REMOVED, () => {
      console.log('Favorite removed event received, refreshing map data...');
      debouncedRefresh();
    });

    // Cleanup subscriptions and timeout
    return () => {
      unsubscribeTripCreated();
      unsubscribeMapDataInvalidated();
      unsubscribeFavoritesInvalidated();
      unsubscribeFavoriteAdded();
      unsubscribeFavoriteRemoved();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [debouncedRefresh]);

  // Initialize data on mount
  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  return {
    mapData,
    loading,
    error,
    fetchMapData,
    fetchIncrementalData,
    invalidateCache,
    removeTripFromCache,
    removeFavoriteFromCache,
    refreshData: () => fetchMapData(true)
  };
} 