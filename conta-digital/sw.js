const CACHE_NAME = 'conta-ciclobem-v1';
const APP_SHELL = [
  '/conta-digital/',
  '/conta-digital/index.html',
  '/conta-digital/manifest.json',
  '/conta-digital/assets/css/conta-digital.css',
  '/conta-digital/assets/js/env.js',
  '/conta-digital/assets/js/storage.js',
  '/conta-digital/assets/js/logger.js',
  '/conta-digital/assets/js/apiClient.js',
  '/conta-digital/assets/js/auth.js',
  '/conta-digital/assets/js/router.js',
  '/conta-digital/assets/js/ativar.js',
  '/conta-digital/assets/js/login.js',
  '/conta-digital/assets/js/cadastro.js',
  '/conta-digital/assets/js/dashboard.js',
  '/conta-digital/assets/js/bootstrap.js',
  '/conta-digital/icons/icon-192x192.png',
  '/conta-digital/icons/icon-512x512.png'
];

const NEVER_CACHE = [
  '/api/',
  '/auth/',
  '/conta-digital/',
  '/conta-digital/ativar',
  '/conta-digital/login',
  '/conta-digital/cadastro'
];

self.addEventListener('install', (event) => {
  if (self.location.hostname === 'localhost') {
    return self.skipWaiting();
  }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.pathname.startsWith('/api/') || url.pathname.includes('/conta-digital/ativar')) {
    return;
  }

  if (self.location.hostname === 'localhost') {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        }
        return response;
      });
    })
  );
});
