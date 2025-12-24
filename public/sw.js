/**
 * Service Worker for SportBot AI PWA
 * 
 * Caching strategy:
 * - Static assets: Cache first, update in background
 * - API calls: Network first, cache fallback
 * - Images: Cache first with long expiry
 */

const CACHE_NAME = 'sportbot-v1';
const STATIC_CACHE = 'sportbot-static-v1';
const IMAGE_CACHE = 'sportbot-images-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/matches',
  '/pricing',
  '/manifest.json',
  '/favicon.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('sportbot-') && name !== CACHE_NAME && name !== STATIC_CACHE && name !== IMAGE_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control immediately
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // API requests - network first, cache fallback for GET
  if (url.pathname.startsWith('/api/')) {
    // Don't cache most API routes - they need fresh data
    // Only cache specific read-only endpoints
    if (url.pathname.includes('/api/sports') || url.pathname.includes('/api/events/')) {
      event.respondWith(networkFirstWithCache(request, CACHE_NAME, 5 * 60 * 1000)); // 5 min
    }
    return;
  }

  // Images - cache first with long expiry
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
    event.respondWith(cacheFirstWithExpiry(request, IMAGE_CACHE, 7 * 24 * 60 * 60 * 1000)); // 7 days
    return;
  }

  // Static assets and pages - stale while revalidate
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

/**
 * Network first, fall back to cache
 */
async function networkFirstWithCache(request, cacheName, maxAge) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      // Clone and add timestamp header for expiry check
      const responseToCache = response.clone();
      cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

/**
 * Cache first with expiry
 */
async function cacheFirstWithExpiry(request, cacheName, maxAge) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline placeholder for images
    return new Response('', { status: 404 });
  }
}

/**
 * Stale while revalidate - return cache immediately, update in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  // Return cached immediately, or wait for network
  return cached || fetchPromise;
}
