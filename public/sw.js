/* GoalUp Service Worker */
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `goalup-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `goalup-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

const STATIC_ASSETS = [
  '/',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/placeholder-logo.png',
  '/images/GoalUp.jpg',
  '/styles/globals.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GET requests
  if (request.method !== 'GET') return;

  // Navigation requests: Network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Static assets: Stale-while-revalidate
  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isAsset = /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?|ttf|eot)$/i.test(url.pathname);

  if (isSameOrigin && isAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Default: try network, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
