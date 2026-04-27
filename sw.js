const CACHE_NAME = 'sanjeevani-v1.0.0';
const OFFLINE_URL = '/scan.html';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/scan.html',
  '/register.html',
  '/dashboard.html',
  '/hotspot.html',
  '/assets/css/main.css',
  '/assets/js/app.js',
  '/assets/js/crypto.js',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Rajdhani:wght@400;500;600;700&display=swap'
];

// Install event — cache all essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching essential files');
      return cache.addAll(PRECACHE_URLS.map(url => {
        return new Request(url, { mode: 'no-cors' });
      })).catch(() => {
        // Partial cache failure is acceptable
        console.warn('[SW] Some resources could not be cached');
      });
    })
  );
  self.skipWaiting();
});

// Activate event — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event — network first, cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, show scan page offline
          if (event.request.destination === 'document') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});

// Background sync for SOS alerts
self.addEventListener('sync', (event) => {
  if (event.tag === 'sos-sync') {
    event.waitUntil(sendPendingSOS());
  }
});

async function sendPendingSOS() {
  const db = await openDB();
  const pendingAlerts = await db.getAll('pendingSOS');
  for (const alert of pendingAlerts) {
    try {
      await fetch('/api/sos', {
        method: 'POST',
        body: JSON.stringify(alert),
        headers: { 'Content-Type': 'application/json' }
      });
      await db.delete('pendingSOS', alert.id);
    } catch (e) {
      console.warn('[SW] SOS retry failed, will try again');
    }
  }
}
