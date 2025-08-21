import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from './use-toast';
import { cacheEventManager, CACHE_EVENTS, invalidateFavoriteCaches } from '../utils/cache';

export interface FavoritePlace {
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

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoritePlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch favorites from database
  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFavorites([]);
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFavorites(data || []);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      setError(err.message || 'Failed to fetch favorites');
      toast({
        title: 'Error',
        description: 'Failed to load favorites. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Add favorite
  const addFavorite = useCallback(async (favoriteData: Omit<FavoritePlace, 'id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Login Required',
          description: 'Please log in to save favorites.',
          variant: 'destructive',
        });
        return false;
      }

      const { data, error } = await supabase
        .from('favorites')
        .insert([{
          user_id: user.id,
          ...favoriteData
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setFavorites(prev => [data, ...prev]);

      // Emit cache invalidation events
      cacheEventManager.emit(CACHE_EVENTS.FAVORITE_ADDED);
      await invalidateFavoriteCaches(user.id);

      toast({
        title: 'Added to Favorites',
        description: 'Place added to your favorites.',
      });

      return true;
    } catch (err: any) {
      console.error('Error adding favorite:', err);
      toast({
        title: 'Error',
        description: 'Failed to add favorite.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Remove favorite
  const removeFavorite = useCallback(async (favoriteId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found for removing favorite');
        return false;
      }

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      // Update local state
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));

      // Emit cache invalidation events
      cacheEventManager.emit(CACHE_EVENTS.FAVORITE_REMOVED);
      await invalidateFavoriteCaches(user.id);

      toast({
        title: 'Removed from Favorites',
        description: 'Place removed from your favorites.',
      });

      return true;
    } catch (err: any) {
      console.error('Error removing favorite:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove favorite.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Check if a place is favorited
  const isFavorited = useCallback((placeId: string) => {
    return favorites.some(fav => fav.place_id === placeId);
  }, [favorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (favoriteData: Omit<FavoritePlace, 'id' | 'created_at'>) => {
    const existingFavorite = favorites.find(fav => fav.place_id === favoriteData.place_id);
    
    if (existingFavorite) {
      return await removeFavorite(existingFavorite.id);
    } else {
      return await addFavorite(favoriteData);
    }
  }, [favorites, addFavorite, removeFavorite]);

  // Listen for cache invalidation events
  useEffect(() => {
    const unsubscribeFavoriteAdded = cacheEventManager.subscribe(CACHE_EVENTS.FAVORITE_ADDED, () => {
      console.log('Favorite added event received, refreshing favorites...');
      fetchFavorites();
    });

    const unsubscribeFavoriteRemoved = cacheEventManager.subscribe(CACHE_EVENTS.FAVORITE_REMOVED, () => {
      console.log('Favorite removed event received, refreshing favorites...');
      fetchFavorites();
    });

    const unsubscribeFavoritesInvalidated = cacheEventManager.subscribe(CACHE_EVENTS.FAVORITES_INVALIDATED, () => {
      console.log('Favorites invalidated event received, refreshing favorites...');
      fetchFavorites();
    });

    return () => {
      unsubscribeFavoriteAdded();
      unsubscribeFavoriteRemoved();
      unsubscribeFavoritesInvalidated();
    };
  }, [fetchFavorites]);

  // Initialize favorites on mount
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    refreshFavorites: fetchFavorites,
  };
} 