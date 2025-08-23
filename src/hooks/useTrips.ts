import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { tripCache, getOrSetCache, cacheEventManager, CACHE_EVENTS } from '@/utils/cache';
import { Trip } from '@/types/trip';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getTrips = async (userId: string) => {
    try {
      setLoading(true);
      
      const fetchedTrips = await getOrSetCache(
        tripCache,
        `trips-${userId}`,
        async () => {
          // First get regular trips
          const { data: tripData, error: tripError } = await supabase
            .from('trips')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (tripError) {
            throw tripError;
          }

          // Then get ZapOut trips
          const { data: zapOutData, error: zapOutError } = await supabase
            .from('zapout_data')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (zapOutError) {
            throw zapOutError;
          }
          
          // Then get ZapRoad trips
          const { data: zapRoadData, error: zapRoadError } = await supabase
            .from('zaproad_data')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
            
          if (zapRoadError) {
            throw zapRoadError;
          }

          // Transform ZapOut trips to match Trip interface
          const zapOutTrips = (zapOutData || []).map(trip => ({
            ...trip,
            trip_type: 'ZapOut' as const
          }));

          // Transform ZapRoad trips to match Trip interface
          const zapRoadTrips = (zapRoadData || []).map(trip => ({
            ...trip,
            trip_type: 'ZapRoad' as const
          }));

          // Regular trips already match the interface
          const regularTrips = (tripData || []).map(trip => ({
            ...trip,
            trip_type: 'ZapTrip' as const
          }));

          // Combine all trips
          const allTrips = [...regularTrips, ...zapOutTrips, ...zapRoadTrips];
          
          // Sort by created_at
          allTrips.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return dateB.getTime() - dateA.getTime();
          });

          return allTrips;
        },
        { ttl: 1000 * 60 * 5 } // 5 minutes TTL
      );

      // Set the trips in state after fetching
      setTrips(fetchedTrips);
      return fetchedTrips;
    } catch (error) {
      console.error("Error fetching trips:", error);
      setTrips([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const refreshTrips = async (userId: string) => {
    // Force refresh from server
    const freshTrips = await getOrSetCache(
      tripCache,
      `trips-${userId}`,
      () => getTrips(userId),
      { force: true }
    );
    setTrips(freshTrips);
    return freshTrips;
  };

  const deleteTrip = async (tripId: string) => {
    try {
      console.log("useTrips: Attempting to delete trip with ID:", tripId);
      
      // First, find the trip in our local state to determine its type
      const tripToDelete = trips.find(trip => trip.id === tripId);
      
      if (!tripToDelete) {
        console.error("Trip not found in local state:", tripId);
        throw new Error("Trip not found");
      }
      
      console.log("Found trip to delete:", tripToDelete);
      console.log("Trip type:", tripToDelete.trip_type);
      
      if (tripToDelete.trip_type === 'ZapOut') {
        console.log("Deleting ZapOut trip from zapout_data table");
        const { error: zapOutError } = await supabase
          .from('zapout_data')
          .delete()
          .eq('id', tripId);
          
        if (zapOutError) {
          console.error("Error deleting ZapOut trip:", zapOutError);
          throw zapOutError;
        }
      } else if (tripToDelete.trip_type === 'ZapRoad') {
        console.log("Deleting ZapRoad trip from zaproad_data table");
        const { error: zapRoadError } = await supabase
          .from('zaproad_data')
          .delete()
          .eq('id', tripId);
          
        if (zapRoadError) {
          console.error("Error deleting ZapRoad trip:", zapRoadError);
          throw zapRoadError;
        }
      } else {
        console.log("Deleting regular trip from trips table");
        const { error: tripError } = await supabase
          .from('trips')
          .delete()
          .eq('id', tripId);
          
        if (tripError) {
          console.error("Error deleting regular trip:", tripError);
          throw tripError;
        }
      }

      // Clear the cache for this user's trips
      const userId = tripToDelete.user_id;
      tripCache.delete(`trips-${userId}`);
      
      // Update local state
      setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
      
      return true;
    } catch (error) {
      console.error("Error in deleteTrip:", error);
      throw error;
    }
  };

  // Listen for cache invalidation events
  useEffect(() => {
    const unsubscribeTripCreated = cacheEventManager.subscribe(CACHE_EVENTS.TRIP_CREATED, async () => {
      console.log('Trip created event received, refreshing trips...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await refreshTrips(user.id);
        }
      } catch (error) {
        console.error('Error refreshing trips after trip creation:', error);
      }
    });

    const unsubscribeTripDeleted = cacheEventManager.subscribe(CACHE_EVENTS.TRIP_DELETED, async () => {
      console.log('Trip deleted event received, refreshing trips...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await refreshTrips(user.id);
        }
      } catch (error) {
        console.error('Error refreshing trips after trip deletion:', error);
      }
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeTripCreated();
      unsubscribeTripDeleted();
    };
  }, []);

  return {
    trips,
    loading,
    getTrips,
    refreshTrips,
    deleteTrip
  };
}
