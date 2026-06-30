// Service Worker for offline support and caching
const CACHE_NAME = 'finance-tracker-v1';
const STATIC_CACHE_NAME = 'finance-tracker-static-v1';
const DATA_CACHE_NAME = 'finance-tracker-data-v1';

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/transactions',
  '/budgets',
  '/accounts',
  '/reports',
  '/settings',
  '/manifest.json',
  // Add other static assets as needed
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/transactions',
  '/api/accounts',
  '/api/budgets',
  '/api/stats',
];

// Network strategies
const strategies = {
  // Cache first for static assets
  cacheFirst: async (request) => {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      // Update cache in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      });
      return cached;
    }
    
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      // Return offline fallback if available
      return getOfflineFallback(request);
    }
  },

  // Network first for API calls
  networkFirst: async (request) => {
    const cache = await caches.open(DATA_CACHE_NAME);
    
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
      return getOfflineFallback(request);
    }
  },

  // Stale while revalidate for dynamic content
  staleWhileRevalidate: async (request) => {
    const cache = await caches.open(DATA_CACHE_NAME);
    const cached = await cache.match(request);
    
    // Always try to fetch in background
    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => null);
    
    if (cached) {
      return cached;
    }
    
    try {
      return await fetchPromise;
    } catch (error) {
      return getOfflineFallback(request);
    }
  }
};

// Get offline fallback response
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return caches.match('/offline.html') || new Response(
      '<html><body><h1>Offline</h1><p>You are currently offline. Please check your connection.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
  
  // Return empty JSON for API requests
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Offline', data: null }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    });
  }
  
  return new Response('Offline', { status: 503 });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // Get all pending actions from IndexedDB
  const pendingActions = await getPendingActions();
  
  for (const action of pendingActions) {
    try {
      // Try to sync the action
      await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body
      });
      
      // Remove from pending actions on success
      await removePendingAction(action.id);
    } catch (error) {
      console.error('Failed to sync action:', error);
    }
  }
}

// IndexedDB helpers for offline queue
async function getPendingActions() {
  return new Promise((resolve) => {
    const request = indexedDB.open('FinanceTrackerOffline', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingActions'], 'readonly');
      const store = transaction.objectStore('pendingActions');
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => resolve(getRequest.result || []);
    };
    
    request.onerror = () => resolve([]);
  });
}

async function removePendingAction(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('FinanceTrackerOffline', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingActions'], 'readwrite');
      const store = transaction.objectStore('pendingActions');
      store.delete(id);
      
      transaction.oncomplete = () => resolve();
    };
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.data,
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action) {
    // Handle specific action clicks
    handleNotificationAction(event.action, event.notification.data);
  } else {
    // Handle notification click
    clients.openWindow(event.notification.data.url || '/dashboard');
  }
});

function handleNotificationAction(action, data) {
  switch (action) {
    case 'view-transaction':
      clients.openWindow(`/transactions?id=${data.transactionId}`);
      break;
    case 'view-budget':
      clients.openWindow(`/budgets?id=${data.budgetId}`);
      break;
    case 'dismiss':
      // Just close the notification
      break;
    default:
      clients.openWindow('/dashboard');
  }
}

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DATA_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages
  clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests and external requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }
  
  // Route to appropriate strategy
  if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
    event.respondWith(strategies.cacheFirst(request));
  } else if (API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
    event.respondWith(strategies.networkFirst(request));
  } else if (request.mode === 'navigate') {
    event.respondWith(strategies.staleWhileRevalidate(request));
  }
});

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    updateCache(event.data.url);
  }
});

async function updateCache(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(url, response);
    }
  } catch (error) {
    console.error('Failed to update cache:', error);
  }
}
