const CACHE_NAME = '7media-cache-v1'
const STATIC_ASSETS = [
  '/',
  '/movies',
  '/series',
  '/anime',
  '/my-list',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/og-image.png',
  '/web-app-manifest-512x512.png',
]

// 1. Install Event: Cache Core App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {})
    })
  )
  self.skipWaiting()
})

// 2. Activate Event: Clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// 3. Fetch Event: Stale-While-Revalidate for API & Cache-First for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Avoid caching non-GET requests or auth/admin mutations
  if (event.request.method !== 'GET') return
  if (url.pathname.startsWith('/api/auth') || url.pathname.startsWith('/admin')) return

  // Stale-While-Revalidate for TMDB & AniList APIs
  if (url.pathname.startsWith('/api/tmdb') || url.pathname.startsWith('/api/anilist')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone()).catch(() => {})
              }
              return networkResponse
            })
            .catch(() => cachedResponse)

          return cachedResponse || fetchPromise
        })
      })
    )
    return
  }

  // Network-First with Cache Fallback for Pages
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.destination === 'image') {
          const resClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone).catch(() => {}))
        }
        return networkResponse
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => cached || caches.match('/'))
      })
  )
})