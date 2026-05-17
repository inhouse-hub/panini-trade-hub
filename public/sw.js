// public/sw.js — REEMPLAZA el archivo existente

// Cache name con versión - cambiar este número fuerza refresh
const CACHE_VERSION = 'v3'
const CACHE_NAME = `panini-trade-hub-${CACHE_VERSION}`

const PRECACHE_URLS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  // Activar inmediatamente sin esperar
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Borrar caches viejos
      caches.keys().then((keys) =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      ),
      // Tomar control de todas las pestañas inmediatamente
      self.clients.claim(),
    ])
  )
})

// Network-first siempre para HTML/navegación
// Esto asegura que la app siempre cargue la última versión
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Skip Supabase y APIs - siempre van a la red
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    return
  }

  // Para navegación (HTML), siempre intenta red primero
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => caches.match('/').then(c => c || new Response('Sin conexión', { status: 503 })))
    )
    return
  }

  // Para assets estáticos (CSS, JS, imágenes), cache-first con fallback a red
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        // Refresh en background
        fetch(request).then(fresh => {
          if (fresh.ok) {
            caches.open(CACHE_NAME).then(c => c.put(request, fresh.clone()))
          }
        }).catch(() => {})
        return cached
      }
      return fetch(request).then(response => {
        if (response.ok && url.pathname.match(/\.(js|css|png|jpg|svg|woff2?|ico)$/)) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(c => c.put(request, clone))
        }
        return response
      }).catch(() => new Response('Sin conexión', { status: 503 }))
    })
  )
})

// Mensaje desde la app para forzar update
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})