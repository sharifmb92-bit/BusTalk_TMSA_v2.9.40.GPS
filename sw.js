// Nombre de versión dinámico para purgar caché automáticamente en cada actualización
const CACHE_NAME = 'bustalk-v2-9-40';

const ASSETS_TO_CACHE = [
  './index.html',
  './app.js',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-152.png'
];

// Instalación y almacenamiento en caché
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activación y limpieza de versiones viejas del caché
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de red primero, cayendo a caché offline
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
