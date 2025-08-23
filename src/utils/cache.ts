import { LRUCache } from 'lru-cache';

// Cache for API responses
const apiCache = new LRUCache<string, any>({
  max: 500, // Maximum number of items to store
  ttl: 1000 * 60 * 5, // Time to live: 5 minutes
  updateAgeOnGet: true, // Update the "recently used" status on read
});

// Cache for user data
const userCache = new LRUCache<string, any>({
  max: 100, // Maximum number of users to cache
  ttl: 1000 * 60 * 15, // Time to live: 15 minutes
  updateAgeOnGet: true,
});

// Cache for blog data
const blogCache = new LRUCache<string, any>({
  max: 200, // Maximum number of blog entries
  ttl: 1000 * 60 * 30, // Time to live: 30 minutes
  updateAgeOnGet: true,
});

// Cache for trip data
const tripCache = new LRUCache<string, any>({
  max: 300, // Maximum number of trips
  ttl: 1000 * 60 * 10, // Time to live: 10 minutes
  updateAgeOnGet: true,
});

// Cache for homepage trip creation flow
const homepageCreateTripCache = new LRUCache<string, any>({
  max: 50, // Maximum number of homepage trip creation flows
  ttl: 1000 * 60 * 2, // Time to live: 2 minutes (longer to persist through entire flow)
  updateAgeOnGet: true,
});

export interface CacheOptions {
  ttl?: number;
  force?: boolean;
}

// Event-based cache invalidation system
class CacheEventManager {
  private listeners: Map<string, Set<() => void>> = new Map();

  subscribe(event: string, callback: () => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  emit(event: string) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in cache event callback:', error);
        }
      });
    }
  }
}

// Global cache event manager
export const cacheEventManager = new CacheEventManager();

// Cache invalidation events
export const CACHE_EVENTS = {
  TRIP_CREATED: 'trip_created',
  TRIP_UPDATED: 'trip_updated',
  TRIP_DELETED: 'trip_deleted',
  FAVORITE_ADDED: 'favorite_added',
  FAVORITE_REMOVED: 'favorite_removed',
  FAVORITE_UPDATED: 'favorite_updated',
  MAP_DATA_INVALIDATED: 'map_data_invalidated',
  CHECKPOINTS_INVALIDATED: 'checkpoints_invalidated',
  FAVORITES_INVALIDATED: 'favorites_invalidated',
  HOMEPAGE_TRIP_CREATION_STARTED: 'homepage_trip_creation_started',
  HOMEPAGE_TRIP_CREATION_COMPLETED: 'homepage_trip_creation_completed',
} as const;

/**
 * Generic function to get or set cached data
 * @param cache The LRUCache instance to use
 * @param key The cache key
 * @param fetchFn The function to fetch data if not in cache
 * @param options Cache options
 */
async function getOrSetCache<T>(
  cache: LRUCache<string, T>,
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { force = false, ttl } = options;

  // Return cached data if available and not forced refresh
  if (!force) {
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
  }

  // Fetch fresh data
  const data = await fetchFn();
  cache.set(key, data, { ttl });
  return data;
}

/**
 * Invalidate all trip-related caches for a user
 */
export const invalidateTripCaches = async (userId: string) => {
  try {
    // Clear specific cache keys
    const cacheKeys = [
      `map-data-${userId}`,
      `trips-${userId}`,
    ];
    
    cacheKeys.forEach(key => {
      tripCache.delete(key);
    });
    
    // Clear all checkpoint caches
    const allKeys = Array.from(tripCache.keys());
    allKeys.forEach(key => {
      if (key.includes('-checkpoints-')) {
        tripCache.delete(key);
      }
    });
    
    // Emit events to notify all components
    cacheEventManager.emit(CACHE_EVENTS.TRIP_CREATED);
    cacheEventManager.emit(CACHE_EVENTS.MAP_DATA_INVALIDATED);
    cacheEventManager.emit(CACHE_EVENTS.CHECKPOINTS_INVALIDATED);
    
    console.log('All trip-related caches invalidated for user:', userId);
  } catch (error) {
    console.error('Error invalidating trip caches:', error);
  }
};

/**
 * Invalidate all favorite-related caches for a user
 */
