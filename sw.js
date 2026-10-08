// medbasha - BusTalk Service Worker v2.9.40
const CACHE_NAME = 'bustalk-v2-9-40';

// Archivos locales esenciales para precargar en caché
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './icon-152.png',
    './icon-192.png',
    './icon-512.png',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// 1. INSTALACIÓN: Guarda los recursos básicos en caché de inmediato
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// 2. ACTIVACIÓN: Elimina cachés antiguas al cambiar la versión (v2-9-40)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. EVENTO FETCH: Estrategia Network-First con Fallback a Caché
self.addEventListener('fetch', (event) => {
    // Solo procesar peticiones de lectura GET
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Omitir WebSockets, tráficos de voz WebRTC o llamadas en tiempo real de Firebase
    if (url.protocol === 'ws:' || url.protocol === 'wss:' || url.hostname.includes('firestore.googleapis.com')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Si la red responde correctamente, guardar copia fresca en caché
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Si la red falla (cobertura o modo avión), entregar desde la caché
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Si navega a una ruta y no hay red, servir index.html
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});
