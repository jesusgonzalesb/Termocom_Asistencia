/* Service worker del shell PWA. Cachea solo el shell (esta página, manifest e iconos).
   La app de Apps Script (iframe) siempre se pide a la red: necesita el servidor. */
const VERSION = 'v3';
const CACHE = 'puntualidad-shell-' + VERSION;
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/maskable-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // lo externo va directo a la red
  if (req.mode === 'navigate') {
    // red primero (para recibir actualizaciones); si no hay conexión, el shell en caché
    e.respondWith(fetch(req).catch(function () { return caches.match('./index.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      const copia = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copia); });
      return res;
    });
  }));
});