export const invalidateFavoriteCaches = async (userId: string) => {
  try {
    // Clear specific cache keys
    const cacheKeys = [
      `map-data-${userId}`,
      `favorites-${userId}`,
    ];
    
    cacheKeys.forEach(key => {
      tripCache.delete(key);
    });
    
    // Emit events to notify all components
    cacheEventManager.emit(CACHE_EVENTS.FAVORITES_INVALIDATED);
    cacheEventManager.emit(CACHE_EVENTS.MAP_DATA_INVALIDATED);
    
    console.log('All favorite-related caches invalidated for user:', userId);
  } catch (error) {
    console.error('Error invalidating favorite caches:', error);
  }
};

/**
 * Invalidate all caches for a user (trips and favorites)
 */
export const invalidateAllCaches = async (userId: string) => {
  try {
    // Clear specific cache keys
    const cacheKeys = [
      `map-data-${userId}`,
      `trips-${userId}`,
      `favorites-${userId}`,
    ];
    
    cacheKeys.forEach(key => {
      tripCache.delete(key);
    });
    
    // Clear all checkpoint caches
    const allKeys = Array.from(tripCache.keys());
    allKeys.forEach(key => {
      if (key.includes('-checkpoints-')) {
        tripCache.delete(key);
      }
    });
    
    // Emit events to notify all components
    cacheEventManager.emit(CACHE_EVENTS.TRIP_CREATED);
    cacheEventManager.emit(CACHE_EVENTS.FAVORITES_INVALIDATED);
    cacheEventManager.emit(CACHE_EVENTS.MAP_DATA_INVALIDATED);
    cacheEventManager.emit(CACHE_EVENTS.CHECKPOINTS_INVALIDATED);
    
    console.log('All caches invalidated for user:', userId);
  } catch (error) {
    console.error('Error invalidating all caches:', error);
  }
};

/**
 * Invalidate specific cache by key
 */
export const invalidateCacheByKey = (cache: LRUCache<string, any>, key: string) => {
  cache.delete(key);
  console.log(`Cache invalidated for key: ${key}`);
};

/**
 * Clear all caches
 */
export const clearAllCaches = () => {
  apiCache.clear();
  userCache.clear();
  blogCache.clear();
  tripCache.clear();
  console.log('All caches cleared');
};

/**
 * Set homepage trip creation cache
 */
export const setHomepageCreateTripCache = (userId: string, activityData: any) => {
  const key = `homepage-create-trip-${userId}`;
  const cacheData = {
    ...activityData,
    timestamp: Date.now(),
    userId,
  };
  homepageCreateTripCache.set(key, cacheData);
  
  // Emit event for any listeners
  cacheEventManager.emit(CACHE_EVENTS.HOMEPAGE_TRIP_CREATION_STARTED);
  
  return key;
};

/**
 * Get homepage trip creation cache
 */
export const getHomepageCreateTripCache = (userId: string) => {
  const key = `homepage-create-trip-${userId}`;
  const cached = homepageCreateTripCache.get(key);
  return cached;
};

/**
 * Remove homepage trip creation cache
 */
export const removeHomepageCreateTripCache = (userId: string) => {
  const key = `homepage-create-trip-${userId}`;
  const existed = homepageCreateTripCache.has(key);
  homepageCreateTripCache.delete(key);
  
  if (existed) {
    // Emit event for any listeners
    cacheEventManager.emit(CACHE_EVENTS.HOMEPAGE_TRIP_CREATION_COMPLETED);
  }
  
  return existed;
};

/**
 * Check if homepage trip creation cache exists
 */
export const hasHomepageCreateTripCache = (userId: string) => {
  const key = `homepage-create-trip-${userId}`;
  const hasCache = homepageCreateTripCache.has(key);
  
  // Also check for temporary cache in sessionStorage
  let hasTempCache = false;
  try {
    const tempCache = sessionStorage.getItem('homepage-create-trip-temp');
    hasTempCache = !!tempCache;
    if (hasTempCache && hasCache === false) {
      // Transfer temp cache to permanent cache for authenticated user
      const tempData = JSON.parse(tempCache);
      setHomepageCreateTripCache(userId, { ...tempData, transferredFromTemp: true });
      // Remove temp cache
      sessionStorage.removeItem('homepage-create-trip-temp');
      return true;
    }
  } catch (error) {
    // Silently handle temp cache errors
  }
  
  return hasCache || hasTempCache;
};

export {
  apiCache,
  userCache,
  blogCache,
  tripCache,
  homepageCreateTripCache,
  getOrSetCache,
}; 