// Service Worker Configuration
const CONFIG = {
  DEBUG: false,
  VERSION: '2.0.2',
  CACHE_NAME: 'zaparound-v2-' + new Date().toISOString().split('T')[0],
  API_CACHE_NAME: 'zaparound-api-v2-' + new Date().toISOString().split('T')[0],
  STATIC_CACHE_NAME: 'zaparound-static-v2-' + new Date().toISOString().split('T')[0],
  DYNAMIC_CACHE_NAME: 'zaparound-dynamic-v2-' + new Date().toISOString().split('T')[0],
  MAX_DYNAMIC_CACHE_ITEMS: 100,
  CACHE_EXPIRATION: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Critical assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/favicon.ico',
  '/favicon-96x96.png',
  '/apple-touch-icon.png',
  // Add other critical assets
];

// Service Worker Strategies
const STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  NETWORK_ONLY: 'network-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Cache names
const CACHE_NAMES = {
  STATIC: 'static-assets-v1',
  DYNAMIC: 'dynamic-content-v1',
  PAGES: 'pages-v1'
};

// Helper function for logging
const log = (...args) => {
  if (CONFIG.DEBUG) {
    console.log('[Service Worker]', ...args);
  }
};

// Helper function to clean old caches
const cleanOldCaches = async () => {
  const cacheNames = await caches.keys();
  const validCacheNames = [
    CONFIG.CACHE_NAME,
    CONFIG.API_CACHE_NAME,
    CONFIG.STATIC_CACHE_NAME,
    CONFIG.DYNAMIC_CACHE_NAME,
  ];
  
  return Promise.all(
    cacheNames.map(cacheName => {
      if (!validCacheNames.includes(cacheName)) {
        log('Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      }
    })
  );
};

// Helper function to limit cache size
const limitCacheSize = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await limitCacheSize(cacheName, maxItems);
  }
};

// Helper function to determine if a response is valid
const isResponseValid = (response) => {
  if (!response) return false;
  
  const fetchDate = response.headers.get('date');
  if (!fetchDate) return true;
  
  const age = Date.now() - new Date(fetchDate).getTime();
  return age < CONFIG.CACHE_EXPIRATION;
};

// Helper function to determine caching strategy
const getStrategy = (request) => {
  const url = new URL(request.url);
  
  // API calls
  if (url.pathname.startsWith('/api')) {
    return STRATEGIES.NETWORK_FIRST;
  }
  
  // Static assets - Use Cache First with Stale While Revalidate for images
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
    return STRATEGIES.CACHE_FIRST;
  }
  
  // Critical assets - Use Cache First
  if (url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)) {
    return STRATEGIES.CACHE_FIRST;
  }
  
  // HTML pages - Always use network first for navigation requests
  if (request.mode === 'navigate') {
    return STRATEGIES.NETWORK_FIRST;
  }
  
  // Supabase API calls
  if (url.hostname.includes('supabase')) {
    return STRATEGIES.NETWORK_ONLY;
  }
  
  return STRATEGIES.NETWORK_FIRST;
};

// Network First strategy with timeout
const networkFirst = async (request) => {
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 3000)
      ),
    ]);
    
    const cache = await caches.open(CONFIG.CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    log('Network request failed, falling back to cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse && isResponseValid(cachedResponse)) {
      return cachedResponse;
    }
    
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
};

// Cache First strategy with background update
const cacheFirst = async (request) => {
  const cache = await caches.open(CONFIG.STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && isResponseValid(cachedResponse)) {
    // Update cache in background
    fetch(request)
      .then(response => cache.put(request, response))
      .catch(error => log('Background cache update failed:', error));
      
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    throw error;
  }
};

// Stale While Revalidate strategy with improved error handling
const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CONFIG.DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  try {
    const fetchPromise = fetch(request).then(async networkResponse => {
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    });
    
    return cachedResponse || fetchPromise;
  } catch (error) {
    console.error('Cache operation failed:', error);
    return cachedResponse || new Response('Network error', { status: 500 });
  }
};

// Network Only strategy
const networkOnly = async (request) => {
  return fetch(request);
};

// Install event handler
self.addEventListener('install', event => {
  log('Installing...');
  
  event.waitUntil(
    Promise.all([
      // Precache critical assets
      caches.open(CONFIG.STATIC_CACHE_NAME).then(cache => {
        log('Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

// Activate event handler
self.addEventListener('activate', event => {
  log('Activating new service worker version:', CONFIG.VERSION);
  
  // Force aggressive cleanup of any existing caches
  const forceCacheCleanup = async () => {
    const cacheNames = await caches.keys();
    log('Found caches to clean:', cacheNames);
    
    return Promise.all(
      cacheNames.map(cacheName => {
        // Keep only current version caches
        if (!cacheName.includes(CONFIG.VERSION) && cacheName.includes('zaparound')) {
          log('Deleting outdated cache:', cacheName);
          return caches.delete(cacheName);
        }
      })
    );
  };
  
  event.waitUntil(
    Promise.all([
      // Force cleanup of all old caches
      forceCacheCleanup(),
      // Aggressively claim clients to update them
      self.clients.claim(),
      // Notify all clients about the activation
      self.clients.matchAll().then(clients => {
        log(`Notifying ${clients.length} clients about activation`);
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CONFIG.VERSION,
            needsRefresh: true // Force refresh for all clients
          });
        });
      }),
    ])
  );
});

// Fetch event handler
self.addEventListener('fetch', event => {
  const strategy = getStrategy(event.request);
  
  event.respondWith(
    (async () => {
      try {
        switch (strategy) {
          case STRATEGIES.CACHE_FIRST:
            return await cacheFirst(event.request);
          case STRATEGIES.NETWORK_FIRST:
            return await networkFirst(event.request);
          case STRATEGIES.NETWORK_ONLY:
            return await networkOnly(event.request);
          case STRATEGIES.STALE_WHILE_REVALIDATE:
            return await staleWhileRevalidate(event.request);
          default:
            return await networkFirst(event.request);
        }
      } catch (error) {
        log('Fetch failed:', error);
        
        // Return offline fallback for navigation
        if (event.request.mode === 'navigate') {
          const offlineResponse = await caches.match('/offline.html');
          if (offlineResponse) {
            return offlineResponse;
          }
        }
        
        throw error;
      }
    })()
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-trips') {
    event.waitUntil(syncTrips());
  }
});

// Push notification handler
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/apple-touch-icon.png',
    badge: '/favicon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/favicon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon-96x96.png'
      },
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('ZapAround Update', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message event handler for communication with tabs
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle ping from client to check if service worker is active
  if (event.data && event.data.type === 'PING') {
    event.ports[0].postMessage({
      type: 'PONG',
      version: CONFIG.VERSION
    });
  }
});

// Background sync function for trips
async function syncTrips() {
  try {
    const cache = await caches.open(CONFIG.API_CACHE_NAME);
    const requests = await cache.keys();
    
    await Promise.all(
      requests.map(async request => {
        try {
          const response = await fetch(request);
          await cache.put(request, response);
        } catch (error) {
          log('Failed to sync request:', error);
        }
      })
    );
    
    // Notify clients about successful sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now(),
      });
    });
  } catch (error) {
    log('Sync failed:', error);
    throw error;
  }
}
